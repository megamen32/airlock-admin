# Metrius OAuth discovery probe

Administrator-only setup app. Native MCPAuthOAuthDiscovery with channels:read, metrics:read, limits:read only. No Telegram bot grants/channel addition/posting, payments, raw public MCP access or public guest membership. POST /probe reads list_channels to determine whether this free account exposes provider demo data. Do not call it connected until meaningful data and guest acceptance are proven. Native OAuth handles token refresh; existing account password is backed up to100 and Yandex.Disk. Standard single4GiB/CPU2BuildKit and1GiBapp. No Airlock core changes.

RESULT 15Oct: native OAuth discovery/DCR and existing-account login succeeded.
Consent explicitly says current Demo tariff excludes API/MCP; /plans has no
free activation. Consent was not approved, no access/refresh tokens issued.
Account + DCR client_id/client_secret backed up plaintext in protected0600
primary/copy100/Yandex.Disk with readback; no new encryption key. Stopped and
removed own disposable setup after source export/main publication. Ordinary
guest confirms404; no empty app remains in library. Restore this source only
when free API entitlement exists, reuse stored client rather than new signup.
