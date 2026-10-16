# Airlock deployment wrapper

This repository owns instance operations and integration documentation, not
Airlock product code. Read `AIRLOCK_RUNBOOK.md` and `AIRLOCK_ADMIN.md`. Begin
infrastructure discovery in `/home/roomhacker/ServersAdministartion` using its
root instructions, topology, and inventory.

Since 14 October 2026 the private platform runs in the original Docker backend
`airlock-airlock-1` and frontend `airlock-frontend-1`. The legacy `airlock.service`
is inactive/disabled; retain its binary/env for rollback and never start it
alongside Docker. The canonical live Compose order, mounts and budgets are in
`/home/roomhacker/agents-projects/exmanager/docs/airlock-original-docker.md`.
The separate public demo runs on88; its external wrapper belongs to
`/home/roomhacker/airlock-demo`. Verify live state before upgrading either.
Core/submodules belong to their maintainers; use native SDK MCP declarations,
resource credentials, and thin app adapters. Preserve the existing keys/data.

X-manager source is `/home/roomhacker/agents-projects/exmanager`; its existing
Todo panel source is `/home/roomhacker/excode`, deployed from
`/home/roomhacker/services/kanban-board` on 43327. Read their AGENTS and
`exmanager/docs/todo-mcp.md`. Todo's old 8767 listener is a legacy REST service,
not the current Streamable HTTP MCP. Keep the existing board and employee
filters; do not fork core or duplicate task storage to connect it.

Inspect branch, submodule pins, and foreign changes before every edit. Do not
switch a shared checkout, stage foreign submodule changes, or claim synchronized
main when this wrapper remains on another branch. Never print `.env`, decrypted
resource credentials, private task data, or raw auth responses.
