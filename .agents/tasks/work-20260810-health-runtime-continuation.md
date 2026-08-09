# Health incident autopilot runtime continuation

Status: work
Task class: Full
Stage: production runtime deployed; business canary and user-facing gate remain
Owner: L
Created: 2026-08-10

## Original request

Нужен бизнес-результат: мониторинг CPU/disk/RAM всех хостов, failed-сервисов и
ошибок/keywords в логах; деградация должна идти через GPTAdmin/NoticePlace,
Agent Herder и OpenCode/OmniRoute к диагностике и ровно трём планам, затем
пользователь выбирает план в Telegram topic `Health`, Hermes/OpenAI/Codex/
GPT-5.6-Luna high исправляет проблему с контролем полезного прогресса,
независимой проверкой, итоговым resolved-сообщением, elapsed time и trace IDs.
Нужны исследование, дизайн, три плана, имплементация, ревью и независимая
user-facing computer-use проверка.

## Objective and business canary

Prove one controlled degradation through the real producer, GPTAdmin,
NoticePlace, diagnosis, exactly three plans, explicit user selection,
controlled remediation, useful-progress supervision, independent source
verification, and a resolved NoticePlace receipt with elapsed time and traces.

## Confirmed scope

- `/home/roomhacker/gptadmin`, `/home/roomhacker/ServersAdministartion`, and
  `/home/roomhacker/agents-projects` projects NoticePlace, Hermes, OpenCode,
  OmniRoute, Agent Herder, and Agent Harness Fleet.
- Health collector/timer/credential activation and the Normal integration path.
- Fleet-managed backup-first runtime release of the allowlisted NoticePlace
  helper, Agent-Herder `dist`, and non-secret user unit.

## Exclusions and gates

- No Telegram send, Hermes egress start, destructive cleanup, secret value
  output, or unrelated dirty-worktree cleanup.
- Production deploy/restart is allowed only after the exact operator approval;
  that approval was received for the runtime deploy on 2026-08-10.
- User-facing computer-use acceptance is invalid without the supported
  BrowserOS/Touchpoint surface; missing surface is `STOP_MISSING_REAL_SURFACE`.

## Initial active-minute estimate (immutable for this continuation)

- Optimistic: 30 active minutes
- Likely: 90 active minutes
- Pessimistic: 240 active minutes

## Initial plan

1. Зафиксировать текущий branch/worktree drift и authoritative runtime evidence.
2. Проверить Fleet runtime preview/apply/verify safety contract.
3. Проверить production source/live hashes, service restart, and no-send canary.
4. Провести независимый Overseer review и исправить safety findings.
5. Завершить real Health-topic/user-selection canary только на разрешённой
   внешней границе; затем провести свежий black-box Tester.

## Implementation progress (English)

- Fleet runtime skill `health-incident-runtime` was added in commit `ea625ef`.
- Its rollback/hash/post-apply safety gates were hardened after independent
  Overseer review in commit `df33a3d`; full Fleet suite is `224 passed`.
- Fleet API apply used exact confirmation
  `sha256:0bd16b005b4c1cfa03c3e879cfa3a1f69e84b5b3366d2d08aa62db6f23e5d05c`.
  Backup was created under `/var/backups/health-incident-runtime/`; NoticePlace
  and Agent-Herder were restarted, with daemon reload.
- Fleet verify returned `verified`; source/live hashes for the relevant
  NoticePlace health runtime and Agent-Herder `dist`/unit are equal.
- Live no-send canary reached Agent-Herder terminal `stopped`, produced useful
  progress and native Hermes session `20260810_012323_a5a782`, and emitted the
  expected marker. External sends were false and Hermes egress stayed off.
- Current GPTAdmin branch is `agent/gptadmin-parallel-browser-flows-scoped`,
  not the earlier `main` checkout. Existing foreign dirty files are preserved;
  this continuation task records current evidence without switching branches.

## Remaining acceptance gaps

- A real user-facing Health topic is not verified: the fresh Tester remains
  `STOP_MISSING_REAL_SURFACE` because Touchpoint transport is unavailable.
- The full live chain from a real health event through OpenCode/OmniRoute
  diagnosis, exactly three plans, user selection, independent verification,
  and resolved NoticePlace receipt has not yet been proven end-to-end.

## Overseer checkpoint (2026-08-10)

Overseer independently confirmed that the current local vertical canary uses
fakes for GPTAdmin/OmniRoute/Agent-Herder/Telegram and therefore is not the
business acceptance proof. It flagged runtime hash fail-open, user-unit
rollback permissions, and missing post-apply verification. Those findings were
fixed in Fleet source and covered by tests before the production apply; the
current branch/task drift finding is recorded above.

## Fresh fleet/runtime audit (2026-08-10)

- Read-only Server Health probe: all configured targets returned `status=ok`; notable leads were `vpn2` load1 61.54 on 1 CPU, `vusa` disk 85%, and failed-unit counts on server-100/server-88/server-44/vpn2. No restart or remediation was performed.
- NoticePlace currently contains 3,778 `health.degraded` events from `health-monitor`, mapped to 46 open incidents; latest event time was 2026-08-09 23:12 UTC. This proves producer intake/deduplication, not diagnosis success.
- GPTAdmin health diagnosis deliveries are 25 sent and 155 failed. The failed window ended at 2026-08-09 21:01 UTC, before the runtime deployment wave at approximately 2026-08-09 22:20 UTC. Failure classes are 64 policy HTTP 429 (bounded-autonomous budget), 88 shell exit 1, and 3 incomplete. No new diagnosis delivery failure was observed after the deployed runtime canary.
- The root-owned `/etc/gptadmin/agent-jobs.json` is an older profile file, but it is not the active health consumer: both live GPTAdmin health routes contain `GPTADMIN_AGENT_JOBS_FILE=/home/roomhacker/.config/gptadmin/agent-jobs.json` and `GPTADMIN_NOTIFY_EVENT={{json}}`. Their live command hashes exactly match the canonical activation workflow. The active user-owned profiles are `health-diagnosis=opencode/omniroute/subagent/high` with orchestrator mapping and `health-remediation=hermes/gpt-5.6-luna/high`.
- The post-deploy direct no-send canary proved the real NoticePlace helper → Agent-Herder → Hermes no-send path. A full webhook-route canary that would start the Hermes health profile remains excluded while Hermes egress is explicitly not to be run.

### Real diagnosis/plans canary (2026-08-10)

- Executed the deployed `/opt/noticeplace/bin/notify-agent-job run health-diagnosis` with a temporary user-owned 0600 profile/callback and synthetic no-send telemetry. The real Agent-Herder `opencode` path created diagnosis and orchestrator sessions, returned terminal `completed` in about 33 seconds, and posted a callback marked `plans_attached` with 6 trace references. No Telegram send and no Hermes egress occurred.
- Repeated with an in-memory callback capture and counted the actual callback payload: `plan_count=3`, `unique_plan_ids=3`, callback count 1, returncode 0, elapsed about 30 seconds. This proves the real OpenCode/OmniRoute logical path produces exactly three plans; the callback was intentionally not connected to production Telegram delivery.
- A stronger disposable canary used the deployed helper against a real temporary NoticePlace HTTP handler and SQLite workflow (no delivery worker): returncode 0 in about 15 seconds, `noticeplace_plan_count=3`, `unique_plan_ids=3`, `health.plans_attached` present, correlation preserved, 9 trace refs, and no Telegram/Hermes egress. The first setup attempt failed before agent start because the disposable handler omitted its required MCP token; it was corrected in-memory and did not touch production.

### Overseer eligibility for next audit (2026-08-10)

- Previous independent runtime audit is bounded to the review window after Fleet release `ea625ef` at `2026-08-10T01:20:32+03:00` and before safety fix `df33a3d` at `2026-08-10T01:31:27+03:00`; its findings and fixes are recorded above.
- Material trigger for the next audit: a new real deployed diagnosis→disposable NoticePlace canary completed with exactly three plans and traces, while the fresh user-facing Tester still reports `STOP_MISSING_REAL_SURFACE`. This changes both business evidence and the remaining acceptance risk.

## Overseer audit receipt (2026-08-10 02:28 MSK)

- Eligibility: `CONTINUE`. The prior audit window ended at 01:31:27 MSK; the
  30-minute minimum has elapsed, and the deployed diagnosis→disposable
  NoticePlace canary is a material business-evidence trigger.
- Business delta: the real deployed OpenCode/OmniRoute route now has bounded
  evidence for one completed diagnosis callback with exactly three unique plans,
  preserved correlation/traces, and no Telegram/Hermes egress; it still does
  not prove the real Health topic, explicit selection, remediation,
  independent source verification, or resolved receipt.
- Avoidable spend: additional disposable/direct diagnosis canaries cannot close
  the remaining user-facing and remediation gates while the supported
  BrowserOS/Touchpoint surface is unavailable.
- Minimum next action: pause this acceptance route until the supported
  BrowserOS/Touchpoint surface is available, then run one fresh context-free
  Tester through the real Health business path, keeping Telegram/Hermes egress
  behind the existing explicit gate.
- Drift check: no unsolicited security, permissions, rollback, backup,
  observability, cleanup, deployment, or other scope expansion is authorized by
  this audit.
