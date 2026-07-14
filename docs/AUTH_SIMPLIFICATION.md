# One-password authentication and product-language plan

## Decision

GPTAdmin presents one user-owned secret: `AdminPassword`.

Users must not copy, rotate or distinguish `CTL_TOKEN`, shell tokens, relay
tokens, bridge keys or JWT signing secrets. Those are implementation details
and must disappear from normal setup, update, status, UI and quickstart flows.

This document is the target contract for a deliberate breaking migration. It
does **not** claim that the current multi-token implementation has already been
removed.

## Security model

`AdminPassword` authenticates a human. It must not be reused as a JWT signing
key or distributed to clients and agents.

At initial setup, GPTAdmin must:

1. Prompt once for `AdminPassword` without echoing it and store only a strong
   password verifier.
2. Generate non-exported internal signing and encryption keys with restrictive
   filesystem permissions.
3. Use the password only to create an admin session or approve a connection.
4. Issue short-lived, signed JWTs with explicit `sub`, `aud`, `scope`, `iat`,
   `exp` and key identifier claims. Validate all of them on every request.
5. Keep renewal credentials device-bound and non-exported. A client or agent
   never receives the administrator password.

This gives the user one thing to remember without weakening separation between
human login, Hub access, MCP client access and agent-to-Hub transport.

## User flows

### Setup and update

The visible flow is one idempotent command:

```bash
curl -fsSL https://<download-host>/install.sh | sh
```

The command installs on a new host and safely updates an existing installation.
It asks only for `AdminPassword` when needed, shows a Hub URL and finishes with
a health check. Platform detection, service management, package architecture
and tunnel implementation remain internal.

### Connect an MCP client

The operator chooses **Connect Codex**, **Connect Claude** or **Connect custom
client** from the Hub. GPTAdmin drives OAuth Authorization Code + PKCE or a
short-lived one-time connection code. The operator approves requested scopes;
they do not copy a bearer token into a terminal or web form.

For non-interactive automation, the Hub issues a named, scoped, expiring JWT
through an explicit admin-approved flow. It must show audience, scopes and
expiry before issuance, and store the credential only where the client needs
it. Raw JWT display is an advanced, deliberate export action.

### Connect an AirShell agent

An agent joins through a short-lived pairing code or a Hub-initiated local
setup flow. Pairing creates a device-bound identity and renewable least-
privilege JWTs. The user sees agent name, host, allowed capabilities and
expiry policy, not a `SHELLMCP_TOKEN` or relay token.

### Admin UI

The browser signs in with `AdminPassword`, receives a secure session and
manages connections by name, scope, expiry and revocation. It never offers a
field for `CTL_TOKEN` or an internal signing secret.

## Canonical language

| Say | Avoid on product surfaces | Advanced detail only |
| --- | --- | --- |
| Hub | control plane, relay endpoint | protocol internals |
| MCP client | bearer client, token consumer | OAuth/JWT claims |
| Tunnel | FRP, frpc, Cloudflare connector | deployment/troubleshooting docs |
| Connect | issue token, paste Bearer | advanced automation export |
| Admin password | CTL token, hub secret | legacy migration diagnostics |
| Agent | shell token, heartbeat credential | device identity protocol |

`FRP`, `frpc`, transport headers and internal credentials remain accurate in
architecture and advanced troubleshooting documentation, but are never the
first vocabulary shown to an operator.

## Migration phases

### Phase A - Inventory and compatibility boundary

- Enumerate every `CTL_TOKEN`, `SHELLMCP_TOKEN`, relay token, bridge key and
  OAuth secret surface in runtime code, installer, generated units, client
  configuration, API/OpenAPI, admin UI and docs.
- Define the supported legacy window and emit a single actionable migration
  notice. No silent dual-auth fallback remains after the window.
- Add black-box tests proving a new installation exposes no raw token in normal
  output, status or UI.

### Phase B - New issuer and explicit authorization

- Add password verifier, encrypted internal key store, JWT key rotation and
  standard OAuth discovery/PKCE flows.
- Bind JWT audience to each Hub/MCP resource and validate scope, expiry and
  audience at every protected endpoint.
- Add policy decisions for admin, MCP client and agent identities; deny by
  default when scope is absent.

### Phase C - Connection UX

- Replace manual token commands and form fields with named connections,
  approval pages and pairing codes.
- Make installer/update idempotent and present only Hub, Tunnel, health and
  next client connection.
- Replace product-facing FRP terminology while retaining an advanced tunnel
  diagnostic view.

### Phase D - Legacy removal

- Remove `CTL_TOKEN` authentication, query-token support and static agent
  bearer configuration from default paths.
- Delete deprecated CLI token commands and environment variables after the
  documented migration window.
- Prove the removal with contract, installer, browser and AirShell black-box
  tests; run a clean install, upgrade and rollback drill.

## Required acceptance tests

- Fresh setup asks for one password and prints neither a raw admin token nor a
  signing secret.
- An admin session can connect a supported MCP client through PKCE without
  manual bearer-token copying.
- JWTs with wrong audience, missing scope, expired `exp`, malformed signature
  or a revoked device identity are rejected.
- A normal AirShell pairing flow requires no token copied by the operator.
- `gptadmin doctor` uses plain language and reports Hub, MCP clients and Tunnel
  states; advanced diagnostics can reveal implementation detail only to an
  authenticated administrator.
- Upgrade from a legacy installation retains service availability, migrates
  client connections deliberately and removes the deprecated secret only after
  confirmation.

## Non-goals

- Do not make every service share one JWT or one audience.
- Do not use a human password as a symmetric signing key.
- Do not retain a permanent broad-scope bearer token merely for convenience.
- Do not hide a security-relevant consent decision behind a generic setup step.
