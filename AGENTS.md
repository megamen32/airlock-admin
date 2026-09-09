<!-- last-human-commit:begin -->
LHC is shared through the globally installed `last-human-commit` Agent Plugin.
Read its bundled `AGENTS.md` through the active native plugin/skill location;
resolve `common/` from that same package. Do not use the legacy
`~/.local/share/last-human-commit/current` store or copy LHC rules into projects.
For LHC changes use its `lhc-update-agents` skill and canonical LHC repository.
Infer the current work's owning project from the conversation and files being
changed. Keep its ToDo/tasks under that project's `.agents/`, even when this
session was opened elsewhere. Do not require a project-selection ritual.
<!-- last-human-commit:end -->

## Single-history completion

A GPTAdmin change is complete only as one reviewed history. Before declaring a task done, inspect the whole current dirty tree and relevant recent history, including changes left by other agents or earlier work. Test the integrated state, then commit the agreed complete tree, push that commit, deploy that same commit, and validate the live product. Do not silently leave files uncommitted merely because the current agent did not author them. If an existing change cannot be understood or safely validated, stop and report that blocker instead of creating a partial history.

## Reality-first testing

Mocks, fakes, stubs, simulated services, fake health responses, and monkeypatched
process/network boundaries are allowed only for narrow unit tests where the claim
is explicitly limited to local logic. They are never acceptable evidence that a
runtime, integration, installation, update, failover, deployment, or release
works.

For every user-visible or cross-component claim, prefer the real executable path:
real candidate artifacts, real installer, real service manager, real processes,
real protocol/authentication flow, and a harmless real operation whose output or
side effect is verified. A green status, HTTP 200, process existence, schema
listing, mocked response, or fake transport is not proof of end-to-end behavior
when a real execution can be performed.

Acceptance and release gates must fail closed when the real path cannot be
exercised. Never replace an unavailable real dependency with a fake and then
report the corresponding integration as verified; report the gap instead. Use a
test double only when exercising the real dependency is impossible or would be
destructive, and keep that test explicitly below the acceptance/release layer.
