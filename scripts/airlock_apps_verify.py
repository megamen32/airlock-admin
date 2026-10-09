#!/usr/bin/env python3
"""One ordinary release check, hard deadline 180s; no private response logging."""
import json
from pathlib import Path
import subprocess
import signal
import time
import urllib.error
import urllib.request

from airlock_apps import ADMINS, API, ROOT, SOURCE, private_json

START = time.monotonic()
DEADLINE = START + 180
RECEIPT = Path("/tmp/airlock-real-ui-release-check.json")
CHECKS = []

def remaining():
    value = DEADLINE - time.monotonic()
    if value <= 0:
        raise RuntimeError("ordinary release deadline exceeded")
    return value

def check(name, category, purpose, defect, expected, maximum, action):
    start = time.monotonic()
    record = {"name":name,"category":category,"purpose":purpose,"defect":defect,"expected_seconds":expected,"max_seconds":maximum}
    CHECKS.append(record)
    try:
        action()
        elapsed = time.monotonic() - start
        if elapsed > maximum:
            raise RuntimeError("scenario maximum exceeded")
        record.update(ok=True, elapsed_seconds=round(elapsed,3))
    except Exception as exc:
        record.update(ok=False, elapsed_seconds=round(time.monotonic()-start,3), error=str(exc))
        raise

def command(argv, cwd, timeout):
    result = subprocess.run(argv,cwd=cwd,capture_output=True,text=True,timeout=min(timeout,remaining()))
    if result.returncode:
        # Test logs contain no runtime credentials; preserve separately, not chat.
        Path("/tmp/airlock-five-apps-test-failure.log").write_text(result.stdout+result.stderr)
        raise RuntimeError("source check failed; inspect retained local test log")

def request(url, token=None, payload=None, origin=None):
    headers={"Accept":"application/json"}
    if token: headers["Authorization"]="Bearer "+token
    if origin: headers["Origin"]=origin
    if payload is not None:
        headers["Content-Type"]="application/json"
        payload=json.dumps(payload).encode()
    try:
        with urllib.request.urlopen(urllib.request.Request(url,headers=headers,data=payload),timeout=min(45,remaining())) as response:
            return response.status,response.read()
    except urllib.error.HTTPError as exc:
        return exc.code,b""

def main():
    overall = False
    def deadline(_signum, _frame):
        raise TimeoutError("ordinary release hard deadline exceeded")
    signal.signal(signal.SIGALRM, deadline)
    signal.alarm(180)
    try:
        check("SDK unit and callback regression","focused integration","Principal selection, exact confirmation, callback execution","Wrong credential selection or unauthorized upstream call",8,45,
              lambda:command(["env","GOMAXPROCS=2","GOFLAGS=-p=2","go","test","-mod=readonly","./..."],SOURCE,45))
        check("MCP ingress auth and sessions","focused integration","Reject bad bearer before forwarding; retain native MCP session IDs","Anonymous backend exposure or broken MCP transport",1,10,
              lambda:command(["python3","-B","-m","unittest","-q","test_airlock_mcp_proxy"],ROOT/"integrations",10))
        api=API("/tmp/airlock-integration-session.json")
        state=json.loads(Path("/tmp/airlock-five-apps-deployment.json").read_text())
        targets={
            "noticeplace":("/admin/","NoticePlace Admin",None),
            "universal-userio":("/","Universal UserIO","/v1/accounts"),
            "gptadmin":("/admin/","GPTAdmin console","/admin/api/clients"),
            "agent-herder":("/","Agent Herder","/api/adapters"),
            "grepmesh":("/ui/","GrepMesh — Files","/api/host-status"),
        }
        for slug, (page,title,read_api) in targets.items():
            record=state[slug]
            def native(slug=slug,record=record,page=page,title=title,read_api=read_api):
                import re
                origin=record["route"].rstrip("/")
                path="/api/v1/agents/"+record["id"]
                detail,_=api.call("GET",path)
                if detail["agent"]["status"]!="active":raise RuntimeError(slug+": native app not active")
                members,_=api.call("GET",path+"/members")
                grants={m["userId"]:m["role"] for m in members["members"]}
                if any(grants.get(user)!="admin" for user in ADMINS):raise RuntimeError(slug+": missing confirmed administrator")
                code,_=request(origin+page)
                if code not in (401,403):raise RuntimeError(slug+": anonymous UI not denied")
                code,raw=request(origin+page,api.token,origin=origin)
                html=raw.decode()
                if code!=200 or title not in html or 'id="operation-form"' in html:raise RuntimeError(slug+": original product UI missing")
                assets=re.findall(r'(?:src|href)=["\']([^"\']+\.(?:js|css)(?:\?[^"\']*)?)["\']',html)
                from urllib.parse import urljoin
                for asset in assets[:2]:
                    url=urljoin(origin+page,asset)
                    if not url.startswith(origin+"/"):raise RuntimeError(slug+": external product asset")
                    code,data=request(url,api.token)
                    if code!=200 or not data:raise RuntimeError(slug+": product asset missing")
                if read_api:
                    code,data=request(origin+read_api,api.token,origin=origin)
                    if code!=200 or not isinstance(json.loads(data),(dict,list)):raise RuntimeError(slug+": product API missing")
                ids=subprocess.check_output(["docker","ps","-q","--filter","label=run.airlock.agent="+record["id"]],text=True,timeout=min(5,remaining())).split()
                if len(ids)!=1:raise RuntimeError(slug+": runtime not uniquely identified")
                info=json.loads(subprocess.check_output(["docker","inspect",ids[0]],text=True,timeout=min(5,remaining())))[0]["HostConfig"]
                wanted={"Memory":256<<20,"MemoryReservation":128<<20,"MemorySwap":256<<20,"NanoCpus":1000000000,"PidsLimit":128}
                if any(info.get(k)!=v for k,v in wanted.items()):raise RuntimeError(slug+": runtime budget missing")
            check(slug+" original UI, assets, API, grants, auth and budget","focused integration","Use original existing product through admitted native caller","Wrapper UI, broken auth/static/API or unbounded lazy container",4,35,native)
        def stream():
            url=state["agent-herder"]["route"]+"api/events/stream?after=0"
            req=urllib.request.Request(url,headers={"Authorization":"Bearer "+api.token,"Accept":"text/event-stream"})
            with urllib.request.urlopen(req,timeout=min(10,remaining())) as response:
                if response.status!=200 or not response.headers.get("Content-Type","").startswith("text/event-stream") or not response.readline():
                    raise RuntimeError("native original SSE stream failed")
        check("Herder original event stream","focused integration","Original EventSource stream remains live through native proxy","Buffered or broken native SSE transport",1,10,stream)
        overall=True
    finally:
        private_json(RECEIPT,{"ok":overall,"elapsed_seconds":round(time.monotonic()-START,3),"hard_deadline_seconds":180,"checks":CHECKS})
        signal.alarm(0)
        print(json.dumps({"ok":overall,"checks":len(CHECKS),"elapsed_seconds":round(time.monotonic()-START,3),"receipt":str(RECEIPT)}))

if __name__=="__main__":main()
