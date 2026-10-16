---
name: airlock-public-deploy-runbook
description: Why https://airlock.bezrabotnyi.com fails and how to revive it after a backend crash
metadata:
  type: project
---

## Действующая установка — Docker, проверено 16 октября 2026

С14октября private Airlock на server-100 работает в оригинальных контейнерах
`airlock-airlock-1` и `airlock-frontend-1`. `airlock.service` остановлен и
отключён; его нельзя запускать параллельно с Docker. Сохранённые binary/env
относятся к runtime rollback, а не к обычному запуску или обновлению.

Канонический порядок четырёх Compose-файлов, прежние volumes/UID/mount paths,
ресурсные лимиты и реальная приёмка описаны в
`/home/roomhacker/agents-projects/exmanager/docs/airlock-original-docker.md`.
Изменять только выбранные сервисы через этот сохранный Compose-контракт.
Не применять старый `update-airlock-prerelease`: он обновляет исторический
systemd backend из публичного prerelease и не обслуживает нынешние установки.

Отдельное демо88: `/home/roomhacker/airlock-demo/deploy/demo88/README.md` и
`UPSTREAM-DELTA.md`. Сохранять русский enterprise frontend и внешний guest
gateway. Новые теги/образы проверять в приватном `airlockrun/airlock-internal`,
сопоставляя version/revision/source; `main` без нового тега не равен релизу.
Перед изменением runtime сохранять текущую конфигурацию, PostgreSQL, данные
приложений/S3 и protected env/keys вне Git. Старую БД автоматически не откатывать.

## Историческая установка до 14 октября 2026

Следующие разделы описывают прежний native backend. Их команды запуска и
обновления нельзя применять к нынешней Docker-установке.

Airlock публично поднят через официальный ingress: `nginx 127.0.0.1:8444 ssl (TLS edge, wildcard-серт) → caddy-proxy в докере (127.0.0.1:4280, TLS_MODE=proxy) → нативный airlock backend 127.0.0.1:8080`. Caddy маршрутизирует по Host: apex → SPA+API, `*.airlock` → airlock SubdomainProxy (сам проставляет X-Airlock-Proxy-Auth), `s3.*` → S3-upstream. Возвращено 2026-10-06 по рекомендации апстрима (nginx-direct-эксперимент 2026-09-29 откатан; vhost — чистый passthrough в `nginx-dev`, отдельные s3/forenergo vhost'ы удалены). Поднимать caddy только через `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres rustfs caddy-proxy` — без dev-оверлея теряются host-биндинги postgres 42432 / rustfs 42900.

## Действующий запуск на server-100 (проверено 2026-10-06)

Платформа работает как системный `airlock.service`, а не как `make dev` или
фоновый `nohup go run`. Unit запускает
`/home/roomhacker/airlock-admin/airlock/bin/airlock serve`, использует этот
каталог как WorkingDirectory и читает защищённый `.env` как EnvironmentFile.
Сервис был проверен в состоянии active/running. Не запускайте второй процесс
на 8080 и не обходите systemd/resource guard ради восстановления.

Для диагностики без изменения состояния:

```bash
systemctl status airlock.service --no-pager
systemctl show airlock.service -p ActiveState -p SubState -p WorkingDirectory -p ExecStart
ss -ltnp 'sport = :8080'
curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8080/
```

После подтверждённого отказа и проверки владельца изменения перезапуск:
`sudo systemctl restart airlock.service`. Изменение сборки платформы — отдельная
операция её владельца; подключение MCP к X-менеджеру не требует правки ядра.
Не выводите `.env`, auth responses, пароли или токены в диагностику.

Публичный X-менеджер: `https://exmanager.airlock.bezrabotnyi.com`;
его настройки моделей: `/settings`. Приложение объявляет внешние MCP через
штатный SDK, а платформа хранит credentials в зашифрованных resources.
Интеграция существующей доски описана в
`/home/roomhacker/agents-projects/exmanager/docs/todo-mcp.md`;
её инфраструктурная карточка —
`/home/roomhacker/ServersAdministartion/docs/inventory/sites/todo.md`.

## Ingress and ownership

Airlock ingress uses nginx and backend 8080. The common vhost serves the apex,
platform frontend, and wildcard app routing. X-manager also has an explicit
thin app vhost in its own repository:
`/home/roomhacker/agents-projects/exmanager/deploy/nginx/exmanager.airlock.bezrabotnyi.com`.
Its enabled-site symlink sends native app pages and the authentication callback
to Airlock; do not send those pages to the platform SPA or apply a CSP that
blocks the native login bootstrap.

The common proxy-auth secret lives only in protected nginx/runtime
configuration. Do not copy it into this repository. Before changing ingress,
follow the canonical site inventory and the owning authored config, validate
`nginx -t`, then verify the public native page. A successful config test does
not prove browser authentication or model-settings persistence.

S3 and PostgreSQL are separate dependencies of the platform. Inspect their
current Compose files, live containers, port bindings, and project budgets
before restarting or recreating them. An MCP declaration does not require
recreating platform databases, rotating encryption keys, or changing submodule
pins. Never replace an encryption key to address an unrelated connection error.

Historical dev/Caddy incidents and old passwords/login commands are recorded
in `AIRLOCK_ADMIN.md` as dated history. They are not current recovery recipes.
The platform core belongs to its maintainer; app-specific integrations use
native SDK/resource APIs and thin adapters in the owning app checkout.
