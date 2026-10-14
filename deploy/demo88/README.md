# Public Airlock demo on server-88

Final address: https://demo.airlockrun.ru. Authoritative `demo` and `*.demo`
records point to the airlockrun VPS, 31.177.110.230. VPS Caddy preserves the
original Host and proxies HTTPS to `demo.airlock.bezrabotnyi.com`; server-100
nginx terminates this second TLS connection and forwards to 192.168.2.75:43280.
Existing private Airlock and its data are independent.

The official v0.7.0 release runs in a separate rootless Docker owned by
`airlock-demo`, UID 993, socket `/run/user/993/docker.sock`. Runtime archive,
Compose files and private credentials live in `/var/lib/airlock-demo/runtime`.
This is a deployment artifact, not a second Git checkout. `setup-rootless.sh`
owns the dedicated user, subordinate IDs, filesystem mount and budget.
`prepare-runtime.sh` prepares the upstream release and bounded Compose overlay.
`gateway.mjs` is an external adapter; the Airlock core remains official.

Budget, admitted against 94GiB available RAM and 124GiB free disk on 88:
aggregate RAM high8GiB/max12GiB, swap0, CPU4, tasks4096, I/O read128MiB/s and
write32MiB/s, persistent disk48GiB. Host reserves: RAM32GiB/disk20GiB.
BuildKit4GiB/CPU2, Airlock2GiB/CPU2, PostgreSQL1GiB/CPU1,
RustFS1GiB/CPU1, gateway256MiB/CPU1, Caddy256MiB/CPU0.5,
frontend128MiB/CPU0.5. One build at a time; per app memory1GiB. The outer
UID budget applies to all containers together. BuildKit UID0 is namespaced
inside rootless Docker; it has no host-root privileges. This avoids unsupported
nested rootlesskit subordinate-ID maps. Source setup expected180s/emergency1800s.

New visitors obtain separate native user sessions automatically, with HttpOnly
cookies and tenant user role. The broker creates projects as the owner but
grants visitors only the built-in All users membership with role user.
Visitors can chat, upload chat files and create projects; gateway denies other
mutations, including updates, deletion, lifecycle, membership and admin changes.
Creation accepts only name/slug/description/instructions/skipInitialBuild,
uses system model defaults, and never forwards guest Git credentials or ownership.
Limits: two concurrent guest registrations, 256 guests, 32 projects, one create
at a time, 128 proxy connections, 64KiB creation payload. Own AI inference key
has $5/day and $20/week limits, one explicit model route and two sessions.

`Caddyfile.vps-demo` is merged with the existing VPS site. On-demand certificates
are allowed only for the apex, S3 and actual existing `d88-*` project hosts by
the gateway `/_demo/tls` endpoint. This uses native Caddy leaf certificates;
no registrar API or wildcard certificate is required on the VPS.

Operate only the dedicated socket:

```sh
sudo -u airlock-demo env DOCKER_HOST=unix:///run/user/993/docker.sock \
  docker compose -p airlock-demo88 \
  -f /var/lib/airlock-demo/runtime/docker-compose.yml \
  -f /var/lib/airlock-demo/runtime/compose.demo.yml ps
```

`bootstrap.mjs` accepts activation code/provider credentials on stdin inside
the gateway container; never print its input or copy private runtime `.env` or
`owner.json` into a repository. Local private receipts belong in ignored `.tmp`.
