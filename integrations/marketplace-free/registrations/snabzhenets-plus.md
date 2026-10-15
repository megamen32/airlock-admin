# SNABZHENETS+ — api-key-and-real-read (Integration API работает)
- статус: created+emailverified+moderation-passed → API-ключ выпущен, реальный read подтверждён
- основание: https://snabplus.com/register , API docs https://docs.snabplus.com/api/ , OpenAPI https://airlock-demo.snabplus.com/docs-json
- signup/login: https://airlock-demo.snabplus.com/login , email: airlock@bezrabotnyi.com, auth: password (пароль сервиса получен письмом после модерации 15.10)
- портал: airlock-demo.snabplus.com; tenant 43c06f65-6e60-4439-b374-80e476f1b5e5, user 93f719b6-03c0-4b84-b684-f03a960168ba, департамент 4295305d-74f7-4143-8ab7-4ace3b9bc9d2
- trial/квота: лицензия 1 день активирована 15.10 и истекает 16.10.26; продление до 40 дней — ручной шаг «Продлить» в портале с подтверждением через MAX/Telegram (требует человека, НЕ делали)
- креды ref: ~/.config/airlock-marketplace-accounts/snabzhenets-plus.json (пароль + api_key; backup: yadisk:Backups/marketplace-accounts/, status OK rc=0 2026-10-15)
- API-проверка: POST /api/v1/api-keys (Bearer-сессия) → ключ airlock-wave3-readonly-20261015 (id cb7c6101-43d9-4581-9412-b16b0a3c7c75, scope purchase_requisitions.read); GET /api/v1/integration-api/meta c X-API-Key → 200 (v1, scopes, resources: purchase-requisitions list/get); GET /api/v1/integration-api/purchase-requisitions?limit=5 → 200, items содержит реальную заявку number AIRLOCK-DEMO-001 (id 51c11e0a-f038-43ab-8f92-93ce99aa183c)
- ключи в портале: наш + отдельный «Airlock-demo-readonly-20261015» (создан 02:13Z 15.10 другим владельцем процесса, вероятно root; не трогали)
- блокеры: срок лицензии — после 16.10.26 часть функций ограничится; продление только вручную человеком
