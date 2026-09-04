# Schema validation opt-in

Status: reviewed and verified — awaiting unified commit, rebase, and push

Started at 2026-09-04T16:03:30+03:00 (manual clock)
Estimate: minimum 60 active minutes; maximum 180 active minutes.

## Minimal path

1. **Result:** schema version/digest admission is an explicit opt-in and disabled by default.
2. **Canary:** a stale-metadata relay call completes with the default configuration, while the same call is rejected only with `GPTADMIN_SCHEMA_CONTRACT_VALIDATION=true`.
3. **Slice:** gate the existing validation at both Actions and MCP call paths with one boolean configuration field and focused regression tests.

Discarded: removing schema discovery metadata, relay redesign, authentication changes, and unrelated cleanup.

## Unified-history release route

- User requested a self-review of the complete intended GPTAdmin change set, one linear history, and push.
- `main` is 3 commits ahead and 59 commits behind `origin/main`; the safe route is review/test the current intended sources, commit coherent changes, rebase on `origin/main`, repeat affected checks, then push.
- Temporary builds, clones, dependency caches, and test outputs under `.tmp/` are not source artifacts. The repository must ignore that directory rather than attempting to publish it.
- Full checks now pass: Hub and ShellMCP Go suites; Admin UI tests/lint/build; root docs and Hub-process contracts; website production build; and GrepMesh Rust tests. The docs public mirror was regenerated from its canonical sources. A GrepMesh black-box test was isolated from host runtime settings, which made the full suite deterministic.
