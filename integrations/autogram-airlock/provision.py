#!/usr/bin/env python3
"""Provision only the explicitly owned autogram-airlock application."""
import argparse,gzip,hashlib,io,json,os,tarfile,urllib.request,urllib.error
from pathlib import Path
BASE='https://airlock.bezrabotnyi.com'
PRIVATE=Path('/home/roomhacker/.local/share/airlock-afc')
OWNER='5e438326-6339-4ac8-a328-59dae1d6241f'
OLEG='98daa037-a87d-49b1-ba07-cd9e6f451864'
SLUG='autogram-airlock'
def save(p,x):
 fd=os.open(p,os.O_WRONLY|os.O_CREAT|os.O_TRUNC,0o600)
 with os.fdopen(fd,'w') as f:json.dump(x,f)
def api(method,path,data=None,extra=None):
 token=json.loads((PRIVATE/'airlock-session.json').read_text())['accessToken']
 headers={'Authorization':'Bearer '+token,'Accept':'application/json'}
 if data is not None and not isinstance(data,bytes):data=json.dumps(data).encode();headers['Content-Type']='application/json'
 headers.update(extra or {})
 try:
  with urllib.request.urlopen(urllib.request.Request(BASE+path,data=data,method=method,headers=headers),timeout=60) as r:
   body=r.read();return (json.loads(body) if body and 'json' in r.headers.get('Content-Type','') else None),r.headers
 except urllib.error.HTTPError as e:raise RuntimeError(f'{method} {path}: HTTP {e.code}') from None

def main():
 command=argparse.ArgumentParser();command.add_argument('operation',choices=['create','upload','status','configure','grant','readback']);args=command.parse_args()
 statepath=PRIVATE/'deployment.json';state=json.loads(statepath.read_text()) if statepath.exists() else {}
 if args.operation=='create':
  me,_=api('GET','/api/v1/me');u=me.get('user',me)
  if u.get('id')!=OWNER:raise RuntimeError('owner identity mismatch')
  catalog,_=api('GET','/api/v1/agents/all');existing=[a for a in catalog['agents'] if a['slug']==SLUG]
  if existing and state.get('id')!=existing[0]['id']:raise RuntimeError('existing app not owned by this receipt')
  if not existing:
   out,_=api('POST','/api/v1/agents',{'name':'Автограмм · AirLock','slug':SLUG,'description':'Общий кабинет Автограмм для Room Hacker и Олега','skipInitialBuild':True})
   state={'id':out['agent']['id'],'slug':SLUG};save(statepath,state)
  members,_=api('GET',f"/api/v1/agents/{state['id']}/members")
  others=[m for m in members.get('members',[]) if m.get('userId') not in [OWNER,OLEG]]
  if others:raise RuntimeError('unexpected app members; preserve and inspect')
  if not any(m.get('userId')==OLEG for m in members.get('members',[])):api('POST',f"/api/v1/agents/{state['id']}/members",{'userId':OLEG,'role':'user'})
  print(json.dumps(state));return
 if not state.get('id'):raise RuntimeError('no owned app receipt')
 path='/api/v1/agents/'+state['id']
 if args.operation=='upload':
  stream=io.BytesIO()
  with tarfile.open(fileobj=stream,mode='w') as ar:
   for name in ['go.mod','go.sum','main.go','main_test.go','styles/app.css']:
    data=(Path(__file__).parent/name).read_bytes();item=tarfile.TarInfo(name);item.size=len(data);item.mode=0o644;ar.addfile(item,io.BytesIO(data))
  data=gzip.compress(stream.getvalue(),mtime=0);digest=hashlib.sha256(data).hexdigest()
  if state.get('uploaded_sha256')==digest:raise RuntimeError('already uploaded; inspect status, never replay')
  headers={'Content-Type':'application/gzip','X-Airlock-Commit-Message':'Connect shared Autogram cabinet through native MCP and one-use sign-in'}
  try:_,h=api('HEAD',path+'/source');headers['If-Match']=h['ETag']
  except RuntimeError as e:
   if not (str(e).endswith('HTTP 409') or str(e).endswith('HTTP 404')):raise
   if state.get('uploaded_sha256'):
    detail,_=api('GET',path); current=detail.get('agent',detail)
    if current.get('status')!='failed' or current.get('imageRef'):raise RuntimeError('missing deployed source requires failed initial build readback')
  _,h=api('PUT',path+'/source',data,headers)
  state['uploaded_sha256']=digest;save(statepath,state);print(json.dumps({'uploaded_sha256':digest,'id':state['id']}))
 elif args.operation=='status':
  out,_=api('GET',path);a=out.get('agent',out);print(json.dumps({k:a.get(k) for k in ['id','slug','status','upgradeStatus','upgradeError','imageRef']},ensure_ascii=False))
  builds,_=api('GET',path+'/builds');print(json.dumps(builds,ensure_ascii=False)[:1500])
 elif args.operation=='configure':
  secret=json.loads((PRIVATE/'AirLock.json').read_text())
  if not secret.get('handoff_secret'):raise RuntimeError('AFC handoff secret not ready')
  for name,key,endpoint in [('mcp','mcp_token','/mcp-servers/autogram/credentials'),('handoff','handoff_secret','/credentials/handoff')]:
   if not state.get(name+'_configured'):
    result,_=api('POST',path+endpoint,{'apiKey':secret[key],'displayName':'Автограмм AirLock '+name})
    state[name+'_configured']=True;save(statepath,state)
  needs,_=api('GET',path+'/needs')
  save(PRIVATE/'needs-readback.json',needs)
  print(json.dumps(needs,ensure_ascii=False))
 elif args.operation=='grant':
  needs,_=api('GET',path+'/needs')
  candidates=[n for n in needs.get('needs',[]) if n.get('type')=='mcp_server' and n.get('slug')=='autogram']
  if len(candidates)!=1:raise RuntimeError('expected exact MCP need')
  n=candidates[0]
  resource=n.get('boundResourceId')
  if not resource:raise RuntimeError('MCP need unbound')
  grants,_=api('GET',f'/api/v1/resources/mcp_server/{resource}/grants')
  if any(g.get('userId')!=OLEG for g in grants.get('grants',[])):raise RuntimeError('unexpected existing resource grant')
  api('PUT',f'/api/v1/resources/mcp_server/{resource}/grants/{OLEG}',{'capabilities':['use']})
  actual,_=api('GET',f'/api/v1/resources/mcp_server/{resource}/grants')
  state['mcp_resource_id']=resource;save(statepath,state)
  save(PRIVATE/'grants-readback.json',actual)
  print(json.dumps({'mcp_resource':resource,'grants':actual},ensure_ascii=False))
 elif args.operation=='readback':
  for suffix in ['/members','/needs','/mcp-servers/autogram/credentials','/credentials/handoff']:
   out,_=api('GET',path+suffix);print(json.dumps({'path':suffix,'result':out},ensure_ascii=False))
if __name__=='__main__':
 try:main()
 except Exception as e:print(str(e));raise SystemExit(1)
