// Run inside demo-gateway with a JSON input from the owning host, never in a browser.
import {readFileSync} from 'node:fs';
const input=JSON.parse(await new Promise(resolve=>{let text='';process.stdin.on('data',x=>text+=x);process.stdin.on('end',()=>resolve(text));}));
const owner=JSON.parse(readFileSync(process.env.DEMO_OWNER_FILE,'utf8'));
async function call(path,body,token,method='POST') {
  const response=await fetch(process.env.DEMO_API+path,{
    method,signal:AbortSignal.timeout(30000),headers:{'Content-Type':'application/json',Host:process.env.DEMO_DOMAIN,
      'X-Airlock-Proxy-Auth':process.env.REVERSE_PROXY_AUTH_SECRET,'X-Forwarded-Proto':'https',
      ...(token ? {Authorization:`Bearer ${token}`}:{})},...(body===undefined ? {}:{body:JSON.stringify(body)}),
  });
  const result=await response.json();
  if(!response.ok) throw new Error(`${path} HTTP ${response.status}: ${result.error}`);
  return result;
}
if(input.activationCode) {
  const result=await call('/auth/activate',{...owner,activationCode:input.activationCode,displayName:'Владелец демо',uiLocale:'ru'});
  console.log(JSON.stringify({activated:true,user:result.user.id,role:result.user.tenantRole}));
}
if(input.providerKey || input.model) {
  if(typeof input.model!=='string' || !input.model.trim()) throw new Error('Explicit model route required');
  const session=await call('/auth/login',owner);
  const token=session.accessToken;
  let providers=(await call('/api/v1/providers',undefined,token,'GET')).providers||[];
  let provider=providers.find(p=>p.slug==='demo-omniroute');
  if(!provider) {
    if(!input.providerKey) throw new Error('New provider requires a protected inference key');
    provider=(await call('/api/v1/providers',{providerId:'openai-compatible',slug:'demo-omniroute',displayName:'Демо AI',apiKey:input.providerKey,baseUrl:'https://omniroute.bezrabotnyi.com/v1'},token)).provider;
  }
  const model={modelId:input.model,displayName:input.modelDisplayName||input.model,toolCall:true,reasoning:true,vision:true,structuredOutputs:false,contextLimit:'1000000',outputLimit:'8192',...input.modelCapabilities,modelId:input.model};
  // Native Airlock refuses removing a model referenced by the current defaults.
  // Retain registered models while moving both defaults to the new route.
  const registered=(await call(`/api/v1/providers/${provider.id}/models`,undefined,token,'GET')).models||[];
  await call(`/api/v1/providers/${provider.id}/models`,{models:[...registered.filter(m=>m.modelId!==input.model),model]},token,'PUT');
  // The selected demo-only combo owns its explicitly authorized fallbacks.
  const current=(await call('/api/v1/settings',undefined,token,'GET')).settings;
  const result=await call('/api/v1/settings',{settings:{...current,uiLocale:'ru',defaultBuildModel:input.model,defaultBuildProviderId:provider.id,defaultExecModel:input.model,defaultExecProviderId:provider.id}},token,'PUT');
  console.log(JSON.stringify({provider:provider.id,configured:true,model:input.model}));
}
