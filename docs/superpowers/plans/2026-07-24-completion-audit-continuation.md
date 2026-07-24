# GPTAdmin Completion Audit Continuation Implementation Plan

> **For agentic workers:** Execute the tasks inline on the existing integration branch; do not create a parallel worktree or branch.

**Goal:** Finish and verify the remaining GPTAdmin platform gates while preserving one linear, merge-ready vertex.

**Architecture:** Treat `docs/PROJECT_PLAN.md` as the requirement inventory and `tests/fixtures/completion-matrix.json` as the executable evidence index. Each missing behavior gets a failing black-box or runtime regression first, then the smallest implementation in the existing Hub/CLI/ShellMCP boundaries; integration, deploy and native-platform evidence remain distinct from local proof.

**Tech Stack:** Go Hub/ShellMCP/ProxyRelay, Python CLI/tests, vanilla production admin UI, OpenAPI YAML, Docker acceptance fixtures, GitHub Actions.

## Global Constraints

- Keep all implementation on `codex/haos-addon-public`; preserve the unrelated untracked remote-secret plan.
- Use product vocabulary Hub, MCP clients and Tunnel; do not expose internal credential names in normal user surfaces.
- New behavior uses TDD and must be covered by focused and matrix tests.
- Never persist or return raw request arguments, tokens, passwords, workspace contents or telemetry payloads.
- Do not claim native CI, deploy, public publication or clean-host restore from local synthetic tests.

### Task 1: Close the in-progress activation telemetry slice

**Files:** `go-hub/internal/hub/telemetry.go`, `go-hub/internal/hub/telemetry_test.go`, `go-hub/internal/hub/server.go`, `tests/fixtures/completion-matrix.json`, `docs/PROJECT_PLAN.md`, `docs/WORKLOG.md`.

- [x] Write and run the failing opt-in/persistence regression.
- [x] Implement local-only bounded counters and restrictive persistence.
- [ ] Run Hub full/race/vet, Python suite, completion matrix and inspect diff.
- [ ] Close the active worklog entry and commit the linear slice.

### Task 2: Audit and close remaining Stage 1/2 client and MFA gaps

**Files:** `go-hub/internal/hub/connection_page.go`, `go-hub/internal/hub/security_settings.go`, `public/openapi.yaml`, `docs/AUTH_SIMPLIFICATION.md`, `docs/PROJECT_PLAN.md`.

- [ ] Verify the canonical connection manifest against each Codex, Claude-compatible and ChatGPT-style golden path; keep local auto-configuration evidence separate.
- [ ] Add only test-backed MFA recovery/passkey or external-verification behavior that can be implemented without exposing secrets; otherwise record the exact external dependency as an open gate.
- [ ] Add focused black-box tests and update plan status only from evidence.

### Task 3: Re-run the complete platform acceptance ladder

**Files:** `tests/fixtures/completion-matrix.json`, `tests/test_completion_matrix.py`, `tests/e2e/`, `docs/WORKLOG.md`.

- [ ] Run proxy, endpoint, webhook, MCP forwarding, file sharing, profile and policy rows.
- [ ] Run Go/Python race, vet, Darwin cross-build, Docker installer and failover E2E where available.
- [ ] Record skipped native/deployment lanes with exact proof gaps rather than substituting local builds.

### Task 4: Final completion audit and handoff

- [ ] Compare every requested surface and every non-Complete `PROJECT_PLAN` row with an authoritative test/runtime artifact.
- [ ] Fix actionable bugs found during the audit before handoff.
- [ ] Commit all intended changes on the single branch; leave only the known unrelated untracked plan.

### Task 5: Add a verified configuration backup/restore contract

**Files:** `cli.py`, `tests/test_backup_restore.py`, `docs/PROJECT_PLAN.md`, `docs/WORKLOG.md`.

- [ ] Write a failing test that creates a temporary config directory with an env file and JSON state, runs backup creation, verifies the archive manifest and rejects a path-traversal archive member.
- [ ] Implement `gptadmin backup create <archive>` and `gptadmin backup verify <archive>` using a deterministic manifest with relative paths, byte sizes and SHA-256 digests; preserve restrictive modes and never print file contents.
- [ ] Implement `gptadmin backup restore <archive> <target>` with an explicit target directory, traversal/symlink rejection, atomic extraction and post-restore digest verification.
- [x] Run focused Python tests, full Python suite and a clean temporary restore drill; document that live service restart and root ownership remain deployment-specific evidence.
