# Airlock-Admin

Объединённый репозиторий: **GPTAdmin × Airlock**. GPTAdmin — удобный сайдкар на машины
для ИИ (MCP-хаб управления инфраструктурой), Airlock — готовый слой безопасности учётных
записей и платформа AI-приложений. Цель репозитория — управлять машинами через MCP из
любого ИИ и закрывать доступ к этому управлению аккаунтами/авторизацией Airlock.

## Провенанс

- `airlock/` — вендорный subtree-форк [airlockrun/airlock](https://github.com/airlockrun/airlock)
  @ `3603d51` (v0.6.3, 2026-09-03), AGPL-3.0, © Oleg Karpov. Полная история коммитов
  сохранена и достижима: `git log --oneline --graph -20` (subtree-merge `04fb498`,
  второй родитель — вся цепочка airlockrun/airlock).
- Остальное дерево — [megamen32/gptadmin](https://github.com/megamen32/gptadmin)
  (AGPL-3.0-only), remote `gptadmin`.

Обновление вендорной копии (история сохраняется):

```bash
git remote add airlock https://github.com/airlockrun/airlock.git   # один раз
git subtree pull --prefix=airlock airlock main
```

## У кого что сильное

| Слой | GPTAdmin | Airlock |
|------|----------|---------|
| Управление машинами | ✅ MCP-хаб + ноды `shellmcp` на серверах, fleet-exec, CloudOS UI, browser-os; живые деплои | — (управляет своими app-контейнерами, не чужим парком) |
| Доступ AI-клиентов | ✅ JWT bearer для MCP-клиентов, secret-request flow | ✅ agentsdk/goai/sol — среда исполнения агентов |
| Аккаунты и вход | — (один владелец) | ✅ users, user_sessions, passkeys, device_login, OAuth-сервер |
| Авторизация | — (токен = полный доступ) | ✅ authz-движок: grants, principals, policies, resources; auth/lockout по IP |
| Платформа приложений | — | ✅ builder (Go-приложения из промпта), connectors, bridges, субдомены/caddy |

Суть: GPTAdmin силён в «руках» (реальный контроль машин), Airlock — в «пропуске»
(кто и что вправе делать). Ни один из них не закрывает задачу другого.

## Интеграция — Proposed (план, реализация не начата)

Решение о маршруте не принято (владелец выбрал «сначала план», 2026-09-10).
Проверенные по коду предпосылки: хаб отдаёт MCP-эндпоинт `/mcp` с Bearer-JWT и ролями
(`go-hub/internal/hub/access_profiles.go`, `access_admin_roles.go`); airlock-приложения —
Go-агенты на `agentsdk`, для которых внешние MCP-серверы подключаются штатно
(`go tool air mcp probe <url>` → `RegisterMCP`), токен хранится в credentials airlock,
а не в коде (`builder/prompt/agentbuilder.tmpl`, `api/credentials.go`).

### Маршрут 1 — «Airlock-оболочка» (рекомендован)

Логин/чат/права — airlock; парк машин gptadmin доступен внутри airlock-агента как
MCP-инструменты хаба. Слои прав разделены: airlock решает, кто пользуется агентом
(аккаунты, grants), токен хаба — что агенту можно (роль на хабе).

- MVP-срез: dev-стек airlock (`docker-compose.dev.yml` + pnpm frontend) → агент с
  `RegisterMCP` на `/mcp` хаба, hub-bearer как credential → canary: реальный диалог в
  web-UI airlock выполняет реальную команду на реальной ноде.
- Оценка: ~4–5 ч активной работы (главная неизвестность — первый подъём dev-стека).
- Выбрасываем в MVP: собственный Fleet-UI (чат-агента достаточно), SSO для CloudOS.

### Маршрут 2 — «CloudOS-оболочка»

Десктоп CloudOS — единственный интерфейс; airlock — identity-провайдер: экран логина в
`cloudos-ui`, хаб дополнительно принимает airlock-токены (JWKS/token-мост в `go-hub`),
на десктопе — лаунчер airlock-приложений.

- MVP-срез: airlock как IdP запущен → логин-экран в cloudos-ui → canary: вход airlock-
  аккаунтом открывает CloudOS, grants решают доступ к Terminal/Finder.
- Оценка: ~6–8+ ч (правки форка macos-web + auth-мост в go-hub; больше своего кода).

### Общая первая вертикаль для обоих маршрутов

Поднять airlock dev-стек локально (docker compose + pnpm), убедиться что логин работает
и `go-hub` достижим из его сети. Это первый шаг любого маршрута.

### Связь маршрутов

Маршруты не исключают друг друга: Маршрут 1 закрывает «один вход и один чат для машин»,
Маршрут 2 позже добавляется поверх как «SSO в CloudOS» на том же токен-мосту.

## Статус

Объединение дерева и сборочные проверки выполнены (см. `.agents/tasks/`).
Маршрут 1 реализован до последнего шага (2026-09-10): airlock dev-стек, провайдер
OmniRoute, токен хаба (client `airlock-fleet-agent`, `/admin/api/mcp/issue-token`),
агент `fleet-agent/` (agentsdk + RegisterMCP на `/mcp` хаба), tools/list хаба
синкнут агенту (15 инструментов). Канарий-чат ждёт живой LLM: free-модели OmniRoute
в момент приёмки лежали апстримом («Model is unavailable»).

Локальные дельты форка airlock (обновляются через `git subtree pull` с конфликтами
в этих местах):

- `airlock/agentapi/mcp_client.go`: клиент терпим к более новой версии протокола
  сервера (хаб gptadmin отвечает 2026-07-28, клиент airlock — до 2025-11-25);
  продолжает говорить своей версией по легаси-пути.
- там же: HTTP 204 на JSON-RPC notification считается успехом (хаб так отвечает).

Известная особенность платформы (не чиним в этом цикле): при пересборке агента
URL существующего MCP-need не обновляется — потребовалась ручная правка строки в
`agent_mcp_servers` dev-базы.
