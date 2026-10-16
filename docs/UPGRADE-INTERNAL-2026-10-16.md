# Airlock Internal upgrade target check16Oct2026

Direct user request: update airlock.bezrabotnyi.com and demo.airlockrun.ru to
latest Internal. Version selection remains pending: latest published tag versus
unreleased current main. No runtime changes, service restart or DB migration
performed during this discovery. Existing data/images/keys remain untouched.

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
image3822a815. The target choice must include the matching enterprise frontend
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

Capacity snapshot:100available~29GiB RAM/328GiBdisk,88available~82GiB RAM/
29GiBdemo filesystem. No heavy workload admitted; existing runtime budgets retained.
No source build, backup or switch initiated before the target is selected.
User clarification is pending via native async question; continue after response.
Original assignment and plan remain under .agents/tasks/airlock-marketplace-free-
20261014.md and .planning/quick/261016-mrr-upgrade-private-and-demo-airlock-to-late/PLAN.md.
