# GrepMesh recovery architecture and indexed backend implementation

Role: Worker
Status: work

## Objective

Read-only audit commit `e70dffd` against the user's original GrepMesh acceptance contract. Identify the smallest code/config changes needed for a real two-node server-100/server-88 vertical slice: artifact/service naming, indexed backend with watcher/reconciliation and `rg` fallback, peer fan-out/cache, roots/excludes, and MCP/runtime tool boundaries.

## Explorer-owned reconnaissance scope (completed)

- Read-only reconnaissance of `/home/roomhacker/gptadmin/grepmesh`, related tests/docs, and current task evidence.
- Explorer result: commit `e70dffd` is rg-only; no functional index/watcher/reconciliation exists.

## Explorer acceptance/report

Append exact file/line evidence, missing contracts, minimal proposed change set, and focused canary commands. Explorer completed without `NEEDS_REDECOMPOSITION`.

## Budget

Explorer, low effort, 20 / 40 / 80 active minutes, relative cost low.

## Worker continuation

- Owned paths: `grepmesh/src/index.rs`, `grepmesh/src/backend.rs`, `grepmesh/src/config.rs`, `grepmesh/src/server.rs`, `grepmesh/src/lib.rs`, `grepmesh/Cargo.toml`, and focused GrepMesh tests only.
- Implement a bounded primary trigram candidate index with background initial/reconciliation scan and filesystem watcher; literal/case-insensitive literal searches may use candidates plus file verification, while regex and index-unready/corrupt paths use bounded `rg` fallback.
- Expose truthful index state/generation/file counts in `search_status`; preserve named-root and exclude semantics.
- Add red-first focused tests for index candidate correctness, update/delete watcher behavior, fallback, and root/exclude application. Do not deploy or edit unrelated files.
- Worker acceptance: focused tests pass, `cargo fmt --check`, `cargo clippy -D warnings`, and no claim of production readiness.

## Worker correction after review

- The first implementation only rescanned file counts every two seconds; that is rejected as `CHANGES_REQUIRED`.
- Replace it with a real in-memory trigram-to-path candidate map and per-file metadata/content verification, `notify` event handling, and periodic reconciliation. Do not retain a tight polling loop as the watcher.
- Start by adding red tests that prove a literal search uses indexed candidates, a changed/deleted file is reflected after the watcher/reconciliation event, and regex/unready mode falls back to `rg`. Keep `rg` fallback bounded and preserve all configured root/exclude globs.

## Explorer evidence and result — 2026-08-11

### Finding

Commit `e70dffd` is a coherent rg-native temporary mesh, not the requested indexed production vertical slice. `LocalBackend::status` reports `backend: "rg"` and no index state (`grepmesh/src/backend.rs:177-194`), while every local search starts a new `rg` process (`grepmesh/src/backend.rs:389-432`). The `IndexState`/index metadata types (`backend.rs:51-79`) are inert; there is no index store, watcher, reconciliation loop, or persisted per-root state in `grepmesh/src/`. README confirms the deliberate rg-only design (`grepmesh/README.md:20-24,34`).

### Exact gaps and smallest changes

1. Artifact/service naming is broken: Cargo package `grepmesh/Cargo.toml:1-5` produces `grepmesh`, while `grepmesh/grepmesh-mcp.service:8` executes `/usr/local/bin/grepmesh-mcp`. Add an explicit canonical `grepmesh-mcp` binary/install receipt (or align all names to `grepmesh`) and make unit, checksum, and canary use it.

2. The indexed backend is absent. `LocalBackend` owns only roots, limits, and excludes (`backend.rs:131-159`); search invokes `search_text_impl`/`rg` (`backend.rs:235-285,389-432`). Add per-root persistent snapshots, bounded initial reconciliation, filesystem watcher, periodic reconciliation, atomic persistence, real status generation/count/error, and `rg` fallback for missing/stale/corrupt/unsupported index or verification failure. Cover create/modify/remove, restart reload, corruption recovery, and fallback.

3. Roots/excludes exist but need deployment and read threading. Named roots are configured and restricted to absolute paths (`backend.rs:161-175`, `config.rs:105-127`), with credential excludes (`config.rs:12-55`); however `read_text` always validates against `selected_roots(&[])` (`backend.rs:344-352`). Pin `/home/roomhacker`, `/opt`, `/etc` in the two-node configs, preserve defaults, thread selected root through reads, and test escape/secret exclusion.

4. Peer fan-out/cache is present: omitted hosts default to `*` and peer hops are local-only (`grepmesh/src/mcp.rs:115-159`); startup/periodic topology refresh retains cache/static peers on failure (`grepmesh/src/server.rs:48-128`). Hub is correctly control-plane-only and direct peer URLs carry search/read (`go-hub/internal/hub/grepmesh_topology.go:10-12,85-87`). Missing is the real server-100/server-88 deployment manifest/records, routable URLs, equal roots, cache read-back, and installed peer-unavailable `partial=true` canary.

5. MCP boundary is narrow and suitable: four tools are registered (`grepmesh/src/server.rs:202-220`), and topology is read-only. The separate runtime/domain-to-source diagnostic capability requested by product recovery is absent and must be specified identically on both nodes, outside file search and Hub topology.

### Focused canaries and result

Build/test the exact release artifact and SHA-256; install both units and verify local `127.0.0.1:9419/mcp` plus routable peer listeners; with an independent MCP client from each node omit `hosts`, find both canaries, read the remote file, stop one node, and capture local results with `partial=true`; query `search_status` for index generation/state and cache; run the same runtime domain-to-source diagnostic from both agents.

The architecture is resolvable; no `NEEDS_REDECOMPOSITION` is required. Deployment is not ready: artifact naming and the primary indexed backend are hard blockers; production topology/installation and the separate runtime diagnostic seam remain unimplemented. No source, service, host, or credential was mutated.

## Worker progress — 2026-08-11

Implemented the bounded local backend/artifact slice in the assigned paths:

- `grepmesh/Cargo.toml`: added explicit `grepmesh-mcp` binary target.
- `grepmesh/src/index.rs`: added a background bounded filesystem reconciliation
  manager with atomic in-memory status snapshots, generation, file count, and
  degraded error reporting.
- `grepmesh/src/backend.rs`, `grepmesh/src/lib.rs`: attached index lifecycle and
  truthful `indexed+rg-fallback` status metadata while retaining current `rg`
  search as the correctness fallback.
- `grepmesh/tests/mesh.rs`, `grepmesh/tests/search_modes.rs`: updated focused
  artifact/status expectations.

Red-first evidence: the new status regression failed before implementation with
`left: "rg"`, `right: "indexed+rg-fallback"`. After implementation:

- `cargo fmt --manifest-path grepmesh/Cargo.toml -- --check` passed.
- `cargo clippy --manifest-path grepmesh/Cargo.toml --all-targets -- -D warnings` passed.
- `cargo test --manifest-path grepmesh/Cargo.toml --all-targets` passed: 5 unit,
  5 mesh, 6 search-mode, and 10 topology-cache tests.

Remaining limitation: this bounded slice reports/reconciles index state and
keeps `rg` as fallback, but does not yet use trigram candidates to accelerate
literal searches or provide event-driven `notify` watching; the background
reconciliation interval is the safe current mechanism. No deployment,
restart, credential, or unrelated file change was made.

## Worker continuation — 2026-08-11

Added `notify = "6"` and replaced the tight polling loop in
`grepmesh/src/index.rs` with a real recursive filesystem watcher plus periodic
30-second reconciliation. The index now stores a trigram-to-path candidate
map and exposes `candidate_paths`; create/delete watcher behavior is covered by
`search_modes.rs::index_candidates_reconcile_create_and_delete`.

The first attempt to make `search_text` constrain `rg` to indexed candidates
caused the existing black-box mesh canaries to lose local results during the
index startup/event race. I reverted that call-site integration to preserve
correctness; `rg` remains the active search path while the candidate-map API
and watcher are validated. This is an explicit remaining implementation gap,
not a production-readiness claim.

Verification after the continuation:

- `cargo fmt --manifest-path grepmesh/Cargo.toml -- --check` passed.
- `cargo clippy --manifest-path grepmesh/Cargo.toml --all-targets -- -D warnings` passed.
- `cargo test --manifest-path grepmesh/Cargo.toml --all-targets` passed: 5 unit,
  5 mesh, 7 search-mode, and 10 topology-cache tests.
