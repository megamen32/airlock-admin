# GPTAdmin worklog

This is the canonical cross-agent handoff log. It is append-only: add a new
dated entry, never rewrite another agent's historical entry. The execution
plan is [`PROJECT_PLAN.md`](./PROJECT_PLAN.md).

## Workflow for every agent

1. Read `PROJECT_PLAN.md`, this file and the relevant subsystem documentation
   before changing code.
2. Select one milestone and one bounded slice. If another active entry owns an
   overlapping file or runtime surface, coordinate before editing.
3. Add an **active** entry before substantial edits. Include the milestone ID,
   scope, owner/agent label and intended acceptance evidence.
4. Work test-first for behavioral changes: record the failing test or precise
   pre-fix evidence, implement, then record focused and full verification.
5. Replace the active entry with a **completed**, **blocked** or **handed-off**
   entry. Include changed paths, commit, CI run, deployment state and one
   concrete next action.
6. Update the status in `PROJECT_PLAN.md` only when the milestone exit gate has
   evidence. Do not mark a stage complete from an implementation claim.

## Entry template

```md
## YYYY-MM-DD - <short title> - <active|completed|blocked|handed-off>

- Milestone: `Sx.y`
- Owner: `<agent or human>`
- Scope: `<bounded files, runtime or user flow>`
- Baseline / red evidence: `<failing test, incident or N/A>`
- Change: `<what was done>`
- Verification: `<commands and concise results>`
- Delivery: `<commit, push, CI URL/run, deployment>`
- Next: `<single actionable continuation or none>`
- Blocker: `<only when status is blocked>`
```

## Rules

- Never put tokens, passwords, private URLs, raw customer data or full command
  output in this file. Refer to a redacted log path or issue instead.
- Keep entries factual and compact. State uncertainty explicitly.
- A runtime change is not delivered until restart/health evidence is logged.
- A docs-only or research task still records the canonical source and what
  decision it changed.
- Use absolute repository paths in handoffs when ambiguity is possible.

## Entries

## 2026-07-22 - Edge proxy policy and dialer core - completed

- Milestone: `S0.2` Go-only ShellMCP runtime
- Owner: Codex
- Scope: Add the isolated `go-shellmcp/internal/networkproxy` policy and
  dialer core only; no queue/heartbeat, transport, offer-client, agent, CLI or
  deployment changes.
- Baseline / red evidence: `cd go-shellmcp && go test ./internal/networkproxy`
  failed because the desired policy, resolver and dialer contract was undefined.
- Change: Added scope-aware target policy, local resolution with all-answer
  validation and numeric-IP pinning, plus bounded TCP connections enforcing
  dial timeout, total bytes and connection lifetime. No ShellMCP loop,
  transport, current proxy PoC, CLI or deployment code changed.
- Verification: Focused RED then GREEN passed; `go test ./...`,
  `go test -race ./internal/networkproxy`, and `go vet ./...` all passed from
  `go-shellmcp`.
- Delivery: Commit `ad68358` (`Add edge proxy policy and dialer core`);
  detailed handoff is `.superpowers/sdd/task-4a-report.md`.
- Next: Add the separately scoped signed-offer client and agent activation
  flow that supplies this package's local Policy and Limits.

## 2026-07-20 - Retire legacy CLI token - completed

- Milestone: `S0.5`
- Owner: Codex
- Scope: Legacy `CTL_TOKEN` compatibility window, Go Hub enforcement, CLI/admin messaging and migration deadline.
- Baseline / red evidence: `CTL_TOKEN` remained accepted by Hub admin/MCP auth and was exposed by CLI token/doctor/setup messaging; no recorded cutoff date existed.
- Change: Set the fixed 2026-07-27 UTC cutoff; legacy bearer auth now emits deprecation metadata before the cutoff and is rejected afterwards. New setup/update flows do not generate or print it, CLI rotation is removed, Admin UI uses session/OAuth flows, and ShellMCP artifacts use the agent credential after the cutoff.
- Verification: RED tests covered pre/post-deadline Hub auth, ShellMCP artifact access, CLI output/rotation/setup and Admin UI controls. Python `130 passed, 2 skipped`; Go Hub and Go ShellMCP suites passed; local Hub rebuilt, restarted and reports `go-dev/worktree`.
- Delivery: Changes are included in the pushed `main` commit.
- Next: Complete the final legacy credential removal and migration audit after the 2026-07-27 deadline.

## 2026-07-20 - Persist ShellMCP auth across updates - completed

- Milestone: `S0.2`
- Owner: Codex with Sol security review
- Scope: Installer update auth preservation and legacy systemd ShellMCP overrides
- Baseline / red evidence: server-88 Go ShellMCP polls returned repeated `401 unauthorized`; effective service environment came from a legacy Go-primary drop-in instead of the canonical Hub environment.
- Change: Preserve legacy auth aliases during updates; remove all legacy Go-primary systemd overrides; make Linux/Android installers reuse stored credentials; add Hub `awaiting_approval` state and `approve_pending_server` MCP tool that gates queue delivery.
- Verification: RED tests reproduced both token rewrite and approval bypass. Python `126 passed, 2 skipped`; Go Hub `go test ./...` passed. Server-88 canonical env was repaired, legacy overrides removed, current Go ShellMCP rebuilt and restarted; Hub reports server-88 `online` with fresh `last_seen`. Hub MCP `tools/list` exposes `approve_pending_server`; `pending` call returns a structured empty list.
- Delivery: Live server-100 Hub and server-88 ShellMCP restarted with locally built binaries. The changes are pushed to `main`.
- Next: Run CI release verification for the pushed auth/approval lifecycle changes.

## 2026-07-19 - Remove Python MCP transport runtimes - handed-off

- Milestone: `S0.2` Go-only ShellMCP runtime
- Owner: Codex with bounded Mac, Windows and Android audit workers
- Scope: Replace Python generic MCP relay services with direct Go ShellMCP child
  ownership, remove production-capable Python ShellMCP launch surfaces, and
  restore live Linux, Mac, Windows and Android agents.
- Baseline / red evidence: Server-100 has eleven enabled per-agent systemd
  services whose effective command is the Python generic relay; ten are active
  and one failed. The generated Go supervisor registry launches the same Python
  relay instead of the configured child command. Android is stale with no
  ShellMCP process; both Windows identities are stale. Mac and server-100 are
  currently online through Go queue mode with no listener.
- Change: ShellMCP now writes a direct Go child registry, retires Linux and
  macOS orphan relay units, uses the canonical service name, persists the Mac
  ordinary-user identity, terminates child MCP processes during restart, and
  ships no Python relay in release archives. Stale duplicate CLI and public
  Windows installer artifacts were removed or synced.
- Verification: RED regressions covered nested Python relay ownership, legacy
  unit cleanup, Mac orphan plists/default user, Windows installer drift and
  long-poll listeners. Both Go suites passed; Python passed `123 passed, 2
  skipped`. Release builds for ShellMCP, Windows and Android contain no Python
  runtime. Server-100 exposed all seven enabled child schemas through Go;
  a restart with a live child completed in the same second; Mac and Android
  completed real Hub calls with no listener or Python relay.
- Delivery: Server-100, Mac and Android runtime migrations deployed and
  restarted. Release build 128 is prepared for the same commit and push.
- Next: Reinstall one reachable Windows host and record
  `online -> tools/list -> harmless call` acceptance.
- Blocker: Both registered Windows hosts remain stale and this environment has
  no SSH or WinRM route to either host; repository, artifact and CI evidence
  cannot substitute for a live Windows call.

## 2026-07-19 - Audit standalone ShellMCP host completion - completed

- Milestone: `S0.2` standalone ShellMCP contract slice
- Owner: Codex with bounded implementation audit and lifecycle review workers
- Scope: Prove and correct the Go ShellMCP standalone child-host contract for
  stdio, Streamable HTTP, legacy SSE, optional Hub polling, bounded storage and
  Mac/Linux deployment.
- Baseline / red evidence: Runtime tests reproduced duplicate stdio ownership,
  non-functional legacy SSE, non-persistent HTTP sessions, proprietary inbound
  GET/session behavior, queue cancellation delay, unbounded child stderr and
  separate disposable-data allowances. Review then reproduced hung-start and
  stale multi-waiter lifecycle races.
- Change: Child protocol sessions now have one cancellable, generation-checked
  owner; remote transports implement persistent/negotiated sessions and legacy
  SSE; inbound HTTP is stateless Streamable HTTP; queue cancellation is prompt;
  ShellMCP-owned spill, outbox, audit and backup files share one budget. Public
  service/HA templates and standalone documentation now use the installed Go
  binary and opt-in heartbeat policy.
- Verification: `go test ./...`, focused race suites, `go vet ./...`, five-way
  cross-build and Linux standalone black-box smoke passed. Final integrated
  gates passed both Go suites, Python `110 passed, 2 skipped`, React `17 passed`,
  lint, production build, secret scan and diff check. Linux, Darwin arm64 and
  HAOS arm64 runtimes use outbound long-poll with heartbeat disabled and no
  listener; Hub inventory reports their current identities online.
- Delivery: Integrated into the single repository commit for this worktree.
  Hub and local ShellMCP were rebuilt and restarted; the authorized Mac binary,
  CLI and canonical ShellMCP credential were updated over SSH and launchd was
  restarted; the HAOS add-on options, binary and container were rebuilt through
  Supervisor. All four services are active and queue authentication is healthy.
- Next: None.

## 2026-07-17 - Access profiles and enforced client bindings - completed

- Milestone: `S1.3a`
- Owner: Codex orchestrating bounded Luna workers
- Scope: Persist versioned access profiles, bind managed JWT/OAuth clients to a
  profile, filter their effective MCP tools and reject manually constructed
  forbidden calls. Preserve reference-only external workspaces and the current
  transitional authentication path.
- Baseline / red evidence: The delivered instruction set is versioned, but
  access remains a global `full`/`readonly` claim; no persisted profile binds a
  client to explicit targets/tools, and the admin Clients/Auth inventory does
  not provide the complete profile-aware control flow.
- Change: Added atomic versioned access-profile persistence, profile-aware JWT
  and OAuth client bindings, allowlisted target/tool enforcement at discovery
  and execution boundaries, redacted managed-client inventory, and complete
  React profile/client/auth flows. External workspaces remain reference-only.
- Verification: Red persistence, inventory, enforcement and UI tests preceded
  implementation. Final gates passed Hub and ShellMCP Go suites, Python `110
  passed, 2 skipped`, React `17 passed`, lint, production build, secret scan and
  diff check; Hub restart retained the profile contract and current agents
  re-registered successfully.
- Delivery: Integrated into the same single repository commit. The production
  Hub binary was rebuilt and `gptadmin-hub.service` restarted active. React
  remains source-only until its separately documented production parity gate;
  `public/admin/` remains the served admin UI.
- Next: Run the explicit React/public-admin parity gate before replacing the
  production admin bundle.

## 2026-07-17 - Admin profile instruction workspace - handed-off

- Milestone: `S1.3a`
- Owner: Codex orchestrating bounded Luna workers
- Scope: Deliver the first `S1.3a` vertical slice: versioned instructions,
  failover-safe persistence and the CI-gated React admin foundation. Define
  external machine/workspace references without copying private repositories
  into GPTAdmin or Cloud.
- Baseline / red evidence: Regression tests reproduced stale cross-Hub ETag
  writes, cacheable private responses, invalid inline overrides blocking edits,
  a Unix-epoch fallback timestamp and Windows Hub compile failures.
- Change: Added authenticated GET/PUT instruction-set CAS, OS-level file locks,
  cross-Hub read refresh, atomic persistence, nullable fallback timestamps and
  Windows-native locking. Added the React/TypeScript admin source and its exact
  API, stale-write, size, keyboard and build contracts. `public/admin/` remains
  production until the explicit parity gate. `ADMIN_PROFILES.md` defines
  reference-only external workspaces and the Cloud metadata boundary.
- Verification: `go test ./...` in Hub and ShellMCP; Hub race detector; Windows
  amd64 and Darwin arm64 compile; Python `106 passed, 2 skipped`; React 5 tests,
  lint, build and dependency audit; desktop/mobile browser smoke; `git diff
  --check`. Build, Sync, Release run `29587947262` passed all five jobs,
  including admin UI, Windows, macOS and failover E2E.
- Delivery: Commit `39d1931632ba546deb9c3727b67f852d70131af4` pushed to
  `origin/main`; CI run `29587947262` passed. No production admin replacement
  or runtime deployment was performed in this source-foundation slice.
- Next: Implement versioned `AccessProfile`, client binding and target/tool
  policy enforcement with black-box allow/deny tests, then pass the UI parity
  gate before replacing `public/admin/`.

## 2026-07-17 - Make cold Hub contract startup deterministic - completed

- Milestone: `S0.2`
- Owner: Codex
- Scope: Remove first-run Go compilation time from the Hub HTTP contract readiness window in CI.
- Baseline / red evidence: CI run `29583276807` failed only `test_hub_contract_health_and_auth[go]`; the first `go run` never opened its port within 15 seconds, while all subsequent Hub contract tests passed after the Go cache warmed.
- Change: The default Go Hub contract command is now built once per test session with `-buildvcs=false`; every default black-box case starts that binary instead of compiling during a 15-second readiness window. Configured external `HUB_CONTRACT_COMMANDS` remain unchanged.
- Verification: Cold-cache `test_hub_contract_health_and_auth` passed (`1 passed`); Python `104 passed, 2 skipped`; `go test ./...` in `go-hub` and `go-shellmcp` passed.
- Delivery: Pending commit, push and CI.
- Next: None.

## 2026-07-17 - Convert Cloud to a normal private tree - completed

- Milestone: `S0.4`
- Owner: Codex
- Scope: Replace the `private/Cloud` linked worktree with ordinary `main`-tracked private Cloud materials, while preserving unrelated untracked agent state.
- Baseline / red evidence: The previous move retained a linked worktree, contradicting the intended single-tree layout and leaving a 245 MB duplicate checkout under `private/Cloud`.
- Change: Preserved the three private Cloud materials in `private/Cloud/`, removed the linked worktree and its 245 MB duplicate code tree, and restored its unrelated `.juggler/` state under the new directory. Added a narrow ignore rule for that state directory; the root user's `.juggler/` was untouched.
- Verification: `git worktree list --porcelain` no longer contains Cloud; `git status` reports the three intended Cloud paths as ordinary additions; `git check-ignore` matches only `private/Cloud/.juggler/`; `.gitpublic/ignore` excludes all of `private/`.
- Delivery: Pending private-repository commit and push.
- Next: Work on reviewed Cloud materials directly under `private/Cloud` in `main`.

## 2026-07-17 - Move private Cloud worktree - completed

- Milestone: `S0.4`
- Owner: Codex
- Scope: Move the existing private `gptadmin-hubhub` linked worktree under `private/Cloud` without merging its obsolete branch into `main` or exposing it in the public mirror.
- Baseline / red evidence: The private Cloud worktree lives beside the repository root under a legacy folder name, while `private/` is already the sanctioned mirror-excluded location for private materials.
- Change: Renamed and moved the linked worktree from `/home/roomhacker/gptadmin-hubhub` to `private/Cloud` using `git worktree move`. Its private branch, staged files and untracked Cloud document were preserved; no obsolete branch history was merged into `main`. Added a local Git exclusion so the nested worktree does not pollute `main` status.
- Verification: `git worktree list --porcelain` reports `private/Cloud` on `gptadmin-hubhub`; its Git common directory is the root private repository; its staged/untracked state remains present; root `git check-ignore` matches `private/Cloud`; `.gitpublic/ignore` excludes `private/`.
- Delivery: Local workspace organization only; no public release.
- Next: Use `private/Cloud` as the private Cloud workspace; merge only reviewed, current slices into `main`.

## 2026-07-17 - Consolidate active work on main - completed

- Milestone: `S0.4`
- Owner: Codex
- Scope: Merge the currently verified AI-client and private startup-instruction slice into `main`; classify remaining divergent branches so obsolete implementation history is not reintroduced.
- Baseline / red evidence: The default workspace is on a feature branch, while `main` contains release `127`; branch choice is ambiguous for subsequent agents.
- Change: Merged `feature/connect-mcp-additional-ai-clients` into `main`, preserving its private startup-instruction source and AI-client support. Classified all other divergent branches as historical, obsolete or backup work: merging them would reintroduce removed Python ShellMCP code or stale Hub rewrites. Made the root-daemon black-box harness deterministic in isolated worktrees by disabling irrelevant Go VCS stamping during its test-only build.
- Verification: `go test ./...` in `go-hub`; `go test ./...` in `go-shellmcp`; `python3 -m pytest tests/ --ignore=tests/e2e` (`101 passed, 5 skipped`).
- Delivery: Commits `61c9e23`, `63b6640` and the follow-up test-harness commit; push and CI pending.
- Next: Work from `main`; retain old branches as explicit history until a separate deletion decision.

## 2026-07-15 - Compact MCP tool names and descriptions - completed

- Milestone: `S4.1`
- Owner: Codex
- Scope: Audit and compact the public MCP tool surface while preserving legacy dispatch aliases.
- Baseline / red evidence: `tools/list` exposes long `list_mcp_*`, `call_mcp_tool` and `get_mcp_job` names plus repeated prose; current contract does not use the shorter discover/schema/execute/job vocabulary.
- Change: Canonical MCP tools are now `discover`, `schema`, `execute`, `job`, `inspect`, and `ui`; old names remain accepted but are not advertised. OpenAPI operation IDs and component schemas use the same compact vocabulary. Canonical execute uses `target/tool/args`; old `tool_name/arguments` remain accepted. Downstream ShellMCP names were retained and their descriptions shortened because they are separate capability contracts.
- Verification: Red canonical-surface test first; Hub tests and race detector; ShellMCP Go tests; Python `97 passed, 2 skipped`; `tools/list` payload is capped by a regression assertion at 12000 bytes.
- Delivery: Commit `9adf894` pushed to `main`; Build, Sync, Release run `29419512851` passed across build/release, macOS, Windows and Docker failover; Hub rebuilt with this commit and `gptadmin-hub.service` restarted active on `roomhacker-server-100`; live smoke passed `discover`, `schema(target=hub)`, and `execute(tool=status)`, advertising only compact names. Website docs commit `bc76d8c` and parent pointer `1290935` are pushed.
- Next: Keep legacy names through the documented migration window; remove aliases only in a planned breaking release after client telemetry confirms migration.

## 2026-07-15 - Relax repeated MCP discovery - completed

- Milestone: `S4.1`
- Owner: Codex
- Scope: Remove the prompt requirement to rediscover agents before every MCP operation.
- Baseline / red evidence: Public instructions required `Always call listMcpAgents first` and prescribed discovery/schema before every infrastructure action.
- Change: Discover once when target is unknown; reuse a healthy target and schema; repeat only after stale/disconnected state, unknown tool schema, or explicit refresh. Added a black-box prompt guard and clarified the philosophy.
- Verification: `python3 -m pytest tests/test_hub_contract.py -q` (`5 passed`); Build, Sync, Release run `29420583122` passed.
- Delivery: Commit `0ff518f` pushed to `main`; both prompt files synchronized to `/opt/gptadmin/public` on `roomhacker-server-100`; no Hub restart required because only static instructions changed.
- Next: Observe client behavior; do not reintroduce mandatory per-call discovery without measured correctness evidence.

## 2026-07-15 - Idempotent MCP writes - completed

- Milestone: `S4.1`
- Owner: Codex with one bounded contract-review agent
- Scope: Add optional idempotency to existing `call_mcp_tool` writes without creating a second execution facade.
- Baseline / red evidence: A write can complete while its response is lost; a retry currently has no Hub-level duplicate key and may enqueue the same operation twice.
- Change: Added one Hub-level deduplication layer shared by HTTP and MCP Apps calls. It scopes keys by caller authorization fingerprint, fingerprints target/tool/arguments, reuses the original result/job, rejects conflicting reuse with `409`, refreshes background records when downstream results arrive, and bounds memory with a 15-minute TTL and 1024-entry limit.
- Verification: Red tests first; `go test ./...` in `go-hub` and `go-shellmcp`; `go test -race ./internal/hub`; `python3 -m pytest tests/ --ignore=tests/e2e` (`97 passed, 2 skipped`).
- Delivery: Commit `0227a34` pushed to `main`; Build, Sync, Release run `29417782872` passed across build/release, macOS, Windows and Docker failover; `/opt/gptadmin/bin/gptadmin_hub` rebuilt from this commit and `gptadmin-hub.service` restarted active on `roomhacker-server-100`; live duplicate smoke returned one job id for two identical `shell:server-44` calls.
- Next: Add durable idempotency recovery semantics only as a separate milestone; current retry safety is bounded to the running Hub process.

## 2026-07-15 - Align integration contract with existing Hub flow - completed

- Milestone: `S4.1`
- Owner: Codex
- Scope: Correct the integration-control plan so it certifies GPTAdmin's existing agent/tool/call flow instead of implying a new Codex-style facade.
- Baseline / red evidence: GPTAdmin already exposes `list_mcp_agents` or `list_mcp_servers`, `list_mcp_tools`, and `call_mcp_tool`; the new contract wording did not document this mapping or distinguish the remaining idempotency/version gaps.
- Change: Map the external pattern onto current Hub operations and record only the missing guarantees as future work.
- Verification: Documentation tests and diff checks.
- Delivery: Pending commit and push.
- Next: Add idempotency/schema digest only when the corresponding S4.1 implementation slice is started.

## 2026-07-15 - External integration control contract - completed

- Milestone: `S4.1`
- Owner: Codex
- Scope: Record whether the Codex Document Control discover/schema/execute pattern is a GPTAdmin commitment or only an external reference; define the first bounded GPTAdmin integration slice.
- Baseline / red evidence: The pattern was described as a standard for “future integrations”, but neither `PROJECT_PLAN.md` nor this worklog named an owner, deliverable or acceptance test.
- Change: Add a canonical integration-control contract and make S4.1 explicit about session discovery, schema retrieval and idempotent execution.
- Verification: Documentation link/diff checks and the existing site-doc test.
- Delivery: Pending commit and push.
- Next: Implement the S1.3 candidate only when that milestone is started; no runtime change is claimed here.

## 2026-07-14 - MCP server list restart and failover contract - completed

- Milestone: `S0.2`, `S3.4`
- Owner: Codex with independent incident-review agents
- Scope: Prove the public MCP `list_mcp_servers` shape and registry survival across Hub restart/failover; ensure a live generic relay re-registers to a fresh Hub without a service restart.
- Baseline / red evidence: The attached client probe read `structuredContent.response.servers`, but production returns the list at `structuredContent.servers`; direct production inspection reports 27 servers while that parser reports zero.
- Change: Added a direct MCP JSON-RPC restart-contract test. Generic stdio relay now treats failed polling or registration as unregistered and retries registration with capped backoff before sending another poll. Docker failover now starts a real generic relay and fake stdio MCP, validates authenticated `list_mcp_servers`, then requires an `echo` tool call through the promoted fallback.
- Verification: Red Python regression tests proved one-time registration and polling after a failed recovery registration; green `go test ./...` and `go vet ./...` in Hub/ShellMCP, Python `97 passed, 2 skipped`, and Docker failover suite with all tunnel, Hub, combined, agent, reclaim and ranked-fallback scenarios passing locally.
- Delivery: Commit `7ab87c9` pushed to `main`; Build, Sync, Release run `29359978802` passed, including Docker failover, macOS, Windows and Android artifact jobs. Production generic relay runtime copies on `roomhacker-server-100` were synchronized and its ten `gptadmin-mcp-*` services restarted as user-owned processes; authenticated Hub smoke reports all ten online.
- Next: None.

## 2026-07-14 - Redacted security environment metadata - completed

- Milestone: `S2.3`
- Owner: Codex
- Scope: Replace the admin panel's raw env-file `shell_exec` read with a Hub metadata endpoint.
- Baseline / red evidence: The panel sent `cat /etc/gptadmin/gptadmin.env` through MCP, allowing secret values to enter model context and client previews.
- Change: `/admin/api/security/env` returns only variable names, presence, lengths and sensitivity flags; the UI no longer reads env through ShellMCP.
- Verification: Focused Hub test, admin UI tests (`5 passed`), JS syntax and diff checks passed; live unauthenticated endpoint returns `401`; live Hub reports commit `a691b06`.
- Delivery: Commit `a691b06` pushed to `main`; production binary rebuilt and `gptadmin-hub.service` restarted; Build, Sync, Release run `29359009257` is in progress.
- Next: Implement the OS-enforced ShellMCP read-only worker and secret handles.

## 2026-07-14 - OAuth rotation and readonly boundary - completed

- Milestone: `S2.1`, `S2.3`
- Owner: Codex
- Scope: Replace browser-side OAuth secret generation with an authenticated Hub endpoint, preserve secrets out of responses, and close the remaining readonly/redaction boundary with tests.
- Baseline / red evidence: `rotateOAuth()` only filled an HTML field; the screenshot showed secret-looking values in a client confirmation preview; ShellMCP service still runs as root for supervisor duties.
- Change: Added an authenticated Hub endpoint that atomically replaces `OAUTH_CLIENT_SECRET`, updates the current process, and never returns the secret. The admin UI now calls the endpoint instead of generating a secret in browser JavaScript.
- Verification: Go Hub/ShellMCP tests and vet passed; Python `95 passed, 2 skipped`; admin JavaScript syntax and diff checks passed; live `/version` reports build `126` at commit `19fe2b4`; live OAuth metadata exposes `gptadmin.inspect`; unauthenticated rotation is rejected with `401`.
- Delivery: Commit `19fe2b4` pushed to `main`; `/opt/gptadmin/bin/gptadmin_hub` rebuilt and `gptadmin-hub.service` restarted; Build, Sync, Release run `29358756754` is still running.
- Next: Implement the OS-enforced ShellMCP read-only worker and secret-handle boundary; do not rotate the production OAuth secret until the operator explicitly confirms invalidating current OAuth sessions.

## 2026-07-14 - Live auth transition and read-only verification - completed

- Milestone: `S2.1`, `S2.3`
- Owner: Codex with auth, deploy and redaction review agents
- Scope: Verify the configured public Hub, restore the documented CTL migration path, make managed Client/Auth inventory usable, and prove ShellMCP read-only plus model-output redaction at the real MCP boundary.
- Baseline / red evidence: Public admin currently serves a login page whose visible contract still references Bearer CTL; unauthenticated MCP returns `401`; the supplied client confirmation preview exposes API-key/password-looking values before execution.
- Change: Corrected the product terminology to ShellMCP; exposed the legacy CTL transition credential in inventory without persisting or showing its value; excluded it from JWT revoke-all and JWT rotation UI; added a regression test.
- Verification: Hub/ShellMCP Go tests and vet passed; Python `94 passed, 2 skipped`; live `/version` reports build `126` at commit `fbc45e8`; live OAuth metadata includes `gptadmin.inspect`; authenticated live checks returned `200` for both Bearer CTL and `X-CTL-Token`; inventory reports one redacted `legacy_ctl` record.
- Delivery: Commit `fbc45e8` pushed to `main`; Build, Sync, Release run `29357359924` passed; `/opt/gptadmin/bin/gptadmin_hub` rebuilt with commit ldflags and `gptadmin-hub.service` restarted successfully.
- Next: Add the OS-enforced ShellMCP read-only sandbox and secret-handle boundary so secrets are absent from client confirmation previews, then verify with black-box tests.

## 2026-07-14 - Cross-platform read-only client profile - completed

- Milestone: `S2.3`
- Owner: Codex
- Scope: Hub-issued read-only JWT profile, typed ShellMCP inspection and
  mandatory model-output secret redaction across Linux, macOS, Windows and
  Android contracts.
- Baseline / red evidence: `gptadmin.read` is advertised but MCP authorization
  does not enforce tool-call scopes; ShellMCP exposes arbitrary `shell_exec`
  and has no model-output secret redaction boundary.
- Change: Added managed and CLI `readonly` JWTs, profile-aware Hub MCP tool
  lists and fail-closed enforcement across relay, global MCP, pinned MCP,
  generated Actions and admin APIs. Added typed ShellMCP `system_inspect` with
  allowed roots, symlink containment, credential-directory denial, bounds and
  mandatory credential redaction. Admin issuance defaults visibly to read-only.
- Verification: Red tests showed missing inspector/redactor, ignored
  `access_mode`, shell execution through every MCP route and MCP JWT access to
  admin APIs. Green: both `go test ./...`; both `go vet ./...`; Python `94
  passed, 2 skipped`; admin JavaScript syntax; Hub darwin amd64/arm64 builds;
  ShellMCP Windows and Android builds plus Windows inspector test compilation.
- Delivery: Commit `3ec79d4`; Build, Sync, Release run `29354412360` passed,
  including macOS runtime, Windows ShellMCP, Android artifact and Docker
  failover jobs.
- Next: Add the separate `ask-before-write` profile with approval-bound job
  ownership; do not expand read-only into filtered raw shell.

## 2026-07-14 - Low-context product philosophy - completed

- Milestone: `S0.5`, `S2.1`
- Owner: Codex with Sol proposer and adversarial critic agents
- Scope: Canonical product philosophy and staged low-context MCP/required
  migration notice architecture.
- Baseline / red evidence: No philosophy document existed; the plan did not
  define MCP context as a budget, daily notice limits or evidence-based notice
  completion.
- Change: Added `PHILOSOPHY.md` and `MCP_CONTEXT_AND_NOTICES.md`; linked the
  philosophy from the execution plan, docs home and both agent instruction
  files. The synthesis preserves the current compact Hub tools and defers
  broader storage/protocol changes until measured evidence justifies them.
- Verification: Proposer and independent critic completed; `git diff --check`
  passed; `python3 -m pytest tests/test_site_docs.py tests/test_admin_ui.py -q`
  passed (`6 passed`).
- Delivery: Commit `bf35b42`; Build, Sync, Release run `29351644583` passed,
  including macOS, Windows, Android artifact and Docker failover jobs.
- Next: Implement V1 `connection_id` and notice-ledger tests as a separate TDD
  runtime slice.

## 2026-07-14 - Required AI migration notices - handed-off

- Milestone: `S2.1`
- Owner: Codex
- Scope: Hub MCP tools that deliver a one-time required migration instruction
  per JWT and record explicit agent acknowledgement.
- Baseline / red evidence: Hub has no durable way to tell a connected AI that
  a manual client migration needs user explanation and a confirmed completion.
- Change: Runtime implementation was deliberately deferred after proposer and
  critic review. The accepted V1/V2 contract is now
  `docs/MCP_CONTEXT_AND_NOTICES.md`.
- Verification: Design review rejected dynamic `tools/list`, a new generic
  facade, premature SQLite and unmeasured token limits.
- Delivery: Architecture handoff included with the philosophy documentation.
- Next: Start with a failing test proving JWT rotation preserves
  `connection_id`.

## 2026-07-14 - Managed MCP JWT inventory and rotation - completed

- Milestone: `S2.1`
- Owner: Codex
- Scope: Go Hub-issued MCP JWT registry, individual revoke/rotate APIs, admin
  inventory and plain-language CLI/admin guidance.
- Baseline / red evidence: The Go Hub returns an empty client list and its
  revoke endpoints are placeholders, so the admin cannot show or rotate
  issued JWTs even though it can issue one.
- Change: Hub-issued JWTs now have a persisted metadata-only inventory and
  revocable ID; the admin can list, revoke or rotate them. The panel explains
  OAuth as the normal route and JWT as a simple fallback for unsupported
  clients; CLI help uses the same language.
- Verification: Red tests proved missing token ID and UI path. Green:
  `go test ./...` in `go-hub`; `python3 -m pytest tests/ --ignore=tests/e2e
  -q` (`93 passed, 2 skipped`); `node --check public/admin/app.js`.
- Delivery: Commit `771d421`; Build, Sync, Release run `29331893009` passed.
- Next: Push and verify CI.

## 2026-07-14 - Automatic local MCP client registration - completed

- Milestone: `S1.1`, `S1.3`
- Owner: Codex
- Scope: `/home/roomhacker/gptadmin/cli.py` client registration and its
  installer/update regression tests for Codex, Claude Code, OpenCode and VS
  Code.
- Baseline / red evidence: Existing setup registers only three clients, emits
  raw bearer credentials, has no VS Code support, and update intentionally
  skips client registration.
- Change: Added idempotent registration for Codex, Claude Code, OpenCode and
  VS Code; client URLs now prefer `HUB_PUBLIC_URL`; setup and update perform
  the registration; automatic output no longer prints a bearer credential.
- Verification: Red baseline: `5 failed, 2 passed` in the new focused tests.
  Green: `python3 -m pytest tests/ --ignore=tests/e2e -q` (`92 passed, 2
  skipped`); `go test ./...` in both Go modules passed.
- Delivery: `de9f9e9` pushed to `main`; GitHub Actions run `29330935641`
  passed Linux build/release, Android artifact, macOS, Windows and Docker
  failover jobs.
- Next: None.

## 2026-07-14 - Zero-to-working setup principle - completed

- Milestone: `S1.1`, `S1.3`, `S1.6`
- Owner: Codex
- Scope: Product default for install, Tunnel, Hub URL and progressive security.
- Baseline / red evidence: Earlier planning put exposure choice and MFA before
  the first useful connection, reproducing the configuration burden users
  dislike in self-hosted agent products.
- Change: Superseded the upfront exposure questionnaire with automatic Hub +
  HTTPS Tunnel setup, one canonical Hub URL, client connection automation and
  optional security presets after first value.
- Verification: Decision reviewed against current repository installer/token
  inventory and recorded as a future runtime acceptance contract.
- Delivery: Delivered in the accompanying documentation commit; runtime setup
  still needs TDD implementation.
- Next: Add a failing clean-host installer test that requires an externally
  verified Hub URL without a manual Tunnel/token prompt.

## 2026-07-14 - Exposure profiles and admin MFA contract - completed

- Milestone: `S1.5`, `S2.1a`
- Owner: Codex
- Scope: Plain-language setup exposure choices and conditional MFA rules.
- Baseline / red evidence: Existing setup exposes transport/token terminology
  instead of asking whether the Hub is local, private or public.
- Change: Added local-only, private-network and public-Tunnel profiles;
  specified passkey-first MFA, TOTP fallback and recovery codes for public
  administration.
- Verification: Compared against current OpenClaw security documentation:
  loopback-first, pairing and identity-aware private access are sound patterns;
  GPTAdmin retains scoped JWT as a stricter client/agent authorization model.
- Delivery: Delivered in the accompanying documentation commit; no runtime
  exposure profile or MFA code exists yet.
- Next: Write failing installer and Hub black-box tests for the local-only
  default before implementing profile selection.

## 2026-07-14 - One-password product contract - completed

- Milestone: `S0.5`
- Owner: Codex
- Scope: Authentication simplification decision, migration phases and surface
  terminology.
- Baseline / red evidence: Current code and docs expose `CTL_TOKEN`, shell,
  relay and bridge tokens across installer, API, UI and quickstarts.
- Change: Added `AUTH_SIMPLIFICATION.md`; updated execution plan to require
  `AdminPassword` as the sole user-owned secret, internal scoped JWTs and the
  terms Hub, MCP clients and Tunnel on product surfaces.
- Verification: Repository inventory completed with `rg`; migration acceptance
  tests and phases are recorded before runtime changes.
- Delivery: Delivered in the accompanying documentation commit; runtime token
  removal remains a planned breaking migration.
- Next: Implement Phase A inventory tests and a new-install no-raw-token
  regression before changing authentication code.

## 2026-07-14 - Execution plan and cross-agent handoff - completed

- Milestone: `S0.4`
- Owner: Codex
- Scope: Canonical plan, append-only worklog and agent operating instructions.
- Baseline / red evidence: Public roadmap described product themes, but there
  was no milestone exit-gate plan or root-level cross-agent handoff record.
- Change: Added `PROJECT_PLAN.md`, this worklog and matching workflow rules to
  `AGENTS.md` and `CLAUDE.md`.
- Verification: Reviewed current repository structure and roadmap; `git diff
  --check` passed.
- Delivery: Delivered in the accompanying documentation commit; CI is not
  required for this docs-only coordination change.
- Next: Keep new implementation work aligned to one milestone and record
  evidence here before handoff.

## 2026-07-14 - Failover black-box coverage - completed

- Milestone: `S3.4`
- Owner: Codex
- Scope: Docker failover harness, CI gate and operator runbook.
- Baseline / red evidence: No Docker black-box coverage existed for hub failure,
  tunnel failure, combined outage, reclaim or multiple fallback ranks.
- Change: Added real Go hub/watchdog/proxy Docker topology. It covers tunnel
  only, hub only, combined failure, signed reclaim, rank 1 fencing rank 2 and
  rank 2 promotion while rank 1 is unavailable.
- Verification: `docker compose -f tests/e2e/failover/docker-compose.yml up
  --build --abort-on-container-exit --exit-code-from failover-e2e` passed all
  six scenarios.
- Delivery: `ed90d04`; GitHub Actions run `29310215351` passed, including the
  `failover-e2e`, Linux, macOS, Windows and Android artifact jobs.
- Next: Add a physical two-host deployment drill and partition-specific
  fencing evidence before calling HA maturity complete.

## 2026-07-15 - Remove private infrastructure prompts from public repo - completed

- Milestone: `S4.1`
- Owner: Codex
- Scope: Keep personal short and infrastructure MCP instructions outside the
  public repository and its Git history.
- Baseline / red evidence: Two private prompt artifacts were tracked in the
  public tree and present in 12 historical commits.
- Change: Preserved private local copies outside the repository, removed the
  artifacts from the public tree, added ignore rules, and removed the public
  contract-test dependency on their contents.
- Verification: Rewritten local and remote refs contain no matching path in a
  commit history or tree; focused contract-test collection and `git diff
  --check` pass.
- Delivery: Commit `fadc58d` and all public branches/tags were force-pushed
  after history rewrite; private copies remain outside the repository.
- Next: Keep personal prompts in the private directory and maintain only the
  public deletion manifest in the repository.

## 2026-07-15 - Preserve JWTs across updates and anchor private prompts - completed

- Milestone: `S2.2`, `S4.1`
- Owner: Codex
- Scope: Make in-place and automatic updates preserve all existing auth
  material, and keep personal instructions in the private source repository.
- Baseline / red evidence: A package step that rewrote `gptadmin.env` dropped
  `OAUTH_CLIENT_SECRET` and client bearer JWTs; private prompt copies lived in
  an external directory that was easy to lose.
- Change: Added pre-update auth capture and post-package restoration, atomic
  `.env` replacement, and moved private instructions under
  `private/instructions/` in the private repo. Both `git-private2public` and
  GitHub rsync explicitly exclude `private/`.
- Verification: TDD regression and mirror guard pass; private instruction
  hashes were preserved during the move.
- Delivery: Pending commit and CI.
- Next: Keep auth state in the managed config and never rotate it as part of
  binary/package replacement.

## 2026-07-15 - Compact discover with explicit detail opt-in - completed

- Milestone: `S1.3`, `S4.2`
- Owner: Codex
- Scope: Reduce default MCP context cost without removing target metadata when
  an integration explicitly needs it.
- Baseline / red evidence: `discover` returned transport, timestamps,
  capabilities and arbitrary metadata on every call.
- Change: Default REST, MCP and Apps SDK discovery now returns only
  `server_id`, `name`, `kind` and `status`; `detail: "full"` or
  `GET /mcp-relay/servers?detail=full` opts into the previous detail payload.
  OpenAPI and generated MCP schemas document the opt-in.
- Verification: Go Hub tests and black-box contract tests pass.
- Delivery: Pending commit and CI.
- Next: Apply the same compact/default policy to `listMcpAgents` only if a
  measured client still needs it; do not expand the default tool surface.

## 2026-07-17 - Publish release 127 - completed

- Milestone: `S1.3`, `S4.2`
- Owner: Codex
- Scope: Publish the committed Hub/client artifacts containing compact
  `discover` output and explicit detail opt-in.
- Baseline: `main` was at build `126`; CI builds passed but no new release
  tag or platform artifacts had been published.
- Change: Bumped `VERSION` to `127`; auto-tag created `v127`, and the release
  workflow built and synchronized all platform artifacts.
- Verification: Build, Sync, Release run `29581385996` passed all jobs,
  including Linux/Ubuntu, macOS, Windows and Android artifact checks;
  failover-e2e also passed. Public release `v127` in
  `megamen32/gptadmin_opensource` is published with nine assets, including
  Android arm64, Linux amd64/arm64, macOS amd64/arm64, Windows CLI/Hub/
  ShellMCP and the combined package.
- Delivery: `v127` is published and the public mirror sync completed.
- Next: Verify one real auto-update on each installed platform; no code change
  is required for this release gate.

## 2026-07-17 - GPTAdmin Cloud startup instructions - completed

- Milestone: `S1.4`
- Owner: Codex
- Scope: Provide owner-managed startup instructions through Hub MCP without
  contaminating direct third-party MCP endpoints.
- Baseline / red evidence: No persistent owner instruction channel existed;
  direct and administrative MCP surfaces had no tested separation.
- Change: Added bounded UTF-8 startup instructions from the private config,
  MCP `initialize.instructions`, the
  `gptadmin://startup-instructions` resource, and CLI `instructions path/show/set-file`.
  Hub and Shell surfaces receive GPTAdmin guidance; third-party direct MCP
  surfaces proxy upstream initialize/resources unchanged. Private owner
  instructions remain under `private/instructions/` and are excluded from
  public mirrors.
- Verification: `go test ./...`; `python3 -m pytest tests/ --ignore=tests/e2e`
  (`104 passed, 2 skipped`); `git diff --check`.
- Delivery: Pending commit and CI.
- Next: Publish this feature slice only after review; do not include it in the
  already-running `v127` release.
## 2026-07-21 - Promote React admin with legacy operations bridge - completed

- Milestone: `S1.4`, `S2.2`
- Owner: Codex
- Scope: Make the React admin console the primary `/admin/` surface while
  retaining the complete operational/MCP console at `/admin/legacy/`.
- Baseline / red evidence: The effective `/opt/gptadmin/public/admin` bundle
  differed from the repository React artifact; the React UI did not expose the
  legacy overview, tools/resources manager, jobs/audit, update or failover
  views.
- Change: Added the authenticated `/admin/legacy/` static route, packaged the
  React bundle plus an explicit `admin-legacy` fallback into Hub packages,
  taught CLI updates to install both static trees atomically, and exposed a
  visible `Операции и MCP` link from the React sidebar. Added TDD coverage for
  the route and release/install contracts.
- Verification: React tests `17 passed`, lint and `/admin/` base build passed;
  Python tests `132 passed, 2 skipped`; Go Hub tests `go test ./...` passed;
  browser smoke after admin login showed React instructions/profiles and the
  legacy tools/resources/MCP manager/jobs/audit/failover surface. Hub service
  is active. Deployment backup: `/opt/gptadmin/backups/admin-ui/20260721T050252Z`
  (Hub/static) and `/opt/gptadmin/backups/admin-ui/20260721T050913Z`
  (post-link static bundle).
- Security: The password used for browser smoke was accidentally included in
  tool output. At the user's direction the original `ADMIN_PASSWORD` was
  restored immediately; no replacement value was retained or committed.
- Delivery: Source changes are committed locally; the live static switch and
  release-ldflags Hub binary are active and reversible from the listed
  backups.
- Next: Push the integrated commit and keep the existing admin password stable.

## 2026-07-22 - Isolated Network Tunnel proxy relay - completed

- Milestone: `S2.2`
- Owner: Codex
- Scope: Create the separate `go-proxyrelay` core and ticket verifier without
  modifying Hub or ShellMCP transport, queues, jobs or service lifecycle.
- Baseline / red evidence: The relay regression suite first failed because the
  production relay and ticket packages were absent. A follow-up RED caught
  per-direction bandwidth doubling for one stream.
- Change: Added signed role-bound tickets, replay cache, bounded WSS pairing,
  FIN/RESET forwarding, capability revoke, per-agent/profile limits, byte,
  frame, queue, idle, lifetime and shared bandwidth limits, and metadata-only
  audit logging. The relay is an isolated module with no Hub/ShellMCP imports.
- Verification: `cd go-proxyrelay && go test ./internal/relay -count=1`,
  `go test ./...`, `go test -race ./...`, `go vet ./...` and the local TCP echo
  integration test passed.
- Delivery: Commit `4752e06` (`feat: add isolated bounded proxy relay`); no
  push, public listener deployment or edge-agent dialer in this slice.
- Next: Implement the edge proxy agent and enforce target dial timeout/ACL at
  the LAN side before adding service packaging.

## 2026-07-22 - Repair outbound ShellMCP polling and FRP origin - completed

- Milestone: `S0.2`
- Owner: Codex
- Scope: External Custom GPT relay, FRP origin migration, and ShellMCP agents on
  `roomhacker-server-100`, `roomhacker-server-88`, and `server-44`.
- Baseline / red evidence: Server-100 root ShellMCP rejected ordinary commands
  without `SHELLMCP_DEFAULT_USER`; server-44 ran an older listener build with
  `queue=false` and then returned queue `401 unauthorized`; live FRP installs
  could retain a private `HUB_PUBLIC_URL` after update. The new origin regression
  test failed before the code change.
- Change: `sync_oauth_origin_env()` now derives the canonical HTTPS origin from
  enabled FRP settings, preventing private-origin drift. Live server-100 env was
  repaired with the external origin and `roomhacker` default user. Server-44 was
  migrated to the working Go ShellMCP binary, canonical shared token, outbound
  long-poll queue, and heartbeat disabled; server-88 was aligned to the same
  queue/heartbeat policy. Existing per-host identities were preserved.
- Verification: Focused Python `30 passed`; full Python `133 passed, 2 skipped`;
  Go Hub and Go ShellMCP `go test ./...` passed. External Custom GPT OpenAPI
  returned HTTP 200; relay inventory showed 29 records and 100/88/44 online;
  authenticated `hostname && uptime` completed with returncode 0 on all three.
  All three ShellMCP services are active and recent logs show no queue 401 or
  heartbeat failure.
- Delivery: Live runtime changes applied and restarted; server-44 binary backup
  retained at `/opt/gptadmin/bin/rootd-go.bak.codex-20260722`. Source changes in
  `cli.py` and `tests/test_update_semantics.py` remain uncommitted locally.
- Next: Commit the source regression fix when publication is requested.

## 2026-07-22 - Share Android 4G as a dual LAN proxy - completed

- Milestone: `S0.2`
- Owner: Codex
- Scope: Android S21 4G egress, ADB transport, and LAN proxy exposure from
  `roomhacker-server-100`.
- Baseline / red evidence: Android shell traffic could ping over `rmnet4`, but
  the existing ShellMCP queue route to the private Hub address was unreachable;
  no proxy daemon existed and LAN port 3126 was free. The first proxy smoke
  returned 502 because Android shell DNS was empty.
- Change: Added a TDD-tested Go proxy supporting SOCKS5 CONNECT and HTTP
  CONNECT on one TCP listener, with explicit DNS fallback for Android. Added a
  systemd bridge that keeps the Android process alive through ADB, forwards an
  internal port, and selects a free LAN port from 3126 downward. The live
  service is enabled on the LAN bind address with port 3126; heartbeat is not
  involved. UDP is explicitly unsupported because ADB forward is TCP-only.
- Verification: Proxy unit tests passed; full Go ShellMCP `go test ./...`,
  Android arm64 build, `bash -n`, and `git diff --check` passed. Internal ADB
  tests returned HTTP 200 through both protocols. From a LAN client, HTTP
  CONNECT and SOCKS5 both returned HTTP 200; both produced the same masked
  mobile egress while direct server egress was different.
- Delivery: Live Android binary, ADB forward, LAN systemd service, and state
  file are active; selected LAN port is recorded in
  `/etc/gptadmin/android-4g-proxy.env`. Source changes are uncommitted.
- Next: Use a TUN/tun2socks design only if LAN UDP is required.

## 2026-07-22 - Hub Network Tunnel controller - completed

- Milestone: `S2.2`
- Owner: Codex
- Scope: Implement only the Hub network proxy capability controller, dedicated
  proxy-control HTTP routes and Hub tools covered by
  `go-hub/internal/hub/network_proxy_test.go`; do not touch command/relay/shell
  queues, execution, heartbeat liveness, relay sockets, agents/connectors,
  child MCP servers or deployment.
- Baseline / red evidence: Focused RED first failed on the incomplete controller
  wiring and then on missing OpenAPI contract entries.
- Change: Added the Hub-side capability controller with explicit `lan` and
  `internet_egress` scopes, finite leases, profile/agent authorization,
  target-bound one-time client/agent grants, revoke signalling, fail-closed
  persistence and dedicated proxy-control routes/tools. Internet egress also
  rejects CGNAT, TEST-NET, benchmark, documentation and reserved ranges, and
  normalizes IPv4-mapped IPv6 literals before policy checks. The command queues
  and heartbeat liveness remain untouched.
- Verification: `cd go-hub && go test ./internal/hub -run 'Proxy|Network' -count=1`
  and `cd go-hub && go test ./...` passed. `public/openapi.yaml` parsed and
  included all proxy-control paths/schemas; `git diff --check` passed.
- Delivery: Commits `383af8b` (`feat: add Hub Network Tunnel controller`),
  `848cd9a` (reserved-range security fix) and the IPv4-mapped IPv6 policy fix;
  no push, relay deployment or external proxy data-plane in scope.
- Next: Implement the isolated proxy relay and edge-agent transport; keep the
  controller API as the only control-plane dependency.
## 2026-07-22 - Normalize unscoped OAuth client inventory - completed

- Milestone: `S1.4`
- Owner: Codex
- Scope: Keep the React Clients inventory usable when OAuth registrations are
  present alongside managed MCP clients.
- Baseline / red evidence: `oauthClientInventory()` emitted
  `access_mode:""` for OAuth registrations; React rejected that value and
  showed `Сервер вернул некорректный режим доступа клиента.`.
- Change: Hub omits `access_mode` for unscoped OAuth inventory rows and the UI
  normalizes the legacy empty-string response to `null`.
- Verification: React `18 passed`, lint/build passed; Go `go test ./...`
  passed; focused red/green tests cover both the old response and the new
  serialization contract.
- Delivery: Commit `0b921c7` is deployed with build `128`; live Hub inventory
  now omits the empty OAuth mode and the service is active.
- Verification: Authenticated local API smoke returned seven clients, with the
  OAuth row's `access_mode` omitted and managed/legacy rows retaining valid
  modes. Existing admin password was not changed.
- Next: Push the integrated commit and keep the existing admin password stable.
