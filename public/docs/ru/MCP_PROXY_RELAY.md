# GPT‑Админ как защищённый MCP-прокси/релей

GPT‑Админ может выставлять каждый зарегистрированный MCP-сервер через два публичных, аутентифицированных слоя совместимости:

1. **MCP-совместимый эндпоинт** для MCP-клиентов: Claude Desktop, Codex, OpenCode, Cursor-подобных инструментов и любых клиентов, умеющих MCP по HTTP.
2. **Эндпоинт OpenAPI Action** для Custom GPT в ChatGPT и других клиентов с OpenAPI Action.

Так реальные MCP-серверы остаются на частных машинах — за NAT, за stdio или за внутренним туннелем, — а внешние ИИ-клиенты получают одну HTTPS-точку входа с аутентификацией GPT‑Админ, аудитом, маршрутизацией, очередями и обработкой вывода.

## Зачем ставить GPT‑Админ на входе

- Одна публичная HTTPS-точка вместо кучи открытых MCP-серверов.
- Защита Bearer/OAuth на шлюзе.
- Стабильные URL и slug для каждого сервера.
- Работает со stdio MCP, remote MCP, shell-коннекторами и внутренними инструментами хаба.
- OpenAPI-схемы генерируются из ответа `tools/list` upstream MCP, поэтому схема Action всегда соответствует реальному набору инструментов.
- Запросы проксируются только в выбранный MCP-сервер; Custom GPT видит только OpenMemory, только FileShare или любой другой один сервер — без полной поверхности релея.

## Раскладка URL

Допустим, хаб опубликован по адресу:

```text
https://hub.example.com
```

Каждый зарегистрированный MCP-сервер получает slug, он виден в `/admin` и в `GET /mcp-relay/servers` в `meta.public_mcp_slug`.

| Назначение | URL |
|------------|-----|
| MCP-совместимый эндпоинт | `https://hub.example.com/server/{slug}/mcp` |
| Карточка сервера / discovery | `https://hub.example.com/server/{slug}/card` |
| Здоровье | `https://hub.example.com/server/{slug}/health` |
| OpenAPI Action (YAML) | `https://hub.example.com/server/{slug}/actions/openapi.yaml` |
| OpenAPI Action (JSON) | `https://hub.example.com/server/{slug}/actions/openapi.json` |
| Вызов инструмента Action | `POST https://hub.example.com/server/{slug}/actions/tools/{tool_name}` |

Старый маршрут `/agent/{slug}/...` оставлен как алиас совместимости, новым клиентам лучше использовать `/server/{slug}/...`.

## Пример: открыть только OpenMemory в Custom GPT

Укажите в импорте Action редактора GPT этот URL схемы:

```text
https://hub.example.com/server/openmemory/actions/openapi.yaml
```

В блоке аутентификации выберите API key / bearer token и подставьте токен GPT‑Админ, который принимает ваш хаб.

Сгенерированная схема будет содержать инструменты OpenMemory:

```text
openmemory_query
openmemory_store_project
openmemory_store
openmemory_list
```

Она не будет включать инструменты релея вроде `call_mcp_tool`, если только выбранный сервер не внутренний `hub`.

Прямой вызов Action выглядит так:

```bash
curl -fsS \
  -H 'Authorization: Bearer <GPTADMIN_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{"query":"deployment notes","project_id":"gptadmin","k":3}' \
  https://hub.example.com/server/openmemory/actions/tools/openmemory_query
```

Форма ответа:

```json
{
  "server_id": "OpenMemory",
  "tool_name": "openmemory_query",
  "status": "completed",
  "response": {
    "content": [
      {"type": "text", "text": "..."}
    ]
  }
}
```

## Пример: подключить MCP-совместимый клиент

Когда клиент уже говорит по MCP, используйте per-server MCP URL:

```text
https://hub.example.com/server/openmemory/mcp
```

Этот эндпоинт принимает стандартные JSON-RPC-методы MCP:

```text
initialize
tools/list
tools/call
resources/list
resources/read
prompts/list
prompts/get
```

Для полной поверхности хаба:

```text
https://hub.example.com/server/hub/mcp
```

Для одного upstream-сервера — его slug:

```text
https://hub.example.com/server/fileshare/mcp
https://hub.example.com/server/chromedevtools-roomhacker-server-100/mcp
https://hub.example.com/server/openmemory/mcp
```

## Как генерируются схемы

Когда клиент запрашивает:

```text
GET /server/{slug}/actions/openapi.yaml
```

GPT‑Админ резолвит `{slug}` в ровно один зарегистрированный MCP-сервер, вызывает `tools/list` и превращает каждый MCP-дескриптор инструмента в OpenAPI-операцию `POST /server/{slug}/actions/tools/{tool_name}`. `inputSchema` из MCP становится схемой тела запроса в OpenAPI.

Это значит:

- добавление нового MCP-инструмента автоматически обновляет OpenAPI Action;
- удаление инструмента убирает его из сгенерированной схемы;
- per-server Custom GPT остаются компактными и сфокусированными;
- не нужно вручную поддерживать большие OpenAPI-файлы.

## Заметки по безопасности

- Не выставляйте голые stdio MCP-серверы напрямую в интернет — поставьте перед ними GPT‑Админ.
- Используйте HTTPS для публичных хабов.
- Используйте сильные bearer/OAuth-учётные данные и ротируйте их, если ими делились с Custom GPT или MCP-клиентом.
- Для Custom GPT отдавайте предпочтение per-server OpenAPI-схемам, когда GPT нужна одна возможность.
- Полную поверхность `/server/hub/mcp` или Apps SDK GPT‑Админ давайте только тем клиентам, которым действительно нужен весь релей/админ.

## Смотрите также

- [API Reference](./API_REFERENCE.md)
- [Integrations](./INTEGRATIONS.md)
- [Security](./SECURITY_DOCS.md)
- [Hub](./HUB.md)