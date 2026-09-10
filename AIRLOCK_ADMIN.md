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
**Маршрут 1 принят 2026-09-10: канарий пройден на живом стенде.** Полная цепочка:
чат airlock → агент `fleet-agent` (LLM minimax/MiniMax-M2.7 через OmniRoute) →
MCP-брокер airlock → хаб gptadmin (`fleetExec`/`shell_exec` на ноде
`shell:roomhacker-server-88`) → вывод `uptime` вернулся в диалог агента.
Штатный approval-флоу хаба отработан: агент получил `approval_required`, админ
апрувнул (`/admin/api/approvals/{id}`), агент повторил вызов с `approval_ids`;
approval отмечен `consumed` в аудите хаба.

Токен агента — роль `client` (право записи только через approval). Отдельный
admin-токен, выпущенный при отладке, ротирован и уничтожен.

Локальные дельты форка airlock (обновляются через `git subtree pull` с конфликтами
в этих местах):

- `airlock/agentapi/mcp_client.go`: клиент терпим к более новой версии протокола
  сервера (хаб gptadmin отвечает 2026-07-28, клиент airlock — до 2025-11-25);
  продолжает говорить своей версией по легаси-пути.
- там же: HTTP 204 на JSON-RPC notification считается успехом (хаб так отвечает).

Известные особенности платформы (не чиним в этом цикле):

- при пересборке агента URL существующего MCP-need не обновляется — потребовалась
  ручная правка строки в `agent_mcp_servers` dev-базы;
- схемы инструментов MCP синкаются только при старте контейнера агента — после
  смены инструментария хаба нужен рестарт агента (toolCount 0 → 15);
- имя машины в mesh — `shell:roomhacker-server-88` (не `server-100`).

## Публичная развёртка (2026-09-10)

- **https://airlock.bezrabotnyi.com** — nginx vhost (ServersAdministartion/nginx-dev,
  коммит `d4bbd27`): `127.0.0.1:8444 ssl` + WS-upgrade → airlock caddy-proxy
  (`127.0.0.1:4280`, TLS_MODE=proxy, CADDY_TRUSTED_PROXIES=127.0.0.1). Сертификат
  Let's Encrypt (webroot /var/www/letsencrypt).
- Конфиг в `airlock/.env` (не в git): DOMAIN=airlock.bezrabotnyi.com,
  PUBLIC_URL=https://airlock.bezrabotnyi.com. **JWT_SECRET ротирован** —
  публично известный dev-секрет из открытого репо airlock неприемлем для
  публичного инстанса (фордж админ-JWT).
- Аккаунты: `roomhacker@bezrabotnyi.com` (админ, выдан владельцем) и
  `admin@airlock.local` (операционный, локальный). roomhacker имеет grant admin
  на агента fleet-admin.
- Уроки: (1) `nginx -s reload` может молча не примениться — после каждого reload
  обязательна живая проба curl; (2) airlock Create-юзера всегда генерит
  temp-password и игнорирует переданный — пароль выставляется прямым bcrypt-хэшем
  в dev-БД; (3) members API не создал grant — вставлен напрямую в agent_grants.

### Реинкарнация 2026-09-10 (починка 502)

Через несколько часов после первой публикации публичный логин перестал
работать: nginx отдавал `502 Bad Gateway`, в логах caddy-proxy — `dial tcp
172.17.0.1:8080: connect: connection refused`. Нативный airlock backend не был
запущен: `make dev` поднимает его в foreground, и при завершении прошлой сессии
`go run ./cmd/airlock serve` умер.

Восстановление:

1. `airlock-caddy-proxy-1` пересоздан с актуальными секретами (ротация из
   первой сессии уже была в `.env`, контейнер нужно было лишь переподнять).
2. Хост-биндинги rustfs (`42900`) и postgres (`42432`) восстановлены полным
   `docker compose up -d postgres rustfs caddy-proxy` — `up -d <single>`
   теряет биндинги у остальных сервисов.
3. Backend запущен в фоне: `cd airlock && set -a && . ./.env && set +a &&
   nohup go run ./cmd/airlock serve &`, слушает `127.0.0.1:8080`.
4. `POST /auth/login` через nginx возвращает 200 + accessToken;
   `/api/v1/agents` отдаёт `fleet-admin` под `roomhacker`.

Ловушки:

- `ENCRYPTION_KEY=000…deadbeef` — дефолт из `.env.dev.example` отвергается
  валидатором вне `localhost`. Боевой ключ — `openssl rand -hex 32`.
- `ENCRYPTION_KEY_REWRAP=true` с потерянным `ENCRYPTION_KEY_OLD` падает с
  `secret storage migration failed: unknown key ID` (в БД остались записи
  `agents.db_password`, зашифрованные уже не существующим ключом). Сейчас
  rewrap выключен (`ENCRYPTION_KEY_REWRAP=false`) — `fleet-admin` в этом
  dev-инстансе не запускается, его `db_password` не используется.
- В логах caddy-proxy SPA обращается по пути `/auth/login` (без `/api`);
  внешний curl нужно слать так же.

Подтверждённый E2E:

```
$ curl -sS -i -X POST https://airlock.bezrabotnyi.com/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"email":"roomhacker@bezrabotnyi.com","password":"<REDACTED-PASSWORD>"}'
HTTP/2 200  content-type: application/json  via: 1.1 Caddy
{"accessToken":"eyJ...","user":{"email":"roomhacker@bezrabotnyi.com","tenantRole":"TENANT_ROLE_ADMIN",...}}
```
