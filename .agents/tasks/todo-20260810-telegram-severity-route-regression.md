# Telegram severity route test regression

Status: todo
Observed: 2026-08-10

Symptom: full NoticePlace suite reports `147 passed, 1 failed` in
`/home/roomhacker/agents-projects/notify/tests/test_telegram_controls.py::TelegramControlPolicyTests::test_severity_route_overrides_default_chat_and_optionally_sets_topic`.

Smallest evidence: actual route is `{"chat_id":"notice-chat","message_thread_id":"17"}`;
the test expected `{"chat_id":"default-chat"}`.

Blocker: this is a separate Telegram routing contract and may affect Health
topic delivery. It was not changed or investigated during the Hermes profile
fix; resolve only in a bounded Telegram/topic-routing task.
