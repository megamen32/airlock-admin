# Справочник API

Конечные точки REST + MCP, предоставляемые хабом.

## Краткий справочник по аутентификации

| Конечная точка | Аутентификация |
|----------|------|
| `GET /admin` | Basic (`CTL_TOKEN`) |
| `GET /admin/api/*` | Bearer `CTL_TOKEN` |
| `POST /mcp` | OAuth bearer |
| `POST /heartbeat` | Bearer `SHELLMCP_TOKEN` |
| `GET /servers` | Bearer `CTL_TOKEN` |
| `GET /api.json` | нет |
| `GET /openapi.yaml` | нет |
| `POST /authorize` | форма `ADMIN_PASSWORD` |
| `POST /oauth/token` | учетные данные клиента |

См. [Конфигурация → Модель аутентификации](./CONFIGURATION.md#auth-model).

---

## Админ API (`/admin/api/*`)

Аутентификация Bearer с использованием `CTL_TOKEN`. Используется веб-панелью и действиями Custom GPT.

### `GET /servers`

Список зарегистрированных агентов shellmcp.

```json
{
  "servers": [
    { "name": "server-01", "url": "http://10.0.0.5:25901", "alive": true, "last_seen": "2026-06-29T10:00:00Z" }
  ]
}
```

### `POST /exec`

Выполнить команду оболочки на целевом агенте.

```json
{
  "server": "server-01",
  "cmd": "systemctl status nginx"
}
```

Ответ (усечен для экономии токенов, если длинный):

```json
{
  "stdout": "● nginx.service - The nginx HTTP server...",
  "stderr": "",
  "exit_code": 0,
  "truncated": false
}
```

### `GET /tasks/{task_id}`

Получить статус фоновой задачи.

### `POST /file/backup`

Создать управляемую резервную копию файла перед редактированием.

### `GET /system/info?server=server-01`

ЦП, ОЗУ, диск, время работы для целевого агента.

Полная схема: импортируйте `https://became.bezrabotnyi.com/api.json` в ваш клиент.

---

## Конечная точка MCP (`/mcp`)

Аутентификация OAuth bearer. MCP удаленный SSE (потоковый HTTP).

Клиенты MCP (Claude Desktop, Codex, OpenCode) подключаются сюда. Хаб предоставляет
инструменты shellmcp как инструменты MCP:

- `shell_exec` — запустить команду оболочки
- `file_read` — прочитать файл
- `file_write` — записать файл (с резервной копией)
- `file_backup` — создать управляемую резервную копию
- `systemd_status` / `systemd_start` / `systemd_stop` / `systemd_restart`
- `system_info` — ЦП/ОЗУ/диск/время работы
- `system_health` — быстрая проверка работоспособности
- `dir` — список каталогов

См. настройку [Адаптеры → Клиент MCP](./ADAPTERS.md#1-mcp-client).

---

## Конечные точки агентов (shellmcp)

Их вызывает хаб, а не напрямую ИИ. Bearer `SHELLMCP_TOKEN`.

| Конечная точка | Метод | Назначение |
|----------|--------|---------|
| `/exec` | POST | Выполнить команду оболочки |
| `/file` | GET/POST | Чтение/запись файла |
| `/dir` | GET | Список каталогов |
| `/systemd/{action}` | POST | status/start/stop/restart/enable |
| `/system/info` | GET | ЦП/ОЗУ/диск/время работы |
| `/system/health` | GET | Проверка работоспособности |
| `/heartbeat` | POST | Регистрация в хабе (вызывается агентом → хаб) |

---

## OAuth конечные точки

| Конечная точка | Метод | Назначение |
|----------|--------|---------|
| `/oauth/authorize` | GET/POST | Конечная точка авторизации |
| `/oauth/token` | POST | Конечная точка токена |
| `/.well-known/oauth-authorization-server` | GET | Метаданные сервера OAuth |

См. [Конфигурация → OAuth](./CONFIGURATION.md#oauth).

---

## Схема OpenAPI

- `GET /api.json` — Схема JSON (для импорта в Custom GPT / Open WebUI)
- `GET /openapi.yaml` — Схема YAML

Это общедоступные (без аутентификации), чтобы Custom GPT мог импортировать по URL.

## Фоновые задачи

Длительно выполняющиеся команды возвращают `task_id` вместо блокировки:

```json
{ "task_id": "abc123", "status": "running" }
```

Опрашивайте с помощью `GET /tasks/abc123` до тех пор, пока `status: completed`. ИИ делает это
автоматически.

## Усечение вывода

Длинный stdout/stderr разбивается на части. Ответ включает:

```json
{
  "stdout": "...первые 1МБ...",
  "truncated": true,
  "spilled_path": "/tmp/spilled.stdout",
  "preview_head": "...",
  "preview_tail": "..."
}
```

ИИ может прочитать больше по требованию с помощью последующего вызова. Это экономит токены —
ИИ читает только то, что ему нужно для ответа.


## Прокси-действие MCP и OpenAPI для каждого сервера

GPTAdmin предоставляет каждый зарегистрированный сервер MCP через аутентифицированные маршруты для каждого сервера. Замените `{slug}` на `meta.public_mcp_slug` из `GET /mcp-relay/servers`.

| Метод | Путь | Назначение |
|--------|------|---------|
| `GET` / `POST` | `/server/{slug}/mcp` | Конечная точка, совместимая с MCP, для одного сервера |
| `GET` | `/server/{slug}/card` | Карточка обнаружения сервера |
| `GET` | `/server/{slug}/health` | Состояние сервера |
| `GET` | `/server/{slug}/actions/openapi.yaml` | Сгенерированная схема OpenAPI для действий Custom GPT |
| `GET` | `/server/{slug}/actions/openapi.json` | Та же схема, что и JSON |
| `POST` | `/server/{slug}/actions/tools/{tool_name}` | Прокси-вызов действия OpenAPI к одному инструменту MCP |

Схема действий генерируется из `tools/list` выбранного сервера MCP. Тело запроса каждой операции — это `inputSchema` инструмента MCP. Ответ вызова действия оборачивает результат MCP вышестоящего уровня:

```json
{
  "server_id": "OpenMemory",
  "tool_name": "openmemory_query",
  "status": "completed",
  "response": {"content": []}
}
```

См. [Прокси-релей MCP](./MCP_PROXY_RELAY.md) для примеров.
