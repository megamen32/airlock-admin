# Интеграции

Четыре способа подключения AI-клиента к вашему хабу GPTAdmin.

| # | Адаптер | Лучшее для | Авторизация |
|---|---------|----------|------|
| 1 | [OpenAI Action](#1-openai-action-custom-gpt) | ChatGPT (Plus/Team/Desktop) Пользовательские GPT | Носитель `CTL_TOKEN` или OAuth |
| 2 | [MCP пульт](#2-mcp-remote-streamable-http) | Клод Рабочий стол / Кодекс / OpenCode / Мавис | Носитель JWT (OAuth) |
| 3 | [Рукопожатие OAuth](#3-oauth-handshake) | поток аутентификации, который подает №1 и №2 | ПКСЕ S256 |
| 4 | [Расширение браузера](#4-browser-extension) | DeepSeek/Qwen/Алиса/любой веб-чат | `Bridge Key` = `CTL_TOKEN` |

Все четыре используют один и тот же центр и одни и те же инструменты. См. [ADAPTERS.md](./ADAPTERS.md) (старый трехсторонний обзор) и [GPTADMIN_INSTRUCTIONS.md]() (ссылка для агентов ИИ, доступная только для чтения).

---

## 1. Действие OpenAI (пользовательский GPT)

**Когда использовать.** Только для клиентов семейства ChatGPT: `chat.openai.com`, ChatGPT Desktop, Plus/Team. Любой инструмент, который импортирует схему OpenAPI 3.x. Правильный выбор, если вам нужен пользовательский GPT, который вызывает ваш хаб без почасовых квот на вызовы инструментов в стиле Кодекса.

**Протокол.** REST + OpenAPI 3.1, проверка подлинности носителя. Компактный поток — `discover → schema → execute`; `job` опросы фоновые работают. Устаревшие длинные имена остаются принятыми, но не рекламируются.

**URL-адрес схемы.** `https://<your-hub>/actions/openapi.yaml` — каноническая спецификация, обслуживаемая в реальном времени. В репозиторий также входит `public/openapi.json` (синоним той же спецификации), так что вы можете `curl` его локально.

### Как подключиться

1. Откройте `https://chatgpt.com/gpts/editor` → **Создать** или изменить GPT.
2. **Настроить → Действия → Создать новое действие.**
3. **Импортировать OpenAPI по URL** → `https://<your-hub>/actions/openapi.yaml`.
4. **Аутентификация → Ключ API → Носитель** → вставьте `CTL_TOKEN` (из `config/gptadmin.env` на хосте концентратора).
5. **Сохранить.** Пользовательский GPT теперь представляет каждую операцию как инструмент.

### Пример

```bash
curl -sS -X GET https://<your-hub>/mcp-relay/servers \
  -H "Authorization: Bearer $CTL_TOKEN" \
  -H "Content-Type: application/json" -d '{}'
```

```text
POST /mcp-relay/call
{
  "target": "shell:roomhacker-server-100",
  "tool": "shell_exec",
  "args": { "cmd": "uptime" }
}
```

> **Bearer против OAuth.** Сегодня концентратор принимает Bearer `CTL_TOKEN` на `/mcp-relay/*` для быстрой настройки. Для производства — области действия для каждого клиента, ротация, аудит, отзыв — переключите блок аутентификации на OAuth ([§3](#3-oauth-handshake)). Те же конечные точки, более строгая аутентификация.

### Устранение неполадок

- **"Действие не найдено"** — URL-адрес схемы недоступен со стороны ChatGPT. Хаб должен находиться на общедоступном HTTPS (Cloudflare Tunnel, общедоступном домене или зеркале в стиле `become.bezrabotnyi.com`); `http://localhost` не подойдет.
- **401 при каждом вызове** — неверный `CTL_TOKEN`, или токен содержит случайные пробелы/переводы строк из-за копирования и вставки.
- **Импортирует схему, инструменты не отображаются** — редактор GPT активно кэширует схемы. Реимпорт.
- **Подробная ссылка** — полный список операций см. в `docs/CHATGPT_ACTION.md` (старая версия) и `public/openapi.json`.

---

## 2. Удаленный MCP (Streamable HTTP)

**Когда использовать.** Любой клиент с поддержкой MCP — Claude Desktop, Codex, OpenCode, Mavis, Cherry Studio, современные AI IDE/CLI. Основной адаптер для инструментов искусственного интеллекта эпохи 2026 года.

**Протокол.** MCP через потоковый HTTP, JSON-RPC 2.0.

**Конечная точка.** `POST https://<your-hub>/mcp` (также `GET` для открытия `initialize`).

**Аутентификация**. Носитель JWT, HS256, подписанный концентратором с использованием `OAUTH_CLIENT_SECRET`, срок действия 12 часов, `iss = PUBLIC_ORIGIN`, `aud = MCP_RESOURCE`. Получите его через [§3](#3-oauth-handshake).

> `/mcp` принимает только JWT, выданные OAuth; `CTL_TOKEN` предназначен для REST/API администратора. Локальное исключение: `http://localhost:<port>/mcp` на самом хосте концентратора, где концентратор ослабляет аутентификацию (удобно для разработчиков `claude_desktop_config.json`).

### Как подключиться

#### Клод Рабочий стол — `claude_desktop_config.json`

```json
{
  "mcpServers": {
    "gptadmin": {
      "type": "http",
      "url": "https://<your-hub>/mcp",
      "headers": {
        "Authorization": "Bearer  <paste JWT here>"
      }
    }
  }
}
```

Перезапустите Клод Рабочий стол. Сервер `gptadmin` предоставляет `discover`, `schema`, `execute`, `job`, `inspect` и `ui`.

#### Мэвис

```bash
mavis mcp add gptadmin '{"url":"https://<your-hub>/mcp"}'
mavis mcp auth login gptadmin     # opens browser → OAuth flow → writes JWT
```

#### Кодекс / OpenCode / другие

Та же форма: сервер MCP типа HTTP, указывающий на `https://<your-hub>/mcp` с `Authorization: Bearer <JWT>`.

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

Клиенты, поддерживающие [RFC 8414](https://www.rfc-editor.org/rfc/rfc8414) / [RFC 9728](https://www.rfc-editor.org/rfc/rfc9728), получают это, регистрируются по адресу `/register`, запускают PKCE `authorize → callback → token` и представляют собственную страницу согласия концентратора.

### Поиск неисправностей- **401 при каждом запросе** — срок действия JWT истек (12 часов TTL) или он подписан под другим номером `OAUTH_CLIENT_SECRET`. Повторно запустите поток OAuth.
- **"Транспорт не поддерживается"** — клиент доступен только для stdio. Оберните `mcp-remote` (`npx -y mcp-remote https://<your-hub>/mcp`) или выберите другой адаптер.
- **Поток останавливается в середине вызова** — корпоративный прокси-сервер буферизует SSE/фрагментированные ответы. Принудительно включите режим опроса на клиенте или используйте туннель без буферизации.

---

## 3. Рукопожатие OAuth

**Когда использовать.** Всякий раз, когда вам (или клиенту MCP) нужен JWT-носитель для `/mcp` (адаптер № 2) или вы хотите переключить блок аутентификации OpenAI Action с `CTL_TOKEN` на OAuth (адаптер № 1). Рукопожатие — это **не** адаптер на стороне клиента — это поток, который **питает** два других.

**Тип гранта.** `authorization_code` с PKCE. **Только `S256`** — простые верификаторы отклоняются.

**Области применения.**

- `gptadmin.read` — список серверов/инструментов, чтение ресурсов, чтение заданий.
- `gptadmin.exec` — выполнить инструменты (`execute`), поставить задания в очередь.

На странице хаба `/authorize` перечислены запрошенные области; пользователь вводит пароль администратора для согласия.

### Конечные точки

| Конечная точка | Метод | Цель |
|----------|--------|---------|
| `/.well-known/oauth-authorization-server` | `GET` | Метаданные издателя RFC 8414. |
| `/.well-known/oauth-protected-resource` | `GET` | Метаданные ресурса RFC 9728. |
| `/register` | `POST` | Динамическая регистрация клиента — возвращает `client_id = "chatgpt-dynamic"`. |
| `/authorize` | `GET` | Отображает страницу согласия (открывается в браузере). |
| `/authorize` | `POST` | Отправляет форму согласия (`password` = пароль администратора). |
| `/token` | `POST` | Обмен `code` + `code_verifier` на JWT `access_token`. |

### Поток

1. Клиент генерирует `code_verifier` (случайные 43–128 символов) и
   `code_challenge = BASE64URL(SHA256(verifier))`.
2. Клиент `POST /register` с `redirect_uris` (например.
   `https://chatgpt.com/connector/oauth/...` или
   `http://127.0.0.1:<port>/callback` для локальных клиентов CLI) → получает `client_id`.
3. В браузере открывается номер `GET /authorize?response_type=code&client_id=...&redirect_uri=...&code_challenge=...&code_challenge_method=S256&resource=<hub>&scope=gptadmin.read+gptadmin.exec`.
4. Пользовательские обзоры → вводят пароль администратора → отправляют.
5. Хаб 302s на `redirect_uri?code=...&state=...`.
6. Клиент `POST /token` с `code`, `code_verifier`, `redirect_uri`, `client_id` → `access_token` (JWT) → сохранить в конфиге MCP.
7. Каждый `/mcp` звоните: `Authorization: Bearer <access_token>`.

### Форма JWT

```json
{
  "sub": "<user-entered name, optional>",
  "client_id": "chatgpt-dynamic",
  "scope": "gptadmin.read gptadmin.exec",
  "iss": "<PUBLIC_ORIGIN>",
  "aud": "<MCP_RESOURCE>",
  "iat": 1719820000,
  "exp": 1719863200
}
```

> **Список разрешенных URI перенаправления.** `/authorize` по умолчанию принимает только `https://chatgpt.com/.../connector/oauth/...` и `*.chatgpt.com`. Для других клиентов настройте список разрешений перенаправления OAuth в Go Hub.

### Устранение неполадок

- **`invalid_request: invalid redirect_uri`** — нет в белом списке. Используйте канонический номер `https://chatgpt.com/connector/oauth/...` или ослабьте список разрешенных на хабе.
- **`invalid_grant` по номеру `/token`** — `code_verifier` не соответствует `code_challenge`, или истекло 5-минутное окно кода. Повторно введите `/authorize`.
- **"истёк" при каждом вызове** — срок жизни JWT составляет 12 часов. Большинство клиентов MCP повторно запускают поток автоматически.
- **Отменить все** — панель администратора по адресу `https://<your-hub>/admin` → **Безопасность → Отозвать все** меняет номер `OAUTH_CLIENT_SECRET` и уничтожает все действующие JWT.

---

## 4. Расширение для браузера

**Когда использовать.** Бесплатные искусственные интеллекты для веб-чата, которые не поддерживают MCP изначально — DeepSeek, Qwen, Tongyi, Yandex Alice, ChatGPT (уровень бесплатного пользования). Расширение превращает «любой веб-чат» в клиент gptadmin: перехватывает ` ```mcp ` код, блокирует исходящие AI, отправляет их POST в ваш хаб, вставляет результат обратно.

**Артефакт.** `apps/chatgpt-admin-app/` — пользовательский скрипт Tampermonkey/Userscripts; опубликованная сборка зеркально отображается по адресу `public/mcp-bridge.user.js`.

### Как подключиться1. **Установите менеджер пользовательских скриптов:**
   - Рабочий стол Chrome / Edge / Brave → [Tampermonkey](https://www.tampermonkey.net/).
   - iPhone/iPad → Safari + [Userscripts](https://apps.apple.com/app/userscripts/id1463298887) приложение; включите в Safari → Расширения.
   - Android → Firefox из Google Play + Tampermonkey из [tampermonkey.net](https://www.tampermonkey.net/).
2. **Установить скрипт** — открыть `https://<your-hub>/mcp-bridge.user.js` (или загрузить файл с `apps/chatgpt-admin-app/`). Tampermonkey подхватывает блок метаданных `@userscript` → **Установить**.
3. **Настройка**: нажмите <kbd>Alt</kbd>+<kbd>K</kbd> (или значок ключа в правом нижнем углу):
   - **URL-адрес моста** — `https://<your-hub>` (без косой черты в конце).
   - **Ключ от моста** — ваш `CTL_TOKEN` (тот же, что и §1).

### Как это работает

В интерфейс веб-чата добавлены две кнопки:

- **MCP All** (`Alt+M`) — вставляет компактное описание каждого агента и его инструментов во ввод чата и копирует это же приглашение в буфер обмена.
- **MCP** — открывает панель для выбора конкретного агента с подробной документацией по инструменту.

Когда ИИ отвечает ` ```mcp ` изолированным блоком JSON, сценарий выделяет его, отправляет POST-вызов на `<Bridge URL>/mcp-relay/call` и заменяет блок ответом концентратора.

> Если автоматическая вставка на сайте с пользовательским редактором не удалась, подсказка всегда находится в буфере обмена — <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>V</kbd>.

### Поддерживаемые сайты (из директивы `@match`)

| Сайт | Статус |
|------|--------|
| `chatgpt.com` | Полная поддержка |
| `chat.deepseek.com` | Полная поддержка |
| `tongyi.aliyun.com` | Полная поддержка |
| `qwenlm.github.io`, `chat.qwenlm.ai`, `chat.qwen.ai` | Полная поддержка |
| `ya.ru`, `yandex.ru`, `alice.yandex.ru`, `chat.yandex.ru` | Полная поддержка |

Чтобы добавить новый сайт, добавьте строку `@match` к `apps/chatgpt-admin-app/public/userscript-header` (или опубликованному `mcp-bridge.user.js`) и переустановите.

### Устранение неполадок

- **Кнопки не отображаются** — для сайта не включен менеджер пользовательских скриптов, или скрипт вышел из строя (панель управления Tampermonkey → скрипт → Ошибки).
- **401 от моста** — неверный `CTL_TOKEN`, или хаб находится на локальном хосте без туннеля (хаб ослабляет авторизацию только на `127.0.0.1`).
- **Нет автовставки** — ИИ выдал код без ограждения ` ```mcp `. Повторно запросите его: *"ответить на звонок внутри огороженного блока с тегом `mcp`".* Альтернативный вариант: вставить из буфера обмена.
- **`GM_xmlhttpRequest` заблокировано** — Настройки сценария Tampermonkey: установите **Запускать по адресу** `document-idle`, убедитесь, что `@grant GM_xmlhttpRequest` находится в блоке метаданных.

---

## Устранение неполадок между адаптерами

- **Где `CTL_TOKEN`?** На хосте хаба: `grep ^CTL_TOKEN config/gptadmin.env`. Поверните, отредактировав файл и `systemctl restart gptadmin-hub`.
- **Хаб недоступен из ChatGPT/Клода/моего клиента** — должен быть общедоступный HTTPS. IP-адреса локального хоста и локальной сети подходят для ручного тестирования, но не для действий ChatGPT или удаленных клиентов MCP. Используйте туннель Cloudflare (см. [TUNNELS.md](./TUNNELS_DOCS.md)) или обратный прокси-сервер с реальным доменом.
- **MCP подключается, но каждый инструмент возвращает «неавторизованный»** — откройте `https://<your-hub>/.well-known/oauth-authorization-server` в браузере; если выдается ошибка 404, маршруты OAuth не включены в вашей сборке хаба. Повторно проверьте, что `apps/chatgpt-admin-app/` развернут (или что обработчики OAuth Go Hub включены).
- **Пользовательский тег GPT не видит действия** – убедитесь, что URL-адрес схемы является общедоступным: `curl -I https://<your-hub>/actions/openapi.yaml` из-за пределов вашей сети. Если 4xx/5xx, туннель/DNS не указывает на концентратор.
- **Расширение браузера не внедряется** — разрешения менеджера пользовательских сценариев: Tampermonkey Dashboard → «Разрешить пользовательские сценарии» должно быть включено; iOS Safari → Настройки → Safari → Расширения → Пользовательские скрипты → Разрешить; Android Firefox → дополнение включено для текущего сайта.
- **Страница согласия OAuth 500** — `PUBLIC_ORIGIN` в `config/gptadmin.env` не соответствует URL-адресу, по которому обращается клиент. Установите для него **точное** происхождение (схема + хост + порт), которое использует клиент.
- **Быстрый выбор клиентом.** ChatGPT (плюс/командный/пользовательский GPT) → [§1](#1-openai-action-custom-gpt). Claude Desktop / Codex / OpenCode / Mavis → [§2](#2-mcp-remote-streamable-http). Бесплатный веб-чат (DeepSeek/Qwen/Alice/ChatGPT бесплатно) → [§4](#4-browser-extension). Все еще застряло → [FAQ](./FAQ.md), [SECURITY_DOCS.md](./SECURITY_DOCS.md) или `https://<your-hub>/admin` для каждого раздела справочной панели.## Безопасный прокси/реле MCP

Для одноцелевой интеграции откройте один зарегистрированный сервер MCP вместо всего ретранслятора GPTAdmin. На каждом сервере есть:

```text
/server/{slug}/mcp
/server/{slug}/actions/openapi.yaml
/server/{slug}/actions/tools/{tool_name}
```

Используйте `/server/openmemory/actions/openapi.yaml` для пользовательского GPT, который должен иметь доступ только к OpenMemory. Используйте `/server/openmemory/mcp` для клиентов, совместимых с MCP. Схема OpenAPI генерируется на основе `tools/list` выбранного сервера, поэтому она соответствует реальным инструментам MCP.

См. [MCP Proxy Relay](./MCP_PROXY_RELAY.md).
