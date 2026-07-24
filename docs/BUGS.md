# Bug tracker

This is the project’s append-only working register for bugs found during
development, diagnostics, deployment, or live verification.

Rules:

- Record a bug as soon as it is observed, before implementing a fix.
- Use an immutable evidence path, commit, test name, or runtime artifact ID;
  never paste secrets, private URLs, customer data, or raw logs.
- Keep actionable bugs open until a focused verification proves the fix.
- At the end of the current goal, resolve every actionable open entry before
  final handoff, unless a concrete external blocker is recorded.

## 2026-07-24 - UPDATE-HEALTH-IGNORED-20260724 - Failed update health did not abort - fixed

- Component: `cli.py:cmd_update` in-place update flow.
- First observed: 2026-07-24, immutable RED evidence from the new transactional update test and inspection of the `wait_local_hub_health` call site.
- Confirmed fact: The update called `wait_local_hub_health` but ignored its false result, so a failed Hub health gate did not abort the update or restore the previous runtime.
- Root cause: Health was treated as an informational warning instead of the canary acceptance gate; package replacement had no transaction snapshot.
- Fix / verification: Added a private runtime snapshot/restore transaction, restored services after failure, and made a false Hub health result raise and trigger rollback. `tests/test_update_semantics.py` passes `10` tests.
- Status: fixed.
- Next action: Prove the same transaction with a clean-host update and real client reconnection before closing S3.5.

## 2026-07-24 - WEBAUTHN-CEREMONY-EXPIRY-20260724 - Ceremony sessions rejected immediately - fixed

- Component: `go-hub/internal/hub/webauthn.go` WebAuthn registration/login ceremony store.
- First observed: 2026-07-24, immutable browser evidence from the Playwright session `gptadmin-webauthn` and the `go-webauthn` v0.15.0 `SessionData.Expires` contract.
- Confirmed fact: A begin request returns 200 and stores a ceremony, but the matching finish request returns `WebAuthn registration ceremony is missing or expired` immediately.
- Root-cause hypothesis: The Hub checks `time.Now().After(session.Session.Expires)` without allowing the library's zero expiry sentinel, so a valid session is rejected before credential validation.
- Fix / verification: Expiry validation now treats the library's zero expiry as unset; the focused Hub test passes, and Chromium completed registration, passkey verification, and locked-down browser login.
- Status: fixed.
- Next action: Retain the browser-backed ceremony regression evidence in the release acceptance gate.

## 2026-07-24 - POLICY-BOUNDARY-BYPASS-20260724 - Legacy write entrypoints skip central policy - open

- Component: `go-hub/internal/hub/server.go` bridge/prompt, bulk execution and
  admin MCP resource routes; `go-hub/internal/hub/webhook_gateway.go` action
  dispatch.
- First observed: 2026-07-24, immutable review ID
  `019f93df-7148-7033-972a-07c17c13955d`.
- Confirmed fact: `mcpPromptCall` and webhook actions can invoke write-capable
  execution with a nil request/profile, while `bulkExec` and admin resource
  routes enqueue work directly; these paths do not consistently pass through
  approval/autonomy policy and the central policy audit boundary.
- Root-cause hypothesis: privileged legacy entrypoints predate the shared
  `executeMCPTool` policy executor and retain direct queue calls.
- Fix / verification: Added RED regressions in
  `go-hub/internal/hub/policy_boundary_test.go`; bridge ingress is read-only,
  webhook writes use explicit approval-mode automation profiles, bulk and
  resource routes use the central executor, and runtime Actions OpenAPI now
  advertises the Network Tunnel paths. Focused policy tests and the full Hub
  suite pass.
- Status: fixed.
- Next action: retain the boundary regressions in the completion matrix and
  repeat them after future legacy-route changes.

## 2026-07-24 - SECRET-INGRESS-CSP-20260724 - Secret input CSP header malformed - fixed

- Component: `go-hub/internal/hub/secret_ingress.go` browser input response.
- First observed: 2026-07-24, immutable RED evidence `TestSecretIngressPageConsumesTokenWithoutReturningSecret` after adding the exact CSP contract.
- Symptom / evidence: The response emitted `style-src 'unsafe-inline` without the closing quote, weakening the intended browser policy syntax.
- Root cause: The CSP literal omitted the closing single quote around the inline-style source expression.
- Fix / verification: Corrected the header and added exact Cache-Control, Referrer-Policy and CSP assertions; focused secret-ingress tests pass.
- Status: fixed.
- Next action: Keep the browser ingress contract in the full Hub and secret-ingress test gates.

## 2026-07-24 - HUB-PUBLIC-ORIGIN-HTTP-20260724 - Security preset accepted external HTTP origin - fixed

- Component: `go-hub/internal/hub/security_settings.go` preset mutation.
- First observed: 2026-07-24, immutable RED test `TestSecurityPresetRejectsExternalHTTPOrigin`.
- Symptom / evidence: `private_access` accepted `PUBLIC_ORIGIN=http://hub.example`, allowing a non-TLS public identity to be selected for a hardened preset.
- Root cause: Preset validation checked only the preset name and MFA enrollment; it did not validate the configured public origin transport.
- Fix / verification: External origins now require HTTPS and reject userinfo; loopback HTTP remains allowed only for internal Hub↔Tunnel transport. Full Hub test/race/vet and completion matrix pass.
- Status: fixed.
- Next action: Prove TLS and external identity behavior at the real Tunnel/deployment boundary.

## 2026-07-24 - HUB-BIND-LOOPBACK-20260724 - Go Hub ignored installer loopback bind - fixed

- Component: `cli.py` Hub service environment and `go-hub/internal/hub.FromEnv`.
- First observed: 2026-07-24, immutable regression evidence `TestFromEnvDefaultsHubToLoopbackAndHonorsHubBind` added before the fix.
- Symptom / evidence: The installer writes `HUB_BIND=127.0.0.1`, but Go Hub only reads `GPTADMIN_HUB_HOST`/`HUB_HOST`; with neither set it builds `:9001`, exposing the service listener beyond the Tunnel boundary.
- Root cause hypothesis: The Go runtime renamed the bind variable without retaining the installer’s canonical `HUB_BIND` compatibility input, and its empty-host default is not fail-closed.
- Fix / verification: `FromEnv` now honors `GPTADMIN_HUB_HOST`, `HUB_HOST`, then installer-compatible `HUB_BIND`, and defaults to `127.0.0.1`. `TestFromEnvDefaultsHubToLoopbackAndHonorsHubBind`, full Hub test/race/vet and the completion matrix pass. HAOS runtime keeps its explicit `GPTADMIN_HUB_HOST` override.
- Status: fixed.
- Next action: Keep public ingress at the Tunnel/HAOS boundary; do not expose the Hub listener directly.

## 2026-07-24 - ADMIN-ENV-SHELL-20260724 - Legacy admin env mutation bypass - fixed

- Component: `public/admin/index.html` and `public/admin/app.js:setEnvVar`.
- First observed: 2026-07-24, immutable evidence ID `admin-ui-security-audit-20260724-01` from the tracked source inspection and the missing typed-endpoint regression in `tests/test_admin_ui.py`.
- Symptom / evidence: The production admin view exposes internal environment key names and constructs a `shell_exec` command containing an operator-supplied value to rewrite `/etc/gptadmin/gptadmin.env`; this bypasses the typed Hub security API and can put sensitive values into command/audit paths.
- Root cause: The legacy UI retained an operator shell-editing fallback after the redacted `/admin/api/security/env` metadata endpoint was introduced.
- Fix / verification: Replaced shell mutation and restart fallback with typed preset, MFA, telemetry, heartbeat and approval controls; removed internal key names from normal UI copy. `python3 -m pytest tests/test_admin_ui.py tests/test_shellmcp_heartbeat_config.py -q` passed (13 tests), `node --check public/admin/app.js` passed, and `go test ./internal/hub -run 'TestSecurityHeartbeatUsesTypedAdminEndpoint' -count=1` passed.
- Next action: None for this bug; retain the full-suite run as the release gate.

## 2026-07-24 - HUB-APPS-SDK-COUNT-20260724 - Apps SDK capability count drift - fixed

- Component: `go-hub/internal/hub/server_test.go:TestAppsSDKMetadataAndWidget`.
- First observed: 2026-07-24, immutable test evidence from `cd go-hub && go test ./...` after the safe readonly `demo` capability was added.
- Symptom / evidence: The runtime advertised 8 Apps SDK tools while the regression asserted the previous count of 7, so the full Hub suite failed even though the new capability was intentional and readonly.
- Root cause: The test encoded a stale aggregate count instead of asserting the capability names and safe metadata contract.
- Fix / verification: Updated the regression to assert the exact eight capability names, including `demo`, while preserving widget metadata checks. `go test ./...`, `go test -race ./...` and `go vet ./...` in `go-hub` all pass; the focused Apps SDK test also passes.
- Next action: None for this bug.

## 2026-07-24 - AUDIT-MCP-DECISION-20260724 - Direct MCP allow missing policy audit - fixed

- Component: Hub `/mcp` Apps SDK `tools/call` path and durable operator audit.
- First observed: 2026-07-24, immutable RED evidence from
  `TestAuditIncidentDrillRecoversDecisionWithoutRawArguments`: the `/mcp`
  allow for `demo` produced no `tool_policy_decision`, while the equivalent
  `/mcp-relay/call` deny did.
- Symptom / evidence: An incident query over `/admin/api/audit` could recover
  the denied relay decision but not the successful direct MCP decision, so the
  audit trail was not transport-complete.
- Root cause: Direct Apps SDK dispatch used a separate call path that returned
  the typed result without passing through `auditToolDecision`.
- Fix / verification: Direct `/mcp` allow and deny decisions now use the same
  digest-only audit helper as relay calls. The incident drill and focused
  direct-MCP audit regressions pass; Hub `go test ./...`, `go test -race ./...`
  and `go vet ./...` plus completion matrix `11 passed` are green.
- Next action: None for this bug.

## 2026-07-24 - DOCKER-SETUP-PROMPT-20260724 - ShellMCP installer E2E input drift - fixed

- Component: `tests/e2e/docker/scenarios/user-public-hub-shellmcp.sh` and the interactive setup contract in `cli.py`.
- First observed: 2026-07-24, immutable evidence ID `docker-shellmcp-e2e-20260724-01` from `docker compose -f tests/e2e/docker/docker-compose.yml up --build --abort-on-container-exit --exit-code-from shellmcp-e2e`.
- Symptom / evidence: The disposable scenario reaches the new “How will ShellMCP connect to the Hub?” prompt and then exits with `EOFError`; scripted stdin is exhausted before setup completes.
- Root cause: The scenario's prompt/answer sequence is stale relative to the current installer flow and does not provide the connection-mode answer.
- Fix / verification: Synchronized the scenario with transport and auto-update prompts, added a deterministic local `/version` health stub, used the checked-in CLI, and reran the compose suite; all user, system/FRP and tunnel-backend scenarios passed with exit code 0.
- Next action: None for this bug.

## 2026-07-24 - DOCKER-SETUP-SECRET-20260724 - Installer E2E prints generated bearer credential - fixed

- Component: Interactive `cli.py` setup completion output.
- First observed: 2026-07-24, immutable evidence ID `docker-shellmcp-e2e-20260724-02` from the repaired disposable installer scenario.
- Symptom / evidence: Setup completion output includes a generated bearer credential in the terminal transcript; the value is intentionally omitted from this register.
- Root cause: The E2E bootstrap downloaded a stale remote CLI that still printed a raw API-key line; the checked-in CLI already uses the AdminPassword/OAuth completion copy.
- Fix / verification: The E2E image now runs the checked-in `cli.py` via a local file URL; the final compose run exited 0 and its completion output contains no raw bearer value.
- Next action: None for this bug.

## 2026-07-23 - ANDROID-LAN-PROXY-FW-20260723 - LAN proxy blocked by host firewall - fixed

- Component: `android-4g-lan-proxy.service` on roomhacker-server-100.
- First observed: 2026-07-23.
- Symptom / evidence: Runtime probe `mac-curl-3126-20260723` stalled connecting to the LAN listener. The service was listening on `192.168.2.100:3126`, and a server-local proxy request completed successfully, while the UFW user rules had no TCP/3126 allow entry and the INPUT policy was deny.
- Root cause: The deployment created the LAN listener but did not install a matching UFW allow rule.
- Fix / verification: Added UFW TCP rules limited to the private LAN ranges and
  made the deployment script install the matching rule idempotently for the
  selected port. An external Windows LAN client returned the same mobile IPv6
  through both SOCKS5 and HTTP CONNECT, while direct egress returned a different
  address; the service remained active after restart.
- Next action: Have the Mac retry the exact command; no code-side blocker remains.

## Entry format

```text
## BUG-ID - short title - <open|in_progress|fixed|wont_fix>
- Component:
- First observed:
- Symptom / evidence:
- Root cause:
- Fix / verification:
- Next action:
```

## 2026-07-23 - WIN-ROOTD-AUTH-20260723 - Windows polling authentication - fixed

- Component: Windows ShellMCP polling agent on BeyondInfinity.
- First observed: 2026-07-23.
- Symptom / evidence: The exact runtime artifact `C:\ProgramData\gptadmin\rootd-25900.log` records queue and heartbeat requests returning HTTP 401. The same artifact records polling mode with the HTTP listener intentionally disabled, so a closed local port is not evidence that polling is disabled.
- Root cause: The legacy launcher hard-coded `ROOTD_TOKEN=srv_secret` instead of loading the Hub credential, and its runtime was not the supported Go ShellMCP package.
- Fix / verification: Replaced the active user-mode runtime with the current Go Windows binary, copied the existing identity, loaded the existing Hub credential without rotation, and verified an authenticated queue poll returns HTTP 200 with an empty job response.
- Next action: Remove or disable the inaccessible legacy system task from an elevated Windows session so it cannot resurrect the old runtime.

## 2026-07-23 - WIN-ROOTD-CERT-20260723 - Windows bundled CA path drift - fixed

- Component: Legacy Windows Python/PyInstaller ShellMCP runtime.
- First observed: 2026-07-23.
- Symptom / evidence: The exact runtime artifact `C:\ProgramData\gptadmin\rootd-25900.log` contains repeated failures referencing the removed temporary bundle path `C:\Temp\_MEI107362\certifi\cacert.pem`.
- Root cause: An old packaged runtime retained a PyInstaller-extracted certifi path instead of using a stable bundled or system CA location.
- Fix / verification: The active user-mode path now uses the Go binary and no longer uses the stale PyInstaller bundle. A fresh current Go log entry exists and the active log set contains zero `401`, `certifi`, or `unauthorized` matches.
- Next action: Keep the legacy artifact isolated until the separate privileged-task cleanup entry is handled.

## 2026-07-23 - WIN-ROOTD-REDIRECT-20260723 - Hub URL redirect drops agent auth - fixed

- Component: Windows ShellMCP Hub URL configuration.
- First observed: 2026-07-23.
- Symptom / evidence: Runtime probe `win-rootd-redirect-20260723` showed the generic configured Hub host redirects to another host; a cross-host redirect can drop the Authorization header and produce 401 responses.
- Root cause: The agent was configured with a generic web host instead of the instance-specific public Hub origin.
- Fix / verification: The active user-mode config now uses the canonical instance origin; an authenticated queue probe returns HTTP 200.
- Next action: Keep installer input explicit for deployments where the generic host redirects; do not infer a private Hub origin in the repository.

## 2026-07-23 - WIN-USER-TASK-20260723 - Standard user Task Scheduler fallback - fixed

- Component: `deploy/install_win.ps1` and `public/install_win.ps1`.
- First observed: 2026-07-23.
- Symptom / evidence: User-mode Task Scheduler registration on BeyondInfinity returned access denied, while the user could execute the agent.
- Root cause: The installer treated user Task Scheduler ACLs as universally available.
- Fix / verification: Added a per-user Startup launcher fallback and kept Task Scheduler as the preferred backend; `python3 -m pytest -q tests/test_install_win.py` passes 3 tests.
- Next action: Validate the fallback installer on a clean non-admin Windows account in CI or the next Windows acceptance run.

## 2026-07-23 - WIN-ROOTD-LEGACY-TASK-20260723 - Privileged legacy task cleanup - in_progress

- Component: Old Windows scheduled task `gptadmin-rootd` under the system install.
- First observed: 2026-07-23.
- Symptom / evidence: `schtasks /query /tn gptadmin-rootd` returns access denied for the authenticated non-admin SSH user; the task and its old ProgramData runtime remain outside that user’s ACL.
- Root cause: The historical system installation was not removed when the supported Go user-mode runtime was installed.
- Fix / verification: The active agent is now the supported Go process and remains alive after the SSH connection closes; full deletion of the stale task requires an elevated Windows session.
- Next action: From an elevated local Windows session, disable/remove `gptadmin-rootd`, then verify one clean post-logon Go ShellMCP process and close this entry.

## 2026-07-23 - FAILOVER-PHYSICAL-INGRESS-20260723 - Physical Hub failover has no active takeover path - fixed

- Component: `server-100` Hub watchdog/FRP path and HAOS standby.
- First observed: 2026-07-23.
- Symptom / evidence: Runtime artifact `failover-runtime-20260723-01` shows `gptadmin-hub-watchdog.timer=bad` on `server-100`, no active failover watchdog/proxy unit, HAOS reachable on `:9001`, and HAOS `:9101` refusing connections. The public route therefore has no verified takeover owner when the primary Hub is stopped.
- Root cause: Physical deployment wiring is incomplete or invalid even though the repository Docker failover harness passes; the HAOS standby is only a local Hub and the public tunnel/proxy promotion path is not active.
- Fix / verification: Added the systemd-free HAOS watchdog/proxy runtime, ARM64 FRP packaging, one valid FRP config/process per endpoint, secret-safe reclaim key fallback, dead-child pipe fix, reclaim cooldown reset, and primary FRP `BindsTo=gptadmin-hub.service`. `7` focused regressions passed; physical drill stopped only the Hub, systemd showed Hub inactive and FRP failed, public fallback `/healthz` and `/version` returned `200` with the standby build, automatic reclaim logged `reclaimed_primary`, and final public responses returned primary build `128` with both primary units active.
- Next action: Keep the second physical fallback host disabled until its own deployment drill is run under S3.4.

## 2026-07-23 - HAOS-SUPERVISOR-JOB-20260723 - Stale unrelated app job blocks failover add-on update - open

- Component: Home Assistant OS Supervisor Job Manager, `local_bezrabotnyi_recovery_haproxy` and `local_gptadmin_hub_standby` app jobs.
- First observed: 2026-07-23.
- Symptom / evidence: Runtime artifact `haos-supervisor-job-20260723-01` shows `addon_restart` for `local_bezrabotnyi_recovery_haproxy` and dependent GPTAdmin update jobs at `progress=0`, `done=false`; Supervisor logs report the recovery HAProxy app exited with code 1. The GPTAdmin standby is stopped while the `1.0.3` update waits.
- Root cause: Hypothesis is a stale/failing recovery HAProxy app job serializing the Supervisor app job group; this is outside the GPTAdmin add-on image but blocks its normal update/start path.
- Fix / verification: GPTAdmin update eventually completed without resetting Job Manager state; add-on `1.0.4` is started and the failover drill passed. The unrelated recovery HAProxy app remains in `error` with a separate missing `mgmt_auth` userlist and certificate-rate-limit errors.
- Next action: Repair `local_bezrabotnyi_recovery_haproxy` in its owning deployment task; it no longer blocks GPTAdmin failover acceptance.

## 2026-07-24 - AUTH-UI-INTERNAL-NAMES-20260724 - Auth pages expose internal credential name - fixed

- Component: Hub `/admin/login` and `/authorize` HTML pages.
- First observed: 2026-07-24, immutable source evidence from
  `go-hub/internal/hub/server.go` and the auth-page regression contract.
- Symptom / evidence: Normal browser-facing copy names `CTL_TOKEN`, exposing an
  internal credential vocabulary even though the one-password product contract
  requires OAuth/AdminPassword/scoped JWT language.
- Root cause: Legacy migration hint was retained in the login and OAuth consent
  templates after the public admin UI was sanitized.
- Fix / verification: Replaced the legacy hints with OAuth/Hub/scoped-JWT
  wording; the auth-page regression now rejects `CTL_TOKEN`, bridge, OAuth
  secret and ShellMCP token names. Focused Hub auth and admin UI boundary tests
  pass; full Hub/contract is the remaining handoff gate.
- Next action: None for this bug; internal migration support remains hidden from
  normal auth-page copy until its documented deadline.

## 2026-07-24 - CLI-PLATFORM-CONSTANT-20260724 - Missing Windows platform constant - fixed

- Component: `cli.py` platform detection and cross-platform service helpers.
- First observed: 2026-07-24, immutable RED evidence from
  `tests/test_doctor_json.py` after adding the service runtime probe: the
  existing `IS_WINDOWS` reference raised `NameError` during doctor execution.
- Symptom / evidence: Windows-specific setup branching and the new doctor
  runtime branch could not evaluate the platform guard.
- Root cause: `IS_MACOS` and `IS_USER_INSTALL` were defined at module scope,
  but `IS_WINDOWS` was referenced without a declaration.
- Fix / verification: Defined the explicit `sys.platform == 'win32'` constant;
  doctor runtime tests `4 passed`, full Python `175 passed, 2 skipped`, and
  Windows Hub contract `1 passed`.
- Next action: None for this bug.

## 2026-07-24 - FAILOVER-E2E-RESTART-20260724 - Failover E2E output looked like a restart - fixed

- Component: `tests/e2e/failover/docker-compose.yml` and
  `tests/e2e/failover/run.sh`.
- First observed: 2026-07-24, immutable Docker command evidence from
  `docker compose -f tests/e2e/failover/docker-compose.yml up --build --abort-on-container-exit --exit-code-from failover-e2e`.
- Symptom / evidence: Unbounded Docker output made expected public-down curl
  errors appear after the success line, and context extraction split the same
  invocation into multiple sections that looked like a second cycle.
- Root cause: Interleaved Docker stdout/stderr plus query-section rendering;
  there was no restart policy and no second container invocation in the
  captured serial command.
- Fix / verification: Serial capture under a unique compose project returned
  `rc=0`, exactly one `ALL FAILOVER BLACK-BOX SCENARIOS PASSED` line and all
  seven scenario lines. No harness change was required.
- Next action: Use captured exit-code/count evidence for future failover runs;
  do not interpret expected public-down curl stderr as a failure.

## 2026-07-23 - HAOS-PUBLIC-FALLBACK-PROXY-20260723 - Forward-proxy probe used the wrong listener contract - wont_fix

- Component: Public HAOS `gptadmin_hub_standby` `1.0.5`, fallback listener `:9101`.
- First observed: 2026-07-23.
- Symptom / evidence: Immutable probe artifact `trash/logs/haos-public-fallback-probe-20260723-01.txt` records Hub `:9001/healthz` and `/version` success, TCP `:9101` open, but an HTTP request routed through `:9101` returned `502`.
- Root cause: The `:9101` listener expects origin-form requests from the FRP/reverse-proxy path, while `curl -x` sent an absolute-form forward-proxy request that the tiny proxy concatenated into an invalid upstream URL.
- Fix / verification: No runtime fix required; artifact `trash/logs/haos-public-fallback-probe-20260723-02.txt` records TCP open and direct origin-form `/healthz` returning `200`.
- Next action: Use the origin-form probe for the physical drill and keep forward-proxy semantics out of the acceptance command.

## 2026-07-23 - HAOS-PUBLIC-CREDENTIAL-SCAN-20260723 - Initial scan counted public values as credentials - wont_fix

- Component: Public HAOS `gptadmin_hub_standby` `1.0.5` persisted/build/output surface.
- First observed: 2026-07-23.
- Symptom / evidence: Artifact `trash/logs/haos-public-credential-scan-20260723-01.txt` recorded one match, but the follow-up identified only public `public_origin` and numeric `hub_port` values in `failover_state.json`.
- Root cause: The initial scanner treated every option value as a credential instead of using the explicit credential-key allowlist.
- Fix / verification: Artifact `trash/logs/haos-public-credential-scan-20260723-02.txt` records zero exact matches for all seven credential keys; protected files remain mode `600` and recent logs contain zero sensitive-keyword lines.
- Next action: Keep the credential-key allowlist in future acceptance probes; no runtime leak remains.

## 2026-07-23 - SERVER100-PRIMARY-BASELINE-20260723 - Primary Hub baseline was already down - fixed

- Component: `roomhacker-server-100` primary Hub/FRP units and listeners.
- First observed: 2026-07-23.
- Symptom / evidence: Immutable artifact `trash/logs/server100-primary-baseline-20260723-01.txt` records `gptadmin-hub.service=inactive`, `gptadmin-tunnel-frpc.service=failed`, watchdog timer `bad`, port `9001` owned by nginx, and port `7000` owned by frps; no `gptadmin_hub` process is present.
- Root cause: Under investigation; likely stale edge ownership after the previous physical drill, with nginx retaining the Hub port while the systemd Hub unit is dead.
- Fix / verification: Restored only the Hub and its dependent primary FRP unit; artifact `trash/logs/server100-primary-baseline-20260723-02.txt` records both units active and public primary build `128` before the drill.
- Next action: Keep the primary units under normal service supervision; the promotion/reclaim drill is complete.

## 2026-07-23 - SIGNED-RECLAIM-PUBLIC-20260723 - Public migration initially blocked signed reclaim - fixed

- Component: Server-100 `gptadmin-failover-reclaim-push` and public HAOS standby `1.0.5` reclaim path.
- First observed: 2026-07-23.
- Symptom / evidence: Immutable artifact `trash/logs/server100-signed-reclaim-20260723-01.txt` records primary Hub/FRP active, reclaim push HTTP `401` with missing authorization header, public `/version` still returning standby build `1.0.5` instead of primary build `128`.
- Root cause: Public FRP was mapped to `9001` instead of the fallback proxy `9101`, the watchdog health check used the public route and could race promotion, and generated standby internal credentials did not share the primary bridge key.
- Fix / verification: Set the instance failover port to `9101`, moved health checking to the direct primary LAN endpoint, preserved only the shared bridge key in protected `/data`, and verified artifacts `trash/logs/server100-signed-reclaim-20260723-02.txt` and `trash/logs/haos-public-drill-20260723-01.txt`.
- Next action: Keep this compatibility contract in the release/runbook before the next public app version.

## 2026-07-24 - SHELLMCP-SPOOL-PERM-20260724 - Installer spill directory alias ignored - fixed

- Component: `go-shellmcp/internal/server.FromEnv` and the Go ShellMCP contract runner.
- First observed: 2026-07-24, immutable evidence ID `completion-matrix-shellmcp-spool-20260724-01` while running `tests/test_completion_matrix.py::test_completion_matrix_commands_execute[endpoints]`.
- Symptom / evidence: The Go contract daemon ignored `SHELLMCP_SPILL_DIR`, fell back to `/tmp/shellmcp-go-spool`, and returned `500`/`returncode=-1` with a permission error when that directory was owned by another user.
- Root cause: `FromEnv` accepted `SHELL_SPOOL_DIR` and `SHELLMCP_SPOOL_DIR` but not the installer-emitted `SHELL_SPILL_DIR`/`SHELLMCP_SPILL_DIR` aliases.
- Fix / verification: Added `TestFromEnvUsesInstallerSpillDirectoryAliases` and made all four installer spellings converge on the configured directory. The focused Go test and `python3 -m pytest tests/test_shellmcp_contract.py -q` both pass (`8 passed`).
- Next action: Keep the alias contract in installer/runtime changes; no code-side blocker remains.

## 2026-07-24 - SBOM-PYTHON-TOMLLIB-20260724 - SBOM tool assumed unavailable stdlib module - fixed

- Component: `tools/generate_sbom.py`.
- First observed: 2026-07-24, immutable evidence ID `sbom-test-20260724-01` from `tests/test_sbom.py`.
- Symptom / evidence: The first deterministic SBOM implementation failed at startup because the repository's supported Python runtime did not provide `tomllib`.
- Root cause: The tool assumed a Python 3.11-only standard-library parser despite the project supporting Python 3.10 environments used by the test runner.
- Fix / verification: Replaced the parser dependency with a bounded manifest parser for the checked-in dependency arrays; `tests/test_sbom.py` passes and output remains byte-for-byte deterministic.
- Next action: Keep the release tool compatible with the oldest supported Python runtime; no code-side blocker remains.
