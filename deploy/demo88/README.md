# Public Airlock demo on server-88

Final address: https://demo.airlockrun.ru. Authoritative `demo` and `*.demo`
records point to the airlockrun VPS, 31.177.110.230. VPS Caddy preserves the
original Host and proxies HTTPS to `demo.airlock.bezrabotnyi.com`; server-100
nginx terminates this second TLS connection and forwards to 192.168.2.75:43280.
Existing private Airlock and its data are independent.

The official Airlock Internal v0.7.0 release runs in a separate rootless Docker owned by
`airlock-demo`, UID 993, socket `/run/user/993/docker.sock`. Runtime archive,
Compose files and private credentials live in `/var/lib/airlock-demo/runtime`.
This is a deployment artifact, not a second Git checkout. `setup-rootless.sh`
owns the dedicated user, subordinate IDs, filesystem mount and budget.
`prepare-runtime.sh` prepares the upstream release and bounded Compose overlay.
`gateway.mjs` is an external adapter; the Airlock core remains official.

Source: private `airlockrun/airlock-internal`, revision
`690a90e7bafd781e39c5618f12598e42f5d9c306`. Both official backend and frontend
image labels must match this revision. The frontend is specifically
`ghcr.io/airlockrun/airlock-enterprise-frontend:v0.7.0`, containing the upstream
English/Russian catalogs from `enterprise/frontend/src/i18n/`. Persisted
`settings.uiLocale=ru` makes Russian the instance default, including a fresh
visitor with an English browser. The community frontend contains only English
and is not an acceptable fallback. Private source/translations stay out of this
public operations repository. Follow `enterprise/README.md` in the shared
Internal repository: authenticate on100, pull the private frontend, then
`docker save | ssh ... docker load` into the dedicated88 socket without copying
registry credentials. Verify the immutable image digest and labels after loading.

Budget, admitted against 94GiB available RAM and 124GiB free disk on 88:
aggregate RAM high8GiB/max12GiB, swap0, CPU4, tasks4096, I/O read128MiB/s and
write32MiB/s, persistent disk48GiB. Host reserves: RAM32GiB/disk20GiB.
BuildKit4GiB/CPU2/cpuset0,1, Airlock2GiB/CPU2, PostgreSQL1GiB/CPU1,
RustFS1GiB/CPU1, gateway256MiB/CPU1, Caddy256MiB/CPU0.5,
frontend128MiB/CPU0.5. One build at a time; per app memory1GiB. The outer
UID budget applies to all containers together. BuildKit UID0 is namespaced
inside rootless Docker; it has no host-root privileges. This avoids unsupported
nested rootlesskit subordinate-ID maps. Source setup expected180s/emergency1800s.
The build cpuset also bounds Go compiler parallelism on this 88-core host;
CPU quota alone allowed compiler process fan-out to exhaust the task limit.

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

## Verified delivery, 14 October 2026

Authoritative ns1.reg.ru returns31.177.110.230 for demo and wildcard. Public
HTTPS and the encrypted VPS/home connection pass. Official Internal enterprise
frontend package digest902ea8f94afe743b59ec20f677b349ed31fb51376f8c7143f3fd3c35d9f00639
is transferred without registry credentials; runtime source/revision labels match
690a90e7. Headed Chrome on88 enters without password; document language ru,
Russian navigation, no persistent browser credential keys. A native guest-created
«Стартап-навигатор» was generated, built and deployed successfully in198 seconds.
Five real guest mutations (rename, delete, membership elevation, settings, stop)
return403; persisted name and user membership remain intact. Unknown app hosts
are denied by the TLS admission endpoint. No fake transport or AI was used.

Foreign wrapper changes/branch and infrastructure WIP are preserved. Delivery
uses a separate temporary Git index based on origin/main and a scoped remote
commit; no branch switch, new checkout, stash or foreign staging is involved.
