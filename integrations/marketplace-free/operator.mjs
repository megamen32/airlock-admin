// Operator-only helper: execute inside demo-gateway. JSON input arrives on stdin.
// Uses the native API; owner credentials and connector secrets never leave stdout.
import {readFileSync} from 'node:fs';
const input=JSON.parse(await new Promise(resolve=>{let s='';process.stdin.on('data',x=>s+=x);process.stdin.on('end',()=>resolve(s));}));
const owner=JSON.parse(readFileSync(process.env.DEMO_OWNER_FILE,'utf8'));
async function request(path,body,method='GET') {
  const r=await fetch(process.env.DEMO_API+path,{method,signal:AbortSignal.timeout(30000),
    headers:{'Content-Type':'application/json',Host:process.env.DEMO_DOMAIN,
      'X-Airlock-Proxy-Auth':process.env.REVERSE_PROXY_AUTH_SECRET,'X-Forwarded-Proto':'https',
      ...(token?{Authorization:`Bearer ${token}`}:{})},
    ...(body===undefined?{}:{body:JSON.stringify(body)})});
  if(!r.ok)throw new Error(`Native API ${method} ${path}: HTTP ${r.status}`);
  return r;
}
let token;
token=(await (await request('/auth/login',owner,'POST')).json()).accessToken;
async function json(path,body,method='GET') {
  const r=await request(path,body,method);
  return r.status===204 || r.headers.get('content-length')==='0'?{}:r.json();
}
const prefix='/api/v1/agents/';
if(input.op==='withdraw-coding-demo') {
  if(input.id!=='220d5ba5-72af-43b8-a22b-7dff57650993')throw new Error('Unexpected withdrawn application');
  const isGuest=m=>['user','AGENT_ROLE_USER'].includes(m.role);
  const members=(await json(prefix+input.id+'/members')).members||[];
  let revoked=0;
  for(const member of members.filter(isGuest)) {
    await request(prefix+input.id+'/members/'+member.userId,undefined,'DELETE');revoked++;
  }
  await request(prefix+input.id+'/stop',{},'POST');
  const remaining=(await json(prefix+input.id+'/members')).members||[];
  const current=(await json(prefix+input.id)).agent;
  console.log(JSON.stringify({id:input.id,revoked,remainingGuestMembers:remaining.filter(isGuest).length,status:current.status,running:current.running,dataRetained:true}));
} else if(input.op==='list') {
  const r=await json(prefix.slice(0,-1));
  console.log(JSON.stringify((r.agents||[]).map(a=>({id:a.id,name:a.name,slug:a.slug,status:a.status,running:a.running}))));
} else if(input.op==='create') {
  const existing=(await json(prefix.slice(0,-1))).agents.find(a=>a.slug===input.agent.slug);
  const a=existing||(await json(prefix.slice(0,-1),input.agent,'POST')).agent;
  console.log(JSON.stringify({id:a.id,name:a.name,slug:a.slug,status:a.status,reused:!!existing}));
} else if(input.op==='builds'||input.op==='needs'||input.op==='connections'||input.op==='mcp-servers') {
  console.log(JSON.stringify(await json(prefix+input.id+'/'+input.op)));
} else if(input.op==='run-proof') {
  const data=await json('/api/v1/runs/'+input.id);
  const run=data.run;
  console.log(JSON.stringify({id:run.id,status:run.status,errorKind:run.errorKind,
    durationMs:run.durationMs,sourceRef:run.sourceRef,
    actionTypes:(run.actions||[]).map(a=>({type:a.type,tool:a.tool||a.toolName||a.name})),
    messageRoles:(data.messages||[]).map(m=>m.role)}));
} else if(input.op==='upgrade') {
  const r=await request(prefix+input.id+'/upgrade',{description:input.description},'POST');
  console.log(JSON.stringify({id:input.id,accepted:r.status===202}));
} else if(input.op==='grant-test-user') {
  if(!/^[0-9a-f-]{36}$/.test(input.id)||!/^[0-9a-f-]{36}$/.test(input.userId))throw new Error('Invalid test identity');
  const user=(await json('/api/v1/users')).users.find(u=>u.id===input.userId);
  if(user?.tenantRole!=='TENANT_ROLE_USER')throw new Error('Ordinary test user required');
  await request(prefix+input.id+'/members',{userId:input.userId,role:'user'},'POST');
  console.log(JSON.stringify({id:input.id,role:'user',singleTestUser:true}));
} else if(input.op==='grant-guests') {
  const dir=(await json('/api/v1/users/selectable')).users;
  const all=dir.find(u=>u.kind==='group' && u.displayName==='All users');
  if(!all)throw new Error('Native All users group absent');
  const guests=(await json('/api/v1/users')).users.filter(u=>u.tenantRole==='TENANT_ROLE_USER');
  const members=(await json(prefix+input.id+'/members')).members;
  let granted=0;
  for(const u of [all,...guests]) if(!members.some(m=>m.userId===u.id && m.role==='user')) {
    await request(prefix+input.id+'/members',{userId:u.id,role:'user'},'POST');granted++;
  }
  console.log(JSON.stringify({id:input.id,granted,role:'user'}));
} else if(input.op==='credential') {
  if(!['connection','mcp'].includes(input.type)||!input.secret)throw new Error('Credential input absent');
  const path=input.type==='mcp'?`mcp-servers/${input.slug}/credentials`:`credentials/${input.slug}`;
  const r=await json(prefix+input.id+'/'+path,{displayName:input.displayName,apiKey:input.secret,createNew:true},'POST');
  console.log(JSON.stringify({id:input.id,slug:input.slug,status:r.status}));
} else if(input.op==='mcp-oauth-start') {
  // Operator-only: redirect URI is the native callback, not a third-party collector.
  const r=await json('/api/v1/resource-authorizations/start',{agentId:input.id,type:'mcp_server',slug:input.slug,displayName:input.displayName||input.slug,redirectUri:input.redirectUri||`/agents/${input.id}`,createNew:false},'POST');
  console.log(JSON.stringify(r));
} else if(input.op==='source') {
  const r=await request(prefix+input.id+'/source');
  // Redirect this output to a private source artifact, never display it in chat.
  process.stdout.write(Buffer.from(await r.arrayBuffer()));
} else if(input.op==='upload-source') {
  const path=prefix+input.id+'/source';
  const head=await fetch(process.env.DEMO_API+path,{method:'HEAD',signal:AbortSignal.timeout(30000),
    headers:{Host:process.env.DEMO_DOMAIN,Authorization:`Bearer ${token}`}});
  const state=head.headers.get('etag');
  if(!(head.ok&&state) && !(head.status===409&&input.allowInitial===true))throw new Error('Source state absent');
  const payload=Buffer.from(input.sourceBase64,'base64');
  if(!payload.length||payload.length>5*1024*1024)throw new Error('Source payload size refused');
  const r=await fetch(process.env.DEMO_API+path,{method:'PUT',signal:AbortSignal.timeout(30000),
    headers:{'Content-Type':'application/gzip',...(state?{'If-Match':state}:{}),
      'X-Airlock-Commit-Message':input.message||'Update marketplace app',Host:process.env.DEMO_DOMAIN,
      'X-Airlock-Proxy-Auth':process.env.REVERSE_PROXY_AUTH_SECRET,'X-Forwarded-Proto':'https',
      Authorization:`Bearer ${token}`},body:payload});
  if(r.status!==202)throw new Error(`Source upload HTTP ${r.status}`);
  console.log(JSON.stringify({id:input.id,accepted:true,state:r.headers.get('etag')}));
} else throw new Error('Unknown operator action');
