# Live acceptance runner

`tests/e2e/live_acceptance.py` is the first deployment-session gate for a
reachable Hub. It uses an existing short-lived scoped connection and never
prints the bearer value or response bodies.

```bash
GPTADMIN_LIVE_BASE_URL="$HUB_URL" \
GPTADMIN_LIVE_BEARER="$SCOPED_JWT" \
python3 tests/e2e/live_acceptance.py
```

The runner verifies, in order:

1. `/healthz` and `/version`;
2. `/connect.json` MCP/OAuth discovery;
3. canonical OAuth authorization and token endpoints;
4. generated `/actions/openapi.yaml`;
5. authenticated `tools/list` and the harmless `demo` MCP call.

Use `--required-tool NAME` for a profile-specific tool allowlist. This runner
does not claim successful webhook delivery, Network Tunnel data-plane
connectivity, file restore, profile mutation or external MCP-client
certification; those remain separate gates and must be recorded with their own
immutable evidence.

## Existing credential matrix

Before and after an authorization, key, endpoint or relay deployment, run the
secret-safe matrix for every known supported credential. The inventory stores
only stable IDs, entitled paths and environment-variable names; bearer values
remain outside the repository and output.

```json
{
  "credentials": [
    {
      "id": "codex-existing",
      "env": "GPTADMIN_CREDENTIAL_CODEX",
      "paths": ["custom", "mcp_remote", "relay_vrp"]
    }
  ]
}
```

```bash
GPTADMIN_LIVE_BASE_URL="$HUB_URL" \
GPTADMIN_CREDENTIAL_MATRIX_FILE="/secure/credential-matrix.json" \
python3 tests/e2e/credential_matrix.py
```

`custom` probes `/server/hub/mcp`, `mcp_remote` probes `/mcp`, and `relay_vrp`
probes `/mcp-relay/servers`. A credential missing from the inventory or a
declared environment value is a deployment blocker, not a reason to issue a
replacement token.

## Deployment runtime diagnosis

Before changing a deployed host, use the read-only runtime probe to emit a
small JSON report for the canonical service contract. It never restarts units,
reads credential values or returns remote stderr:

```bash
python3 tests/e2e/deployment_runtime.py \
  --kind hub --host "$HUB_HOST" --port "$SSH_PORT" --user "$SSH_USER"
python3 tests/e2e/deployment_runtime.py \
  --kind shellmcp --host "$SHELLMCP_HOST" --port "$SSH_PORT" --user "$SSH_USER"
```

The Hub probe requires a running `gptadmin-hub.service`, a real `/healthz`
response on the local port and no Tunnel `router config conflict`. The
ShellMCP probe requires the canonical `shellmcp.service`, rejects legacy
`rootd-go` binaries and reports queue authentication failures. A failed report
is diagnosis only; repair and the authenticated `live_acceptance.py` run still
require an explicitly authorized deployment session.
