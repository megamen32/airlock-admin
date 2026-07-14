# GPTAdmin product philosophy

This document is the product-level decision source. Architecture, setup,
documentation and new MCP capabilities must preserve these principles unless a
new explicit decision supersedes them.

## Easy to install, flexible to configure

GPTAdmin must work before the operator studies it. The normal path is one
installation command, a few questions that cannot be inferred, one Hub URL and
automatically connected local MCP clients.

Advanced configuration is progressive. An operator can later change exposure,
policy, approval, identity, failover and client profiles without rebuilding the
installation from scratch.

## Convenience and resilience by default

The working default optimizes for immediate usefulness and recovery from
ordinary failures. It creates the required services and Tunnel, verifies the
result and leaves a clear repair path.

Security is real but progressive. GPTAdmin generates and protects internal
credentials, validates identity and scopes, and avoids unsafe silent fallback.
It does not force a newcomer through a threat-model questionnaire before the
first useful action. Stronger access restrictions and MFA can be enabled after
the Hub works.

Resilience is a product feature, not an operator homework assignment. Updates
are idempotent, state survives restart, failures are visible, and recovery does
not depend on remembering transport internals.

## Model context is a user resource

MCP must consume the minimum practical model context by default. Context used
by unused tools, repeated instructions or oversized results competes directly
with the user's real task.

- Keep the global Hub tool surface small, stable and deterministic.
- Load server inventories, schemas, resources and result detail only when the
  current task actually needs them.
- Discover first; describe or load content only after an explicit selection.
- Never inject the full upstream MCP inventory into every session.
- Paginate and bound lists and results. Return a concise summary and a handle
  for large content instead of duplicating full payloads.
- Measure real byte, item, call and client token costs before redesigning a
  working protocol around estimated savings.

Dynamic loading means loading data after the model selects a target. It does
not mean changing `tools/list` unpredictably during a session; stable schemas
preserve client compatibility and prompt caching.

## The user's task comes first

Maintenance and migration notices must never block an urgent read or action.
They are durable and auditable, but deliberately non-disruptive.

- Bundle notices instead of repeating them individually.
- Offer a due bundle at most once per rolling 24 hours on the active Hub by
  default, not once per chat or tool call.
- Do not append notices to shell output, job polling or every successful call.
- Let the agent defer a notice for at least another day when the user is busy.
- Keep the notice short; load full instructions only when the agent or user
  opens it.

An AI acknowledgement means only "read and explained". It does not prove that
the requested migration happened. Only the Hub may mark completion, using
observed evidence such as a new connection credential, a successful request on
that connection and retirement of the obsolete credential.

## Stable identity, rotating credentials

A connection keeps one stable `connection_id` while its JWT `jti` values
rotate. Policies, notices and audit history belong to the connection, not to a
single replaceable token.

The normal user remembers only `AdminPassword`. JWTs, signing keys and device
credentials remain implementation details unless an advanced client requires
an explicit export.

## Explicit behavior beats clever fallback

Targets are explicit. The Hub does not guess a default server, silently reroute
an unavailable action, repeat a write without idempotency, claim an unverified
success, or preserve compatibility forever without an owner and removal gate.

Every new capability must define:

- its default context cost and lazy-loading behavior;
- its failure and recovery behavior;
- what the Hub can verify versus what needs operator confirmation;
- compatibility scope and removal conditions;
- runtime or black-box acceptance evidence.

