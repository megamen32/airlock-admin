# Optional proxy and webhook MCP exposure — 2026-08-03

Status: active
Classification: Full

## Original request

Explain why proxy/webhook operations are not separate optional MCPs and design separate, explicitly enabled exposure in Hub. Then implement the selected virtual-MCP model, fix the Custom GPT OpenAPI importer errors and documentation, and diagnose the current local `/mcp` Bearer/OAuth failure. Issue short-lived public legacy-Hub canary tokens and delete them after the check.

## Objective

Produce an evidence-backed architecture decision for optional virtual `network-proxy` and `webhooks` MCP servers created inside Hub, disabled by default and exposed through normal per-server MCP/Action routes when enabled.

## Goal accepted 2026-08-03

Deliver a new build after real Mac BrowserOS Custom GPT Bearer and OAuth acceptance, schema compatibility repair, optional virtual MCP implementation, and documentation update.

## Business canary

A default Custom GPT schema excludes proxy/webhook operations; enabling one approved capability exposes only its intended schema and endpoints.

## Confirmed scope

Implement virtual MCPs `network-proxy` and `webhooks`, default-off with persisted Admin-Hub enabling; remove their operations from the default Custom GPT schema; update documentation; test locally and diagnose the specified public/local OAuth/Bearer paths. Public legacy-Hub token creation and deletion is authorized only for short-lived canaries.

Also replace the new-install shared `MCP_RELAY_AGENT_TOKEN` setup flow: users must know only `ADMIN_PASSWORD`; ShellMCP enrollment must use a local device identity and Hub-side pending-device approval. Retain the legacy token only as a migration compatibility path for existing installations.

2026-08-03 release expansion: publish the finished build after re-preflight; remove the existing GPTAdmin install on the Mac mini and reinstall it as the normal unprivileged user through SSH; prove a user-mode Linux install in an isolated container. Run an independent read-only review of Custom-GPT CLI/API test gaps and a consolidation proposal for legacy and React admin surfaces. Documentation may follow publication but must be included before final completion.

## Explicit exclusions

No unrelated service changes, deployment/restart, permanent public credentials, or arbitrary tool execution through the canary.

No mutation by the independent review. No release until the requested product canaries and the mandatory release review gates pass.

## Initial estimate (immutable)

- Optimistic: 35 active minutes
- Likely: 75 active minutes
- Pessimistic: 150 active minutes

## План (русский)

1. Сопоставить существующие internal MCP tools, REST/OpenAPI и policy-gates proxy/webhook.
2. Спроектировать virtual MCP registry entries `network-proxy` и `webhooks`, создаваемые только при явном enable.
3. Определить обратную совместимость REST control-plane и default-off Action exposure.
4. Дождаться выбора человека до реализации.

## Progress (English)

- 2026-08-03: architecture reconnaissance started; no implementation authorized.
- 2026-08-03: user corrected the target architecture: do not publish category-specific standalone schemas. Register two optional virtual MCP servers inside Hub (`network-proxy`, `webhooks`) on enable; use normal `/server/{slug}/mcp` and `/server/{slug}/actions/openapi.yaml` surfaces. Assumed the repeated word `proxy` means `webhooks` from the immediately preceding context.
- 2026-08-03: user selected implementation, expanded scope to Custom GPT schema/docs and local/public auth diagnosis. Production mutations limited to issuing and deleting short-lived legacy-Hub canary tokens as explicitly authorized.
- 2026-08-03: live diagnosis: `127.0.0.1:9000` is owned by BrowserOS, not GPTAdmin; the active local Hub is `127.0.0.1:9001` and its unauthenticated `/mcp` returns expected 401. Public `u-f110…/admin/legacy/` login succeeded.
- 2026-08-03: live canary token issuance deliberately paused: current admin API implements only `/admin/api/mcp/tokens/{id}/rotate`, which revokes the old credential while creating a replacement. It has no delete/revoke-without-replacement operation, so issuing a token would violate the explicitly required cleanup.
- 2026-08-03: user demonstrated the authoritative `Clients and Auth` UI revoke control, correcting the narrow token-API finding. Mac BrowserOS Custom GPT editor was configured with API key/Bearer and the real `discover` Action completed successfully, returning 31 servers. Bearer Custom GPT E2E is confirmed; OAuth, code changes, build, and cleanup remain.
- 2026-08-03: user authorized release, publication, a clean per-user Mac mini reinstall, and a Linux container user-install proof. SSH preflight to `roomhacker@192.168.2.8` failed public-key/password authentication, so no Mac mutation has occurred; alternate documented SSH route will be rechecked before asking for intervention.
- 2026-08-03: user corrected the Mac mini address to `192.168.2.4`. The previously reached `localhost:2222` host is excluded from this deployment; the Mac mini will be fingerprint-preflighted and verified independently before any change.
- 2026-08-03: user authorized publication after preflight, requested Mac Mini migration to a user installation and Docker Ubuntu user-install validation, and requested an independent CLI/API and dual-admin-surface coverage review. Mac preflight found the current system CLI at `/usr/local/bin/gptadmin` and legacy per-user `~/.gptadmin`; removal is deferred until a replacement artifact is verified.
- 2026-08-03: reviewed 19 older foreign LHC/workflow changes (664 insertions, 328 deletions). `git diff --check` passed; the changes update LHC version, roles, protocols, task templates, self-improvement records, AGENTS/CLAUDE and roadmap, and remove obsolete kanban/orchestrator templates. User explicitly authorized inclusion in the next build.
- 2026-08-03: user confirmed removal of the new-install shared relay-token UX. New agent enrollment will be identity/approval based; old relay-token support is migration-only.
- 2026-08-03: implemented default-off persisted `network-proxy` and `webhooks` virtual MCPs, each with normal dedicated MCP/Actions routes and an authenticated Hub control endpoint. Both admin surfaces now call the same typed control API; the default Custom GPT OpenAPI has exactly one Bearer scheme and excludes proxy/webhook operations.
- 2026-08-03: Docker acceptance initially found a production bootstrap defect: the curl-installed CLI imported optional `cryptography` before setup. Deferred that optional catalog-only dependency, added a stock-Python regression, and reran the disposable Ubuntu Docker E2E successfully for user/public-hub and sudo/FRP installation paths.
- 2026-08-03: external-process contract test reproduced CLI-issued Bearer 401 against a real Hub. The token lacked the Hub-required `kid`; CLI now emits the configured key id (or canonical default), including audience/resource. The process contract passes after the fix. Focused final validation: 30 Python tests, complete `go test ./internal/hub`, React test/build, Docker E2E, and `git diff --check` all pass.
- 2026-08-03: Mac mini target revalidated as `192.168.2.4` / `Macmini6,2` / `roomhacker`. With explicit operator sudo authorization, stopped and removed only the old system GPTAdmin paths and LaunchDaemons (`/opt/gptadmin`, `/etc/gptadmin`, `/usr/local/bin/gptadmin`, `/Library/LaunchDaemons/com.gptadmin*.plist`); verification confirmed they are absent and the pre-existing user-mode tree remains. Final tagged-artifact user reinstall is still pending.
