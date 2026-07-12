# Конфигурация

Полная справка по переменным окружения, модели аутентификации и настройке OAuth.

## Переменные окружения Hub (`go-hub/`)

### Аутентификация

| Переменная | Обязательно | По умолчанию | Назначение |
|-----|----------|---------|---------|
| `CTL_TOKEN` | **да** | — | Токен Bearer для админ-API + веб-панели. Сгенерировать с помощью `openssl rand -hex 32`. |
| `ADMIN_PASSWORD` | для OAuth | — | Пароль для HTML-формы `/authorize` (поток OAuth). |
| `OAUTH_CLIENT_SECRET` | для `/mcp` | — | Подписывает токены Bearer OAuth. Сгенерировать с помощью `openssl rand -hex 32`. |
| `PUBLIC_ORIGIN` | рекомендуется | — | Публичный базовый URL (например, `https://your-hub.bezrabotnyi.com`). Используется в OAuth + OpenAPI. |
| `MCP_RESOURCE` | рекомендуется | `$PUBLIC_ORIGIN` | Идентификатор ресурса MCP. |

### Сеть

| Переменная | По умолчанию | Назначение |
|-----|---------|---------|
| `HUB_PORT` | 25900 | Порт прослушивания |
| `HUB_HOST` | 0.0.0.0 | Хост прослушивания |
| `CORS_ORIGINS` | `*` | Разрешенные источники CORS (через запятую) |

### Поведение

| Переменная | По умолчанию | Назначение |
|-----|---------|---------|
| `EXEC_TIMEOUT` | 120 | Максимальное время выполнения команды (секунды) |
| `LOG_LIMIT_B` | 65536 | Бюджет вывода stdout/stderr для каждого агента ShellMCP. Более крупный вывод команды выгружается на диск; бюджеты ответа hub/клиента настраиваются отдельно. |
| `HEARTBEAT_TIMEOUT` | 60 | Секунды до того, как агент будет помечен как неактивный |
| `BACKGROUND_TASK_TTL` | 3600 | Как долго хранятся завершенные фоновые задачи (секунды) |

## Переменные окружения ShellMCP

См. [ShellMCP → Переменные окружения](./SHELLMCP.md#environment-variables).

## Модель аутентификации

GPT-Админ имеет **три** механизма аутентификации — они разные, не путайте их.

### 1. `CTL_TOKEN` (Bearer)

- Используется для: `/admin`, `/admin/api/*`, `/servers`, `/tasks/*`, конечные точки артефактов
- Заголовок: `Authorization: Bearer <CTL_TOKEN>`
- Это токен "админа". Веб-панель и действия пользовательского GPT используют его.

### 2. Bearer OAuth (для `/mcp`)

- Используется для: `/mcp` (MCP remote SSE)
- `/mcp` **не** принимает `CTL_TOKEN` напрямую. Он требует токен Bearer OAuth, который hub подписывает с помощью `OAUTH_CLIENT_SECRET`.
- Клиенты MCP (Claude Desktop, Codex) получают этот токен через поток OAuth.

### 3. `ADMIN_PASSWORD` (форма)

- Используется для: HTML-формы по адресу `/authorize` в потоке OAuth
- Это то, что вводит человек для авторизации клиента OAuth.

### 4. `SHELLMCP_TOKEN` (агент → hub)

- Используется для: `POST /heartbeat` (регистрация агента)
- У каждого агента свой `SHELLMCP_TOKEN` — hub проверяет его при получении сигнала "сердцебиения".

## OAuth

Hub реализует конечные точки OAuth, совместимые с потоком OAuth OpenAI SDK.

### Конечные точки

| Конечная точка | Метод | Назначение |
|----------|--------|---------|
| `/oauth/authorize` | GET/POST | Конечная точка авторизации (показывает форму `ADMIN_PASSWORD`) |
| `/oauth/token` | POST | Конечная точка токена (учетные данные клиента / код авторизации) |
| `/.well-known/oauth-authorization-server` | GET | Метаданные сервера OAuth |

### Настройка

1. Установите `OAUTH_CLIENT_SECRET` на hub (сгенерировать с помощью `openssl rand -hex 32`)
2. Установите `ADMIN_PASSWORD` (это то, что вводит пользователь в форме авторизации)
3. Установите `PUBLIC_ORIGIN` на ваш публичный URL hub
4. Клиенты MCP обнаружат конечные точки OAuth через `/.well-known/...`

### Где установить пароль

В веб-панели: `/admin` → **Безопасность** → установить `ADMIN_PASSWORD` и сгенерировать `OAUTH_CLIENT_SECRET`. Или установить их в качестве переменных окружения при запуске hub.

## Пример `.env`

```bash
# Сгенерировать надежные значения:
# CTL_TOKEN=$(openssl rand -hex 32)
# OAUTH_CLIENT_SECRET=$(openssl rand -hex 32)

CTL_TOKEN=generate-a-strong-random-token
ADMIN_PASSWORD=choose-a-strong-password
OAUTH_CLIENT_SECRET=$(openssl rand -hex 32)
PUBLIC_ORIGIN=https://your-hub.example.com
MCP_RESOURCE=https://your-hub.example.com
```

## См. также

- [Hub](./HUB.md) — что конфигурируют эти переменные
- [Security](./SECURITY_DOCS.md) — усиление для продакшена
- [API Reference](./API_REFERENCE.md) — какая аутентификация нужна каждой конечной точке
