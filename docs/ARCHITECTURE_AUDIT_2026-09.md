# GPTAdmin architecture audit — 2026-09-05

Scope: task persistence and the split administrator experience. The task-store
change is commit `e158cca`; the unified console is the accompanying UI change.
Production Hub services were not restarted during this work.

## Fixed and verified

| Problem | Implementation | Regression evidence |
| --- | --- | --- |
| Every task transition serialized and rewrote all historical results | Individual SQLite records, transactions, WAL/FULL, explicit changed task IDs | 3080-task fixture; selected-row/no-op writes; full Go tests and targeted race tests |
| Restart or another Hub writer could interact with persistence | Transactional JSON migration, lifecycle conflict check, preserved idempotency and recovery behavior | Committed WAL recovered after abrupt process exit; two Hub instances; rollback/migration tests |
| Failed result persistence was acknowledged to the transport | Return 503 instead of acknowledgement; failed dispatch is put back in the queue | Result-commit and dispatch-commit failure tests |
| Main UI and operations lived at different entrypoints | One React application at `/admin/`; operations are a native component; `/admin/legacy/` redirects | Browser navigation through 13 sections, one navigation and no iframe |
| MCP manager called helpers outside their JavaScript scope | Hoist shared helpers into the operations component lifecycle | Nonempty MCP list rendered in the component regression test |
| Operational refresh timers and requests had no component lifecycle | Mount/unmount controller, abort requests and clear interval on exit | StrictMode remount and cleanup tests |
| Background refresh overwrote unsaved failover fields | Dirty form guard, reset after successful save | Draft URL survives refresh |
| UI only recognized old JWTs for managed-token operations | Support current `durable` tokens as well as `managed_jwt` | Existing client action tests; real Hub issues an opaque token in browser acceptance |
| Issued token disappeared just by switching sections | Keep it in application state and display it on the connection screen | Clients → connections → clients retains the value |
| Empty client list told the user to create a client but hid the issuance form | Render issuance controls in the empty state too | Red/green empty-client test and first-token issuance against a real isolated Hub |

The controlled persistence fixture recorded 1,507,328 bytes for 20 updates with
3080 historical task results (~16.45 MiB). This is not a post-deployment NVMe or
production-process measurement. Do not present it as one.

## Functional preservation and migration boundary

The unified application includes server and task inspection, tool calls,
resources, MCP management, failover, audit, activity and raw diagnostics alongside
instructions, profiles, clients, webhooks, virtual MCP and authentication.
The Hub version and update control remain in the overview. Old bookmarks still
work. The old static payload now contains only a compatibility redirect.

Operational markup/JavaScript was moved under `admin-ui/src/operations`, not
rewritten wholesale. It is a transitional imperative component with scoped
styles and lifecycle management; it still has inline action handlers and broad
overview refreshes. There is one user-facing application, not yet a completely
React-native implementation of every operational widget.

No security preset or existing enforcement default was changed. Owner-facing
product controls and redaction in diagnostic/public responses are different
concerns: hiding a feature is not an acceptable substitute for an explicit
opt-in policy. Future UI migrations must preserve a feature inventory before
removing the previous implementation.

### Token limitation — not finished

Only the most recently issued token is retained in the current page's memory.
Navigation preserves it; page reload still clears it. Historical managed token
records contain a digest, not the original value, so this change cannot restore
those old values. No token was silently rotated, revoked or replaced. A durable
owner-facing credential inventory, with an explicit storage/display contract,
remains separate work; this change does not claim to have restored all token
values from configuration or old token records.

## Remaining architecture work, in priority order

1. **HA ownership and error acknowledgement.** SQLite protects record commits,
   but primary/standby still have independent in-memory queues and idempotency
   maps. This is not a distributed exactly-once scheduler. Define task ownership,
   leadership/fencing and failover reconciliation. Some enqueue/cancellation
   paths still log persistence errors instead of returning failure; make durable
   acknowledgement consistent before redesigning the scheduler.
2. **Storage API and coarse locking.** `Server` owns too many subsystems, and
   task transactions still execute while holding its broad mutex. Introduce a
   small task-store interface, explicit mutations and lifecycle tests before
   narrowing lock scope. Other JSON state stores still use snapshot patterns;
   profile their actual writes instead of applying blanket debounce. The old
   task-specific JSON merge helper is now dead code, but registry merging still
   has live consumers.
3. **Owner UX, not another rewrite.** Split `App.tsx` by feature. Move the
   operational adapter incrementally to typed components, preserving tool and
   resource actions, outputs, cancellation and updates. Group navigation around
   work, connections and diagnostics. Keep owner credential viewing separate
   from telemetry redaction; keep hardening presets explicitly opt-in.
4. **Contract tests and dormant legacy.** Some old Python assertions still
   describe the old security-driven UX or inspect the unserved
   `public/admin_dashboard.html`. Replace text-presence assertions with
   owner-action and persistence tests as each area is migrated. Avoid deleting
   a working capability simply to satisfy an outdated test.

## Reproducing verification

From the repository root:

```sh
(cd go-hub && go test ./...)
(cd go-hub && go test -race ./internal/hub -run 'TestTaskStore|TestTaskSave|TestTaskResultDoes|TestTaskDispatch|TestConcurrentHubState' -count=1)
(cd admin-ui && npm test && npm run lint && npm run build)
python -m pytest tests/test_admin_dashboard_js.py tests/test_admin_ui.py tests/test_admin_ui_build_contract.py tests/test_admin_ui_release_contract.py -q
python tests/e2e/unified_admin_ui.py
```

The browser script requires the Python Playwright package and its Chromium
browser. It builds a loopback-only Go fixture, uses fresh temporary configuration,
never loads the production environment, creates its token only in that fixture,
and terminates its child server in `finally`. Screenshots and result artifacts
are under `.tmp/unified-admin-ui`. It is an explicit acceptance command, not a
claim that browser E2E has already been added to CI.

For rollout, follow [TASK_PERSISTENCE.md](TASK_PERSISTENCE.md): old JSON-only and
new SQLite writers must not run concurrently against the same configuration.
Upgrade both Hub writers together after a backup. The frozen migration JSON is
not a current rollback snapshot after new tasks have been accepted.
