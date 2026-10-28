# Airlock deployment wrapper

<!-- airlock-demo-contribution-policy:begin -->
## Current collaboration and test-deployment boundaries — 2026-10-20

- The user has authorized private and demo Airlock as test environments. Integrate shared Airlock source only on `megamen32-dev`; use GitHub-hosted Actions for shared CI. Do not build or register ARC/K3s GitHub runners for this work.
- One named owner performs each source integration and deployment. Verify the real checkout, branch, target, and current deployment owner before writing or deploying. Preserve foreign WIP and existing app data. Test deployments to the two authorized environments do not require a new pre-deployment Oleg approval; Oleg reviews the accepted result for any later shared `main` handoff.
- `main` is protected and remains untouched by this work: no direct or force push, merge, squash, or auto-merge. Do not create one PR per subtask. The final main handoff belongs to Oleg.
- Existing demo ownership remains path-scoped: app forms/interfaces and demo deployment belong to Codex `01a14c5d-d212-78a3-872a-aad236b7db2e` in `/home/roomhacker/airlock-admin/.worktrees/demo-airlock-forms` (`demo/app-interfaces`); post-update compatibility checks belong to Codex `01a14ea7-5a98-7b73-ae74-cb63dbdb67e0` in `/home/roomhacker/.codex/worktrees/1576/airlock-admin` (`demo/compatibility`). Do not edit their paths or take over their deployments/checks.
- Preserve existing app/auth boundaries, credentials, and user data. No real external sends, payments, bulk actions, auth bypass, or deletion of unowned accounts/data. Do not repeat accepted or unknown external operations.
- The latest direct user instructions and verified ownership state supersede stale task notes; update this entry and `.agents/TEST_ACCESS.md` together when that policy changes. Keep original messages/history intact.
- Ownership map and historical cleanup receipts remain at `/home/roomhacker/airlock-admin/.agents/shared-session/airlock-demo-ownership-20261018.md` and `/home/roomhacker/airlock-admin/.agents/shared-session/archive/airlock-pr-cleanup-20261018/`.
<!-- airlock-demo-contribution-policy:end -->

This repository owns instance operations and integration documentation, not
Airlock product code. Read `AIRLOCK_RUNBOOK.md` and `AIRLOCK_ADMIN.md`. Begin
infrastructure discovery in `/home/roomhacker/ServersAdministartion` using its
root instructions, topology, and inventory.

For the current test-account identity, protected credential reference, and
authorized provisioning/login/cleanup sequence, read `.agents/TEST_ACCESS.md`.
It contains paths and metadata only, never credential values.

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
