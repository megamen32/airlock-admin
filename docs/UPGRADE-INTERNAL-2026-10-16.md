# Airlock Internal: source upgrade preparation, 16 October 2026

Direct user request: update airlock.bezrabotnyi.com and demo.airlockrun.ru to
latest Internal. Human clarified: update from current Internal source, not wait
for a tag. Selected commit0f023c88b6bc6e09d0c5787ad98d4f19a4dfa026.
No live runtime switch, restart or live DB migration performed yet.
Existing live data/images/keys remain untouched; isolated migration preparation
is recorded below.

Authoritative GitHub authenticated API: Internal highest tagv0.7.0 points to
690a90e7bafd781e39c5618f12598e42f5d9c306; there are no GitHub Releases.
Current main0f023c88b6bc6e09d0c5787ad98d4f19a4dfa026 (16Oct11:36:55UTC)
is newer/untagged, still declares Version0.7.0. Published image latest resolves
to the old paired release, not source HEAD. Never call a same-version untagged
HEAD upgrade already installed merely from version.go.

Both running backend image labels match Internal690a90e/v0.7.0. Their rootfs
layers match the live GHCRv0.7.0 image;100uses the amd64 manifest digestc01e71b5,
88imported image IDd2220baa. Different Docker identifiers are not different code.
Both public health endpoints actually returned db=true/s3=true,HTTP200.
This is health and image identity proof, not a fresh business canary.

Private100 frontend is the original community frontendv0.7.0/manifest444240f8,
not the enterprise frontend. Demo88 has enterprise/Russian frontendv0.7.0/
image3822a815. The source target includes the matching enterprise frontend
for a complete Internal distribution; do not substitute public English frontend
for the demo. Existing Russian interface and guest gateway are required.

Current private runtime:airlock-airlock-1/airlock-frontend-1 with four absolute
Compose overlays under exmanager/var/20261014-original-runtime-recovery/
docker-runtime-v4. Canonical contract is exmanager/docs/airlock-original-docker.md.
Legacy airlock.service inactive/disabled. Fixed stale wrapper instructions that
incorrectly named it the current backend; old native prerelease updater not run.
Main underlying Compose/DB/S3/activation/app volumes untouched.

Unreleased HEAD has substantial schema changes, including012_platform_runtime.sql
(49CREATE TABLE statements) and013_platform_backfill.go. Inspect upstream upgrade
contract and verify backup/migration on demo before private instance if selected.
Latest CI run38894945247 reports failure; individual go/fmt/executor/enterprise
frontend jobs succeeded, migrations/hq-full lack final conclusions. This does
not establish a specific functional defect and must not be described as one.

Capacity before source build:100available~29GiB RAM/328GiBdisk,88available~82GiB
RAM/29GiBdemo filesystem. Existing live budgets retained. Dedicated rootless
BuildKit4GiB/CPU2/tasks1024, swap0, one component at a time, expected900/max9000s,
32MiB log/component, demo filesystem floor20GiB. All five images completed
in1064s; healthy progressing build was not stopped at its estimate.
Original assignment and plan remain under .agents/tasks/airlock-marketplace-free-
20261014.md and .planning/quick/261016-mrr-upgrade-private-and-demo-airlock-to-late/PLAN.md.

## Built candidate, not installed

Five official Docker recipes built from the same fixed Internal source, without
changing core or modules: SDK v0.8.1-alpha.12, GoAI v0.3.2, Sol v0.1.18.
Enterprise frontend includes Russian. Dedicated rootless daemon on88 holds:

| Component | Local image | Verified image SHA256 prefix |
|---|---|---|
| Core | airlock-internal-core:0f023c8 | ed34fc17a4fa |
| Enterprise frontend | airlock-internal-frontend:0f023c8 | f7f2d34f1bc1 |
| Builder | airlock-internal-builder:0f023c8 | cbf7d56b072a |
| Base | airlock-internal-base:0f023c8 | 0fd434486cf8 |
| JS executor | airlock-internal-executor:0f023c8 | f220e42d5e2b |

Remote owned receipts: `/var/lib/airlock-demo/runtime/.upgrade-0f023c8/`.
No component has been substituted into the live service yet. Current code
automatically rebuilds apps when SDK changes; retained sources and admitted
receipts must survive that process. A version string or successful image build
is not user acceptance.

## Private100: verified pre-existing migration boundary

Live ledger includes custom applied12–16, ending6October; actual public schema
has97tables and no new platform schema. Existing custom source filenames include
012_codegen_limits_and_stateless_mcp,013_userbot_inbox,014_userbot_bridge_type,
015_userbot_group_origins,016_userbot_owner_group_origins. They are not the new
official012_platform_runtime/013_platform_backfill. Original startup explicitly
refuses ledgers above13; do not relabel or erase these migrations blindly.

Follow the candidate's `docs/development-migrations.md`: compare complete
catalog/data against a disposable official013 schema; reconcile deliberately
with backups and preserved history. New012/013 are irreversible; rollback
requires matching database/source/object backups, not merely an old image.

## Private100: S3 recovery boundary is intentional

Real authenticated ListObjects against both configured S3_URL:4281 and public
endpoint returns503 `Storage recovery incomplete`. Local stock RustFS:42900
returns an empty bucket; that is NOT the real preserved object store and must
not replace it. Process5776 is the existing recovery overlay gateway from
ServersAdministartion/ops/airlock-storage-recovery/overlay_gateway.py.

Its canonical README records98knownobjects/82recovered/16missing as the recovery
baseline. These counts are historical catalog facts, not a fresh all-object
recovery audit. Full listings containing missing keys intentionally fail503;
known object reads/new PUTs may still operate. No defect in this guard is proven
and no storage route/key/data was changed. Official013 file inventory needs
complete storage; use the existing storage recovery owner/catalog, preserve
missing-object evidence, and never pretend the empty RustFS is recovery.

## Demo88: isolated migration preparation

Latest source dump and read-only app-source snapshot are prepared in an owned
staging directory; original live core/database remain running. Real original
S3 inventory returned0objects/0bytes. An isolated operator bucket
`airlock-upgrade-0f023c8-stage` is used for source-pack publication by the
original migration, never the live bucket. Migration-only helper invokes
original db.RunMigrations; it starts no server, prompt worker, rebuild or
pruning loop. Stage result is recorded after actual completion.

### Actual isolated result, 16 October 21:47 MSK

Original db.RunMigrations completed successfully on the real restored demo DB
and source snapshot in16seconds, ledger011→013. Imported20retained apps and
64source revisions/64source packs into the isolated stage bucket. A first clone
run failed before version012 because CREATE privilege on the newly created
clone DB had not been copied. Original live DB grants were then copied to the
clone (live grants unchanged); ledger remained011 before retry. This was a
staging-setup defect, not evidence of an upstream migration defect. Both
attempt logs/receipts retained, no source publication had occurred on the first
failed attempt.

Actual row-count comparison covered220pre-existing tables/views against the
restorable dump. The migration added two ledger rows and exposed old shared
history through system_conversations/system_messages views (12/54rows).
Other existing counts retained; this is count preservation, not a full
field-by-field audit or live guest acceptance. New source refs and credential
values were never printed. Exited migration containers and stage DB/bucket
remain operator-owned checkpoints; no running extra service/browser is left.

Live installations remain on the old images. Required remaining work:
- Distribute the paired private runtime images through a supported registry
  available to both Docker and rootless BuildKit; bare local tags cannot be
  assumed resolvable by remote BuildKit for future app builds.
- Back up current live state at cutover, migrate demo, rebuild SDK apps within
  the existing one-build budget, verify real guest forms/chat/Russian UI and
  all guest denials. No successful source build or stage migration substitutes
  for these checks.
- Private100 additionally needs deliberate legacy-schema reconciliation and
  the existing incomplete-object recovery resolved for original013 inventory.
  No fake empty catalog, guard removal or live ledger edit is authorized as
  a shortcut. Preserve the storage recovery owner's catalog and originals.
