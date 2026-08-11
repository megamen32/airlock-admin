# FRP wildcard TLS and NoticePlace monitoring

Status: work — awaiting exact deployment and producer-credential authorization

## User request

Issue a replacement trusted TLS certificate for the FRP wildcard serving
`*.t.gptadmin.bezrabotnyi.com`, ensure an assigned FRP hostname receives its
own matching certificate and routes to the registered Hub, then configure
NoticePlace to monitor this public TLS/business path.

## Objective and business canary

For the registered `u-f1102930.t.gptadmin.bezrabotnyi.com` endpoint, a strict
public HTTPS request to `/healthz` must both validate the certificate hostname
and return the registered Hub's `200 {"ok":true}`. A NoticePlace monitor must
detect loss of that exact public TLS/health path.

## Scope and exclusions

Owned: FRP ingress diagnosis, certificate renewal/reload if technically
required, hostname-to-proxy routing, and a narrow NoticePlace monitor/check for
the public endpoint. Excluded: Hub code changes, client tokens, VPN, replacing
FRP with Cloudflare, generic fleet-health rollout, Telegram delivery, and
unrelated repository changes.

## Initial control limit

- Minimum / maximum active minutes: 15 / 40 (immutable initial range)
- Started at: 2026-08-11T21:49:01+03:00
- Lifecycle provenance: copied by Lead from the committed todo snapshot before
  monitoring implementation; initial scope unchanged
- Last task-file mtime observed: 2026-08-11T22:03:00+03:00

## Runtime identity

- Harness: Codex desktop
- PID: 1894973
- Agent session: unknown (harness did not expose a stable session id)
- PID status: alive during research
- Last PID signal: subagent research completed at 2026-08-11T22:01:00+03:00
- Last task-file transition: todo -> work at 2026-08-11T22:03:00+03:00

## Read-only research evidence

- Public DNS resolves the assigned endpoint to `95.165.165.65`.
- Strict public canary: `https://u-f1102930.t.gptadmin.bezrabotnyi.com/healthz`
  returns HTTP/2 200 and `{"ok":true}`.
- Its current Let’s Encrypt certificate has SAN
  `u-f1102930.t.gptadmin.bezrabotnyi.com`, issuer `YE1`, and expiry
  `2026-11-06`; no certificate issuance is justified now.
- Nginx terminates the wildcard TLS in
  `/etc/nginx/sites-enabled/t.gptadmin.bezrabotnyi.com` and proxies it to FRPS
  on `127.0.0.1:8079`. `/etc/frp/frps.toml` configures
  `subdomainHost="t.gptadmin.bezrabotnyi.com"` and the same HTTP vhost port.
  `frps.service` and `gptadmin-tunnel-frpc.service` are active.
- Certbot owns renewal through `snap.certbot.renew.timer` and
  `/etc/letsencrypt/renewal/gptadmin-canonical-http.conf`.
- NoticePlace has no discovered generic URL-monitor CRUD endpoint. Its existing
  event path is authenticated `POST /v1/events`; current local health probes do
  not validate an arbitrary public TLS endpoint.

## Proposed bounded implementation

Install a dedicated timer/service which uses strict HTTPS hostname validation,
requires exactly HTTP 200 plus `{"ok":true}`, and emits a deduplicated event to
NoticePlace only on state transition. The producer must obtain its token through
an approved opaque secret/configuration path; no secret is recorded in this
task file.

## Authorization gate

Installing/enabling the systemd monitor is a deployment and begins an outbound
event path. It requires exact human approval and an attested producer-secret
handoff. No service reload/restart, certificate issue, DNS mutation, or event
delivery has occurred.
