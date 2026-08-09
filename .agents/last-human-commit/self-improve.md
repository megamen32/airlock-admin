## 2026-08-04 — docs-custom-gpt-virtual-mcp-public-docs (Short)

- What slowed or confused L? `tests/test_product_auth_language.py` does not exist here, so I had to re-scope to real focused checks.
- Which instruction should change? none
- Which skill, MCP, or tool is missing? none
- What operation or error repeated? 1 failed combined pytest attempt because the missing test file short-circuited `&&`; a small existence check or direct known-test list would avoid it.
- State: fixed now

## 2026-08-05 — Root docs translation recovery (Short)

- What slowed or confused L? `englishFiles()` read a generated website mirror, so existing mirror-equality checks did not reveal that a new root document could not be translated first.
- Which instruction should change? none.
- Which skill, MCP, or tool is missing? Proposed: a docs-contract fixture helper that creates a stale mirror and root manifest without retained temporary diagnostics.
- What operation or error repeated? Two review passes preceded discovery that the first canary leaked its retained `/tmp/gptadmin-docs-*`; guard: require test-owned cleanup for diagnostic-mode fixtures.
- State: fixed now

## 2026-08-05 — Local main consolidation (Full)

- What slowed or confused L? Divergent stale worktrees and a nested gitlink hid two independent merge contracts: the website mirror and optional virtual MCP tests.
- Which instruction should change? Proposed: when a user requires a canonical local checkout, require explicit no-new-worktree mode before any task bootstrap.
- Which skill, MCP, or tool is missing? Proposed: a read-only worktree inventory that classifies clean/dirty state, unique commits, and gitlink/tree collisions.
- What operation or error repeated? Merge choices retained stale test and source variants; guard: after every cross-line merge, run the full target package after focused tests and restore the newer contract when it has explicit coverage.
- State: fixed now

## 2026-08-06 — GPTAdmin plugin smoke test (Direct)

- What slowed or confused L? `ALL_TOOLS` descriptions were too large to inspect safely; filtering to exact tool names resolved it.
- Which instruction should change? none
- Which skill, MCP, or tool is missing? none; GPTAdmin connector exposed discovery, schema, and execute directly.
- What operation or error repeated? none; one discovery, one schema call, and one canary execute all completed.
- State: not actionable

## 2026-08-06 — Server-100 GPTADMIN blocker audit (Direct)

- What slowed or confused L? `system_inspect` returned different errors for `/home/roomhacker` versus `/home`; the target's inspection-root contract is not self-describing.
- Which instruction should change? none
- Which skill, MCP, or tool is missing? Proposed: expose configured inspection roots and executor mode in GPTADMIN schema/status without revealing secrets.
- What operation or error repeated? `shell_exec` failed twice with missing `/usr/bin/sudo`; guard: preflight executor binary and report remediation separately from command failure.
- State: Proposed

## 2026-08-09 — Health Incident Autopilot plan gate (Full)

- What slowed or confused L? The required plan-selection question remained unanswered across three automatic goal continuations.
- Which instruction should change? none; the Full-cycle approval boundary is explicit.
- Which skill, MCP, or tool is missing? none; a human plan selection is required.
- What operation or error repeated? 3 goal turns reached the same selection gate; guard: keep implementation untouched until one plan is named.
- State: needs human decision

## 2026-08-06 — Server-100 ShellMCP repair (Short)

- What slowed or confused L? GPTADMIN shell_exec failed inside the service namespace while SSH could see sudo; the decisive evidence was the live systemd unit and process identity.
- Which instruction should change? none
- Which skill, MCP, or tool is missing? Proposed: a bounded GPTADMIN live deployment helper for atomic drop-in install, rollback receipt, restart, and canary.
- What operation or error repeated? Phone proxy CONNECT failed on four tested ports/paths; guard: separate proxy transport acceptance from external HTTPS success and fall back to vpn2 only when explicitly authorized.
- State: Proposed

## 2026-08-06 — Custom Actions and selected MCP HTTP Remote audit (Full)

- What slowed or confused L? A successful VPN2 egress check initially looked like an Actions check; the public schema must be called explicitly and redirect-followed.
- Which instruction should change? none
- Which skill, MCP, or tool is missing? Proposed: a public-surface canary that validates OpenAPI, MCP, selected-server URL, and redacted Bearer config together.
- What operation or error repeated? Public routes returned 404 across 6 endpoints after redirect; guard: fail the release canary on canonical-host route absence before UI claims.
- State: Proposed

## 2026-08-07 — GPTAdmin status and FRP URL audit (Direct)

- What slowed or confused L? The local CLI defaulted to user scope and the server CLI status summary printed unknown despite active raw units; `doctor --json` was needed for authoritative state.
- Which instruction should change? none
- Which skill, MCP, or tool is missing? Proposed: a status command that emits the effective public URL and normalized systemd states in one machine-readable result.
- What operation or error repeated? Wrong hostname returned redirects/404s before the FRP URL was read from `gptadmin urls`; guard: always derive the URL from the target runtime before external canaries.
- State: Proposed

## 2026-08-07 — BrowserOS Mac mini URL check (Direct)

- What slowed or confused L? The GPTADMIN agent name implied a connected MCP, but schema failed and the stored relay port 19000 had no listener; direct Mac inspection found BrowserOS on 9000 returning 503.
- Which instruction should change? none
- Which skill, MCP, or tool is missing? Proposed: target discovery should expose the effective remote MCP URL and a health result, not only an agent-config wrapper.
- What operation or error repeated? `mcp_tools`/schema failed once with stdio exit -15 and HTTP probes returned 503 on six paths; guard: require tools/list plus health before claiming connected.
- State: Proposed

## 2026-08-07 — BrowserOS vs BrowserClaw log audit (Direct)

- What slowed or confused L? Two similarly named products shared the Mac host: BrowserOS.app 0.47.18 and BrowserClaw 0.48.1.0; process identity was decisive.
- Which instruction should change? none
- Which skill, MCP, or tool is missing? none; context-mode log extraction plus upstream docs were sufficient.
- What operation or error repeated? Old `browseros_server` crash reports repeatedly showed `EXC_BAD_INSTRUCTION`; guard: health must bind to process identity and successful MCP initialize/tools/list, not an app name or port alone.
- State: fixed now

## 2026-08-07 — FRP edges, Custom GPT, and BrowserClaw release 52694d4 (Full)

- What slowed or confused L? Prior green evidence was stale: direct probes found primary/VUSA on build 140 and VPN2 client using obsolete port 27000.
- Which instruction should change? none
- Which skill, MCP, or tool is missing? Proposed: one built-in per-edge authenticated canary that supports SNI/forced-IP resolution and nested MCP child calls.
- What operation or error repeated? FRP restart loop and failover proxy conflicts repeated for minutes; guard: endpoint-port regression, bounded unit/child watchdog, cooldown, and post-push per-edge canary.
- State: fixed now

## 2026-08-07 — Direct child MCP catalog (Full)

- What slowed or confused L? Existing `mcpAgentsForCapabilities()` was mistaken for Hub public exposure; source tracing found the missing `Beat.MCPAgents` wiring and child alias dispatch.
- Which instruction should change? none.
- Which skill, MCP, or tool is missing? Proposed: a topology query that distinguishes “catalog exists on ShellMCP” from “catalog is transported to Hub and publicly exposed.”
- What operation or error repeated? One reviewer found disabled child publication; guard: direct child aliases must be enabled-only and have a regression test.
- State: needs human decision

## 2026-08-07 — Lazy child MCP health (Full)

- What slowed or confused L? A health refresh lifecycle race was found only by independent review: cancel handle cleanup could overlap `Close()`/next refresh.
- Which instruction should change? none.
- Which skill, MCP, or tool is missing? Proposed: a reusable lifecycle blackbox harness for cancel, single-flight, and service close races.
- What operation or error repeated? Three review passes found P1/P2 test gaps; guard: require race tests plus blocked remote blackbox before claiming health complete.
- State: needs human decision

## 2026-08-08 — Rollout canary and edge trust (Full)

- What slowed or confused L? The rollout script reported failure after a successful HAOS start because it assumed `addon_` container names, and Mac polling hit one DNS edge serving a self-signed fallback certificate.
- Which instruction should change? Treat deploy-script exit as provisional until the actual Supervisor container, process log, and consumer canary are checked.
- Which skill, MCP, or tool is missing? Proposed: a secret-safe per-edge TLS/SNI canary and a rollout script that discovers the Supervisor-generated `app_` container name.
- What operation or error repeated? Mac ShellMCP started with `heartbeat=false` or could not trust the bad edge; guard: set both heartbeat env names, pin/route only a valid edge, and verify direct initialize/tools/list/browser flow.
- State: fixed now

## 2026-08-09 — Health Incident Autopilot research (Full)

- What slowed or confused L? context-mode shell capture broke compound `if/for` commands and later local file-processing calls hung; direct narrow reads recovered the evidence.
- Which instruction should change? Proposed: context-mode shell wrapper should preserve compound commands or emit a fast fallback hint.
- Which skill, MCP, or tool is missing? Proposed: a bounded cross-repo topology/evidence query that avoids full recursive raw output.
- What operation or error repeated? 3 context-mode calls hung (large `rg` batch plus resume-time `ctx_search`); guard: scope searches by repo/file type, use direct fallback, and terminate read-only batches on timeout.
- State: Proposed

## 2026-08-09 — Health Incident Autopilot implementation hardening (Full)

- What slowed or confused L? A durable core fix initially looked green while the HTTP workflow wrapper recomputed `useful_progress` differently; independent Reviewer/Critic caught the cross-layer mismatch and a separate-process SQLite race.
- Which instruction should change? Keep business-state verdicts authoritative at the deepest durable boundary and require fresh black-box/review reruns after wrapper changes.
- Which skill, MCP, or tool is missing? Proposed: a reusable cross-process state-machine canary that checks HTTP status, persisted rows, and returned receipts together.
- What operation or error repeated? Heartbeat-only receipts, oversized Hermes session actors, and unproven fake transport provenance were each exposed only by independent adversarial passes; guard: reject heartbeat-only before persistence, bound every bridge actor, and print real/fake transport provenance in canaries.
- State: Proposed

## 2026-08-09 — Fleet health rollout checkpoint c819ec0 (Full)

- What slowed or confused L? Live verify falsely reported the installed config absent because remote `test -s -- path` is not portable.
- Which instruction should change? none; the runner now uses the portable command and has a regression.
- Which skill, MCP, or tool is missing? none.
- What operation or error repeated? One false readiness receipt; guard: exercise remote shell primitives against the real target before trusting Fleet preconditions.
- State: fixed now

## 2026-08-09 — Health activation approval boundary (Full)

- What slowed or confused L? The same required credential/timer approval remained unanswered across three continuation turns while preflight stayed unchanged.
- Which instruction should change? none; the Lead boundary correctly requires a direct question for secret-write and systemd activation.
- Which skill, MCP, or tool is missing? none.
- What operation or error repeated? Three read-only preflight confirmations showed absent env and inactive timer; guard: stop after the third identical boundary instead of polling.
- State: needs human decision

## 2026-08-09 — Health canary model routing and black-box gate (Full)

- What slowed or confused L? A successful HTTP 200 from legacy OpenCode PATCH hid that the first prompt still used the default model; the real-user Tester also lacked a live Touchpoint surface.
- Which instruction should change? Treat effective provider/model telemetry and request ordering as acceptance evidence; never infer them from an adapter receipt.
- Which skill, MCP, or tool is missing? A stable BrowserOS/Touchpoint real-user surface for the final black-box gate.
- What operation or error repeated? Silent model fallback and `Transport closed`; guard with v2 model-switch-before-prompt, fail-closed tests, and `STOP_MISSING_REAL_SURFACE`.
- State: fixed now; user plan selection remains pending

## 2026-08-09 — Two-stage orchestrator provenance and Fleet credential (Full)

- What slowed or confused L? `omniroute/orchestrator` was accepted by the local session endpoint but did not exist upstream; a durable orchestration object was also initially string-truncated by the core sanitizer.
- Which instruction should change? Separate requested logical roles from proven effective model IDs, order mandatory stage traces first, and test persisted JSON rather than only callback return values.
- Which skill, MCP, or tool is missing? A post-deploy Fleet credential contract test that compares the dedicated health token with the scoped producer token.
- What operation or error repeated? Two live canaries exposed missing final trace retention and a Fleet activation check/write mismatch; guard with v8 timing/provenance canary, `4 passed` activation regression, and live token equality verification.
- State: fixed now; plan selection/remediation and real Touchpoint surface remain pending
## 2026-08-10 — Hermes CLI health remediation review correction
- What changed: separated Hermes observation MCP from the health CLI job, added request-bound execution-profile validation, bounded redacted CLI trace export, real CLI-output progress, a 20-minute watchdog with SIGTERM/SIGKILL escalation, and tracked systemd profile variables.
- Evidence: Agent-Herder build; focused 11 tests; full 105-test suite; diff checks clean; prior live canary and Fleet activation remained no-send. Fresh Reviewer/Critic findings were recorded and fixed; black-box Tester remained `STOP_MISSING_REAL_SURFACE` because Touchpoint transport was unavailable.
- Future shield: never call a stale PID a current-build canary; require fresh restart plus post-restart canary before claiming the seam is live, and treat service-ops 9119 probes separately from the direct Hermes 8644 health endpoint.
- What operation or error repeated? 2 related stale probes: service-ops user DBus/9119 versus direct Hermes 8644; guard is to report direct endpoint authority separately.

## 2026-08-10 — health monitoring Hermes review (Full)

- What slowed or confused L? The reviewed live PID (started 00:05) predated the fresh `dist` build (00:24); a current-build canary cannot be inferred from an active unit.
- Which instruction should change? `/home/roomhacker/.local/share/last-human-commit/current/common/agents/Lead.md`: require fresh PID/start-time evidence after every source rebuild before calling a service canary live.
- Which skill, MCP, or tool is missing? A canonical Agent-Herder restart/status probe is missing from `service-ops`; smallest useful addition is a read-only status plus explicit approval-bound restart for that unit.
- What operation or error repeated? 2 related stale probes: service-ops user DBus/9119 versus direct Hermes 8644; guard is to report direct endpoint authority separately.
- State: needs human decision

## 2026-08-10 — current-dist Hermes receipt parser (Full)

- What slowed or confused L? The first progress-visible Hermes canary returned a valid answer but no native ID because the CLI emitted `Session: <id>` instead of `session_id:`.
- Which instruction should change? none; the adapter must accept documented and observed CLI receipt variants.
- Which skill, MCP, or tool is missing? none; a bounded isolated current-dist canary exposed the gap.
- What operation or error repeated? 1 parser miss; guard is a fixture for both receipt formats plus a current-dist canary asserting native ID, progress, and terminal status.
- State: fixed now

## 2026-08-10 — NoticePlace Hermes handoff (Full)

- What slowed or confused L? Fleet had already switched the live profile to Hermes, but NoticePlace `agent_job_helper.py` still rejected Hermes and expected the old OpenCode model string.
- Which instruction should change? none; keep profile allowlists and deployment examples tested against the applied Fleet profile.
- Which skill, MCP, or tool is missing? none; read-only source/live profile comparison found the mismatch.
- What operation or error repeated? 1 full NoticePlace suite failure remains in an unrelated Telegram severity-route test (`147 passed, 1 failed`); guard is the recorded bounded todo, not an opportunistic fix.
- State: fixed now; live NoticePlace deploy and restart need human decision

## 2026-08-10 — live NoticePlace deployment boundary (Full)

- What slowed or confused L? Source helper hash `36e9bc...` and live `/opt/noticeplace` hash `a166a2...` differ; the source fix cannot be called live from a passing isolated canary.
- Which instruction should change? none; require source/live hash equality after every service deployment before accepting an integration claim.
- Which skill, MCP, or tool is missing? Fleet has health activation workflows but no canonical NoticePlace application deploy adapter; smallest useful capability is a backup-first preview/apply for `/opt/noticeplace` plus notification-center restart proof.
- What operation or error repeated? 1 full suite failure (`notify/tests/test_telegram_controls.py`, `147 passed, 1 failed`); guard remains the bounded Telegram-routing todo.
- State: needs human decision
