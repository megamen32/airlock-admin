# Must Up — self-hosted AI workspace

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)
[![Self-hosted](https://img.shields.io/badge/Self--hosted-yes-green.svg)](#)
[![MCP](https://img.shields.io/badge/MCP-compatible-violet.svg)](#)

> **Brand direction: "Must Up"** — picked 2026-09-10, domains under verification.

One AGPL-licensed stack for self-hosted corporate AI: an identity + governance
server (Airlock) and a distributed MCP hub that runs on every employee device
(GPTAdmin). An optional personal-secretary template (ExManager) lives on top
and gives every employee a chat agent that lives in their existing messengers.

---

## What's here

| Layer | What it does | Code |
|-------|--------------|------|
| **Airlock** (server) | Identity, grants, audit, agent runtime, app platform, S3, OAuth server. The "passport". | `airlock/` (vendored fork of [airlockrun/airlock](https://github.com/airlockrun/airlock), AGPL-3.0) |
| **GPTAdmin** (edge) | MCP hub on every machine: shell, file, process, MCP tools with approval flow, peer mesh. The "hands". | `go-hub/`, `go-shellmcp/`, `cli.py` (this repo, AGPL-3.0) |
| **ExManager** (front, optional) | Personal-secretary template: per-employee Telegram bot, PWA web face, mail adapter, reminders, audit. The "face". | Separate repo at [agents-projects/exmanager](https://github.com/megamen32/exmanager) (AGPL-3.0) |

The pieces are independent — you can use just GPTAdmin, just Airlock, or
both together. The cross-product integration (airlock as identity + governance
plane, GPTAdmin as the edge execution plane) is the recommended deployment.

## Where to start

| You are... | Read this |
|------------|-----------|
| Founder / product lead | **[PRODUCT_VISION.md](./PRODUCT_VISION.md)** — strategic plan, MVP slice, personas, business model, open decisions |
| Operator / devops | **[AIRLOCK_ADMIN.md](./AIRLOCK_ADMIN.md)** — current operational runbook, hardening notes, deployment lessons |
| GPTAdmin user / contributor | **[gptadmin docs](https://gptadmin.bezrabotnyi.com)** and `go-hub/`, `go-shellmcp/` here |
| Airlock user | **[airlock docs](https://airlock.run/docs/)** and `airlock/docs/` here |

## Quickstart

This repo is the integration tree. Pick the product you want:

```bash
# GPTAdmin hub (any host with Python 3.10+)
curl -s https://raw.githubusercontent.com/megamen32/gptadmin_opensource/main/deploy/install.sh | bash

# Airlock server (Linux with Docker + Go 1.26+)
git clone https://github.com/megamen32/airlock-admin.git
cd airlock-admin/airlock
cp .env.dev.example .env
make dev   # see AIRLOCK_ADMIN.md for production
```

Live public demo: **https://airlock.bezrabotnyi.com** (login is email + password).

## Provenance

- `airlock/` — vendored subtree-merge of [airlockrun/airlock](https://github.com/airlockrun/airlock) @ v0.6.3 (2026-09-03), AGPL-3.0, © Oleg Karpov. Full upstream history preserved: `git log --oneline --graph -20`.
- Everything else — original work, AGPL-3.0, © the project owners.

To refresh the vendored airlock copy (preserves local history):

```bash
git remote add airlock https://github.com/airlockrun/airlock.git   # once
git subtree pull --prefix=airlock airlock main
```

## License

**AGPL-3.0-or-later** for every component. See [LICENSE](LICENSE).

The core (identity, governance, MCP hub, shell agent, the personal-secretary
template, the basic web panels) stays free and open-source forever. Commercial
add-ons (hosted cloud, enterprise SSO/audit/RBAC, advanced panels, support)
will live in separate repos under their own licenses — the AGPL core is not
encumbered.

## Contributing

PRs welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for dev setup, code
style, and the PR process. For security issues see [SECURITY.md](SECURITY.md).

## Links

- 🌐 GPTAdmin website & docs: https://gptadmin.bezrabotnyi.com
- 🌐 Airlock website & docs: https://airlock.run
- 📦 Issue tracker: this repo's GitHub Issues
- 💬 Discussion: see project owners' contacts in `MAINTAINERS.md` if present, or open an issue
