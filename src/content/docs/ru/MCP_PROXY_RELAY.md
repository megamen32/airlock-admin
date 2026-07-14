# GPTAdmin как безопасный прокси/ретранслятор MCP

GPTAdmin может предоставлять доступ к каждому зарегистрированному серверу MCP через два общедоступных уровня совместимости с проверкой подлинности:

1. **MCP-совместимая конечная точка** для клиентов MCP, таких как Claude Desktop, Codex, OpenCode, инструментов, подобных Cursor, или любого клиента, который может использовать MCP через HTTP.
2. **Конечная точка действия OpenAPI** для пользовательских GPT ChatGPT и других клиентов действий OpenAPI.

Это позволяет вам размещать настоящие серверы MCP на частных машинах, за NAT, за stdio или за внутренним туннелем, одновременно предоставляя внешним клиентам AI одну точку входа HTTPS с аутентификацией GPTAdmin, ведением журнала аудита, маршрутизацией, очередями и обработкой вывода.

## Зачем использовать GPTAdmin в качестве входной двери

— Одна общедоступная конечная точка HTTPS вместо предоставления доступа к множеству серверов MCP.
- Защита носителя/OAuth на шлюзе.
- Стабильные URL-адреса и пули для каждого сервера.
- Работает со стандартным MCP, удаленным MCP, соединителями оболочки и внутренними инструментами концентратора GPTAdmin.
- Схемы OpenAPI генерируются на основе ответа вышестоящего сервера MCP `tools/list`, поэтому схема действий соответствует реальному набору инструментов.
- Звонки проксируются только на выбранный сервер MCP; Пользовательский GPT может видеть только OpenMemory, только FileShare или любой другой отдельный сервер, не видя полного ретранслятора GPTAdmin.

## Макет URL-адреса

Предположим, ваш хаб опубликован по адресу:

```text
https://hub.example.com
```

Каждый зарегистрированный сервер MCP получает пул, видимый в `/admin` и в `GET /mcp-relay/servers` под `meta.public_mcp_slug`.

| Цель | URL-адрес |
|---------|-----|
| Конечная точка, совместимая с MCP | `https://hub.example.com/server/{slug}/mcp` |
| Серверная карта/обнаружение | `https://hub.example.com/server/{slug}/card` |
| Здоровье | `https://hub.example.com/server/{slug}/health` |
| Схема действий OpenAPI | `https://hub.example.com/server/{slug}/actions/openapi.yaml` |
| Схема действий OpenAPI, JSON | `https://hub.example.com/server/{slug}/actions/openapi.json` |
| Вызов инструмента действий OpenAPI | `POST https://hub.example.com/server/{slug}/actions/tools/{tool_name}` |

Устаревший маршрут `/agent/{slug}/...` сохраняется как псевдоним совместимости, но новым клиентам следует использовать `/server/{slug}/...`.

## Пример: предоставить доступ только OpenMemory к пользовательскому GPT

Используйте этот URL-адрес схемы в редакторе GPT. Импорт действий:

```text
https://hub.example.com/server/openmemory/actions/openapi.yaml
```

Настройте аутентификацию как ключ API/токен носителя и предоставьте токен GPTAdmin, принимаемый вашим концентратором.

Сгенерированная схема будет содержать такие инструменты OpenMemory, как:

```text
openmemory_query
openmemory_store_project
openmemory_store
openmemory_list
```

Он не будет включать инструменты ретрансляции GPTAdmin, такие как `call_mcp_tool`, если только выбранный сервер не является внутренним сервером `hub`.

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

## Пример: подключение MCP-совместимого клиента

Используйте URL-адрес MCP для каждого сервера, если клиент уже говорит на MCP:

```text
https://hub.example.com/server/openmemory/mcp
```

Эта конечная точка принимает стандартные методы MCP JSON-RPC, такие как:

```text
initialize
tools/list
tools/call
resources/list
resources/read
prompts/list
prompts/get
```

Для полной поверхности концентратора GPTAdmin используйте:

```text
https://hub.example.com/server/hub/mcp
```

Для одного вышестоящего сервера используйте его пул:

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

GPTAdmin разрешает `{slug}` ровно одному зарегистрированному серверу MCP, вызывает `tools/list` и преобразует каждый дескриптор инструмента MCP в операцию OpenAPI `POST /server/{slug}/actions/tools/{tool_name}`. MCP `inputSchema` становится схемой тела запроса OpenAPI.

Это означает:

— добавление нового инструмента MCP автоматически обновляет схему действий OpenAPI;
- удаление инструмента удаляет его из сгенерированной схемы;
- пользовательские GPT для каждого сервера остаются небольшими и целенаправленными;
- пользователям не нужно вручную поддерживать большие файлы OpenAPI.

## Выбор цели ретрансляции

У полного ретранслятора-концентратора **нет глобальной цели по умолчанию**. Звоните по номеру `listMcpServers`.
сначала, затем передайте один, возвращенный `server_id` как `target` на `listMcpTools` и
`callMcpTool`. Никогда не отправляйте `target: "default"`: хаб скорее отклонит его, чем
угадывание, какая машина должна получить команду.

Используйте `hub` для работы концентратора/реестра и явную цель `shell:<server>` для
команды, журналы, управление службами и файлы на этом сервере. Для привилегированных
оболочка работает, сохраняйте обычную личность без полномочий root, если только это не будет сделано намеренно.
устанавливает `run_as_user: "root"` или использует `sudo`.

## Примечания по безопасности- Не предоставляйте необработанные серверы MCP stdio непосредственно в Интернет; поставьте GPTAdmin впереди.
- Используйте HTTPS для общедоступных хабов.
– Используйте надежные учетные данные носителя/OAuth и чередуйте их, если они используются клиентом Custom GPT или MCP.
– Отдавайте предпочтение схемам OpenAPI для каждого сервера для пользовательских GPT, когда GPT требуется только одна возможность.
- Используйте `/server/hub/mcp` или SDK GPTAdmin Apps только в том случае, если клиенту действительно необходимы полные возможности ретрансляции/администрирования.

## См. также

- [Справочник API](./API_REFERENCE.md)
- [Интеграции](./INTEGRATIONS.md)
- [Безопасность](./SECURITY_DOCS.md)
- [Hub](./HUB.md)
