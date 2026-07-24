"""Process-level contract for the optional live Hub acceptance runner."""

from __future__ import annotations

import importlib.util
import json
import os
import signal
import socket
import subprocess
import threading
import time
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

import pytest


ROOT = Path(__file__).resolve().parents[1]
RUNNER_PATH = ROOT / "tests" / "e2e" / "live_acceptance.py"
SPEC = importlib.util.spec_from_file_location("live_acceptance", RUNNER_PATH)
assert SPEC and SPEC.loader
live_acceptance = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(live_acceptance)


class _Handler(BaseHTTPRequestHandler):
    """Minimal disposable Hub surface used by the runner regression."""

    def _send(self, status: int, payload: Any, content_type: str = "application/json") -> None:
        body = payload if isinstance(payload, bytes) else json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802 - stdlib handler contract
        if self.path == "/actions/openapi.yaml":
            self._send(200, b"openapi: 3.1.0\n", "application/yaml")
        elif self.path == "/connect.json":
            self._send(200, {"mcp_endpoint": "/mcp", "oauth_authorization_server": "/.well-known/oauth-authorization-server"})
        elif self.path == "/.well-known/oauth-authorization-server":
            self._send(200, {"authorization_endpoint": "http://127.0.0.1/oauth/authorize", "token_endpoint": "http://127.0.0.1/oauth/token"})
        elif self.path in {"/healthz", "/version"}:
            self._send(200, {"ok": True})
        else:
            self._send(404, {"error": "not found"})

    def do_POST(self) -> None:  # noqa: N802 - stdlib handler contract
        if self.path != "/mcp" or self.headers.get("Authorization") != "Bearer test-bearer":
            self._send(401, {"error": "unauthorized"})
            return
        request = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        if request["method"] == "tools/list":
            self._send(200, {"jsonrpc": "2.0", "id": request["id"], "result": {"tools": [{"name": "demo"}]}})
        else:
            self._send(200, {"jsonrpc": "2.0", "id": request["id"], "result": {"structuredContent": {"safe": True}}})

    def log_message(self, *_args: object) -> None:
        return


def test_live_runner_checks_public_and_authenticated_surfaces_without_echoing_bearer() -> None:
    """The runner must exercise the minimum deployment smoke without leaking auth."""

    server = ThreadingHTTPServer(("127.0.0.1", 0), _Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        summary = live_acceptance.run_acceptance(
            f"http://127.0.0.1:{server.server_port}",
            "test-bearer",
            required_tools={"demo"},
        )
    finally:
        server.shutdown()
        thread.join(timeout=5)
        server.server_close()

    assert summary["status"] == "passed"
    assert summary["stages"] == ["health", "version", "connection", "oauth", "openapi", "mcp"]
    assert "test-bearer" not in json.dumps(summary)


@pytest.fixture
def disposable_real_hub(tmp_path: Path):
    """Build and run the actual Go Hub for a process-level live smoke."""

    binary = tmp_path / "gptadmin-hub"
    subprocess.run(
        ["go", "build", "-buildvcs=false", "-o", str(binary), "./cmd/gptadmin-hub"],
        cwd=ROOT / "go-hub",
        check=True,
        timeout=120,
    )
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        port = int(sock.getsockname()[1])
    config_dir = tmp_path / "config"
    config_dir.mkdir()
    env = os.environ.copy()
    env.update(
        {
            "GPTADMIN_HUB_HOST": "127.0.0.1",
            "GPTADMIN_HUB_PORT": str(port),
            "HUB_HOST": "127.0.0.1",
            "HUB_PORT": str(port),
            "PORT": str(port),
            "CTL_TOKEN": "ctl",
            "ADMIN_PASSWORD": "pw",
            "PUBLIC_ORIGIN": f"http://127.0.0.1:{port}",
            "MCP_RESOURCE": f"http://127.0.0.1:{port}",
            "GPTADMIN_CONFIG_DIR": str(config_dir),
            "GPTADMIN_ROOT": str(ROOT),
            "NO_PROXY": "localhost,127.0.0.1",
            "no_proxy": "localhost,127.0.0.1",
            "HTTP_PROXY": "",
            "HTTPS_PROXY": "",
            "ALL_PROXY": "",
        }
    )
    process = subprocess.Popen(
        [str(binary)],
        cwd=ROOT,
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        start_new_session=True,
    )
    base_url = f"http://127.0.0.1:{port}"
    deadline = time.monotonic() + 15
    while time.monotonic() < deadline:
        try:
            with urllib.request.urlopen(f"{base_url}/version", timeout=1) as response:
                if response.status == 200:
                    break
        except (OSError, urllib.error.URLError):
            time.sleep(0.1)
    else:
        process.kill()
        process.wait(timeout=5)
        pytest.fail("disposable Go Hub did not become ready")
    try:
        yield base_url
    finally:
        if process.poll() is None:
            os.killpg(os.getpgid(process.pid), signal.SIGTERM)
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                os.killpg(os.getpgid(process.pid), signal.SIGKILL)
                process.wait(timeout=5)


def test_live_runner_checks_actual_go_hub_process(disposable_real_hub: str) -> None:
    """The deployment runner must work against the real Hub binary, not only a mock."""

    summary = live_acceptance.run_acceptance(disposable_real_hub, "ctl", required_tools={"demo"})
    assert summary["status"] == "passed"
    assert summary["tool_count"] > 0
