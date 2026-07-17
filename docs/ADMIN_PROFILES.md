# Admin Profiles

An admin profile is the user-facing unit that connects instructions, access
policy, MCP capabilities and clients. It must remain easy to start with while
keeping each part independently configurable.

## Profile contract

A persisted profile will contain:

- a stable profile ID and display name;
- a versioned instruction-set reference;
- an access mode and allowed MCP targets/tools;
- client bindings;
- zero or more external workspace references.

The current `S1.3a` slice implements the versioned default instruction set.
Profile persistence, bindings and policy enforcement remain exit-gate work and
must not be represented as active until their black-box tests pass.

## External workspace reference

An infrastructure workspace remains an independent source of truth. GPTAdmin
stores only the information required to select it at execution time:

```json
{
  "machine_id": "<registered-machine>",
  "workspace_path": "<absolute-path-on-that-machine>",
  "startup_document": "AGENTS.md",
  "shell_target": "shell:<registered-machine>"
}
```

When a profile is selected, Hub resolves the registered machine and ShellMCP
target. The MCP client reads the referenced startup document before workspace
actions. The repository itself, its Git credentials and its configuration are
not copied, vendored or added as a submodule to GPTAdmin.

Instance-specific machine IDs and paths are private configuration. Examples in
the public repository stay generic; the public mirror must never receive a
private workspace checkout or its contents.

## Cloud boundary

GPTAdmin Cloud may store device identity, route and health metadata needed to
reach a registered Hub. It does not store external workspace repositories,
their credentials or their instruction files.

## Runtime requirements

- Profile and workspace-reference updates use version checks to prevent stale
  writes.
- Instruction updates affect subsequent MCP initialization without restarting
  Hub.
- Tool discovery filters capabilities using the selected profile.
- Execution rejects a target or tool that the selected profile does not allow,
  even if a client constructs the call manually.
- Failover Hubs observe the same committed profile version before accepting a
  write.
