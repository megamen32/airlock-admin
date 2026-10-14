# TealBand — created (API-токен заблокирован на бесплатном тарифе)

- статус: created (аккаунт+организация+демо-опрос; personal API token не выдаётся — см. блокеры)
- основание: https://app.teal.band/pricing ; /docs/integrations/api-tokens
- signup/login: https://app.teal.band/register, email: airlock@bezrabotnyi.com, auth: password
- trial/квота: тариф Basic «0$ за старт», оплата только за расход токенов AI-анализа с баланса; промокод START5: поля промокода в форме регистрации НЕТ (не применён)
- account/workspace IDs: организация Airlock `01m4y767tj6bg6w5jfzh6nqz25`; опрос «Демо-опрос Airlock» `01m4y7awpkd9150pkpt96x2y00` (draft, 1 категория, 3 публичных вопроса типа «Шкала»: частота использования, популярные функции, что улучшить)
- креды ref: ~/.config/airlock-marketplace-accounts/tealband.json (backup: yadisk:Backups/marketplace-accounts/, статус OK, readback rc=0 2026-10-15)
- API-проверка: GET https://app.teal.band/api/v1/01m4y767tj6bg6w5jfzh6nqz25/surveys (сессионная cookie-авторизация из браузера) → HTTP 200, JSON `data.surveys[]` содержит наш опрос (id, name, status=draft) — endpoint и данные подтверждены; Bearer-проверка невозможна (см. блокеры)
- блокеры: POST https://app.teal.band/api/v1/personal-access-tokens → HTTP 403 `{"message":"This action is unauthorized."}` — выпуск персонального API-токена запрещён политикой на бесплатном Basic (UI «Выпустить токен» есть, бэкенд отказывает); поэтому реальный read с `Authorization: Bearer` не выполнен. Email-подтверждение не требовалось (аккаунт работает без него). MCP https://app.teal.band/mcp требует интерактивного OAuth — не проверялся.
