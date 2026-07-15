# Integration Control Contract

This is the GPTAdmin design reference for integrations that control a
connected external client or session. It is not a claim that GPTAdmin already
implements Codex Document Control.

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

## GPTAdmin Scope

This contract applies only to future session-oriented adapters. It does not
change the stable MCP `tools/list` surface and it does not replace ordinary
Hub, MCP client or Tunnel calls.

The first bounded GPTAdmin implementation candidate is the Stage 1.3
Universal connection page: discover a connected MCP client, retrieve the
client-specific connection schema, and execute one safe configuration action.
That milestone is still `Planned`; no implementation is being claimed here.

Codex Document Control is the external reference that motivated this contract.
GPTAdmin adopts the interaction shape, not Codex-specific names or behavior.
