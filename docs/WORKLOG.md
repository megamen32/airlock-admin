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

## 2026-07-14 - Live auth transition and read-only verification - active

- Milestone: `S2.1`, `S2.3`
- Owner: Codex with auth, deploy and redaction review agents
- Scope: Verify the configured public Hub, restore the documented CTL migration path, make managed Client/Auth inventory usable, and prove ShellMCP read-only plus model-output redaction at the real MCP boundary.
- Baseline / red evidence: Public admin currently serves a login page whose visible contract still references Bearer CTL; unauthenticated MCP returns `401`; the supplied client confirmation preview exposes API-key/password-looking values before execution.
- Change: Investigation in progress; no runtime claim is accepted from local CI alone.
- Verification: Pending live authenticated black-box checks with secret-safe output.
- Delivery: Not deployed.
- Next: Integrate agent findings, add failing regression tests, deploy the configured Hub, and verify admin inventory, legacy CTL access, redaction and read-only behavior live.

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
