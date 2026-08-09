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
