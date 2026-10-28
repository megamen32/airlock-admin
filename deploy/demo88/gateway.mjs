import http from 'node:http';
import {readFileSync} from 'node:fs';
import {randomBytes,createHash} from 'node:crypto';
import {GuestLifecycle} from './guest-lifecycle.mjs';

const domain = process.env.DEMO_DOMAIN;
const apiURL = process.env.DEMO_API;
const upstream = new URL(process.env.DEMO_UPSTREAM);
const owner = JSON.parse(readFileSync(process.env.DEMO_OWNER_FILE, 'utf8'));
const lifecycle=new GuestLifecycle({file:process.env.DEMO_GUEST_STATE_FILE||'/var/lib/demo-gateway/guests.json',domain,
  ttlSeconds:Number(process.env.DEMO_GUEST_TTL_SECONDS||86400)});
const activeGuests=new Map();
const identities=new Map();
let cleanup;
let ownerSession;
let ownerLogin;
let creating = false;
let guestSlots = 0;
let usersGroup;
const json = (res, status, data, cookies) => {
  res.writeHead(status, {'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store', ...(cookies?.length ? {'Set-Cookie':cookies}: {})});
  res.end(JSON.stringify(data));
};
async function api(path, body, token, method='POST', cookie) {
  const response = await fetch(apiURL + path, {
    method, redirect:'error', signal:AbortSignal.timeout(30000),
    headers:{'Content-Type':'application/json', Host:domain, Origin:`https://${domain}`,
      'X-Airlock-Proxy-Auth':process.env.REVERSE_PROXY_AUTH_SECRET, 'X-Forwarded-Proto':'https',
      ...(token ? {Authorization:`Bearer ${token}`} : {})},
      ...(cookie ? {headers:{'Content-Type':'application/json',Host:domain,Origin:`https://${domain}`,
        'X-Airlock-Proxy-Auth':process.env.REVERSE_PROXY_AUTH_SECRET,'X-Forwarded-Proto':'https',Cookie:cookie}} : {}),
    ...(body === undefined ? {} : {body:JSON.stringify(body)}),
  });
  const data = response.status===204 ? {} : await response.json();
  if (!response.ok) { const error = new Error(data.error || 'Airlock request failed'); error.status=response.status; throw error; }
  return {data, cookies:response.headers.getSetCookie(), status:response.status};
}
async function adminToken() {
  if (ownerSession && ownerSession.expires > Date.now()) return ownerSession.token;
  if (!ownerLogin) ownerLogin = api('/auth/login', owner).then(({data}) => {
    ownerSession={token:data.accessToken, expires:Date.now()+300000}; return data.accessToken;
  }).finally(()=>{ownerLogin=null;});
  return ownerLogin;
}
async function reapGuests() {
  if(cleanup)return cleanup;
  cleanup=(async()=>{
    const token=await adminToken();
    const users=(await api('/api/v1/users',undefined,token,'GET')).data.users||[];
    const removed=await lifecycle.reap(users,id=>api(`/api/v1/users/${id}`,undefined,token,'DELETE'),new Set(activeGuests.keys()));
    if(removed)console.log('Expired demo guests removed:',removed);
  })().finally(()=>{cleanup=null;});
  return cleanup;
}
async function observeRequest(req) {
  const token=requestToken(req);if(!token)return;
  const key=createHash('sha256').update(token).digest('hex');
  let entry=identities.get(key);
  if(!entry || entry.until<Date.now()) {
    if(identities.size>=512)identities.clear();
    entry={until:Date.now()+60000,promise:api('/api/v1/me',undefined,token,'GET').then(x=>x.data.user).catch(()=>null)};
    identities.set(key,entry);
  }
  const user=await entry.promise;
  if(!lifecycle.enroll(user))return;
  if(lifecycle.expired(user.id)&&!activeGuests.has(user.id))return {id:user.id,expired:true};
  lifecycle.touch(user.id);return {id:user.id,expired:false};
}
async function refresh(req,res) {
  await body(req);
  if(!req.headers.cookie&&!req.headers.authorization)return guest(res);
  let session;
  try {session=await api('/auth/refresh',{},undefined,'POST',req.headers.cookie);}
  catch(error) {if(error.status===401)return guest(res);throw error;}
  const user=(await api('/api/v1/me',undefined,session.data.accessToken,'GET')).data.user;
  if(lifecycle.enroll(user)) {
    if(lifecycle.expired(user.id)&&!activeGuests.has(user.id)) {await reapGuests();return guest(res);}
    lifecycle.touch(user.id);lifecycle.flush();
  }
  return json(res,session.status,session.data,session.cookies);
}
async function guest(res) {
  if (guestSlots >= 2) return json(res,429,{error:'Подождите несколько секунд и обновите страницу.'});
  guestSlots++;
  try {
    const token = await adminToken();
    await reapGuests();
    const users = await api('/api/v1/users',undefined,token,'GET');
    if ((users.data.users || []).length >= 256) return json(res,429,{error:'Демо заполнено. Попробуйте позже.'});
    const email=`guest-${randomBytes(12).toString('hex')}@${domain}`;
    const made = await api('/api/v1/users',{email,displayName:'Гость',tenantRole:'user'},token);
    lifecycle.enroll(made.data.user);lifecycle.flush();
    const projects=await api('/api/v1/agents',undefined,token,'GET');
    for(const project of projects.data.agents||[]) {
      await api(`/api/v1/agents/${project.id}/members`,{userId:made.data.user.id,role:'user'},token);
    }
    const login = await api('/auth/login',{email,password:made.data.tempPassword});
    const session = await api('/auth/change-password',{currentPassword:made.data.tempPassword,newPassword:randomBytes(36).toString('base64url')},login.data.accessToken);
    json(res,200,session.data,session.cookies);
  } finally { guestSlots--; }
}
async function body(req) {
  let length=0;const chunks=[];
  for await (const chunk of req) {
    length+=chunk.length;
    if (length > 65536) {const e=new Error('Слишком большой запрос.');e.status=413;throw e;}
    chunks.push(chunk);
  }
  try {return JSON.parse(Buffer.concat(chunks).toString() || '{}');}
  catch {const e=new Error('Некорректный запрос.');e.status=400;throw e;}
}
function requestToken(req) {
  if (req.headers.authorization) {
    const match=/^Bearer ([^\s,]+)$/.exec(req.headers.authorization);
    return match?.[1];
  }
  const cookies=(req.headers.cookie||'').split(';').map(x=>x.trim()).filter(x=>x.startsWith('airlock_session='));
  return cookies.length===1 ? cookies[0].slice(16) : undefined;
}
async function identity(req) {
  const token=requestToken(req);
  if (!token) {const e=new Error('Откройте демо заново.');e.status=401;throw e;}
  return (await api('/api/v1/me',undefined,token,'GET')).data.user;
}
async function createProject(req,res) {
  if (creating) return json(res,429,{error:'Сейчас создаётся другой проект. Попробуйте немного позже.'});
  creating=true;
  try {
    await identity(req);
    const input=await body(req);
    if (typeof input.name!=='string' || !input.name.trim() || input.name.length>120 || typeof input.slug!=='string' || !/^[a-z0-9][a-z0-9-]{0,40}$/.test(input.slug))
      return json(res,400,{error:'Укажите название и адрес проекта латинскими буквами.'});
    const token=await adminToken();
    if(!usersGroup) {
      const directory=await api('/api/v1/users/selectable',undefined,token,'GET');
      usersGroup=directory.data.users?.find(u=>u.kind==='group' && u.displayName==='All users')?.id;
      if(!usersGroup || !/^[0-9a-f-]{36}$/.test(usersGroup)) throw new Error('Native all-users group unavailable');
    }
    const list=await api('/api/v1/agents',undefined,token,'GET');
    if ((list.data.agents||[]).length>=32) return json(res,429,{error:'В демо уже достаточно проектов. Попробуйте позже.'});
    const made=await api('/api/v1/agents',{
      name:input.name.trim(),slug:`d88-${input.slug}-${randomBytes(3).toString('hex')}`,
      description:typeof input.description==='string' ? input.description.slice(0,4000):'',
      instructions:typeof input.instructions==='string' ? input.instructions.slice(0,16000):'',
      skipInitialBuild:input.skipInitialBuild===true,
    },token);
    // Guests never receive ownership or admin membership, including on their own projects.
    await api(`/api/v1/agents/${made.data.agent.id}/members`,{userId:usersGroup,role:'user'},token);
    // v0.7.0 WebSocket subscriptions use direct memberships, not role groups.
    const guests=await api('/api/v1/users',undefined,token,'GET');
    for(const user of guests.data.users||[]) {
      if(user.tenantRole==='TENANT_ROLE_USER')
        await api(`/api/v1/agents/${made.data.agent.id}/members`,{userId:user.id,role:'user'},token);
    }
    made.data.agent.yourAccess='user';made.data.agent.isOwner=false;
    json(res,made.status,made.data);
  } finally {creating=false;}
}
async function runStatus(req,res,runId) {
  const user=await identity(req);
  if (['admin','TENANT_ROLE_ADMIN'].includes(user?.tenantRole)) return proxy(req,res);
  // Native v0.7.0 restricts run detail to app admins. For guest chat polling,
  // first prove that this run appears in the caller's own conversation.
  let conversation;
  try {
    const ref=new URL(req.headers.referer);
    if(ref.origin===`https://${domain}`) conversation=ref.searchParams.get('c');
  } catch {}
  if(!conversation || !/^[0-9a-f-]{36}$/.test(conversation)) return json(res,403,{error:'Недоступный диалог.'});
  const own=await api(`/api/v1/conversations/${conversation}/messages?before=9223372036854775807&limit=100`,undefined,requestToken(req),'GET');
  if(!own.data.messages?.some(m=>m.runId===runId)) return json(res,403,{error:'Недоступный диалог.'});
  const result=await api(`/api/v1/runs/${runId}`,undefined,await adminToken(),'GET');
  const source=result.data.run;
  const run={};
  for(const key of ['id','agentId','status','startedAt','finishedAt','durationMs','errorKind']) run[key]=source[key];
  run.errorMessage=source.errorMessage ? 'Не удалось получить ответ AI. Попробуйте ещё раз через несколько минут.' : '';
  // No source code, inputs, tool actions, logs or credentials leave this adapter.
  json(res,200,{run,messages:own.data.messages.filter(m=>m.runId===runId)});
}
function headers(req) {
  const result={...req.headers,'X-Forwarded-Proto':'https'};
  delete result['x-airlock-proxy-auth'];delete result['x-demo-bootstrap'];
  return result;
}
function proxy(req,res) {
  const request=http.request({hostname:upstream.hostname,port:upstream.port||80,path:req.url,method:req.method,headers:headers(req)},response=>{
    res.writeHead(response.statusCode,response.headers);response.pipe(res);
  });
  request.on('error',()=>{if (!res.headersSent) json(res,502,{error:'Демо запускается. Обновите страницу через несколько секунд.'});else res.destroy();});
  request.setTimeout(120000,()=>request.destroy());req.on('aborted',()=>request.destroy());req.pipe(request);
}
const chatPost=/^\/api\/v1\/(agents\/[^/]+\/(prompt|conversations|files)|conversations\/[^/]+\/(cancel|clear))$/;
const server=http.createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,'http://gateway');
    const path=url.pathname;
    if (req.method==='GET' && path==='/_demo/tls') {
      const name=url.searchParams.get('domain');
      if ([domain,`s3.${domain}`].includes(name)) return json(res,200,{});
      const suffix=`.${domain}`;
      if (!name?.endsWith(suffix)) return json(res,403,{});
      const slug=name.slice(0,-suffix.length);
      if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(slug)) return json(res,403,{});
      const list=await api('/api/v1/agents',undefined,await adminToken(),'GET');
      return json(res,(list.data.agents||[]).some(a=>a.slug===slug) ? 200:403,{});
    }
    if(req.method==='POST'&&path==='/auth/refresh'&&(req.headers.host||'').split(':')[0]===domain) {
      if(req.headers.origin&&req.headers.origin!==`https://${domain}`)return json(res,403,{error:'Откройте демо на его сайте.'});
      return await refresh(req,res);
    }
    if(requestToken(req)) {
      const activity=await observeRequest(req);
      if(activity?.expired)return json(res,401,{error:'Гостевая сессия завершилась. Откройте демо заново.'});
    }
    // These hosts reach native app/S3 routing, never the dashboard API.
    // Let native per-route user grants and signed S3 requests govern app actions.
    const host=(req.headers.host||'').split(':')[0];
    if(host===`s3.${domain}` || (host.endsWith(`.${domain}`) && /^[a-z0-9][a-z0-9-]{0,62}$/.test(host.slice(0,-domain.length-1))))
      return proxy(req,res);
    if (path.includes('%') || path.includes('\\') || /\/\/|\/\.\.?\//.test(path)) return json(res,400,{error:'Некорректный адрес.'});
    const runMatch=/^\/api\/v1\/runs\/([0-9a-f-]{36})$/.exec(path);
    if (req.method==='GET' && runMatch) return await runStatus(req,res,runMatch[1]);
    if (['GET','HEAD','OPTIONS'].includes(req.method)) return proxy(req,res);
    if (path==='/auth/activate') return json(res,403,{error:'Демо уже настроено.'});
    if (req.headers.origin && req.headers.origin!==`https://${domain}`) return json(res,403,{error:'Откройте демо на его сайте.'});
    if (req.method==='POST' && ['/auth/refresh','/auth/login','/auth/logout','/auth/relay-code','/auth/relay-exchange'].includes(path)) return proxy(req,res);
    const user=await identity(req);
    if (['admin','TENANT_ROLE_ADMIN'].includes(user?.tenantRole)) return proxy(req,res);
    if (req.method==='POST' && path==='/api/v1/agents') return await createProject(req,res);
    if (req.method==='POST' && chatPost.test(path)) return proxy(req,res);
    return json(res,403,{error:'В демо можно общаться и создавать проекты. Изменять, удалять и администрировать проекты может только владелец.'});
  } catch(error) {
    // Never log native responses, credentials, request bodies or session tokens.
    console.error('demo request failed',error.status||502);
    if (!res.headersSent) json(res,error.status||502,{error:error.status && error.status<500 ? error.message : 'Демо временно недоступно. Попробуйте позже.'});
  }
});
server.on('upgrade',async(req,socket,head)=>{
  if (new URL(req.url,'http://gateway').pathname!=='/ws' || req.headers.origin!==`https://${domain}`) {socket.end('HTTP/1.1 403 Forbidden\r\n\r\n');return;}
  let activity;
  try {activity=await observeRequest(req);}catch {socket.end('HTTP/1.1 503 Service Unavailable\r\n\r\n');return;}
  if(activity?.expired){socket.end('HTTP/1.1 401 Unauthorized\r\n\r\n');return;}
  const request=http.request({hostname:upstream.hostname,port:upstream.port||80,path:req.url,headers:headers(req)});
  request.on('upgrade',(response,remote,remoteHead)=>{
    if(activity?.id) {
      activeGuests.set(activity.id,(activeGuests.get(activity.id)||0)+1);
      socket.once('close',()=>{
        const count=(activeGuests.get(activity.id)||1)-1;
        if(count)activeGuests.set(activity.id,count);else activeGuests.delete(activity.id);
      });
    }
    socket.write(`HTTP/1.1 ${response.statusCode} ${response.statusMessage}\r\n`+Object.entries(response.headers).map(([k,v])=>`${k}: ${v}`).join('\r\n')+'\r\n\r\n');
    if(remoteHead.length)socket.write(remoteHead);if(head.length)remote.write(head);
    remote.pipe(socket);socket.pipe(remote);socket.on('error',()=>remote.destroy());remote.on('error',()=>socket.destroy());socket.on('close',()=>remote.destroy());
  });
  request.on('response',response=>{socket.end(`HTTP/1.1 ${response.statusCode} Unauthorized\r\n\r\n`);response.resume();});
  request.on('error',()=>socket.destroy());request.end();
});
server.maxConnections=128;server.requestTimeout=120000;server.headersTimeout=15000;
setInterval(()=>{
  for(const id of activeGuests.keys())lifecycle.touch(id);
  lifecycle.flush();
  for(const [key,entry]of identities)if(entry.until<Date.now())identities.delete(key);
  reapGuests().catch(error=>console.error('Demo guest cleanup failed',error.status||502));
},60000).unref();
reapGuests().catch(error=>console.error('Demo guest cleanup failed',error.status||502));
for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>{
  lifecycle.flush();server.close(()=>process.exit(0));
  setTimeout(()=>process.exit(0),2000).unref();
});
server.listen(8088,'0.0.0.0',()=>console.log('Airlock demo gateway listening'));
