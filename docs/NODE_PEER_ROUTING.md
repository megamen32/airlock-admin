# Explicit node peer routing

`GPTADMIN_NODE_PEERS` maps an execution target to an operator-configured origin:

```json
{
  "shell:nodeB": {
    "url": "https://node-b.example",
    "connect_to": "192.0.2.20"
  },
  "shell:nodeC": "https://node-c.example"
}
```

String origins remain compatible. Optional `connect_to` accepts only a literal
IP and requires HTTPS. It overrides the TCP destination, preserving the URL
hostname for TLS certificate verification and SNI. Connections are pooled per
configured URL/IP pair, so two physical nodes sharing a logical hostname cannot
share a pool. No DNS or hosts-file changes are required.

Through `/mcp`, execute normally:

```json
{"name":"execute","arguments":{"target":"shell:nodeB","tool":"shell_exec","args":{"cmd":"printf hello"},"background":true,"idempotency_key":"example-1"}}
```

Read the returned job through the **same entrypoint**, using the same target as
execute (also available as `result._meta.owner_target`):

```json
{"name":"job","arguments":{"id":"<returned-job-id>","owner_target":"shell:nodeB"}}
```

Job IDs remain unchanged. Existing local `job {id}` reads remain compatible.
The owner hint selects only an explicitly configured route, never a caller URL.
A local record takes priority; a conflicting hint fails. The receiving node
requires its pinned local executor to own the stored job. Unknown jobs and
unconfigured owners fail; there is no peer scan.

The original bearer is forwarded and independently authorized at the owner.
Forwarding permits one hop, rejects redirects, and never retries an uncertain
execution at another executor. Jobs, receipts and idempotency stay in the
owner's existing SQLite store. The ingress keeps no persistent routing index;
clients retain the owner target across reconnects. After ingress loss, the
same credential can read the receipt or reuse the same execution idempotency
key directly at the owner. Receipt reads do not trigger execution.

This slice adds MCP receipt routing; the REST execution endpoint remains
supported, but REST receipt reads still use the owner's endpoint. It does not
provide job replication, automatic promotion, discovery or stable DNS failover.

Real local acceptance:

```sh
python3 tests/e2e/node/peer_run.py .tmp/path/to/gptadmin-node
```

The MCP canary runs two actual Node processes, provisions an ordinary managed
credential using auth snapshot export/apply, forwards through verified HTTPS
with a physical IP pin, reads repeatedly through the ingress, stops that
ingress and verifies direct owner receipts and a single execution side effect.
It also invokes `scripts/gptadmin_node_probe.py` against the ingress. Optional
`--legacy-probe PATH` checks a preserved old probe fails the missing-owner read.
