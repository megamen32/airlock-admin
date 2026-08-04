# Roadmap

What's built, what's coming, and the open-core split.

## Status today

### ✅ Built and working

- **Hub** (`go-hub/`) — MCP remote SSE, admin API, OAuth, web panel
- **ShellMCP** (Go + Python) — agent for Linux/macOS/Windows
- **Three adapters**:
  - MCP client (Claude Desktop, Codex, OpenCode)
  - Browser extension (userscript for free web AIs)
  - OpenAI Action (Custom GPT, Open WebUI)
- **CLI** (`gptadmin`) — setup, tunnel, status, logs, config
- **Tunnels** — FRP + Cloudflare auto-tunnel
- **Web panel** (`/admin`) — queue, agent health, logs
- **OAuth** for OpenAI SDK
- **Install scripts** for Linux/macOS/Windows (user + system mode)
- **Background tasks** with polling
- **Output truncation** (saves tokens)
- **Managed file backups** with TTLs

### 🚧 Next

- **Advanced web panel** — teams, RBAC, alerting, and richer audit-log export
- **Hosted cloud** — don't want to self-host? A managed cloud option is planned
- **Enterprise SSO** — SAML, OIDC, SCIM provisioning
- **MCP marketplace** — browse and install MCPs (openmemory, chrome-devtools,
  custom) from the panel
- **More adapters** — Slack, Discord, Telegram bots as first-class adapters

## Open-core model

GPT‑Админ is **open-core** under AGPL-3.0.

### Free forever (this repo)

- The hub, shellmcp, all three adapters
- Basic web panel (queue, health, logs)
- All CLI commands
- All tunnels
- Community support (GitHub issues, Discussions)

### Will be paid (separate repo / cloud)

- Hosted cloud (managed hub, no self-hosting)
- Enterprise SSO (SAML/OIDC) + SCIM
- Advanced RBAC (roles, per-agent permissions)
- Extended audit log + SIEM export
- SLA + priority support
- Advanced panel (team dashboards, alerting, analytics)

The core stays open. Paid features are additive — never paywalling existing
functionality.

## Versioning

GPT‑Админ follows [SemVer](https://semver.org/). See the
[CHANGELOG](https://github.com/megamen32/gptadmin/blob/main/CHANGELOG.md) for
release history.

- `0.x` — pre-1.0, breaking changes possible between minor versions
- `1.0` — first stable release
- `1.x+` — backward-compatible additions

## Contributing

PRs are welcome — see the
[contribution guide](https://github.com/megamen32/gptadmin/blob/main/CONTRIBUTING.md).
Good places to contribute:

- More test coverage (tunnels, MCP-SSE, CLI)
- Documentation improvements
- New MCP integrations (write an MCP that wraps your favorite tool)
- Packaging (Homebrew formula, AUR package, Scoop manifest)

## See also

- [Architecture](./ARCHITECTURE.md) — how it's built
- [CHANGELOG](https://github.com/megamen32/gptadmin/blob/main/CHANGELOG.md) — what changed
