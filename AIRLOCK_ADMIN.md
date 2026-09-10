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
  `agents.db_password`, зашифрованные уже не существующим ключом). ~~Сейчас
  rewrap выключен~~ **Исправлено тем же днём (см. след. секцию): rewrap выполнен
  с `ENCRYPTION_KEY_OLD=<dev-ключ>`, все 3 секрета перепакованы, fleet-admin
  запускается.**
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

## Харденинг и agent-субдомен (2026-09-10, финал)

Параллельно с починкой 502 двумя сессиями выполнены: полная ротация dev-секретов,
штатный rewrap, перевод бэкенда на systemd и публикация agent-субдомена.

### Секреты — всё dev-выпилено

Ротированы (значения только в `airlock/.env`, не в git): `ENCRYPTION_KEY`,
`JWT_SECRET`, `REVERSE_PROXY_AUTH_SECRET`, `POSTGRES_PASSWORD` и
`AIRLOCK_DB_PASSWORD` (обе через `ALTER ROLE` в живом postgres + правка
`DATABASE_URL`), `S3_SECRET_KEY`. Postgres/rustfs пересозданы с новым env,
аутентификация app-роли новым паролем проверена реально.

**Rewrap по docs/secret-storage.md**: boot с `ENCRYPTION_KEY_OLD=<dev-ключ>` +
`ENCRYPTION_KEY_REWRAP=true` → лог `rewrapped_secrets: 3`, key ID конверта в БД
сменён на текущий (проверено прямым SQL). После этого `REWRAP=false`,
`ENCRYPTION_KEY_OLD` **оставлен** — под dev-ключом могут жить agent-owned
`/seal`-значения; удалять только после их перепечатки. E2E-подтверждение:
`POST /api/v1/agents/{id}/start` → 204, контейнер `airlock-dev-agent-5302d0ae`
поднялся, decrypt-ошибок в журнале нет.

Ключевой ID-факт для диагностики: key ID конверта = `sha256(raw-ключа)[:16]`
(не hex-строка!) — по нему в БД видно, под каким ключом лежит значение:
`substring(db_password from 'airlock-crypto:v2:([0-9a-f]+)')`.

### Backend под systemd

`/etc/systemd/system/airlock.service`: `bin/airlock serve` (собран
`go build -o bin/airlock ./cmd/airlock`), `EnvironmentFile=airlock/.env`,
`Restart=on-failure`, enabled. nohup-вариант из «Реинкарнации» заменён —
переживает ребут и крэш. Инфра-контейнеры поднимать только с dev-overlay и
явным списком сервисов (иначе `up -d` без overlay поднимает контейнерный
airlock, который crash-loop'ится на host-`DATABASE_URL`):

```bash
cd airlock && docker compose -f docker-compose.yml -f docker-compose.dev.yml \
  up -d postgres rustfs caddy-proxy
```

`COMPOSE_PROFILES=bundled-db,bundled-s3,caddy-proxy` (caddy-local снят).

### Agent-субдомен fleet-admin.airlock.bezrabotnyi.com

- DNS: wildcard `*.airlock.bezrabotnyi.com` → 95.165.165.65 уже существовал
  (NS — spaceweb, DNS-01/Cloudflare недоступен ⇒ wildcard-серт невозможен).
- Схема: **per-host LE-сертификат** (webroot, HTTP-01) + отдельный ssl-блок.
  Для каждого нового агента: добавить хост в `server_name` :80-блока → apply →
  `certbot certonly --webroot -w /var/www/letsencrypt -d <slug>.airlock…` →
  добавить ssl-блок → apply. Всё в `ServersAdministartion/nginx-dev/state/files/
  sites-available/airlock.bezrabotnyi.com`, коммиты `e4d1649` + `1b80e13`.
- Анонимный GET субдомена → **401 от airlock-бэкенда** — это штатно
  (`api.SubdomainProxy` требует relay-код; браузерный флоу — через apex
  `/auth/relay` + cookie `__air_session`, host-scoped).

### Операционные ловушки (новые)

- `nginxctl import` оставляет `state/` root-owned — после него
  `sudo chown -R roomhacker:roomhacker state`, иначе refresh падает на temp-файле.
- `nginx-dev-sync.timer` не применяет коммиты, пока checkout грязный: в дереве
  лежат чужие незакоммиченные `debate.bezrabotnyi.com` и `t.gptadmin…`,
  чей контент уже в live (`nginxctl diff` — «no managed drift»). Когда их
  закоммитят, таймер применит HEAD; до тех пор apply вручную (`sudo
  ./nginxctl apply`) + живая проба. deployed-git-sha двигает только таймер.
- Старые nginx workers переживают reload — после каждого apply/reload
  обязательна живая curl-проба (ловушка повторилась на субдомене: первые пробы
  дали 000, ответ появился после явного reload+паузы).

## Хранилище: Яндекс.Диск как S3-бэкенд (2026-09-10)

- **Схема**: airlock → S3-шлюз `rclone serve s3` (127.0.0.1:4281, systemd
  `airlock-s3-gateway.service`, bucket `airlock-storage`) → папка
  `airlock-storage` на Яндекс.Диске (remote `yadisk`, OAuth до 2027). rustfs
  остановлен. VFS-кэш на сервере ограничен 1 ГБ.
- **Presigned-скачивания**: `s3.airlock.bezrabotnyi.com` → 4281 (LE-серт,
  nginx-dev `e45f59f`); `S3_URL_PUBLIC` указывает туда — Host сохраняется,
  SigV4-подписи валидны через наш домен.
- **Провайдер LLM** переключён на публичный `https://omniroute.bezrabotnyi.com/v1`
  (loopback-эндпоинты запрещены сетевой политикой после ухода PUBLIC_URL
  с localhost).
- **Бюджет 10 ГБ**: watchdog `scripts/yadisk_quota_watchdog.sh` каждые 6 ч
  (systemd timer `airlock-yadisk-quota.timer`): журнал + NoticePlace при
  8 ГБ (notice) и 10 ГБ (critical). Для NoticePlace нужен проектный токен —
  NP_TOKEN/NP_EVENTS_URL/NP_PROJECT в шапке скрипта; админ-панель
  notification-center (:8092) на момент настройки висла на рендере дашборда.
- Приёмка: upload через API → объект на Диске → агент процитировал содержимое
  в чате → скачивание по presigned-URL из интернета (HTTP 200).
- Грабли: на сервере два rclone — юнит обязан использовать
  `~/.local/bin/rclone` (v1.74.2); `/usr/bin/rclone` v1.53 не умеет serve s3.
  Флаги сервера у `rclone serve s3` парсятся только после remote-path.
