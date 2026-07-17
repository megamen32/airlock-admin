# GPTAdmin Cloud product boundary and security model

## Product boundary

**GPTAdmin** is the AGPL, self-hosted MCP Hub. It runs on the customer's
machine, owns the MCP configuration, local agents, audit data, OAuth state and
all authorisation decisions.

**GPTAdmin Cloud** is a closed, managed cloud service. It sells the operational layer
that makes a self-hosted Hub practical without a public IP address:

- outbound NAT traversal and a stable public URL;
- managed DNS, TLS, edge availability and health monitoring;
- device provisioning, per-device route allocation, suspend/revoke and quotas;
- connection instructions for ChatGPT, Claude, MiniMax, Alice and other MCP
  clients;
- support and optional paid reliability/security features.

GPTAdmin Cloud is not an MCP tool proxy, does not execute tools, and must not become a
second customer Hub. The customer-facing MCP resource remains the personal
GPTAdmin Hub installed on the customer's machine.

## New and legacy routes

Existing installations keep their current route unchanged:

```text
<legacy-id>.t.gptadmin.bezrabotnyi.com
```

All GPTAdmin Cloud-managed installations use a separately operated namespace:

```text
<device-id>.n.gptadmin.bezrabotnyi.com
```

`n` means **network-managed**, not private or zero-access. It lets us evolve the
commercial control plane and edge without changing old FRP customers.

## Managed default: one command behind NAT

The default paid/free-managed flow is intentionally simple:

1. The customer runs the open-source GPTAdmin installer.
2. The installer creates the local Hub and its local admin/OAuth secrets.
3. It requests a one-time pairing with GPTAdmin Cloud over an outbound connection.
4. GPTAdmin Cloud assigns a route and a device-specific tunnel credential.
5. `frpc` keeps an outbound tunnel open; no inbound port, public IP, DNS setup
   or manual certificate action is required from the customer.
6. GPTAdmin Cloud serves managed TLS for `*.n.gptadmin.bezrabotnyi.com` and prints the
   stable Hub URL for the customer's ChatGPT/Claude connection flow.

A wildcard certificate is valid for this managed mode. The customer does not
need to issue a certificate because GPTAdmin Cloud controls this DNS namespace and
terminates public HTTPS at its edge, then forwards through an encrypted tunnel.
This is how a managed tunnel product can work through arbitrary NAT in one
command.

## Honest trust statement

Managed TLS is **not end-to-end zero-access**. The GPTAdmin Cloud edge necessarily can
see plaintext HTTP/MCP traffic after it terminates the public TLS connection.
The tunnel is encrypted in transit, but the service operator is a trusted
transport provider for this mode.

Product copy must say:

> Your Hub, local MCP configuration and Hub credentials stay on your machine.
> GPTAdmin Cloud provides a managed encrypted public route. In Managed mode, GPTAdmin Cloud is
> a trusted edge that terminates HTTPS; do not use it where an untrusted relay
> must be technically unable to inspect request content.

Product copy must **not** say “we cannot technically access your Hub” for the
managed wildcard-TLS route.

Controls for this mode:

- each device gets a unique route identity and revocable tunnel credential;
- the edge never receives or stores the customer's admin password or Hub signing
  secret;
- do not log request/response bodies or Authorization/Cookie headers;
- redact operational logs, restrict staff access, retain minimal connection
  metadata, and publish the retention policy;
- customer Hub still authenticates every MCP/OAuth request and remains the
  enforcement point for scopes and tool policy;
- customers can revoke a route immediately and can choose their own tunnel or
  public reverse proxy instead.

## Optional stricter modes

A future **private passthrough** tier may use a TCP/SNI relay and TLS that ends
on the customer host. It can be automated through NAT with ACME TLS-ALPN-01,
but it is a different edge architecture and needs careful routing for new
certificates. It does not eliminate trust in the operator of
`gptadmin.bezrabotnyi.com`: the domain owner can alter DNS or obtain a
certificate for that name.

The strongest practical offering is **customer domain + TLS passthrough**. The
customer delegates a hostname (for example `mcp.example.com`) to a GPTAdmin Cloud edge
but controls its DNS zone and certificate lifecycle. This is an advanced,
separate product tier—not a prerequisite for the one-command managed default.

## Non-negotiable implementation rules

1. Never embed a shared FRP token in the open-source installer.
2. Provision an individual device identity, route and revocable credential.
3. Store only a verifier/hash of a provisioning token; show raw secrets once.
4. Restrict each credential to its assigned route at the edge.
5. Keep the legacy `.t` backend untouched during migration.
6. The GPTAdmin Cloud control plane stores tunnel metadata, never the customer's Hub
   admin password, OAuth signing secret, MCP bearer tokens or MCP payloads.
7. Customer-facing documentation clearly distinguishes managed-edge encryption
   from end-to-end TLS passthrough.
