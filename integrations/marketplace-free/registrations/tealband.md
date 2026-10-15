# TealBand — externalblocked (выпуск personal API-токена недоступен)

- статус: externalblocked (аккаунт+организация+демо-опрос живы, роль Владелец; токен не выдан)
- основание: https://app.teal.band/docs/integrations/api-tokens ; https://app.teal.band/pricing
- signup/login: https://app.teal.band/register, email: airlock@bezrabotnyi.com, auth: password
- trial/квота: тариф Basic «0$ за старт», оплата только за расход токенов AI-анализа с баланса
- account/workspace IDs: организация Airlock `01m4y767tj6bg6w5jfzh6nqz25`; опрос «Демо-опрос Airlock» `01m4y7awpkd9150pkpt96x2y00` (draft, 1 категория, 3 публичных вопроса типа «Шкала»)
- креды ref: ~/.config/airlock-marketplace-accounts/tealband.json (backup: yadisk:Backups/marketplace-accounts/, статус OK, store.sh rc=0 2026-10-15)
- API-проверка: GET https://app.teal.band/api/v1/01m4y767tj6bg6w5jfzh6nqz25/surveys (сессионная cookie-авторизация) → HTTP 200, `data.surveys[]` содержит наш опрос (id, name, status=draft); Bearer-проверка невозможна — токен не выдан (см. блокеры)
- блокеры:
  1. POST https://app.teal.band/api/v1/personal-access-tokens → HTTP 403 `{"message":"This action is unauthorized."}` — воспроизведено 2026-10-15 из авторизованной браузерной сессии с корректным X-XSRF-TOKEN (fetch in-page): отказ серверной политики, не CSRF.
  2. Гипотеза «403 = неподтверждённый email» опровергнута: письма от teal.band в ящике нет (проверены все 30 последних почтовых чатов UserIO), в профиле нет контрола подтверждения email, аккаунт полностью рабочий (роль Владелец).
  3. Официальные docs (https://app.teal.band/docs/integrations/api-tokens) описывают персональные токены БЕЗ привязки к тарифу: «Откройте профиль внутри организации и перейдите в раздел API-токены», «Он заменяет браузерную сессию в API-запросах и действует от имени пользователя, который его выпустил», «В текущей версии токены не настраиваются по отдельным scopes». Профиль содержит секцию «API-токены» со ссылкой «Управлять токенами» → `/{org}/profile/api-tokens`, но эта страница зависает при загрузке: 2 попытки навигации — «Operation timed out» (60 c), Runtime.evaluate CDP-таймаут; остальные страницы app.teal.band грузятся нормально. Выпуск токена через UI не завершён.
  4. Альтернатива на следующий заход: MCP-подключение https://app.teal.band/mcp (docs прямо рекомендуют его для AI-агентов: «Если нужен внешний AI-агент с ограниченными scopes, используйте MCP-подключение, а не персональный API-токен») — требует интерактивного OAuth, не проверялся.


## Проверка OAuth MCP root — 15 октября, 05:40МСК

Точные официальные docs `/docs/integrations/mcp-agent` подтверждают endpoint
`https://app.teal.band/mcp`, Streamable HTTP и OAuth с отдельными scopes.
DCR `POST /oauth/register` действительно вернул201; отдельный клиент
«Airlock Demo read-only» создан. В настоящем headed44 браузере выполнен вход,
показано согласие только `analytics:read` («Ничего не меняет»), дано согласие.
PKCE/S256 + state проверены, одноразовый локальный callback принят в ограниченном
процессе; `POST /oauth/token` вернул200 с access/refresh token. Срок access
`expires_in=31536000` секунд. Все новые доступы немедленно сохранены в том же
private ref и скопированы на вторую копию100 и Яндекс.Диск с readback.

Однако настоящее MCP выполнение остаётся заблокировано поставщиком: POST `/mcp`
`initialize` и `tools/list` возвращают HTTP404 с пустым телом даже с выданным
Bearer. Проверены JSON/event-stream Accept и две версии протокола; до входа
также404 с100 и88. Metadata well-known содержат корректный JSON OAuth, но
почему-то сами имеют HTTP404. REST `/api/v1/<org>/surveys` с OAuth token
возвращает401 (сессионный запрос раньше200); cookie в публичное демо не выносится.
Не создаётся ложная готовая карточка Airlock. Аккаунт/опрос/клиент сохранены;
следующий шаг — восстановленный MCP endpoint поставщика или действующий
self-service personal API token. Контакт с менеджером не отправлялся.
Private receipts: `.tmp/tealband-oauth-20261015/`.

## Дополнение wave3 (15.10, zcode-p3): официальный OAuth/MCP путь
- OAuth-инфраструктура полностью рабочая и заскриптована: POST /oauth/register — динамическая регистрация клиента 201 (сервер выдаёт scope mcp:use), GET /oauth/authorize c PKCE S256 — consent-страница, POST approve — 302 с code, POST /oauth/token — 200 (access+refresh). Креды: ~/.config/airlock-marketplace-accounts/tealband-mcp-oauth.json (backup 100+Диск OK rc=0). Scope по authorize принимается analytics:read (mcp:use на authorize → invalid_scope — несоответствие на стороне сервиса).
- Блокер MCP: POST https://app.teal.band/mcp → HTTP 404 на ЛЮБОЙ запрос (с валидным Bearer, без токена, с мусорным, OPTIONS тоже 404 при allow: POST) — Streamable HTTP endpoint из официальных docs (/docs/integrations/mcp-agent, обещанный для Claude/Codex/OpenCode) фактически отсутствует/отключён на app.teal.band.
- Блокер REST: /api/v1/{org}/surveys с OAuth Bearer → 401 Unauthenticated (REST принимает только personal API tokens, выпуск которых на бесплатном Basic: POST personal-access-tokens → 403 policy, страница /{org}/profile/api-tokens зависает).
- Рабочий бесплатный программный доступ: сессионная cookie-авторизация, GET /api/v1/{org}/surveys → 200 с нашим опросом (подтверждено ранее).
