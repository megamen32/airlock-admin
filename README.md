# Airlock Admin

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)
[![Self-hosted](https://img.shields.io/badge/Self--hosted-yes-green.svg)](#)
[![MCP](https://img.shields.io/badge/MCP-compatible-violet.svg)](#)

**Airlock Admin — это не GPTAdmin и не Airlock. Это то, что их вместе скрещивает.**

Здесь не разрабатывается ни один из продуктов. Это интеграционный и
операционный репозиторий: инстанс Airlock, подключение к нему агентов
GPTAdmin, интеграционный план и живая эксплуатация связки. Оба продукта
подключены **сабмодулями**, в корне лежит только «клей».

> 🎯 Продуктовое видение — что строим и зачем: **[PRODUCT_VISION.md](PRODUCT_VISION.md)**
> 🔧 Живой стенд — деплой, секреты, хранилище, интеграция: **[AIRLOCK_ADMIN.md](AIRLOCK_ADMIN.md)**

---

## Кто есть кто

- **Airlock Admin** (этот репозиторий) — *диспетчерская*: боевой инстанс
  Airlock, гранты для агентов, сквозной канарей связки, деплой и
  интеграционный план. Кода продуктов здесь нет.
- **GPTAdmin** (`gptadmin/`) — *руки*: MCP-хаб, который ставится на любую
  машину — ноутбук, сервер, телефон — и умеет всё на ней: файлы, shell,
  процессы, браузер. Разработка в
  [megamen32/gptadmin](https://github.com/megamen32/gptadmin).
- **Airlock** (`airlock/`) — *пропуск*: живёт только на сервере и ведает
  правами и доступами — аккаунты, сессии, гранты, политики, подтверждения
  опасных действий, полный аудит. Форк
  [airlockrun/airlock](https://github.com/airlockrun/airlock) в
  [megamen32/airlock](https://github.com/megamen32/airlock).
- Сверху — **ExManager**, ИИ-секретарь: превращает «руки + пропуск» в
  законченную экосистему.

```
   сотрудник (телефон / ноутбук / браузер)
        │   «найди мои файлы» · «собери презу» · «открой почту» · «напиши отчёт»
        ▼
┌─────────────────────────────┐
│   ExManager — ИИ-секретарь  │   лицо экосистемы, живёт в мессенджере и на веб-морде
└─────────────────────────────┘
        │
   ┌────┴────────────────────────────────┐
   ▼                                     ▼
┌──────────────────────┐      ┌──────────────────────────┐
│  GPTAdmin — руки     │      │  Airlock — пропуск       │
│  ставится на любую   │◄────►│  живёт на сервере;       │
│  машину; умеет всё   │ MCP  │  решает КТО и ЧТО можно: │
│  на этом устройстве  │      │  гранты, аппрувы, аудит  │
└──────────────────────┘      └──────────────────────────┘
        ▲                                     ▲
        └───────────┐                ┌────────┘
                    ▼                ▼
            ┌──────────────────────────────┐
            │  Airlock Admin — этот репо:  │
            │  инстанс, деплой, интеграция │
            └──────────────────────────────┘
```

## Что в репозитории

```
AIRLOCK_ADMIN.md    # живой стенд: деплой, секреты, хранилище, интеграция агентов
AIRLOCK_RUNBOOK.md  # ранбук деплоя инстанса
PRODUCT_VISION.md   # продуктовое видение экосистемы (планирование)
gptadmin/           # сабмодуль → megamen32/gptadmin (приватный)
airlock/            # сабмодуль → megamen32/airlock (форк airlockrun/airlock)
.agents/            # журнал работ
```

Правило: код продуктов правится в их собственных репозиториях и пинится
сюда обновлением сабмодуля. В этом репозитории — только интеграционные
документы и конфигурация связки.

## Сабмодули

| Путь | Репозиторий | Pin | Что это |
|------|-------------|-----|---------|
| `gptadmin/` | [megamen32/gptadmin](https://github.com/megamen32/gptadmin) (приватный) | см. `git ls-tree HEAD gptadmin` | текущий main хаба |
| `airlock/` | [megamen32/airlock](https://github.com/megamen32/airlock), ветка `airlock-admin` | `0b91e0f8` | airlock v0.6.3 + форк-патч MCP |

Форк-патч в `airlock/` (ветка `airlock-admin`): клиент MCP в airlock
пинирует протокол `2025-11-25`, а хаб GPTAdmin отвечает `2026-07-28` и
возвращает `HTTP 204` на JSON-RPC нотификации. Патч держит свою пиннутую
версию вместо обрыва соединения и считает 204 успехом.

Обновить пин:

```bash
git -C gptadmin fetch origin && git -C gptadmin checkout <sha> && git add gptadmin
git -C airlock fetch origin && git -C airlock checkout <sha> && git add airlock
```

## Как клонировать

```bash
git clone --recurse-submodules git@github.com:megamen32/airlock-admin.git
```

`gptadmin/` приватный — нужен доступ к `megamen32/gptadmin`.

## Быстрый старт

```bash
# Airlock dev-стенд (postgres, s3, ingress + backend)
cd airlock && make dev

# Хаб GPTAdmin из исходников (Go 1.21+)
cd gptadmin && go run ./go-hub/cmd/gptadmin-hub
```

Боевой стенд (systemd, ротация секретов, nginx, S3-шлюз на Яндекс.Диске)
собирается по проверенным шагам из [AIRLOCK_ADMIN.md](AIRLOCK_ADMIN.md) —
там же список известных ловушек.

⚠️ На сервере прод-сервис `airlock.service` работает из рабочего каталога
`airlock/` этого репозитория: поверх чистого сабмодуля лежит рантайм-оверлей
(`.env*`, `bin/`, `frontend/dist`, `frontend/node_modules`) — он не
трекается и сносу не подлежит.

## Что уже работает (не на бумаге)

- Публичный инстанс Airlock: **https://airlock.bezrabotnyi.com**
- Сквозной канарей экосистемы: чат в Airlock → агент `fleet-admin` →
  MCP-брокер → хаб GPTAdmin → реальная команда (`uptime`) на реальной
  машине — ответ вернулся в диалог. Опасные действия проходят штатный
  approval-флоу (агент просит → админ подтверждает → агент выполняет).
- Файловое хранилище агентов — на Яндекс.Диске через S3-шлюз (rclone),
  кэш в RAM.

Основная интеграция (shell-маршруты `airlock-shell` / `cloudos-shell`) —
план готов, имплементация не начата: [AIRLOCK_ADMIN.md](AIRLOCK_ADMIN.md).

## Документы

| Документ | О чём |
|----------|-------|
| [PRODUCT_VISION.md](PRODUCT_VISION.md) | продуктовое видение: слои, персоны, пробелы, MVP |
| [AIRLOCK_ADMIN.md](AIRLOCK_ADMIN.md) | живой стенд: деплой, секреты, хранилище, интеграция агентов |
| [AIRLOCK_RUNBOOK.md](AIRLOCK_RUNBOOK.md) | ранбук деплоя инстанса |
| `gptadmin/docs/` | полная документация GPTAdmin (внутри сабмодуля) |
| `airlock/docs/` | документация Airlock (внутри сабмодуля) |

## Лицензия

**AGPL-3.0** — вся экосистема. Совпадение лицензий GPTAdmin и Airlock не
случайность: именно оно позволяет свободно объединить два продукта в одну
систему и строить поверх неё своё. См. [LICENSE](LICENSE).

- `airlock/` — форк [airlockrun/airlock](https://github.com/airlockrun/airlock)
  (© Oleg Karpov), история апстрима сохранена; наш форк-патч живёт в ветке
  `airlock-admin`.
- GPTAdmin — [megamen32/gptadmin](https://github.com/megamen32/gptadmin).
