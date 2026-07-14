# GPTAdmin worklog

This is the canonical cross-agent handoff log. It is append-only: add a new
dated entry, never rewrite another agent's historical entry. The execution
plan is [`PROJECT_PLAN.md`](./PROJECT_PLAN.md).

## Workflow for every agent

1. Read `PROJECT_PLAN.md`, this file and the relevant subsystem documentation
   before changing code.
2. Select one milestone and one bounded slice. If another active entry owns an
   overlapping file or runtime surface, coordinate before editing.
3. Add an **active** entry before substantial edits. Include the milestone ID,
   scope, owner/agent label and intended acceptance evidence.
4. Work test-first for behavioral changes: record the failing test or precise
   pre-fix evidence, implement, then record focused and full verification.
5. Replace the active entry with a **completed**, **blocked** or **handed-off**
   entry. Include changed paths, commit, CI run, deployment state and one
   concrete next action.
6. Update the status in `PROJECT_PLAN.md` only when the milestone exit gate has
   evidence. Do not mark a stage complete from an implementation claim.

## Entry template

```md
## YYYY-MM-DD - <short title> - <active|completed|blocked|handed-off>

- Milestone: `Sx.y`
- Owner: `<agent or human>`
- Scope: `<bounded files, runtime or user flow>`
- Baseline / red evidence: `<failing test, incident or N/A>`
- Change: `<what was done>`
- Verification: `<commands and concise results>`
- Delivery: `<commit, push, CI URL/run, deployment>`
- Next: `<single actionable continuation or none>`
- Blocker: `<only when status is blocked>`
```

## Rules

- Never put tokens, passwords, private URLs, raw customer data or full command
  output in this file. Refer to a redacted log path or issue instead.
- Keep entries factual and compact. State uncertainty explicitly.
- A runtime change is not delivered until restart/health evidence is logged.
- A docs-only or research task still records the canonical source and what
  decision it changed.
- Use absolute repository paths in handoffs when ambiguity is possible.

## Entries

## 2026-07-14 - Execution plan and cross-agent handoff - completed

- Milestone: `S0.4`
- Owner: Codex
- Scope: Canonical plan, append-only worklog and agent operating instructions.
- Baseline / red evidence: Public roadmap described product themes, but there
  was no milestone exit-gate plan or root-level cross-agent handoff record.
- Change: Added `PROJECT_PLAN.md`, this worklog and matching workflow rules to
  `AGENTS.md` and `CLAUDE.md`.
- Verification: Reviewed current repository structure and roadmap; `git diff
  --check` passed.
- Delivery: Delivered in the accompanying documentation commit; CI is not
  required for this docs-only coordination change.
- Next: Keep new implementation work aligned to one milestone and record
  evidence here before handoff.

## 2026-07-14 - Failover black-box coverage - completed

- Milestone: `S3.4`
- Owner: Codex
- Scope: Docker failover harness, CI gate and operator runbook.
- Baseline / red evidence: No Docker black-box coverage existed for hub failure,
  tunnel failure, combined outage, reclaim or multiple fallback ranks.
- Change: Added real Go hub/watchdog/proxy Docker topology. It covers tunnel
  only, hub only, combined failure, signed reclaim, rank 1 fencing rank 2 and
  rank 2 promotion while rank 1 is unavailable.
- Verification: `docker compose -f tests/e2e/failover/docker-compose.yml up
  --build --abort-on-container-exit --exit-code-from failover-e2e` passed all
  six scenarios.
- Delivery: `ed90d04`; GitHub Actions run `29310215351` passed, including the
  `failover-e2e`, Linux, macOS, Windows and Android artifact jobs.
- Next: Add a physical two-host deployment drill and partition-specific
  fencing evidence before calling HA maturity complete.
