# Integration Control Contract

This is the GPTAdmin design reference for integrations that control a
connected external client or session. GPTAdmin already has the same basic
shape in its Hub relay; this document names the existing mapping and the
additional guarantees needed by session-oriented adapters.

## Contract

Every session-oriented integration follows three explicit calls:

1. `discover` lists connected sessions and the surface-specific operations
   supported by each session.
2. `schema` returns the exact input schema and version for one selected
   operation.
3. `execute` runs one operation against the selected session with a
   caller-stable `idempotency_key`.

The caller must select the session from `discover`, use the operation and
version returned by that session, and construct arguments only after `schema`.
Retrying the same logical operation reuses the same idempotency key; a new
operation gets a new key.

## Existing GPTAdmin Mapping

| Control pattern | Existing Hub operation |
| --- | --- |
| `discover` | `list_mcp_agents` or `list_mcp_servers` |
| `schema` | `list_mcp_tools` for the selected `target` |
| `execute` | `call_mcp_tool` with the same `target` and `tool_name` |

The selected `target` is the current stable agent/server identity. A separate
executor session and schema version are not currently part of the ordinary
Hub relay contract because MCP tool schemas are fetched directly from the
selected server.

## Remaining Gaps

The existing flow does not yet accept a caller-stable idempotency key for
ordinary synchronous `call_mcp_tool` writes, and it does not attach a schema
version/digest to a call. Background `job_id` tracks asynchronous completion;
it is not a duplicate-write key. These are certification and targeted contract
extensions, not a reason to create a second copy of the Hub relay API.

## GPTAdmin Scope

This contract applies only to future session-oriented adapters. It does not
change the stable MCP `tools/list` surface and it does not replace ordinary
Hub, MCP client or Tunnel calls.

The first bounded extension candidate is still Stage 1.3 Universal connection
page, but it should reuse the Hub flow above and add session-specific schema
lookup only where a client actually requires it. That milestone is still
`Planned`; no implementation is being claimed here.

Codex Document Control is the external reference that motivated this contract.
GPTAdmin adopts the interaction shape, not Codex-specific names or behavior.
