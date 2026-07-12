# Интеграции

Четыре способа подключения клиента ИИ к вашему хабу GPTAdmin.

| # | Адаптер | Лучше всего подходит для | Аутентификация |
|---|---------|----------|------|
| 1 | [OpenAI Action](#1-openai-action-custom-gpt) | ChatGPT (Plus/Team/Desktop) Пользовательские GPT | Bearer `CTL_TOKEN` или OAuth |
| 2 | [MCP remote](#2-mcp-remote-streamable-http) | Claude Desktop / Codex / OpenCode / Mavis | Bearer JWT (OAuth) |
| 3 | [OAuth handshake](#3-oauth-handshake) | Поток аутентификации, который питает #1 и #2 | PKCE S256 |
| 4 | [Browser extension](#4-browser-extension) | DeepSeek / Qwen / Alice / любой веб-чат | `Bridge Key` = `CTL_TOKEN` |

Все четыре подключаются к одному и тому же хабу и используют одни и те же инструменты. См. [ADAPTERS.md](./ADAPTERS.md) (более старый обзор трехстороннего соединения) и [GPTADMIN_INSTRUCTIONS.md]() (только для чтения справочник для агентов ИИ).

---

## 1. OpenAI Action (Пользовательский GPT)

**Когда использовать.** Только клиенты семейства ChatGPT: `chat.openai.com`, ChatGPT Desktop, Plus/Team. Любой инструмент, который импортирует схему OpenAPI 3.x. Идеально подходит, когда вы хотите Пользовательский GPT, который вызывает ваш хаб без квот вызовов инструментов по часам в стиле Codex.

**Протокол.** REST + OpenAPI 3.1, Bearer auth, через семейство `/mcp-relay/*` (`list_mcp_agents`, `list_mcp_tools`, `call_mcp_tool`, `get_mcp_job`, `resources/list`, `resources/read`).

**URL схемы.** `https://<your-hub>/actions/openapi.yaml` — канонический, живой URL спецификации. Репозиторий также поставляет `public/openapi.json` (синоним той же спецификации), чтобы вы могли выполнить `curl` локально.

### Как подключить

1. Откройте `https://chatgpt.com/gpts/editor` → **Создать** или отредактировать GPT.
2. **Настроить → Действия → Создать новое действие.**
3. **Импортировать OpenAPI по URL** → `https://<your-hub>/actions/openapi.yaml`.
4. **Аутентификация → Ключ API → Bearer** → вставьте `CTL_TOKEN` (из `config/gptadmin.env` на хосте хаба).
5. **Сохранить.** Пользовательский GPT теперь предоставляет каждую операцию как инструмент.

### Пример

```bash
curl -sS -X POST https://<your-hub>/mcp-relay/list_mcp_agents \
  -H "Authorization: Bearer $CTL_TOKEN" \
  -H "Content-Type: application/json" -d '{}'
```

```text
POST /mcp-relay/call_mcp_tool
{
  "agent_id": "shell:roomhacker-server-100",
  "tool_name": "shell_exec",
  "arguments": { "cmd": "uptime" }
}
```

> **Bearer против OAuth.** Сегодня хаб принимает Bearer `CTL_TOKEN` на `/mcp-relay/*` для быстрой настройки. Для продакшена — области видимости на клиента, ротация, аудит, отзыв — переключите блок аутентификации на OAuth ([§3](#3-oauth-handshake)). Те же конечные точки, более надежная аутентификация.

### Устранение неполадок

- **"Action not found"** — URL схемы недоступен со стороны ChatGPT. Хаб должен быть в публичном HTTPS (Cloudflare Tunnel, публичный домен или зеркало типа `become.bezrabotnyi.com`); `http://localhost` не сработает.
- **401 при каждом вызове** — неверный `CTL_TOKEN` или токен содержит лишние пробелы/переводы строк при копировании.
- **Импорт схемы, инструменты не отображаются** — редактор GPT агрессивно кэширует схемы. Повторно импортируйте.
- **Подробная справка** — см. `docs/CHATGPT_ACTION.md` (устаревший) и `public/openapi.json` для полного списка операций.

---

## 2. MCP remote (Потоковый HTTP)

**Когда использовать.** Любой клиент, поддерживающий MCP — Claude Desktop, Codex, OpenCode, Mavis, Cherry Studio, современные IDE/CLI ИИ. Основной адаптер для инструментов ИИ эпохи 2026 года.

**Протокол.** MCP через потоковый HTTP, JSON-RPC 2.0.

**Конечная точка.** `POST https://<your-hub>/mcp` (также `GET` для обнаружения `initialize`).

**Аутентификация.** Bearer JWT, подписанный HS256 хабом с использованием `OAUTH_CLIENT_SECRET`, срок действия 12 ч, `iss = PUBLIC_ORIGIN`, `aud = MCP_RESOURCE`. Получите его через [§3](#3-oauth-handshake).

> `/mcp` принимает только JWT, выданные через OAuth; `CTL_TOKEN` предназначен для REST/админ API. Локальное исключение: `http://localhost:<порт>/mcp` на самом хосте хаба, где хаб ослабляет аутентификацию (удобно для разработки `claude_desktop_config.json`).

### Как подключить

#### Claude Desktop — `claude_desktop_config.json`

```json
{
  "mcpServers": {
    "gptadmin": {
      "type": "http",
      "url": "https://<your-hub>/mcp",
      "headers": {
        "Authorization": "Bearer  <вставьте JWT здесь>"
      }
    }
  }
}
```

Перезапустите Claude Desktop. Сервер `gptadmin` появится с `list_mcp_agents`, `list_mcp_tools`, `call_mcp_tool`, `get_mcp_job`, `resources/list`, `resources/read`.

#### Mavis

```bash
mavis mcp add gptadmin '{"url":"https://<your-hub>/mcp"}'
mavis mcp auth login gptadmin     # откроет браузер → поток OAuth → запишет JWT
```

#### Codex / OpenCode / другие

Та же структура: MCP-сервер типа HTTP, указывающий на `https://<your-hub>/mcp` с `Authorization: Bearer <JWT>`.

### Обнаружение OAuth

Современные клиенты MCP автоматически обнаруживают сервер аутентификации:

```bash
curl -sS https://<your-hub>/.well-known/oauth-authorization-server
```

```json
{
  "issuer": "https://<your-hub>",
  "authorization_endpoint": "https://<your-hub>/authorize",
  "token_endpoint": "https://<your-hub>/token",
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code"],
  "code_challenge_methods_supported": ["S256"],
  "token_endpoint_auth_methods_supported": ["none"],
  "client_id_metadata_document_supported": true,
  "registration_endpoint": "https://<your-hub>/register",
  "scopes_supported": ["gptadmin.read", "gptadmin.exec"]
}
```

Клиенты, поддерживающие [RFC 8414](https://www.rfc-editor.org/rfc/rfc8414) / [RFC 9728](https://www.rfc-editor.org/rfc/rfc9728), извлекают это, регистрируются по `/register`, выполняют PKCE `authorize → callback → token` и показывают собственную страницу согласия хаба.

### Устранение неполадок

- **401 при каждом запросе** — JWT истек (срок действия 12 ч) или подписан с использованием другого `OAUTH_CLIENT_SECRET`. Повторно выполните поток OAuth.
- **"Transport not supported"** — клиент поддерживает только stdio. Оберните его в `mcp-remote` (`npx -y mcp-remote https://<your-hub>/mcp`) или выберите другой адаптер.
- **Поток останавливается в середине вызова** — корпоративный прокси буферизирует SSE / чанкованные ответы. Принудительно переключите режим опроса на клиенте или используйте туннель без буферизации.

---

## 3. OAuth handshake

**Когда использовать.** Всякий раз, когда вам (или клиенту MCP) нужен Bearer JWT для `/mcp` (адаптер #2) или вы хотите переключить блок аутентификации OpenAI Action с `CTL_TOKEN` на OAuth (адаптер #1). Этот поток **не** является клиентским адаптером — это поток, который **питает** другие два.

**Тип предоставления.** `authorization_code` с PKCE. **Только `S256`** — простые верификаторы отклоняются.

**Области видимости (Scopes).**

- `gptadmin.read` — список серверов / инструментов, чтение ресурсов, чтение заданий.
- `gptadmin.exec` — вызов инструментов (`call_mcp_tool`), постановка заданий в очередь.

Страница `/authorize` хаба перечисляет запрашиваемые области видимости; пользователь вводит пароль администратора для согласия.

### Конечные точки

| Конечная точка | Метод | Назначение |
|----------|--------|---------|
| `/.well-known/oauth-authorization-server` | `GET` | Метаданные эмитента RFC 8414. |
| `/.well-known/oauth-protected-resource` | `GET` | Метаданные ресурса RFC 9728. |
| `/register` | `POST` | Динамическая регистрация клиента — возвращает `client_id = "chatgpt-dynamic"`. |
| `/authorize` | `GET` | Отображает страницу согласия (открыть в браузере). |
| `/authorize` | `POST` | Отправляет форму согласия (`password` = пароль администратора). |
| `/token` | `POST` | Обменивает `code` + `code_verifier` на JWT `access_token`. |

### Поток

1. Клиент генерирует `code_verifier` (случайная строка из 43–128 символов) и
   `code_challenge = BASE64URL(SHA256(verifier))`.
2. Клиент выполняет `POST /register` с `redirect_uris` (например,
   `https://chatgpt.com/connector/oauth/...` или
   `http://127.0.0.1:<порт>/callback` для локальных CLI клиентов) → получает `client_id`.
3. Браузер открывает `GET /authorize?response_type=code&client_id=...&redirect_uri=...&code_challenge=...&code_challenge_method=S256&resource=<hub>&scope=gptadmin.read+gptadmin.exec`.
4. Пользователь просматривает области видимости → вводит пароль администратора → отправляет.
5. Хаб перенаправляет 302 на `redirect_uri?code=...&state=...`.
6. Клиент выполняет `POST /token` с `code`, `code_verifier`, `redirect_uri`, `client_id` → `access_token` (JWT) → сохраняет в конфигурацию MCP.
7. Каждый вызов `/mcp`: `Authorization: Bearer <access_token>`.

### Форма JWT

```json
{
  "sub": "<имя, введенное пользователем, необязательно>",
  "client_id": "chatgpt-dynamic",
  "scope": "gptadmin.read gptadmin.exec",
  "iss": "<PUBLIC_ORIGIN>",
  "aud": "<MCP_RESOURCE>",
  "iat": 1719820000,
  "exp": 1719863200
}
```

> **Список разрешенных URI перенаправления.** `/authorize` по умолчанию принимает только `https://chatgpt.com/connector/oauth/...` и `*.chatgpt.com`. Для других клиентов настройте список разрешенных URI перенаправления OAuth в хабе Go.

### Устранение неполадок

- **`invalid_request: invalid redirect_uri`** — не в списке разрешенных. Используйте канонический `https://chatgpt.com/connector/oauth/...` или ослабьте список разрешенных в хабе.
- **`invalid_grant` на `/token`** — `code_verifier` не соответствует `code_challenge` или истек 5-минутный период кода. Повторно выполните `/authorize`.
- **"expired" при каждом вызове** — срок действия JWT составляет 12 ч. Большинство клиентов MCP повторно запускают поток незаметно.
- **Отзыв всего** — панель администратора по адресу `https://<your-hub>/admin` → **Безопасность → Отзыв всего** ротирует `OAUTH_CLIENT_SECRET` и отключает все активные JWT.

---

## 4. Browser extension

**Когда использовать.** Бесплатные веб-чаты ИИ, которые не поддерживают MCP нативно — DeepSeek, Qwen, Tongyi, Yandex Alice, ChatGPT (бесплатный уровень). Расширение превращает "любой веб-чат" в клиент gptadmin: перехватывает блоки кода ` ```mcp ` , отправляет их на ваш хаб, вставляет результат обратно.

**Артефакт.** `apps/chatgpt-admin-app/` — скрипт пользователя Tampermonkey / Userscript; опубликованная сборка зеркалируется по адресу `public/mcp-bridge.user.js`.

### Как подключить

1. **Установите менеджер скриптов пользователя:**
   - Desktop Chrome / Edge / Brave → [Tampermonkey](https://www.tampermonkey.net/).
   - iPhone / iPad → Safari + приложение [Userscripts](https://apps.apple.com/app/userscripts/id1463298887); включите в Safari → Расширения.
   - Android → Firefox из Google Play + Tampermonkey с [tampermonkey.net](https://www.tampermonkey.net/).
2. **Установите скрипт** — откройте `https://<your-hub>/mcp-bridge.user.js` (или загрузите файл из `apps/chatgpt-admin-app/`). Tampermonkey подхватит метаблок `@userscript` → **Установить**.
3. **Настроить:** нажмите <kbd>Alt</kbd>+<kbd>K</kbd> (или значок клавиши в правом нижнем углу):
   - **Bridge URL** — `https://<your-hub>` (без конечного слеша).
   - **Bridge Key** — ваш `CTL_TOKEN` (тот же, что и в §1).

### Как это работает

Две кнопки, добавленные в интерфейс веб-чата:

- **MCP All** (`Alt+M`) — вставляет краткое описание каждого агента и его инструментов в поле ввода чата и копирует тот же запрос в буфер обмена.
- **MCP** — открывает панель для выбора конкретного агента с подробной документацией по инструментам.

Когда ИИ отвечает блоком JSON, заключенным в ` ```mcp ` , скрипт подсвечивает его, отправляет вызов по адресу `<Bridge URL>/mcp-relay/call_mcp_tool` и заменяет блок ответом хаба.

---

**Полезные советы:**

* **Проблемы с подключением:** Если вы не можете подключиться, проверьте, что ваш брандмауэр не блокирует исходящие запросы на порт, который использует ваш локальный сервер.
* **Обновление:** Если вы обновили API, вам может потребоваться перезапустить клиентское приложение, чтобы изменения вступили в силу.
* **Безопасность:** Никогда не вставляйте секретные ключи или пароли в публичные репозитории. Используйте переменные окружения.
