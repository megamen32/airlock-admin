# Дизайн: автообновление — явный выбор при установке, подсказка в CLI, версии и кнопка в /admin

Дата: 2026-07-10
Статус: одобрен (brainstorming)

## Постановка задачи (от пользователя)

1. При установке (`gptadmin setup`) спрашивать, включать ли автообновление (сейчас включено молча).
2. При запуске любой команды CLI, если обновление доступно, а автообновление выключено — печатать подсказку с командой для обновления.
3. В `/admin` выводить версию хаба и шелла + добавить кнопку «Обновить».

## Текущее состояние (по результатам исследования)

- **Установка**: `cli.py` → `setup_interactive()` (строка 1614). Автообновление по умолчанию `true` (строка ~1745), без вопроса пользователю.
- **Обновление**: `gptadmin update` (`cmd_update`, строка 3235) — качает манифест, сравнивает build_version, меняет бинарники, перезаписывает service-юниты, перезапускает сервисы.
- **Автообновление**: `gptadmin auto-update {status,enable,disable,run}` (`cmd_autoupdate`, строка 2528). Таймер systemd / launchd интервал запускает `gptadmin update --auto` раз в 6ч (`GPTADMIN_AUTO_UPDATE_INTERVAL_SEC=21600`). Враппер `run_auto_update.sh` уже существует.
- **Версии**:
  - `VERSION` файл (целое, сейчас `119`), бампится `tools/build.sh`.
  - `gptadmin_build_info.py` (генерится билдом): `BUILD_VERSION`, `BUILD_TS`, `GIT_COMMIT`.
  - Hub Go: `var BuildVersion`/`GitCommit` в `go-hub/internal/hub/server.go:29-30`, инжектятся ldflags. `/version` и `adminOverview` (`server.go:1726`) уже отдают `build`.
  - ShellMCP Go: `var BuildVersion`/`GitCommit` в `go-shellmcp/internal/server/server.go:27-28`, отдаются в `/status`, `/info` и в каждом heartbeat на хаб (`server.go:569`).
- **/admin UI**: `public/admin/{index.html,app.js,style.css}` — vanilla JS SPA. `app.js:138` `renderAll()` уже получает `state.build`, но версии не показывает. Кнопки обновления нет.

## Принятые решения (brainstorming)

- **Частота проверки обновления в CLI**: раз в 24 часа с локальным кэш-файлом (не на каждый запуск).
- **Дефолт в промпте установки**: Yes (Enter = включить). Сохраняет текущее поведение, делает выбор явным.
- **Механика кнопки «Обновить»**: фоновый `exec` существующего `gptadmin update --auto` + рестарт сервисов; hub отвечает 202 немедленно. Не in-process Go self-update.

## Дизайн

### 1. Установка — явный промпт про автообновление

В `setup_interactive()` (`cli.py`) перед записью env-файла добавить один промпт:

```
Включить автообновление (проверка раз в 6ч, systemd timer / launchd)? [Y/n]
```

- Дефолт Yes (Enter = да).
- Ответ `n` → `GPTADMIN_AUTO_UPDATE=false`, таймер не создаётся / отключается (`svc_autoupdate_disable_stop()`).
- Ответ `y`/Enter → текущий путь: `GPTADMIN_AUTO_UPDATE=true`, `svc_autoupdate_enable_start(env)`.
- **Неинтерактивный режим** (`GPTADMIN_NONINTERACTIVE=1` либо env уже задаёт `GPTADMIN_AUTO_UPDATE`): промпт пропускается. По умолчанию автообновление остаётся включённым, если env не задаёт `false`. Существующие CI/автоматические установки не ломаются.
- Вся механика таймера уже реализована (`auto_update_enabled`, `svc_autoupdate_enable_start`); новая логика — только сам вопрос и ветвление.

### 2. Подсказка при запуске CLI

Новый кэш-файл: `~/.gptadmin/update_check.json` (рядом с остальным state gptadmin):
```json
{"last_check_ts": 1752100000, "remote_version": 120, "remote_sha256": "abc..."}
```

Новая функция `maybe_update_hint(args)` в `cli.py`, вызывается рано в `main()`:

- **Пропускается** для команд: `update`, `auto-update`, а также при флагах `--auto`, `--help`, `-h`. Для `version` подсказка показывается. Для `doctor` — показывается (doctor и так сетевой/диагностический, лишний network-fetch там уместен; если окажется, что мешает — добавим в исключения позже, YAGNI).
- **Пропускается**, когда `GPTADMIN_AUTO_UPDATE=true` (подсказка имеет смысл только при выключенном автообновлении).
- Если кэш свежий (`now - last_check_ts < 86400`): без сети берём `remote_version` из кэша.
- Если кэш протух (>24ч) или отсутствует: один запрос к `manifest.json` через существующий `_remote_artifact_build_info()`. При сетевой ошибке — тихо (best-effort), не блокируем команду, подсказку не показываем. На успехе обновляем кэш.
- Сравниваем `remote_version` с установленным (`_installed_build_info()`). Если `remote > installed` — печатаем в **stderr** (чтобы не мешать stdout-парсингу):
  ```
  ℹ Доступно обновление: build 119 → 120.
    Обновить:         gptadmin update
    Включить авто:    gptadmin auto-update enable
  ```
- Задержка от сети возникает только при протухшем кэше и только при выключенном автообновлении. На типичной машине с автоапдейтом проверка не запускается вовсе.

### 3. /admin — версии хаба + шелла + кнопка «Обновить»

#### Бэкенд хаба (`go-hub/internal/hub/server.go`)

Расширить `adminOverview` (строка 1726):
- `build` хаба — уже есть.
- Добавить `shell_version` и `shell_commit` — из последнего heartbeat shellmcp-сервера (shellmcp уже шлёт `BuildVersion` в каждом beat, `go-shellmcp/.../server.go:569`). Хаб хранит актуальные beat-данные по серверам — берём оттуда. Если шелл-сервер не зарегистрирован — поля `null`/пусто.
- Добавить `update`: объект состояния in-memory:
  ```json
  "update": {"status": "idle", "message": "", "started_at": 0, "finished_at": 0}
  ```
  `status ∈ {"idle", "running", "done", "error"}`.

Новый эндпоинт **`POST /admin/api/update`** (та же admin-auth, что у остальных admin-эндпоинтов):
- Если `update.status == "running"` → `409 {"detail": "update already running"}`.
- Иначе: выставляет `status="running"`, `started_at=now`, запускает **goroutine**, которая `exec`-ает установленный CLI через существующий враппер `run_auto_update.sh` (либо напрямую `gptadmin update --auto`). Лог пишется в существующий `auto-update.log`.
- Немедленно отвечает `202 {"ok": true, "status": "running"}`. Hub не блокируется и не останавливается на этапе ответа.
- Когда CLI-процесс завершает update-флоу, он перезапускает сервисы (включая хаб). После рестарта in-memory `update.status` сбрасывается в `idle`. Результат последнего запуска (успех/ошибка, текст) пишется в файл `~/.gptadmin/last_update_result.json`, чтобы пережить рестарт и показать итог в UI (поле `update.message` инициализируется из этого файла при старте хаба).

#### Фронтенд (`public/admin/index.html` + `app.js`)

В сайдбаре, рядом с `#sideMeta` (`index.html:32`, рендерится `app.js:138`):
- Строка версий: `hub: build 119 (3b22fa3)   shell: build 119 (3b22fa3)`.
- Кнопка **«Обновить»**.

Логика в `renderAll()`:
- Заполнять версии из `state.build` (хаб) и `state.shell_version`/`state.shell_commit` (шелл).
- Отражать `state.update.status`: `running` → кнопка disabled с подписью «Обновляю…»; иначе активна.
- Клик по кнопке → `POST /admin/api/update` с CTL-токеном (как у прочих admin-запросов). На `202` — кнопка в «Обновляю…», полагаемся на штатный 15-сек авто-рефреш `overview`, который после рестарта хаба подхватит новую версию. На `409` — показать «обновление уже идёт».

## Тестирование и проверка

- **`cli.py`**:
  - Юнит-проверка логики «свежий/протухший кэш» (фикс. timestamps, без сети).
  - Юнит-проверка сравнения версий и формата подсказки.
  - Проверка, что при `GPTADMIN_AUTO_UPDATE=true` подсказка не вызывается.
- **hub** (`go-hub/internal/hub/server_test.go`):
  - `adminOverview` содержит `shell_version` и `update`.
  - `POST /admin/api/update` → `202` при `idle`, `409` при повторном вызове в `running`.
- **Ручная проверка**:
  - `gptadmin setup` с автоапдейтом `n` → запуск `gptadmin status` печатает подсказку об обновлении (если доступно).
  - Кнопка в /admin триггерит фоновое обновление; после рестарта версии обновляются.

## Что НЕ делаем (YAGNI)

- In-process Go self-update хаба — оставляем фоновый exec (безопаснее, переиспользует готовый флоу `gptadmin update`).
- Баннер «new version available» в /admin с авто-фетчем манифеста при каждом поллинге — кнопка обновления работает и без этого.
- Push-уведомления / интеграции с внешними системами.

## Открытые вопросы (мелкие, фиксируются при планировании)

Все разрешены в дизайне выше:
- Список пропускаемых команд: `update`, `auto-update`, `--auto`, `--help`, `-h` (раздел 2).
- Кэш-файл: `~/.gptadmin/update_check.json` (раздел 2).
- Результат после рестарта: `~/.gptadmin/last_update_result.json` (раздел 3).
