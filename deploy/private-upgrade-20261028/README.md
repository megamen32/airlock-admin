# Private Airlock pure upstream upgrade

Target source: airlockrun/airlock-internal release/0.8 d1924f854444a892ec7c71950ffd3aec1af6a3cc. This is an instance deployment, not a product-main merge or an installation of the deferred custom frontend/plugin.

Protected operational material: /home/roomhacker/.local/state/airlock-upgrade/20261028-d1924f85/private-release. It contains original resolved Compose configuration and inspect, final database dump, data/S3/repository/config snapshots and active-run evidence. Never commit that directory or its env/DSN/archives.

The target uses fresh real core15 and enterprise1 migrations and validated selective data transfer. Unsupported Telegram userbot/MCP/orphan closure remains archived in the retained original database and full dump, without authority reassignment. The accepted userbot archive scope is sixteen conversations and1112 messages. Do not renumber source ledgers or silently convert credential/session kinds.

Preserve existing PostgreSQL roles/passwords. Runtime database identity is airlock_app; database owner is airlock. Restore original public/schema/app owner+ACL metadata separately; bootstrap SECURITY DEFINER role helpers retain privileged owner airlock. Do not rerun a bootstrap script that rotates role passwords.

Before cutover, stop ingress/backend and the exact three running containers labeled run.airlock.instance=airlock-dev, then use a final frozen snapshot. Preserve the two running and five suspended source run rows; do not declare them successful or replay them. Upstream stock sweeper settles stale runs as errors, and task queues were checked empty. Start staged with AIRLOCK_BACKGROUND_ACTIONS_PAUSED=true; restore original false only after data/metadata/health gates.

The final resolved Compose preserves all existing environment, network and data mounts, replaces only backend/frontend images, and removes the historical bind on /airlock. Compose config JSON includes escaped literal dollars: do not double-escape it a second time. A roundtrip config comparison must preserve environment and mounts. No legacy --allow-regression deployment script is used.

Rollback before admitting writes: stop ingress/new backend, switch the retained original database back to the original name, restore exact original Compose/runtime binary and frontend, then health-check before ingress. After new writes are admitted, retain current data and reconcile deliberately; never restore an old snapshot over accepted writes.

Installed: pure backend/frontend d1924f85, core15/enterprise1, health200 with PostgreSQL/S3 healthy. Binary SHA and all259 frontend asset hashes match the build artifacts. Staged background pause was removed after health, restoring normal operational policy. Old database retained as airlock_pre_20261028 with connections disabled; rollback must explicitly re-enable it. Current resolved protected configuration: private-release/compose.upstream.private.json. Existing original Compose chain is archived, not replaced in source.

Independent QA: normal account login succeeded and existing ExManager SDK08 QA workspace opened. One new harmless read-only task-list request completed in the persisted global conversation; ten app tool calls succeeded, provider receipt had no errors, and final assistant message persisted. No old UNKNOWN prompt was replayed. UI terminal readback belongs to the independent root verifier.

Remaining app boundary: competitor-analysis is the sole active v2 app. Its bounded SDK0.8 candidate builds/tests successfully; publication has not started because the existing roomhacker session receives source HEAD/GET403 (tenant admin but no app-admin membership). Existing actual app-admin identities and resource grants were preserved; no role/password reset or self-grant was performed. Source archive/candidate/ETag identity stay in protected artifacts. A correctly authorized app-admin login is required for its native one-shot CAS publication.
