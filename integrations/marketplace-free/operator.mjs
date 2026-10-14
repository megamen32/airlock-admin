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
if(input.op==='list') {
  const r=await json(prefix.slice(0,-1));
  console.log(JSON.stringify((r.agents||[]).map(a=>({id:a.id,name:a.name,slug:a.slug,status:a.status,running:a.running}))));
} else if(input.op==='create') {
  const existing=(await json(prefix.slice(0,-1))).agents.find(a=>a.slug===input.agent.slug);
  const a=existing||(await json(prefix.slice(0,-1),input.agent,'POST')).agent;
  console.log(JSON.stringify({id:a.id,name:a.name,slug:a.slug,status:a.status,reused:!!existing}));
} else if(input.op==='builds'||input.op==='needs'||input.op==='connections'||input.op==='mcp-servers') {
  console.log(JSON.stringify(await json(prefix+input.id+'/'+input.op)));
} else if(input.op==='upgrade') {
  const r=await request(prefix+input.id+'/upgrade',{description:input.description},'POST');
  console.log(JSON.stringify({id:input.id,accepted:r.status===202}));
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
} else if(input.op==='source') {
  const r=await request(prefix+input.id+'/source');
  // Redirect this output to a private source artifact, never display it in chat.
  process.stdout.write(Buffer.from(await r.arrayBuffer()));
} else throw new Error('Unknown operator action');
