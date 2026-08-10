# Independent review: Health remediation receipt path

Status: work

## Parent objective

Review the implementation toward the full health-incident business result:
health degradation → diagnosis → exactly three plans → explicit Telegram
selection → Hermes remediation with useful-progress supervision → independent
source verification → resolved NoticePlace receipt with elapsed time and trace
IDs.

## Bounded review scope

- `/home/roomhacker/agents-projects/noticeplace/notification_center/core.py`
- `/home/roomhacker/agents-projects/noticeplace/notification_center/gptadmin_agent.py`
- `/home/roomhacker/agents-projects/noticeplace/notification_center/http_api.py`
- related focused tests and the Fleet health activation prompt

Read-only only: do not edit, deploy, restart, send Telegram, or run Hermes
egress. Check idempotency, progress supervision, independent verification, and
trace preservation against the parent acceptance contract.

## Acceptance evidence requested

Report concrete PASS/FAIL/NOT_PROVEN findings with file and line references,
the smallest remaining defect, and whether a live external approval boundary
is the only blocker.

## Estimate

Initial: 20 / 30 / 60 active minutes.

## Reviewer evidence (2026-08-10)

Review was read-only and covered the NoticePlace health state machine and
wrappers, the GPTAdmin polling/progress adapter, the related Telegram callback
seam, focused tests, and the runtime activation evidence. No deployment,
restart, Telegram send, or Hermes egress was performed.

### Verification

- `python3 -m pytest tests/test_health_workflow.py tests/test_http_api.py tests/test_gptadmin_agent.py -q` → `43 passed in 23.57s`.
- `git diff --check` for the selected tracked paths → no output.
- Read-only attach canary produced exactly three normalized plans and a
  durable `telegram.main` plan delivery (alongside the ordinary intake alert).
- Plan-selection concurrency tests passed for same-process and separate
  `NotificationCenter` instances; selection is protected by the SQLite
  single-winner table at `notification_center/core.py:1404-1487`.
- Useful-progress classification, heartbeat-only rejection, matching source
  verification, independent verifier enforcement, source-fingerprint matching,
  elapsed time, and trace merging are covered by focused tests at
  `tests/test_health_workflow.py` and `tests/test_gptadmin_agent.py`.

### Scoped findings

1. **CHANGES_REQUIRED / P1 — repeated health progress is not idempotent.**
   `notification_center/core.py:1544-1554` derives `useful` from the latest
   stored receipt and embeds that derived value in the event payload before
   `notification_center/core.py:1556-1563` performs the idempotency lookup.
   The first request with a key stores `useful=true`; an exact retry sees the
   same receipt, derives `useful=false`, and is rejected by
   `_record_health_event` as `IdempotencyConflict`. Direct reproduction:
   first call returned `True`, the exact second call with the same key raised
   `IdempotencyConflict: Idempotency-Key was already used with different event
   content`. This breaks the HTTP retry contract. Smallest fix: resolve the
   existing idempotency key before deriving state-dependent useful fields, or
   exclude derived `useful` fields from the content comparison and return the
   stored receipt on an exact retry.

2. **CHANGES_REQUIRED / P1 — secret-like prefix values can be persisted and
   forwarded.** `notification_center/health_workflow.py:28-31`,
   `notification_center/core.py:1208-1211`, and
   `notification_center/gptadmin_agent.py:30-33` redact only `name=value`
   forms. A read-only temporary-database canary stored the raw evidence
   `api-key:super-secret` in the intake event. The same gap applies to
   `token:`, `secret:`, bearer-style, and similar prefix forms, violating the
   no-raw-secrets receipt contract. Smallest fix: use one shared bounded
   sanitizer covering the prefix and assignment forms before persistence and
   outbound serialization; add regression cases for each form.

3. **CHANGES_REQUIRED / P2 — malformed five-part Telegram callbacks can kill
   the poller.** In the related callback seam,
   `notification_center/telegram_interactions.py:51-53` calls
   `TelegramActionCodec.encode` with a `plan_id` for every five-part callback.
   For an action other than `health_plan` it raises `ValueError`; the caller
   only catches `ValidationError` at `telegram_interactions.py:126`. A direct
   malformed callback decode reproduced `ValueError: only health_plan
   callbacks may carry a plan_id`. Smallest fix: reject non-`health_plan`
   five-part data before calling `encode`, or catch the codec `ValueError` at
   the callback boundary and answer the callback as invalid.

4. **CHANGES_REQUIRED / P2 — agent remediation elapsed time is not bounded on
   the terminal-receipt path.** The public wrapper clamps elapsed time at
   `notification_center/health_workflow.py:376-384`, but the remediation path
   passes the raw adapter value at `notification_center/core.py:1138-1145` to
   `resolve_health_incident`, which persists it at `core.py:1665-1674`.
   `notification_center/gptadmin_agent.py:323-325` also has no upper clamp.
   A hostile or malformed terminal receipt can therefore bypass the bounded
   receipt limit. Smallest fix: apply the same `[0, 86_400_000]` clamp in the
   core resolution boundary before storing any agent receipt.

### PASS / NOT_PROVEN gates

- **PASS:** one incident is retained for health updates; plans are normalized
  to exactly three unique bounded IDs through the HTTP workflow; signed plan
  callbacks are user-allowlisted; unknown/fourth plans are rejected; useful
  progress requires a step/evidence/fingerprint change; resolution requires a
  selected plan, useful progress, matching source, healthy state, and a
  distinct verifier; bounded trace refs and elapsed time are preserved on the
  tested wrapper path.
- **PASS (bounded local supervision):** `HealthProgressSupervisor` uses durable
  `received_at` values and raises on stale useful progress for
  `health-remediation`; focused adapter tests passed.
- **NOT_PROVEN:** the real production business canary. The activation evidence
  records no active Health Telegram route/topic, zero real plan selections,
  remediation, verification, or resolved health events, and Hermes egress was
  intentionally off. Creating/enabling the topic or sending the canary is an
  external approval boundary, but it is not the only blocker because the four
  code findings above remain.
- **Shared-worktree collision:** at the review checkpoint, `core.py` was
  modified at 03:49:38, `gptadmin_agent.py` at 03:52:00, and
  `tests/test_gptadmin_agent.py` at 03:52:13 while the current time was
  03:53:24. These fresh paths were not edited, staged, or included; L must
  re-read the final diff after concurrent work stops.

## Reviewer result

**CHANGES_REQUIRED.** Focused tests are green for the observed snapshot, but
the progress retry defect and secret-prefix persistence are acceptance-blocking;
the malformed callback and unbounded agent elapsed receipt are additional
scoped fixes. The live external approval/user-facing boundary is an additional
 NOT_PROVEN gate, not the sole blocker.

## Fix receipt (2026-08-10)

- Fixed repeated-progress idempotency by checking the existing normalized
  progress payload before deriving state-dependent `useful` fields.
- Added shared `sanitize_bounded_text` coverage for assignment, colon-prefix,
  and Bearer secret forms; core and GPTAdmin adapter now reuse it.
- Rejected non-`health_plan` five-part callbacks before codec signing logic.
- Clamped terminal remediation elapsed time at the core resolution boundary.
- Re-ran red regressions and focused suites: NoticePlace `70 passed`,
  health-monitor `19 passed`, Fleet activation `4 passed`.

## Rerun gate

Perform a fresh context-free review of the current files after these fixes;
remain read-only and do not send Telegram or run Hermes egress.
