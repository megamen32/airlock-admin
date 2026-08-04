# GPTAdmin CLI Improvement Plan

## Current state
- 2940 lines, single file `cli.py` (mirrored to `cli/gptadmin.py`)
- No ANSI colors — plain text everywhere
- `gptadmin tokens` shows CTL_TOKEN but hides SHELLMCP_TOKEN
- `gptadmin token` (alias) issues NEW tokens, doesn't show existing
- Help text is mix of English/Russian, sparse descriptions
- No `--json` output for scripting
- No `gptadmin version` command
- No `gptadmin doctor` (health check)
- `status` just runs `launchctl list` / `systemctl status` raw

## Plan

### Stage 1 — Colors + formatting (visual foundation)
- Add ANSI color helpers: `c()`, `cprint()`, with auto-detect TTY
- Colors: green=ok, red=error, yellow=warn, cyan=info, dim=muted, bold=title
- Apply to: status output, setup prompts, error messages, token display

### Stage 2 — `gptadmin token` command (user's specific request)
- `gptadmin token` — show ALL tokens (CTL_TOKEN, SHELLMCP_TOKEN, MCP bearers)
- `gptadmin token issue <name>` — issue new MCP bearer (rename from `issue-token`)
- `gptadmin token rotate [hub|shellmcp|mcp]` — rotate
- `gptadmin token --show-shellmcp` — force show SHELLMCP_TOKEN (with warning)

### Stage 3 — `gptadmin version` + `gptadmin doctor`
- `version` — print version from VERSION file + build info
- `doctor` — health check: services running? port listening? config valid? token set?

### Stage 4 — Better `status` output
- Table format with colors: service | status | pid | port
- Show hub URL, tunnel status, agent count
- `--json` flag for scripting

### Stage 5 — Help text polish
- Russian descriptions for ALL subcommands (currently mixed)
- Add `description` to subparsers that lack it
- Group commands logically in help: install, manage, mcp, tunnel

### Stage 6 — `--json` flag for key commands
- `status --json`, `tokens --json`, `mcp list --json`
- For scripting and the web panel

### Stage 7 — Stability
- Wrap all subprocess calls in try/except with readable errors
- Validate config before acting (fail fast with message, not traceback)
- `gptadmin doctor` as pre-flight check before setup

## Execution order
1. Stage 1 (colors) — foundation for everything else
2. Stage 2 (token) — user's explicit request
3. Stage 3 (version + doctor) — quick wins
4. Stage 4 (status) — most visible
5. Stage 5 (help) — polish
6. Stage 6-7 (json + stability) — deeper
