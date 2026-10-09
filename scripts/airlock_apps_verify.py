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
RECEIPT = Path("/tmp/airlock-five-apps-release-check.json")
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
        check("Browser script syntax","fast unit","Validate deployed JavaScript syntax","App administration page cannot run",1,5,
              lambda:command(["node","--check",str(SOURCE/"app.js")],ROOT,5))
        api=API("/tmp/airlock-integration-session.json")
        state=json.loads(Path("/tmp/airlock-five-apps-deployment.json").read_text())
        operations={"noticeplace":("noticeplace_instructions",{}),"universal-userio":("userio.accounts.list",{}),"gptadmin":("discover",{}),"agent-herder":("list_agents",{"limit":1,"includeLastMessage":False}),"grepmesh":("list_locations",{"hosts":"local"})}
        for slug, record in state.items():
            def native(slug=slug,record=record):
                path="/api/v1/agents/"+record["id"]
                detail,_=api.call("GET",path)
                if detail["agent"]["status"]!="active":raise RuntimeError(slug+": native app not active")
                members,_=api.call("GET",path+"/members")
                grants={m["userId"]:m["role"] for m in members["members"]}
                if any(grants.get(user)!="admin" for user in ADMINS):raise RuntimeError(slug+": missing confirmed administrator")
                code,_=request(record["route"]+"api/operations")
                if code not in (401,403):raise RuntimeError(slug+": anonymous operation route not denied")
                name,args=operations[slug]
                code,raw=request(record["route"]+"api/call",api.token,{"tool":name,"args":args},record["route"].rstrip("/"))
                if code!=200:raise RuntimeError(slug+": native callback HTTP "+str(code))
                result=json.loads(raw)
                if result.get("isError") or not result.get("content"):raise RuntimeError(slug+": native callback did not return service response")
                for content in result["content"]:
                    if content.get("type")=="text":
                        text=content.get("text","")
                        if not text.strip():raise RuntimeError(slug+": empty service response")
                        try:data=json.loads(text)
                        except json.JSONDecodeError:continue
                        if isinstance(data,dict) and data.get("job_id") and data.get("status") in ("running","pending"):
                            raise RuntimeError(slug+": service job not complete")
            check(slug+" live callback, grants and auth denial","focused integration","Real browser-origin app route reaches existing service with two confirmed admin grants","Unbound resource, broken forwarded Origin or unauthorized public access",35 if slug=="agent-herder" else 3,45 if slug=="agent-herder" else 30,native)
        overall=True
    finally:
        private_json(RECEIPT,{"ok":overall,"elapsed_seconds":round(time.monotonic()-START,3),"hard_deadline_seconds":180,"checks":CHECKS})
        signal.alarm(0)
        print(json.dumps({"ok":overall,"checks":len(CHECKS),"elapsed_seconds":round(time.monotonic()-START,3),"receipt":str(RECEIPT)}))

if __name__=="__main__":main()
