# AI-first access administration and operation history

## One management contract

The Hub exposes `access_profiles`, `access_clients`, and `operations` through
`schema(target="hub")` and `execute(target="hub", ...)`. The tools call the same
owner HTTP handlers as the web UI, forwarding the caller's existing verified
credentials. They do not require shell commands or manufacture an owner session.

Examples of tool arguments:

```json
{"action":"create","id":"inspection","profile":{"name":"Inspection","access_mode":"readonly","allowed_targets":["shell:host"],"allowed_tools":["system_inspect"],"instruction_set_id":"default"}}
```

```json
{"action":"issue","client_id":"inspection-client","profile_id":"inspection","access_mode":"readonly","ttl_days":7}
```

`access_profiles` supports list, get, create, update. Updates require the `etag`
returned by get; creating an existing ID is rejected rather than overwritten.
`access_clients` supports list, issue, bind, unbind, and revoke for an exact ID.
These clients are named MCP/OAuth connections, not local OS accounts or a new
human-login directory. Owner/admin-cookie or existing CTL authentication is
still required. An ordinary MCP execution token does not automatically become
an access administrator. Delegated named admin roles remain separate work.

## Profile fields and explicit limits

The Go contract uses `workspace_refs`. The UI now reads and writes that name,
preserves `instruction_set_id` and `approval_mode`, and omits wholly empty
optional workspace rows. It retains compatibility when reading older UI-shaped
fixtures using `external_workspace_refs`, but never writes the old field name.

A read-only profile takes precedence over a token's execution capability.
`allowed_targets:["*"]` and `allowed_tools:["*"]` explicitly allow all; empty
lists still allow none. `approval_mode:"unrestricted"` disables the additional
approval/budget gate for that profile. Existing profiles and defaults are not
silently broadened or reset. The UI exposes these choices and displays their
meaning instead of concealing behavior in missing fields.

A new connection can be issued with `profile_id` in its original persisted
record. It does not pass through a temporary unbound state. A delayed profile
list response cannot erase a new profile draft the operator has begun editing.

## Durable access operations

`GET /admin/api/operations` and the `operations` tool list access changes newest
first, with pagination. The "Операции доступа" screen uses that same API.
Operation records are appended to the existing `audit.jsonl`; this is not a
second logging service. Every tracked change records a synced started event
before applying the handler and a synced completed/failed event before replying.

Recorded fields: operation ID, actor, method, object path, timestamps, outcome
and HTTP status. Request bodies, token values and result bodies are excluded.
A started operation with no completion stays visible after restart. It means
inspect the object before retrying, not that the action should automatically be
executed again. Failures to record the initial event prevent the mutation;
failures to record completion explicitly state that the underlying action may
already have succeeded. The reader scans the existing log on demand; it is not
an indexed analytics engine or an unbounded background poll.

Command execution and output remain under Tasks. This change preserves profiles,
bindings and access-operation history across restart; it does not yet persist
creator-local executable queue arguments for automatic command resumption.

## Verified retirement

`public/admin_dashboard.html` was an unserved 1144-line duplicate. Repository
references were inspected: the active remnants were text tests and the Mac
source-snapshot script, not the Go runtime. The duplicate is removed; the Mac
snapshot now includes the built canonical `admin-ui/dist` as `public/admin`, and
tests target the actual operational component. Historical work logs retain
historical references. No active token or runtime service was removed by this
source cleanup.

## Remaining owner credential work

Original values of older managed tokens remain hash-only. This change does not
add persistent token-value storage/retrieval or revoke old connections. The most
recent issued value is still page-memory-only. Owner/admin viewing is a required
product capability, not a reason to rotate credentials silently. Actual usage
and exact IDs must be reviewed before removing old connections, especially the
connection used for management and revocation metadata needed by validators.

## Proof

`access_management_test.go` checks owner MCP creation, connection binding,
restart, operation history, interrupted operations and denial for ordinary MCP
clients. `access_effective_mode_test.go` proves the read-only profile rule.
Frontend contract tests use actual Go fields. `tests/e2e/unified_admin_ui.py`
creates/edits a profile in a real browser, issues a bound connection, restarts
its isolated real Hub, and verifies restored fields and visible history.
