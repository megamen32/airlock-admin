#!/usr/bin/env python3
"""Drift guard for the owner's UserIO credential used by the native UI gateway.

The gateway substitutes one bearer per principal for the product runtime. The
owner bearer used to live in a hand-copied file that nothing refreshed, so a
rotated or expired value kept being sent and every owner route answered 401.

This check proves that one canonical file holds the value and that every
consumer points at it, and that the runtime still accepts it. Token values are
never printed: only length and a sha256 prefix are shown.

    python3 scripts/airlock_userio_credential_check.py
"""
import hashlib
import json
import os
from pathlib import Path
import sys
import urllib.error
import urllib.request

OWNER_PRINCIPAL = "5e438326-6339-4ac8-a328-59dae1d6241f"
CONFIG = Path(os.environ.get("AIRLOCK_UI_GATEWAY_CONFIG", str(Path.home() / ".config/airlock-apps/ui-gateway.json")))
CANONICAL = Path(os.environ.get("AIRLOCK_USERIO_TOKEN_FILE", str(Path.home() / ".config/airlock-mcp/userio_token")))
GATEWAY_LEGACY = Path.home() / ".config/airlock-apps/ui-userio-owner.token"
BINDING = Path.home() / ".config/airlock-apps/userio_owner.token"
RUNTIME = os.environ.get("AIRLOCK_USERIO_RUNTIME", "http://127.0.0.1:18093")

FAILURES = []


def check(name, ok, detail=""):
    print("%-4s %-52s %s" % ("ok" if ok else "FAIL", name, detail))
    if not ok:
        FAILURES.append(name)
    return ok


def fingerprint(value):
    return "len=%d sha256=%s" % (len(value), hashlib.sha256(value.encode()).hexdigest()[:12])


def main():
    config = json.loads(CONFIG.read_text())
    configured = config["universal-userio"]["user_token_files"][OWNER_PRINCIPAL]
    check("gateway points the owner at the canonical file", configured == str(CANONICAL), configured)

    for label, path in (("gateway legacy path", GATEWAY_LEGACY), ("platform binding path", BINDING)):
        linked = path.is_symlink() and os.path.realpath(path) == os.path.realpath(CANONICAL)
        check(label + " is a link to the canonical file", linked, str(path))

    if not CANONICAL.is_file():
        check("canonical file exists", False, str(CANONICAL))
        return 1
    mode = CANONICAL.stat().st_mode & 0o777
    allowed = {os.getuid()}
    try:
        import pwd

        allowed.add(pwd.getpwnam("roomhacker").pw_uid)
    except Exception:
        pass
    check("canonical file is 0600 and owned by the gateway user", mode == 0o600 and CANONICAL.stat().st_uid in allowed, "mode=%o uid=%d" % (mode, CANONICAL.stat().st_uid))

    token = CANONICAL.read_text().strip()
    check("canonical file holds a bearer", len(token) >= 16, fingerprint(token))

    request = urllib.request.Request(RUNTIME + "/v1/accounts", headers={"Authorization": "Bearer " + token, "Accept": "application/json"})
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            check("runtime accepts the canonical bearer", response.status == 200, "HTTP %d" % response.status)
    except urllib.error.HTTPError as exc:
        check("runtime accepts the canonical bearer", False, "HTTP %d" % exc.code)
    except Exception as exc:
        check("runtime accepts the canonical bearer", False, type(exc).__name__)

    if FAILURES:
        print("failed checks:", ", ".join(FAILURES))
        return 1
    print(json.dumps({"ok": True, "canonical": str(CANONICAL), "checks": 5}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
