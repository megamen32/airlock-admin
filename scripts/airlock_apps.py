#!/usr/bin/env python3
"""Scoped native Airlock app registration and source upload. No product data copies."""
import argparse
import base64
import gzip
import hashlib
import io
import json
import os
from pathlib import Path
import subprocess
import tarfile
import urllib.error
import urllib.request

BASE = "https://airlock.bezrabotnyi.com"
ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "integrations/airlock-apps"
ADMINS = ["5e438326-6339-4ac8-a328-59dae1d6241f", "98daa037-a87d-49b1-ba07-cd9e6f451864"]
OWNED_SOURCE = ["go.mod", "go.sum", "main.go", "main_test.go", "ui_proxy.go", "ui_proxy_test.go", "runtime_budget.go", "bridgeauth/auth.go", "bridgeauth/auth_test.go", "db/migrations/doc.go", "styles/app.css"]

def private_json(path, data):
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w") as file:
        json.dump(data, file, ensure_ascii=False, indent=2)

class API:
    def __init__(self, credential):
        self.token = json.loads(Path(credential).read_text())["accessToken"]

    def call(self, method, path, data=None, headers=None):
        h = {"Authorization": "Bearer " + self.token, "Accept": "application/json"}
        h.update(headers or {})
        if data is not None and not isinstance(data, bytes):
            data = json.dumps(data).encode()
            h["Content-Type"] = "application/json"
        req = urllib.request.Request(BASE + path, data=data, method=method, headers=h)
        try:
            with urllib.request.urlopen(req, timeout=60) as response:
                body = response.read()
                parsed = json.loads(body) if body and response.headers.get("Content-Type", "").startswith("application/json") else None
                return parsed, response.headers
        except urllib.error.HTTPError as exc:
            # Auth responses, resource credentials and source errors stay private.
            raise RuntimeError(f"Airlock {method} {path}: HTTP {exc.code}") from None

def bundle(config, agent_id):
    stream = io.BytesIO()
    with tarfile.open(fileobj=stream, mode="w") as archive:
        entries = {name: (SOURCE / name).read_bytes() for name in OWNED_SOURCE}
        entries["app.json"] = json.dumps({**config, "agent_id": agent_id}, ensure_ascii=False).encode()
        for name, data in sorted(entries.items()):
            item = tarfile.TarInfo(name)
            item.size = len(data)
            item.mode = 0o644
            archive.addfile(item, io.BytesIO(data))
    return gzip.compress(stream.getvalue(), mtime=0)

def run():
    p = argparse.ArgumentParser()
    p.add_argument("command", choices=["register", "upload", "status", "bind", "credential", "tools", "consumer", "budget", "env"])
    p.add_argument("--credential-file", default="/tmp/airlock-integration-session.json")
    p.add_argument("--state", default="/tmp/airlock-five-apps-deployment.json")
    p.add_argument("--app")
    p.add_argument("--binding")
    p.add_argument("--resource")
    p.add_argument("--token-file")
    p.add_argument("--tool")
    p.add_argument("--args", default="{}")
    args = p.parse_args()
    api = API(args.credential_file)
    configs = json.loads((SOURCE / "apps.json").read_text())
    state = json.loads(Path(args.state).read_text()) if Path(args.state).exists() else {}
    current, _ = api.call("GET", "/api/v1/agents/all")
    agents = {a["slug"]: a for a in current["agents"]}
    for config in configs:
        slug = config["slug"]
        if args.app and slug != args.app:
            continue
        if slug not in agents:
            if args.command != "register":
                raise RuntimeError(f"App {slug} is not registered")
            created, _ = api.call("POST", "/api/v1/agents", {"name": config["name"], "slug": slug, "description": "Штатное подключение действующего сервиса", "skipInitialBuild": True})
            agents[slug] = created["agent"]
            state[slug] = {"id": agents[slug]["id"], "registered": True}
            private_json(args.state, state)
        agent_id = agents[slug]["id"]
        record = state.setdefault(slug, {"id": agent_id})
        path = f"/api/v1/agents/{agent_id}"
        if args.command == "register":
            members, _ = api.call("GET", path + "/members")
            members = {m["userId"]: m for m in members.get("members", [])}
            for user in ADMINS:
                if members.get(user, {}).get("role") != "admin":
                    api.call("POST", path + "/members", {"userId": user, "role": "admin"})
            actual, _ = api.call("GET", path + "/members")
            record["members"] = [{"userId": m.get("userId"), "role": m.get("role")} for m in actual.get("members", []) if m.get("userId") in ADMINS]
        elif args.command == "upload":
            data = bundle(config, agent_id)
            digest = hashlib.sha256(data).hexdigest()
            if record.get("uploaded_sha256") == digest:
                print(json.dumps({"app":slug,"source":"preserved previous upload"}))
                continue
            try:
                _, head = api.call("HEAD", path + "/source")
            except RuntimeError as exc:
                if not str(exc).endswith("HTTP 409") or record.get("uploaded_sha256"):
                    raise
                head = {}  # Native draft has no source state before first upload.
            headers = {"Content-Type":"application/gzip", "X-Airlock-Commit-Message":"Connect existing app through native MCP callbacks"}
            if head.get("ETag"):
                headers["If-Match"] = head["ETag"]
            _, receipt = api.call("PUT", path + "/source", data, headers)
            record["uploaded_sha256"] = digest
            record["source_etag"] = receipt.get("ETag")
        elif args.command == "bind":
            if not args.binding or not args.resource:
                raise RuntimeError("bind requires --binding and --resource")
            api.call("POST", path + f"/needs/mcp_server/{args.binding}/bind", {"resourceId": args.resource})
            record.setdefault("bindings", {})[args.binding] = args.resource
        elif args.command == "credential":
            if not args.binding or not args.token_file:
                raise RuntimeError("credential requires --binding and --token-file")
            token = Path(args.token_file).read_text().strip()
            api.call("POST", path + f"/mcp-servers/{args.binding}/credentials", {"apiKey": token, "displayName": config["name"] + " Airlock"})
            status, _ = api.call("GET", path + f"/mcp-servers/{args.binding}/credentials")
            if not status.get("status", {}).get("authorized"):
                raise RuntimeError(f"{slug}: credential was not confirmed by native readback")
            record.setdefault("credential_configured", {})[args.binding] = True
        elif args.command == "env":
            if not args.binding or not args.token_file:
                raise RuntimeError("env requires --binding and --token-file")
            value = Path(args.token_file).read_text().strip()
            api.call("POST", path + f"/env-vars/{args.binding}", {"value": value})
            record.setdefault("secret_env_configured", {})[args.binding] = True
        elif args.command == "tools":
            tools, _ = api.call("GET", path + f"/integrations/mcp/{args.binding}/tools")
            print(json.dumps({"app":slug,"tools":[{"name":t["name"],"schema":t.get("inputSchemaJson")} for t in tools.get("tools", [])]},ensure_ascii=False))
        elif args.command == "consumer":
            payload = {"tool": args.tool, "argumentsJson": base64.b64encode(args.args.encode()).decode()}
            result, _ = api.call("POST", path + f"/integrations/mcp/{args.binding}/call", payload)
            ok = not result.get("isError", False)
            record.setdefault("consumer", {})[args.binding] = {"tool":args.tool,"ok":ok,"content_blocks":len(result.get("content", []))}
            if not ok:
                raise RuntimeError(f"{slug} upstream rejected consumer call")
        elif args.command == "budget":
            ids = subprocess.check_output(["docker", "ps", "-q", "--filter", "label=run.airlock.agent=" + agent_id], text=True, timeout=5).split()
            if not ids:
                record["runtime_budget_state"] = "idle; reconciled on next admitted UI/MCP request"
            elif len(ids) != 1:
                raise RuntimeError("owned container is not unique")
            else:
                name = ids[0]
                info = json.loads(subprocess.check_output(["docker", "inspect", name], text=True, timeout=5))[0]
                if info["Config"]["Labels"].get("run.airlock.agent") != agent_id:
                    raise RuntimeError("container ownership mismatch")
                subprocess.run(["docker", "update", "--cpus=1", "--memory=256m", "--memory-reservation=128m", "--memory-swap=256m", "--pids-limit=128", name], check=True, timeout=5, stdout=subprocess.DEVNULL)
                info = json.loads(subprocess.check_output(["docker", "inspect", name], text=True, timeout=5))[0]["HostConfig"]
                record["runtime_budget"] = {k:info.get(k) for k in ("Memory", "MemoryReservation", "MemorySwap", "NanoCpus", "PidsLimit")}
                record["runtime_budget_state"] = "applied to current owned generation"
        elif args.command == "status":
            detail, _ = api.call("GET", path)
            builds, _ = api.call("GET", path + "/builds")
            record["status"] = detail["agent"].get("status")
            record["builds"] = [{k:b.get(k) for k in ("id", "status", "errorMessage", "completedAt")} for b in builds.get("builds", [])[:2]]
        record["route"] = f"https://{slug}.airlock.bezrabotnyi.com/"
        private_json(args.state, state)
        print(json.dumps({"app":slug,"id":agent_id,"command":args.command,"status":record.get("status"),"route":record["route"]},ensure_ascii=False))

if __name__ == "__main__":
    run()
