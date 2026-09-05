# Incremental task persistence

Hub stores individual tasks and task-backed idempotency records in
`GPTADMIN_CONFIG_DIR/tasks_state.sqlite`. Explicit task IDs are passed at every
production save call. A group update includes its children. Unrelated result
payloads are neither read nor serialized on the save path. Equal payloads do
not update their rows; newer lifecycle timestamps win against stale writers.

SQLite uses WAL, synchronous=FULL, immediate transactions and a ten-second busy
timeout. A connection is owned and closed by each operation. There is no
background write window, debounce or reduction of configured history retention.
Results are acknowledged to the transport only after a successful commit;
failed dispatch commits leave the job queued and return HTTP 503 for retry.
This does not fix every pre-existing enqueue/cancellation error-reporting path.

## First upgrade

The first database transaction imports the existing `tasks_state.json` and
marks the migration complete atomically. Invalid JSON leaves the migration
uncommitted and can be repaired and retried. The old JSON file is preserved
unchanged. Restart behavior is retained: running jobs can receive their result,
queued/approval-waiting jobs are marked failed rather than executed again,
cancellation intent and completed idempotency entries survive restart. These
recovery transitions are themselves committed.

Upgrade all Hub writers sharing the configuration directory together. Stop
both old primary and standby writers before the first new writer migrates.
Old JSON-only and new SQLite writers cannot share one storage protocol. Take
a configuration backup before the cutover; ShellMCP does not need an update.

The frozen legacy JSON is not a current rollback snapshot after new jobs run.
A rollback to an old Hub requires an offline export of the current database;
do not restart an old binary against the stale JSON file. A backup of a live
SQLite database must use SQLite's backup API (or stop writers and include all
journals), not a file copy of the main database while WAL is active.

## Regression evidence

`task_store_incremental_test.go` checks migration without snapshot rewrites,
selected-record updates on 3080 historical tasks, identical-save no-op, stale
writer protection, transaction rollback, corrupt migration retry, WAL/FULL,
recovery after abrupt process exit with a committed WAL, result acknowledgement
failure and dispatch requeue. Existing restart, idempotency, task-group and
concurrent-Hub tests remain enabled. Performance measurements in that test are
controlled fixtures, not measurements of the deployed production process.
