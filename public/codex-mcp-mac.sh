#!/usr/bin/env bash
set -euo pipefail
ENV_FILE="${GPTADMIN_CONFIG_DIR:-$HOME/.config/gptadmin}/gptadmin.env"
[ -f "$ENV_FILE" ] || { echo "Не найден $ENV_FILE. Сначала установите GPT-Админ." >&2; exit 1; }
command -v codex >/dev/null || { echo "Не найден codex CLI." >&2; exit 1; }
mkdir -p "$HOME/.config/gptadmin" "$HOME/.codex"

python3 - "$ENV_FILE" > "$HOME/.config/gptadmin/codex-mcp-token.env" <<'PY'
from pathlib import Path
import base64, hashlib, hmac, json, os, time, sys

def read_env(path):
    env = {}
    for line in Path(path).read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        env[k] = v.strip().strip('"').strip("'")
    return env

def b64url(data):
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

env = read_env(sys.argv[1])
secret = env.get("OAUTH_CLIENT_SECRET")
if not secret:
    raise SystemExit("В gptadmin.env нет OAUTH_CLIENT_SECRET; обновите GPT-Админ или переустановите hub.")
origin = (env.get("HUB_PUBLIC_URL") or env.get("PUBLIC_ORIGIN") or "http://127.0.0.1:9001").rstrip("/")
resource = (env.get("MCP_RESOURCE") or origin).rstrip("/")
now = int(time.time())
header = {"alg": "HS256", "typ": "JWT"}
payload = {
    "sub": "admin",
    "scope": "gptadmin.read gptadmin.exec",
    "client_id": "codex-local",
    "iss": origin,
    "aud": resource,
    "iat": now,
    "exp": now + 365 * 24 * 3600,
}
msg = f"{b64url(json.dumps(header, separators=(',', ':')).encode())}.{b64url(json.dumps(payload, separators=(',', ':')).encode())}".encode()
token = msg.decode() + "." + b64url(hmac.new(secret.encode(), msg, hashlib.sha256).digest())
print("export GPTADMIN_CODEX_MCP_BEARER=" + json.dumps(token))
PY
chmod 600 "$HOME/.config/gptadmin/codex-mcp-token.env"
# shellcheck disable=SC1090
. "$HOME/.config/gptadmin/codex-mcp-token.env"
launchctl setenv GPTADMIN_CODEX_MCP_BEARER "$GPTADMIN_CODEX_MCP_BEARER" 2>/dev/null || true

codex mcp remove gptadmin >/dev/null 2>&1 || true
codex mcp add gptadmin --url http://127.0.0.1:9001/mcp --bearer-token-env-var GPTADMIN_CODEX_MCP_BEARER
codex mcp get gptadmin
printf '\nГотово. Для Codex Desktop перезапустите приложение, чтобы оно увидело launchctl env.\n'
printf 'Для Codex CLI в новом терминале выполните: source ~/.config/gptadmin/codex-mcp-token.env\n'
