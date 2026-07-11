# CLAUDE.md — gptadmin

## What this is
Self-hosted MCP hub. Two Go binaries + one Python CLI + vanilla-JS admin UI.
- `go-hub/` — hub/proxy (stores metadata, auth, routes MCP calls). `BuildVersion` via ldflags.
- `go-shellmcp/` — shell execution agent (parity port of the old Python `services/shellmcp.py`, deleted in PR #22).
- `cli.py` — single-file (~3900 lines) Python installer + CLI (`gptadmin setup/update/auto-update/...`). Platform-aware: systemd on Linux, launchd on macOS.
- `public/admin/` — vanilla JS SPA (no framework). `app.js` `renderAll()` reads `/admin/api/overview`.
- `tools/build.sh` — build/release: bumps VERSION, Go ldflags inject version, packages tarballs.

## Commands (copy-paste ready)
```bash
# Go tests (run from each module dir)
cd go-hub && go test ./...
cd go-shellmcp && go test ./...

# Python tests (skip slow e2e)
python3 -m pytest tests/ --ignore=tests/e2e

# Cross-compile check for macOS (we have no Mac in local dev)
cd go-hub && GOOS=darwin GOARCH=arm64 go build ./... && GOOS=darwin GOARCH=amd64 go build ./...

# CLI smoke
python3 cli.py version
python3 cli.py auto-update status

# Full build + release (CI does this; manual is rare)
bash tools/build.sh
```

## Release flow (non-obvious)
- Bump `VERSION` (plain integer) + commit "Release build N" → push `main`.
- `auto-tag.yml` creates `v<N>` tag → dispatches `release.yml` → GitHub Release.
- `build-and-sync.yml` runs tests, builds, syncs binaries to `megamen32/gptadmin_opensource` mirror (needs `OPENSOURCE_PAT`).
- macOS CI: `macos-build` job runs Go tests on `macos-latest` (darwin runtime).

## Gotchas
- **No Mac in local dev.** Darwin launchd/systemd code is cross-compiled on Linux; real-launchd behavior verified by `tests/mac/launchd_verify.py` (skips on Linux, runs on Mac).
- `cli.py` is intentionally single-file — don't split into modules.
- Auto-update service unit is **always installed**; the timer is toggled by user preference. macOS uses `launchctl kickstart` (unified trigger), not nohup.
- `AGENTS.md` carries the same context for non-Claude agents (Codex, etc.) — keep it in sync when architecture changes.

## Style
- Go: follow existing `internal/hub` / `internal/server` patterns.
- Python: f-strings, explicit logging, match surrounding code.
- Admin UI: no build step, no framework — edit `app.js`/`index.html`/`style.css` directly.
