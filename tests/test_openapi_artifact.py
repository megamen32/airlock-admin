from __future__ import annotations

import os
import re
import socket
import subprocess
import tempfile
import time
from pathlib import Path
from urllib.error import URLError
from urllib.request import ProxyHandler, build_opener

import yaml


ROOT = Path(__file__).resolve().parent.parent
GO_HUB_ROOT = ROOT / "go-hub"
PUBLIC_OPENAPI = ROOT / "public" / "openapi.yaml"
OPENAPI_ORIGIN_RE = re.compile(r"^  - url: (\S+)$", re.MULTILINE)
DIRECT_OPENER = build_opener(ProxyHandler({}))


def _free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def _public_origin() -> str:
    match = OPENAPI_ORIGIN_RE.search(PUBLIC_OPENAPI.read_text(encoding="utf-8"))
    assert match, "public/openapi.yaml does not declare a servers url"
    return match.group(1)


def _wait_for_openapi(url: str, timeout_seconds: float = 45.0) -> bytes:
    deadline = time.monotonic() + timeout_seconds
    last_error: Exception | None = None
    while time.monotonic() < deadline:
        try:
            with DIRECT_OPENER.open(url, timeout=1.0) as response:
                if response.status == 200:
                    return response.read()
                last_error = RuntimeError(f"unexpected HTTP {response.status}")
        except (OSError, URLError) as exc:
            last_error = exc
        time.sleep(0.2)
    raise AssertionError(f"timed out waiting for {url}: {last_error}")


def _terminate(process: subprocess.Popen[str]) -> None:
    if process.poll() is None:
        process.terminate()
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait(timeout=10)


def test_public_openapi_artifact_matches_go_hub_renderer():
    """The public OpenAPI artifact must preserve the hub-generated core contract."""

    expected = yaml.safe_load(PUBLIC_OPENAPI.read_text(encoding="utf-8"))
    origin = _public_origin()
    port = _free_port()

    with tempfile.TemporaryDirectory(prefix="gptadmin-openapi-") as tmpdir:
        env = os.environ.copy()
        env.update(
            {
                "GPTADMIN_ROOT": str(ROOT),
                "GPTADMIN_CONFIG_DIR": str(Path(tmpdir) / "config"),
                "GPTADMIN_ARTIFACT_DIR": str(Path(tmpdir) / "build"),
                "PUBLIC_ORIGIN": origin,
                "HUB_HOST": "127.0.0.1",
                "HUB_PORT": str(port),
            }
        )

        log_path = Path(tmpdir) / "gohub.log"
        with log_path.open("w", encoding="utf-8") as log_file:
            process = subprocess.Popen(
                ["go", "run", "./cmd/gptadmin-hub"],
                cwd=GO_HUB_ROOT,
                env=env,
                stdout=log_file,
                stderr=subprocess.STDOUT,
                text=True,
            )

            actual = b""
            try:
                actual = _wait_for_openapi(f"http://127.0.0.1:{port}/actions/openapi.yaml")
            finally:
                _terminate(process)

        generated = yaml.safe_load(actual.decode("utf-8"))
        expected_paths = set(expected["paths"]) - {"/connect.json"}
        generated_paths = set(generated["paths"])
        assert expected_paths >= generated_paths, _render_diff("paths", expected_paths, generated_paths, log_path)

        expected_schemas = set(expected["components"]["schemas"])
        generated_schemas = set(generated["components"]["schemas"])
        assert expected_schemas >= generated_schemas, _render_diff("schemas", expected_schemas, generated_schemas, log_path)

        assert "/connect.json" in expected["paths"], "public/openapi.yaml lost the connection manifest extension"
        for schema_name in ("ConnectionManifest", "ConnectionClient"):
            assert schema_name in expected["components"]["schemas"], f"public/openapi.yaml lost {schema_name}"
        for schema_name in ("NetworkProxyPolicy", "ProxyStreamGrant"):
            assert schema_name in expected["components"]["schemas"], f"public/openapi.yaml lost {schema_name}"


def _render_diff(label: str, expected: set[str], actual: set[str], log_path: Path) -> str:
    if expected == actual:
        return ""
    from difflib import unified_diff

    diff = "\n".join(
        unified_diff(
            sorted(expected),
            sorted(actual),
            fromfile=f"public/openapi.yaml {label}",
            tofile=f"go-hub renderer {label}",
            lineterm="",
        )
    )
    tail = log_path.read_text(encoding="utf-8")
    return f"OpenAPI artifact mismatch\n\n{diff}\n\nRenderer log:\n{tail}"
