#!/usr/bin/env python3
"""One ordinary release check, hard deadline 180s; no private response logging.

Every app is checked instead of stopping at the first failure: the run prints an
ok/fail summary per app and exits non-zero when any check fails.
"""
import base64
import json
import os
from pathlib import Path
import re
import signal
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request

from airlock_apps import ADMINS, BASE, ROOT, SOURCE, private_json

START = time.monotonic()
DEADLINE = START + 180
RECEIPT = Path("/tmp/airlock-real-ui-release-check.json")
STATE_FILE = Path("/tmp/airlock-five-apps-deployment.json")
SESSION_FILE = Path(os.environ.get("AIRLOCK_SESSION_FILE", str(Path.home() / ".config/airlock/server-session.json")))
BROKER_SOCKET = Path(os.environ.get("AIRLOCK_BROKER_SOCKET", "/run/airlock-session-broker/sock"))
CHECKS = []
APPS = []

# Acceptable product titles are matched by a normalised brand marker, so that a
# subtitle change does not fail the gate while a foreign product still does:
#   noticeplace       "Notice Place · операторская консоль" (legacy "NoticePlace Admin")
#   universal-userio  "User.io · все ваши чаты, теперь с ИИ" (legacy "Universal UserIO")
#   gptadmin          "GPTAdmin console"
#   agent-herder      "Agent Herder"
#   grepmesh          "GrepMesh — Files"
TARGETS = {
    "noticeplace": ("/admin/", ("noticeplace",), None),
    "universal-userio": ("/", ("userio",), "/v1/accounts"),
    "gptadmin": ("/admin/", ("gptadmin",), "/admin/api/clients"),
    "agent-herder": ("/", ("agentherder",), "/api/adapters"),
    "grepmesh": ("/ui/", ("grepmesh",), "/api/host-status"),
}

def remaining():
    value = DEADLINE - time.monotonic()
    if value <= 0:
        raise RuntimeError("ordinary release deadline exceeded")
    return value

class Session:
    """Owner session for the platform API and the admitted product routes.

    The session broker owns the one-time refresh credential and hands out
    short-lived access tokens, so the gate asks it first and never rotates a
    shared refresh token itself. The session file stays as a fallback for the
    case where the broker is unreachable.
    """

    def __init__(self):
        self.token = ""

    def _broker(self, payload):
        try:
            with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as client:
                client.settimeout(20)
                client.connect(str(BROKER_SOCKET))
                client.sendall((json.dumps(payload) + "\n").encode())
                chunks = []
                while True:
                    data = client.recv(65536)
                    if not data:
                        break
                    chunks.append(data)
                    if b"\n" in data:
                        break
        except (OSError, socket.timeout):
            return None
        raw = b"".join(chunks).split(b"\n", 1)[0]
        try:
            answer = json.loads(raw.decode())
        except Exception:
            return None
        return answer if isinstance(answer, dict) else None

    def _file_token(self):
        try:
            return json.loads(SESSION_FILE.read_text()).get("accessToken", "")
        except Exception:
            return ""

    def claims(self):
        if self.token.count(".") != 2:
            return {}
        part = self.token.split(".")[1]
        part += "=" * (-len(part) % 4)
        try:
            return json.loads(base64.urlsafe_b64decode(part))
        except Exception:
            return {}

    def expired(self):
        expiry = self.claims().get("exp")
        return not expiry or expiry <= time.time() + 30

    def renew(self):
        """Take a live access token from the broker, else from the session file."""
        answer = self._broker({"op": "token"})
        if answer and answer.get("ok") and answer.get("accessToken"):
            self.token = str(answer["accessToken"])
            return self.token
        self.token = self._file_token()
        if not self.token:
            raise RuntimeError("no owner access token: broker %s and file %s are both unavailable" % (BROKER_SOCKET, SESSION_FILE))
        if self.expired():
            raise RuntimeError("owner session expired and could not be renewed; re-login required")
        return self.token

    def ensure(self):
        if not self.token or self.expired():
            self.renew()
        return self.token

    def api(self, method, path, attempts=2):
        """Platform API call; an expired token is renewed once and retried."""
        for attempt in range(attempts):
            request = urllib.request.Request(BASE + path, method=method, headers={"Authorization": "Bearer " + self.ensure(), "Accept": "application/json"})
            try:
                with urllib.request.urlopen(request, timeout=min(60, remaining())) as response:
                    raw = response.read()
                    return json.loads(raw) if raw else None
            except urllib.error.HTTPError as exc:
                if exc.code == 401 and attempt + 1 < attempts:
                    self.renew()
                    continue
                raise RuntimeError("Airlock %s %s: HTTP %s" % (method, path, exc.code)) from None

    def fetch(self, url, origin=None, authenticated=True):
        """Product route through the platform proxy.

        A 401 here is the product refusing the caller, not an expired platform
        token, so it is reported as a product failure instead of a session one.
        """
        headers = {"Accept": "*/*"}
        if authenticated:
            headers["Authorization"] = "Bearer " + self.ensure()
        if origin:
            headers["Origin"] = origin
        request = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(request, timeout=min(45, remaining())) as response:
                return response.status, response.read()
        except urllib.error.HTTPError as exc:
            return exc.code, b""
        except Exception as exc:
            return type(exc).__name__, b""

def check(name, category, purpose, defect, expected, maximum, action):
    """Record one check; a failure is kept and the run continues."""
    start = time.monotonic()
    record = {"name": name, "category": category, "purpose": purpose, "defect": defect, "expected_seconds": expected, "max_seconds": maximum}
    CHECKS.append(record)
    try:
        action()
        elapsed = time.monotonic() - start
        if elapsed > maximum:
            raise RuntimeError("scenario maximum exceeded")
        record.update(ok=True, elapsed_seconds=round(elapsed, 3))
    except Exception as exc:
        record.update(ok=False, elapsed_seconds=round(time.monotonic() - start, 3), error=str(exc))
    return record["ok"]

def command(argv, cwd, timeout):
    result = subprocess.run(argv, cwd=cwd, capture_output=True, text=True, timeout=min(timeout, remaining()))
    if result.returncode:
        # Test logs contain no runtime credentials; preserve separately, not chat.
        Path("/tmp/airlock-five-apps-test-failure.log").write_text(result.stdout + result.stderr)
        raise RuntimeError("source check failed; inspect retained local test log")

def normalized_title(html):
    titles = re.findall(r"<title[^>]*>(.*?)</title>", html, re.S)
    if not titles:
        return ""
    return re.sub(r"[^0-9a-zа-яё]+", "", titles[0].lower())

def owned_container(agent_id, grace):
    """The agent runtime is created on demand, so give the dispatcher a moment."""
    limit = time.monotonic() + grace
    while True:
        ids = subprocess.check_output(["docker", "ps", "-q", "--filter", "label=run.airlock.agent=" + agent_id], text=True, timeout=min(5, remaining())).split()
        if len(ids) == 1 or time.monotonic() >= limit:
            return ids
        time.sleep(1)

def main():
    overall = False
    state = {}
    def deadline(_signum, _frame):
        raise TimeoutError("ordinary release hard deadline exceeded")
    signal.signal(signal.SIGALRM, deadline)
    signal.alarm(180)
    try:
        session = Session()
        try:
            state = json.loads(STATE_FILE.read_text())
        except Exception:
            state = {}
        if not isinstance(state, dict):
            state = {}
        catalog = session.api("GET", "/api/v1/agents/all") or {}
        agents = {agent["slug"]: agent for agent in catalog.get("agents", [])}
        subject = session.claims().get("sub")
        def admitted():
            if subject not in ADMINS:
                raise RuntimeError("session subject %s is not a provisioned administrator" % subject)
        check("Owner session is a provisioned administrator", "focused integration", "Call the platform and the admitted product routes as an administrator", "Foreign or expired principal blocks every app check", 1, 10, admitted)
        check("SDK unit and callback regression", "focused integration", "Principal selection, exact confirmation, callback execution", "Wrong credential selection or unauthorized upstream call", 8, 45,
              lambda: command(["env", "GOMAXPROCS=2", "GOFLAGS=-p=2", "go", "test", "-mod=readonly", "./..."], SOURCE, 45))
        check("MCP ingress auth and sessions", "focused integration", "Reject bad bearer before forwarding; retain native MCP session IDs", "Anonymous backend exposure or broken MCP transport", 1, 10,
              lambda: command(["python3", "-B", "-m", "unittest", "-q", "test_airlock_mcp_proxy"], ROOT / "integrations", 10))
        for slug, (page, markers, read_api) in TARGETS.items():
            record = state.get(slug) if isinstance(state.get(slug), dict) else {}
            agent = agents.get(slug)
            agent_id = agent["id"] if agent else record.get("id")
            route = record.get("route") or ("https://%s.airlock.bezrabotnyi.com/" % slug)
            def native(slug=slug, agent_id=agent_id, route=route, page=page, markers=markers, read_api=read_api):
                if not agent_id:
                    raise RuntimeError(slug + ": app is not registered")
                path = "/api/v1/agents/" + agent_id
                detail = session.api("GET", path)
                if detail["agent"]["status"] != "active":
                    raise RuntimeError(slug + ": native app not active")
                members = session.api("GET", path + "/members")
                grants = {m["userId"]: m["role"] for m in members["members"]}
                if any(grants.get(user) != "admin" for user in ADMINS):
                    raise RuntimeError(slug + ": missing confirmed administrator")
                code, _ = session.fetch(route + page, authenticated=False)
                if code not in (401, 403):
                    raise RuntimeError(slug + ": anonymous UI not denied (HTTP %s)" % code)
                code, raw = session.fetch(route + page, origin=route)
                if code != 200:
                    raise RuntimeError(slug + ": original product UI missing (HTTP %s)" % code)
                html = raw.decode("utf-8", "replace")
                title = normalized_title(html)
                if not any(marker in title for marker in markers):
                    raise RuntimeError(slug + ": original product UI missing (unexpected title %r)" % title)
                if 'id="operation-form"' in html:
                    raise RuntimeError(slug + ": original product UI missing (wrapper form served)")
                assets = re.findall(r'(?:src|href)=["\']([^"\']+\.(?:js|css)(?:\?[^"\']*)?)["\']', html)
                from urllib.parse import urljoin
                for asset in assets[:2]:
                    url = urljoin(route + page, asset)
                    if not url.startswith(route):
                        raise RuntimeError(slug + ": external product asset")
                    code, data = session.fetch(url)
                    if code != 200 or not data:
                        raise RuntimeError(slug + ": product asset missing (HTTP %s)" % code)
                if read_api:
                    code, data = session.fetch(route + read_api, origin=route)
                    if code != 200:
                        raise RuntimeError(slug + ": product API missing (HTTP %s)" % code)
                    try:
                        payload = json.loads(data)
                    except Exception:
                        raise RuntimeError(slug + ": product API is not JSON") from None
                    if not isinstance(payload, (dict, list)):
                        raise RuntimeError(slug + ": product API is not JSON")
                ids = owned_container(agent_id, 8)
                if len(ids) != 1:
                    raise RuntimeError(slug + ": runtime not uniquely identified")
                info = json.loads(subprocess.check_output(["docker", "inspect", ids[0]], text=True, timeout=min(5, remaining())))[0]["HostConfig"]
                wanted = {"Memory": 256 << 20, "MemoryReservation": 128 << 20, "MemorySwap": 256 << 20, "NanoCpus": 1000000000, "PidsLimit": 128}
                if any(info.get(k) != v for k, v in wanted.items()):
                    raise RuntimeError(slug + ": runtime budget missing")
            outcome = check(slug + " original UI, assets, API, grants, auth and budget", "focused integration", "Use original existing product through admitted native caller", "Wrapper UI, broken auth/static/API or unbounded lazy container", 4, 35, native)
            APPS.append({"slug": slug, "route": route, "in_state": slug in state, "ok": outcome, "error": CHECKS[-1].get("error")})
        herder = state.get("agent-herder") if isinstance(state.get("agent-herder"), dict) else {}
        herder_route = herder.get("route") or "https://agent-herder.airlock.bezrabotnyi.com/"
        def stream():
            url = herder_route + "api/events/stream?after=0"
            request = urllib.request.Request(url, headers={"Authorization": "Bearer " + session.ensure(), "Accept": "text/event-stream"})
            with urllib.request.urlopen(request, timeout=min(10, remaining())) as response:
                if response.status != 200 or not response.headers.get("Content-Type", "").startswith("text/event-stream") or not response.readline():
                    raise RuntimeError("native original SSE stream failed")
        check("Herder original event stream", "focused integration", "Original EventSource stream remains live through native proxy", "Buffered or broken native SSE transport", 1, 10, stream)
        overall = all(record.get("ok") for record in CHECKS)
    except TimeoutError as exc:
        CHECKS.append({"name": "hard deadline", "ok": False, "error": str(exc)})
        overall = False
    except Exception as exc:
        CHECKS.append({"name": "gate run", "ok": False, "error": "%s: %s" % (type(exc).__name__, exc)})
        overall = False
    finally:
        private_json(RECEIPT, {"ok": overall, "elapsed_seconds": round(time.monotonic() - START, 3), "hard_deadline_seconds": 180, "checks": CHECKS, "apps": APPS, "state_entries": sorted(state)})
        signal.alarm(0)
        print("state entries:", ", ".join(sorted(state)) or "(none)")
        for app in APPS:
            print("%-18s %-4s %s" % (app["slug"], "ok" if app["ok"] else "FAIL", app.get("error") or ""))
        failed = [record["name"] for record in CHECKS if not record.get("ok")]
        if failed:
            print("failed checks:", ", ".join(failed))
        print(json.dumps({"ok": overall, "checks": len(CHECKS), "apps": len(APPS), "elapsed_seconds": round(time.monotonic() - START, 3), "receipt": str(RECEIPT)}))
    sys.exit(0 if overall else 1)

if __name__ == "__main__":
    main()
