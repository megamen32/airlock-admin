# GPT-Админ

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![Self-hosted](https://img.shields.io/badge/Self--hosted-yes-green.svg)](#)
[![MCP](https://img.shields.io/badge/MCP-compatible-violet.svg)](#)

**Один MCP-хаб — любой AI управляет любой инфраструктурой.**

GPT-Админ — это самохостедный MCP-хаб, который стоит между вашим
AI-ассистентом и вашими серверами. Подключайте к хабу серверы и любые
MCP-инструменты, затем подключайте свой AI через один из трёх адаптеров.
Управляйте всем — от админки серверов до запуска субагентов — из ChatGPT,
Claude, Codex, DeepSeek, Qwen, даже Яндекс Алисы или Сбер GigaChat.

> 🌐 Сайт и актуальные доки: **https://gptadmin.bezrabotnyi.com**
> 📚 Полные доки в этом репо: **[docs/](./docs/Home.md)** — архитектура, адаптеры, хаб, установка, конфиг, API, безопасность, FAQ
> 📦 Установка: `curl -s https://raw.githubusercontent.com/megamen32/gptadmin_opensource/main/deploy/install.sh | bash`

> ℹ️ В этом репо также лежит вендорный subtree-merge
> [airlockrun/airlock](https://github.com/airlockrun/airlock) для
> операционных нужд (см. `airlock/` и `AIRLOCK_ADMIN.md`). Основной
> продукт здесь — GPT-Админ.

---

## Зачем

Большинство «AI-админок серверов» — либо облачные, либо привязаны к одному
AI, либо требуют платный API. GPT-Админ устроен иначе:

- **Самохостед** — ваши серверы, ваш хаб, ваши токены. Ничего не утекает.
- **Любой AI** — ChatGPT, Claude, Codex, OpenCode, DeepSeek, Qwen, Алиса,
  GigaChat. Даже бесплатные веб-чаты работают через браузерное расширение.
- **MCP-нативно** — хаб говорит MCP remote SSE, любой MCP-клиент подключается.
  Подключайте chrome-devtools, openmemory или что угодно ещё.
- **Реальное исполнение** — не «вот команда, скопируй». Агент читает
  состояние, выполняет команды, валидирует, отчитывается фактическим выводом.
- **Опциональные relay и webhook** — когда нужны, GPT-Админ умеет выставлять
  один MCP-сервер наружу или роутить webhook-события через документированные
  поверхности. Начните с быстрого пути ниже; дополнительные документы — если
  реально нужно.

## Как это работает

```
   MCP-инструменты подключаются         AI подключаются (3 адаптера)
  ┌─────────────────┐                  ┌──────────────────────────┐
  │ shellmcp        │                  │ Claude · Codex           │ (MCP-клиент)
  │ chrome-devtools │  ──►  ┌────────┴─────────────┐              │
  │ openmemory      │       │   GPT-Админ         │  ──►  │ DeepSeek · Qwen  │ (расширение)
  │ любой MCP       │  ◄──  │   MCP-хаб           │       │ Алиса · GigaChat │
  └─────────────────┘       └──┬─────────────────┘  ──►  │ ChatGPT · OpenUI  │ (OpenAI Action)
                              │                  │       └──────────────────────────┘
                              ▼
                       ваши серверы
                    (Linux · macOS · Windows)
```

Хаб — один процесс. Инструменты подключаются к нему. AI подключаются через
один из трёх адаптеров. Возможности (админка, код, логи, поиск, субагенты)
даёт хаб — независимо от того, какой AI вы используете.

## Быстрый старт

```bash
# 1. Установка (Linux / macOS — авто-определяет user/system режим)
curl -s https://raw.githubusercontent.com/megamen32/gptadmin_opensource/main/deploy/install.sh | bash

# Windows (PowerShell, без Administrator)
iwr -UseBasicParsing https://became.bezrabotnyi.com/install_win.ps1 | iex
```

Установщик печатает один **Hub URL**. Откройте его и выберите самый
короткий путь для вашего клиента:

```text
ChatGPT Custom GPT → импортируйте https://your-hub.example/actions/openapi.yaml
```

Файл Actions генерируется из текущего списка MCP-инструментов хаба. Это
та самая схема, которую импортирует GPT; её не нужно писать руками.

Для аутентификации выберите один из двух путей:

```text
Bearer → вставьте только значение scoped-токена, выданного хабом
OAuth → используйте authorize/token-флоу хаба по Hub URL
```

Существующие legacy-токены остаются валидными, пока владелец явно их
не ротирует или не удалит.

Никогда не вставляйте внутренний сервисный секрет в GPT или клиент. Если
нужен другой адаптер — отдельные доки ниже.

```bash
# 2. Подключите свой AI — выберите один адаптер:
#    - OpenAI Action (ChatGPT Custom GPT / Open WebUI) → см. доки
#    - MCP remote SSE (Claude / Codex / OpenCode)      → см. доки
#    - Браузерное расширение (бесплатные веб-AI)        → см. доки

# 3. Используйте:
#    «поставь nginx», «почини сайт», «покажи логи», «запусти codex для фикса бага»
```

Полные инструкции по адаптерам: **https://gptadmin.bezrabotnyi.com/#/docs**

## Что можно делать через хаб

| Возможность | Пример |
|-------------|--------|
| **Администрирование серверов** | перезапуск systemd-сервисов, управление firewall/nginx/fail2ban/sshd, установка пакетов |
| **Писать и запускать код** | редактировать файлы, запускать type-check/lint/build, запускать субагентов («запусти codex фиксить баг») |
| **Чистить и фиксить PR** | найти форк в памяти, оставить один фича-коммит, force-push через SSH |
| **Проверять логи** | парсить journalctl/nginx/postgres, искать аномалии, предлагать и применять фиксы |
| **Веб-поиск** | через chrome-devtools MCP — агент открывает страницы, читает доки, ищет |
| **Диагностика инцидентов** | найти упавший сервис, прочитать логи, понять причину (ECONNREFUSED, 503, OOM), починить |

## Три адаптера

| Адаптер | Для | Как |
|---------|-----|-----|
| **OpenAI Action** | ChatGPT, Open WebUI | Импортируйте сгенерированную OpenAPI-схему, затем Bearer или OAuth. Без лимитов Codex. |
| **MCP remote SSE** | Claude Desktop, Codex, OpenCode | Хаб — MCP-сервер (Streamable HTTP). Добавляется в `claude_desktop_config.json`. |
| **Браузерное расширение** | DeepSeek, Qwen, Алиса, GigaChat, ChatGPT (free) | Userscript (Tampermonkey/Firefox) добавляет MCP-кнопки в UI веб-чатов. Без платного API. |

Все три подключаются к **тому же хабу**. Те же возможности. Выбирайте,
что подходит вашему AI.

## Пути установки

| ОС | user-mode (по умолчанию) | system-mode (`sudo`) |
|----|--------------------------|----------------------|
| Linux / macOS | `~/.local/share/gptadmin` | `/opt/gptadmin` |
| Windows | `%LOCALAPPDATA%\gptadmin` | `C:\Program Files\gptadmin` |

Установщик авто-определяет режим: без `sudo` → user-mode (домашняя
директория, пользовательский сервис); с `sudo` → system-mode. Домен не
нужен — авто-туннель через FRP или Cloudflare даёт публичный URL.

## Структура проекта

```
go-hub/                  # Go MCP-хаб — проксирует команды агентам
go-shellmcp/             # основной shell-агент (Go) — работает на целевых машинах
cli.py                   # CLI `gptadmin` (setup, tunnel, status, logs)
gptadmin_security.py     # auth, OAuth, валидация токенов
server_for_installer.py  # отдаёт установочные скрипты + OpenAPI
telegram_logs_bot.py     # опциональные Telegram-алерты
deploy/                  # установочные скрипты, systemd, nginx-конфиги
tests/                   # pytest-тесты
docs/                    # OPEN_CORE_PLAN.md и прочее
airlock/                 # вендорный subtree-merge airlockrun/airlock (для опса)
```

> Структура в процессе чистки — см. `docs/OPEN_CORE_PLAN.md` для целевого
> вида и плана open-core запуска.

## Разработка из исходников

```bash
# Хост: Python 3.10+, Go 1.21+ (для go-hub / go-shellmcp)
git clone https://github.com/megamen32/airlock-admin.git
cd airlock-admin

# Python-зависимости для тестов
python3 -m venv .venv && source .venv/bin/activate
pip install pytest pytest-asyncio

# Тесты (pytest находит test_*.py и *_test.py в tests/)
pytest -q

# Hub из исходников
go run ./go-hub/cmd/gptadmin-hub

# ShellMCP-агент из исходников
SHELLMCP_TOKEN=agent-token HUB_URL=http://127.0.0.1:9001 \
  go run ./go-shellmcp/cmd/shellmcp-go
```

## Контрибуция

PR приветствуются. См. [CONTRIBUTING.md](CONTRIBUTING.md) — dev-окружение,
стиль кода, процесс PR. По безопасности — [SECURITY.md](SECURITY.md).

## Лицензия

**GNU AGPL-3.0** — см. [LICENSE](LICENSE).

Хаб, shellmcp, все три адаптера и базовая веб-панель — **свободны
навсегда**. Будущие платные предложения (облачный хостинг, enterprise
SSO/audit/RBAC, расширенная панель, поддержка) живут в отдельном репо —
ядро остаётся открытым.

## Ссылки

- 🌐 Сайт и доки: https://gptadmin.bezrabotnyi.com
- 💬 Telegram: [@careviolan](https://t.me/careviolan)
- 📦 Другие проекты: https://bezrabotnyi.com

## Failover: жив и degraded

GPT-Админ умеет держать fallback control plane на случай смерти primary
hub. Fallback-нода наблюдает за публичным health-URL, промоутит себя
только после порога ошибок и держит достаточно сервиса онлайн, чтобы
прочитать логи, дотянуться до выживших серверов и восстановить primary.

Это graceful degradation, а не магия multi-master replication: свежие
in-memory счётчики или джобы, выполнявшиеся ровно на упавшей ноде,
могут быть устаревшими. Но очереди, метаданные фоновых джоб, большие
stdout/stderr spill-файлы, shellmcp spool-файлы, ответы outbox,
снапшоты реестра и логи failover пишутся на диск, поэтому recovery
не теряется навсегда.

См. **[docs/FAILOVER.md](./docs/FAILOVER.md)**.

## Показать публичные URL

Используйте CLI для печати активного hub URL, режима туннеля, MCP-эндпоинтов
и per-server OpenAPI Action схем:

```bash
sudo gptadmin urls
sudo gptadmin urls --all
sudo gptadmin urls --json
```

Вывод по умолчанию фокусируется на hub и ShellMCP. `--all` дополнительно
включает все зарегистрированные MCP-серверы (OpenMemory, FileShare,
Chrome DevTools и т.д.).

## Опциональные возможности

Если позже нужен single-server relay или webhook ingress, используйте
отдельные доки:

- [MCP Proxy Relay](./docs/MCP_PROXY_RELAY.md)
- [Webhooks](./docs/WEBHOOKS.md)
