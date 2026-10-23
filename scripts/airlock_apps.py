#!/usr/bin/env python3
"""Scoped native Airlock app registration and source upload. No product data copies.

Canonical registration is one command:

    python3 scripts/airlock_apps.py register-app --app <slug> \
        --credential-file ~/.config/airlock/server-session.json

The command is idempotent: an application that is already registered is
reported as "already registered" and nothing existing is overwritten. Bearer
tokens are read from files and are never printed.
"""
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
import time
import urllib.error
import urllib.request

BASE = "https://airlock.bezrabotnyi.com"
ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "integrations/airlock-apps"
CATALOG = SOURCE / "apps.json"
TOKEN_DIR = Path.home() / ".config/airlock-apps"
ADMINS = ["5e438326-6339-4ac8-a328-59dae1d6241f", "98daa037-a87d-49b1-ba07-cd9e6f451864"]
OWNED_SOURCE = ["go.mod", "go.sum", "main.go", "main_test.go", "ui_proxy.go", "ui_proxy_test.go", "runtime_budget.go", "bridgeauth/auth.go", "bridgeauth/auth_test.go", "db/migrations/doc.go", "styles/app.css"]
# The manifest must carry an explicit binding mode: an MCP need without one
# panics RegisterMCP in the SDK and never reaches the platform.
BINDING_MODE = "shared"
# SDK 0.8 removed the local-host harness, so a source that still imports it
# cannot build against the current SDK.
FORBIDDEN_SOURCE = ["agentsdk/agenttest"]
BUDGET = ["--cpus=1", "--memory=256m", "--memory-reservation=128m", "--memory-swap=256m", "--pids-limit=128"]

def private_json(path, data):
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w") as file:
        json.dump(data, file, ensure_ascii=False, indent=2)

class AirlockError(RuntimeError):
    """A platform API failure that keeps its HTTP code for the caller's decision."""

    def __init__(self, method, path, code):
        super().__init__("Airlock %s %s: HTTP %s" % (method, path, code))
        self.method = method
        self.path = path
        self.code = code

class API:
    def __init__(self, credential):
        self.credential = Path(credential)
        self.token = self._read()
        self.last_status = None

    def _read(self):
        return json.loads(self.credential.read_text())["accessToken"]

    def call(self, method, path, data=None, headers=None, attempts=2):
        h = {"Authorization": "Bearer " + self.token, "Accept": "application/json"}
        h.update(headers or {})
        if data is not None and not isinstance(data, bytes):
            data = json.dumps(data).encode()
            h["Content-Type"] = "application/json"
        for attempt in range(attempts):
            req = urllib.request.Request(BASE + path, data=data, method=method, headers=h)
            try:
                with urllib.request.urlopen(req, timeout=60) as response:
                    self.last_status = response.status
                    body = response.read()
                    parsed = json.loads(body) if body and response.headers.get("Content-Type", "").startswith("application/json") else None
                    return parsed, response.headers
            except urllib.error.HTTPError as exc:
                if exc.code == 401 and attempt + 1 < attempts:
                    # The owner session file is rotated by airlock-api; re-read it once.
                    try:
                        self.token = self._read()
                    except Exception:
                        raise AirlockError(method, path, exc.code) from None
                    h["Authorization"] = "Bearer " + self.token
                    continue
                # Auth responses, resource credentials and source errors stay private.
                self.last_status = exc.code
                raise AirlockError(method, path, exc.code) from None

def manifest(config, agent_id):
    """Per-agent manifest: the catalog entry plus the real agent id.

    The manifest bytes stay identical to the deployed source, so an unchanged
    application is recognised as unchanged by the platform and is not rebuilt.
    A binding may declare its own binding_mode in the catalog; the adapter
    defaults to the shared mode otherwise.
    """
    return {**config, "agent_id": agent_id}

def source_guard():
    """Refuse a source that cannot build against the current SDK."""
    for name in OWNED_SOURCE:
        text = (SOURCE / name).read_text()
        for forbidden in FORBIDDEN_SOURCE:
            if forbidden in text:
                raise RuntimeError("source %s imports the removed %s package" % (name, forbidden))
    # RegisterMCP panics without a binding mode, so the adapter must declare one.
    if "BindingMode" not in (SOURCE / "main.go").read_text():
        raise RuntimeError("adapter source declares no binding mode for RegisterMCP")

def bundle(config, agent_id):
    source_guard()
    stream = io.BytesIO()
    with tarfile.open(fileobj=stream, mode="w") as archive:
        entries = {name: (SOURCE / name).read_bytes() for name in OWNED_SOURCE}
        entries["app.json"] = json.dumps(manifest(config, agent_id), ensure_ascii=False).encode()
        for name, data in sorted(entries.items()):
            item = tarfile.TarInfo(name)
            item.size = len(data)
            item.mode = 0o644
            archive.addfile(item, io.BytesIO(data))
    return gzip.compress(stream.getvalue(), mtime=0)

def read_token(binding_slug, config, args):
    """Read the bearer of one binding from a file. The value is never printed."""
    if args.token_file:
        path = Path(args.token_file)
        raw = path.read_text()
        try:
            mapping = json.loads(raw)
        except ValueError:
            mapping = None
        if isinstance(mapping, dict):
            entry = mapping.get(binding_slug)
            if entry is None:
                raise RuntimeError("no token for binding %s in %s" % (binding_slug, path))
            if isinstance(entry, dict):
                entry = entry.get("path") or entry.get("token")
            if not isinstance(entry, str) or not entry.strip():
                raise RuntimeError("empty token for binding %s in %s" % (binding_slug, path))
            candidate = Path(entry)
            if not candidate.is_absolute():
                candidate = path.parent / candidate
            if candidate.is_file():
                return candidate.read_text().strip()
            return entry.strip()
        if len(config.get("bindings", [])) != 1:
            raise RuntimeError("a raw token file serves a single-binding application only; use a JSON map for several bindings")
        return raw.strip()
    candidate = Path(args.token_dir) / (binding_slug + ".token")
    if candidate.is_file():
        return candidate.read_text().strip()
    raise RuntimeError("no token file for binding %s: expected %s" % (binding_slug, candidate))

def ensure_members(api, agent_id):
    """Grant the owner principals the administrator role; never revoke anything."""
    members, _ = api.call("GET", "/api/v1/agents/%s/members" % agent_id)
    roles = {m.get("userId"): m.get("role") for m in members.get("members", [])}
    added = []
    for user in ADMINS:
        if roles.get(user) != "admin":
            api.call("POST", "/api/v1/agents/%s/members" % agent_id, {"userId": user, "role": "admin"})
            added.append(user)
    return added

def list_needs(api, agent_id):
    needs, _ = api.call("GET", "/api/v1/agents/%s/needs" % agent_id)
    return {n.get("slug"): n for n in needs.get("needs", []) if n.get("type") == "mcp_server"}

def wait_for_needs(api, agent_id, slugs, timeout):
    """A need appears when the started agent syncs its manifest to the platform."""
    deadline = time.monotonic() + timeout
    while True:
        needs = list_needs(api, agent_id)
        if all(slug in needs for slug in slugs):
            return needs
        if time.monotonic() >= deadline:
            missing = [slug for slug in slugs if slug not in needs]
            raise RuntimeError("platform did not declare the MCP need(s): %s" % ", ".join(missing))
        time.sleep(3)

def wait_for_build(api, agent_id, known, timeout, expect_build=True):
    """Wait for the build the upload started and return its record."""
    deadline = time.monotonic() + timeout
    while True:
        builds, _ = api.call("GET", "/api/v1/agents/%s/builds" % agent_id)
        items = sorted(builds.get("builds", []), key=lambda b: b.get("startedAt") or "", reverse=True)
        fresh = [b for b in items if b.get("id") not in known]
        if fresh:
            build = fresh[0]
            status = build.get("status")
            if status in ("complete", "failed", "cancelled"):
                if status != "complete":
                    raise RuntimeError("build %s %s: %s" % (build.get("id"), status, build.get("errorMessage") or "no error message"))
                return build
        elif not expect_build:
            # The platform answered 200: the source was unchanged, no build ran.
            if items and items[0].get("status") == "complete":
                return items[0]
            raise RuntimeError("source was unchanged but no completed build is recorded")
        if time.monotonic() >= deadline:
            raise RuntimeError("build did not finish within %ss" % timeout)
        time.sleep(5)

def upload_source(api, agent_id, config, record):
    """Upload the shared adapter source; a fresh agent has no source to match."""
    data = bundle(config, agent_id)
    digest = hashlib.sha256(data).hexdigest()
    path = "/api/v1/agents/%s/source" % agent_id
    head = {}
    try:
        _, head = api.call("HEAD", path)
    except AirlockError as exc:
        # 404 means the agent has no deployed source. That is the normal state
        # of a fresh agent, so the upload goes out without If-Match.
        if exc.code == 404:
            head = {}
        elif exc.code == 409 and not record.get("uploaded_sha256"):
            head = {}  # Native draft has no source state before first upload.
        else:
            raise
    if head.get("ETag") and record.get("uploaded_sha256") == digest:
        return {"status": "preserved previous upload", "digest": digest, "build_expected": False}
    headers = {"Content-Type":"application/gzip", "X-Airlock-Commit-Message":"Connect existing app through native MCP callbacks"}
    if head.get("ETag"):
        headers["If-Match"] = head["ETag"]
    _, receipt = api.call("PUT", path, data, headers)
    record["uploaded_sha256"] = digest
    record["source_etag"] = receipt.get("ETag")
    # 202 Accepted means the platform started a build, 200 means it was unchanged.
    return {"status": "uploaded", "digest": digest, "build_expected": api.last_status == 202}

def start_agent(api, agent_id, attempts=6):
    """Manual start: a stopped agent is only revived by an explicit start."""
    failure = None
    for attempt in range(attempts):
        try:
            api.call("POST", "/api/v1/agents/%s/start" % agent_id, {})
            return "started"
        except AirlockError as exc:
            failure = exc
            if exc.code != 409:  # 409: deployment recovery is in progress
                raise
            time.sleep(5)
    raise failure

def owned_container(agent_id, grace):
    """The agent runtime is created on demand, so give the dispatcher a moment."""
    limit = time.monotonic() + grace
    while True:
        ids = subprocess.check_output(["docker", "ps", "-q", "--filter", "label=run.airlock.agent=" + agent_id], text=True, timeout=5).split()
        if len(ids) == 1 or time.monotonic() >= limit:
            return ids
        time.sleep(1)

def apply_budget(api, agent_id, record):
    """Apply the runtime budget to the container this agent owns."""
    ids = owned_container(agent_id, 30)
    if not ids:
        record["runtime_budget_state"] = "idle; reconciled on next admitted UI/MCP request"
        return "idle"
    if len(ids) != 1:
        raise RuntimeError("owned container is not unique")
    name = ids[0]
    info = json.loads(subprocess.check_output(["docker", "inspect", name], text=True, timeout=5))[0]
    if info["Config"]["Labels"].get("run.airlock.agent") != agent_id:
        raise RuntimeError("container ownership mismatch")
    subprocess.run(["docker", "update"] + BUDGET + [name], check=True, timeout=5, stdout=subprocess.DEVNULL)
    info = json.loads(subprocess.check_output(["docker", "inspect", name], text=True, timeout=5))[0]["HostConfig"]
    record["runtime_budget"] = {k:info.get(k) for k in ("Memory", "MemoryReservation", "MemorySwap", "NanoCpus", "PidsLimit")}
    record["runtime_budget_state"] = "applied to current owned generation"
    return "applied"

def register_app(api, config, args, state):
    """One command: agent, members, source, build, start, need, resource, credential, budget."""
    slug = config["slug"]
    bindings = config.get("bindings", [])
    steps = {}
    current, _ = api.call("GET", "/api/v1/agents/all")
    agents = {a["slug"]: a for a in current["agents"]}
    if slug in agents:
        agent_id = agents[slug]["id"]
        steps["agent"] = "already registered"
    else:
        created, _ = api.call("POST", "/api/v1/agents", {"name": config["name"], "slug": slug, "description": "Штатное подключение действующего сервиса", "skipInitialBuild": True})
        agent_id = created["agent"]["id"]
        steps["agent"] = "created"
    path = "/api/v1/agents/" + agent_id
    record = state.setdefault(slug, {"id": agent_id})
    record["id"] = agent_id
    added = ensure_members(api, agent_id)
    steps["members"] = "granted to %d administrator(s)" % len(added) if added else "already granted"
    known = {b.get("id") for b in api.call("GET", path + "/builds")[0].get("builds", [])}
    upload = upload_source(api, agent_id, config, record)
    steps["source"] = upload["status"]
    build = wait_for_build(api, agent_id, known, args.build_timeout, upload["build_expected"])
    record["build_id"] = build.get("id")
    steps["build"] = "%s %s" % (build.get("status"), (build.get("id") or "")[:8])
    steps["start"] = start_agent(api, agent_id)
    needs = wait_for_needs(api, agent_id, [b["slug"] for b in bindings], args.need_timeout)
    resources = {}
    for binding in bindings:
        need = needs.get(binding["slug"]) or {}
        if need.get("bound") and need.get("boundResourceId"):
            resources[binding["slug"]] = need["boundResourceId"]
            steps["resource " + binding["slug"]] = "already bound"
            continue
        label = config["name"] if len(bindings) == 1 else config["name"] + " · " + binding["slug"]
        created, _ = api.call("POST", path + "/needs/mcp_server/%s/create" % binding["slug"], {"displayName": label})
        resources[binding["slug"]] = created["resourceId"]
        steps["resource " + binding["slug"]] = "created"
    for binding in bindings:
        slug_name = binding["slug"]
        label = config["name"] if len(bindings) == 1 else config["name"] + " · " + slug_name
        status, _ = api.call("GET", path + "/mcp-servers/%s/credentials" % slug_name)
        if status.get("status", {}).get("authorized"):
            steps["credential " + slug_name] = "already authorized"
            continue
        if binding.get("auth_mode") in ("oauth", "oauth_discovery"):
            # An OAuth resource is authorized through the platform OAuth flow,
            # not with a bearer from a file.
            steps["credential " + slug_name] = "oauth flow required"
            continue
        token = read_token(slug_name, config, args)
        api.call("POST", path + "/mcp-servers/%s/credentials" % slug_name, {"apiKey": token, "displayName": label + " Airlock"})
        status, _ = api.call("GET", path + "/mcp-servers/%s/credentials" % slug_name)
        if not status.get("status", {}).get("authorized"):
            raise RuntimeError("%s: credential was not confirmed by native readback" % slug)
        steps["credential " + slug_name] = "authorized"
    steps["budget"] = apply_budget(api, agent_id, record)
    record["route"] = "https://%s.airlock.bezrabotnyi.com/" % slug
    private_json(args.state, state)
    return {"app": slug, "id": agent_id, "command": "register-app", "steps": steps, "resources": resources, "route": record["route"]}

def verify_app(api, config, agent_id):
    """Read-only verdict for one application."""
    checks = []
    detail, _ = api.call("GET", "/api/v1/agents/" + agent_id)
    status = detail["agent"].get("status")
    checks.append(("agent active", status == "active", status))
    members, _ = api.call("GET", "/api/v1/agents/%s/members" % agent_id)
    grants = {m.get("userId"): m.get("role") for m in members.get("members", [])}
    granted = sum(1 for user in ADMINS if grants.get(user) == "admin")
    checks.append(("administrators granted", granted == len(ADMINS), "%d of %d" % (granted, len(ADMINS))))
    needs = list_needs(api, agent_id)
    for binding in config.get("bindings", []):
        need = needs.get(binding["slug"])
        checks.append(("need " + binding["slug"] + " bound", bool(need and need.get("bound")), (need or {}).get("boundResourceId") or "absent"))
        try:
            credential, _ = api.call("GET", "/api/v1/agents/%s/mcp-servers/%s/credentials" % (agent_id, binding["slug"]))
            authorized = bool(credential.get("status", {}).get("authorized"))
        except AirlockError as exc:
            authorized = False
            credential = {"status": {"error": str(exc)}}
        checks.append(("credential " + binding["slug"] + " authorized", authorized, "authorized" if authorized else "not authorized"))
        try:
            tools, _ = api.call("GET", "/api/v1/agents/%s/integrations/mcp/%s/tools" % (agent_id, binding["slug"]))
            count = len(tools.get("tools", []))
        except AirlockError:
            count = 0
        checks.append(("tools " + binding["slug"] + " discovered", count > 0, str(count)))
    builds, _ = api.call("GET", "/api/v1/agents/%s/builds" % agent_id)
    latest = sorted(builds.get("builds", []), key=lambda b: b.get("startedAt") or "", reverse=True)
    build_status = latest[0].get("status") if latest else "none"
    checks.append(("build complete", build_status == "complete", build_status))
    return checks

def run():
    p = argparse.ArgumentParser()
    p.add_argument("command", choices=["register", "register-app", "upload", "start", "status", "bind", "credential", "tools", "consumer", "budget", "env", "needs", "verify"])
    p.add_argument("--credential-file", default="/tmp/airlock-integration-session.json")
    p.add_argument("--state", default="/tmp/airlock-five-apps-deployment.json")
    p.add_argument("--catalog", default=str(CATALOG))
    p.add_argument("--app")
    p.add_argument("--binding")
    p.add_argument("--resource")
    p.add_argument("--token-file")
    p.add_argument("--token-dir", default=str(TOKEN_DIR))
    p.add_argument("--tool")
    p.add_argument("--args", default="{}")
    p.add_argument("--build-timeout", type=int, default=600)
    p.add_argument("--need-timeout", type=int, default=180)
    args = p.parse_args()
    if args.command == "register-app" and not args.app:
        raise RuntimeError("register-app requires --app")
    api = API(args.credential_file)
    configs = json.loads(Path(args.catalog).read_text())
    state = json.loads(Path(args.state).read_text()) if Path(args.state).exists() else {}
    current, _ = api.call("GET", "/api/v1/agents/all")
    agents = {a["slug"]: a for a in current["agents"]}
    if args.app and not any(c["slug"] == args.app for c in configs):
        raise RuntimeError("App %s is not in the catalog %s" % (args.app, args.catalog))
    for config in configs:
        slug = config["slug"]
        if args.app and slug != args.app:
            continue
        if args.command == "register-app":
            print(json.dumps(register_app(api, config, args, state), ensure_ascii=False, indent=1))
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
            added = ensure_members(api, agent_id)
            actual, _ = api.call("GET", path + "/members")
            record["members"] = [{"userId": m.get("userId"), "role": m.get("role")} for m in actual.get("members", []) if m.get("userId") in ADMINS]
        elif args.command == "upload":
            upload = upload_source(api, agent_id, config, record)
            if upload["status"] == "preserved previous upload":
                print(json.dumps({"app":slug,"source":"preserved previous upload"}))
                continue
        elif args.command == "start":
            detail, _ = api.call("GET", path)
            before = detail["agent"].get("status")
            start_agent(api, agent_id)
            record["start"] = "started from %s" % before
        elif args.command == "needs":
            needs, _ = api.call("GET", path + "/needs")
            print(json.dumps({"app":slug,"needs":[{"type":n.get("type"),"slug":n.get("slug"),"bound":n.get("bound"),"resource_id":n.get("boundResourceId"),"binding_mode":n.get("bindingMode")} for n in needs.get("needs", [])]},ensure_ascii=False))
        elif args.command == "verify":
            checks = verify_app(api, config, agent_id)
            for name, ok, observed in checks:
                print("%-18s %-4s %s" % (slug, "ok" if ok else "FAIL", name + ": " + observed))
            record["verified"] = all(ok for _, ok, _ in checks)
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
            apply_budget(api, agent_id, record)
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
