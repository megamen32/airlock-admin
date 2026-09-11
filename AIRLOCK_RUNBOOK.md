---
name: airlock-public-deploy-runbook
description: Why https://airlock.bezrabotnyi.com fails and how to revive it after a backend crash
metadata:
  type: project
---

Airlock публично поднят через `nginx 127.0.0.1:8444 ssl → airlock-caddy-proxy-1 127.0.0.1:4280 → нативный airlock backend на 127.0.0.1:8080`.

**Самая частая причина «502 Bad Gateway»** — нативный `go run ./cmd/airlock serve` не запущен. `make dev` поднимает его в foreground сессии; если сессия завершилась — backend мёртв, а caddy-proxy не на что проксировать (в логах `dial tcp 172.17.0.1:8080: connect: connection refused`). Бэкенд **не поднимается автоматически** — никакого systemd/supervisor.

Чтобы оживить:

```bash
cd /home/roomhacker/airlock-admin/airlock
set -a && . ./.env && set +a
nohup go run ./cmd/airlock serve > /tmp/airlock-backend.log 2>&1 & disown
```

После — проверить:
- `ss -ltnp | grep :8080` — должен быть процесс `airlock`.
- `curl -sS -i -X POST http://127.0.0.1:8080/auth/login -H 'Content-Type: application/json' -d '{"email":"roomhacker@bezrabotnyi.com","password":"<admin password — rotated 2026-09-11, local only: .tmp/airlock-admin-creds>"}'` → 200 + accessToken.
- Публично: `curl -sS -i -X POST https://airlock.bezrabotnyi.com/auth/login ...` → 200, header `via: 1.1 Caddy`.

**Что ещё ломает backend при старте:**

- `ENCRYPTION_KEY=000…deadbeef` — дефолт из `.env.dev.example` отвергается `validateDeployment` вне `localhost`. Боевой: `openssl rand -hex 32`.
- `ENCRYPTION_KEY_REWRAP=true` при наличии в БД записей (`agents.db_password`), зашифрованных **третьим**, уже потерянным ключом — `FATAL secret storage migration failed: unknown key ID`. Решение: `ENCRYPTION_KEY_REWRAP=false` (пока нет резервной копии старого ключа). На dev-инстансе `fleet-admin` не запускается, его `db_password` всё равно не используется.
- `docker compose up -d <single_service>` теряет host-биндинги остальных сервисов (rustfs `42900`, postgres `42432`). Поднимать весь набор сразу: `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres rustfs caddy-proxy`.
- SPA вызывает `/auth/login` (без префикса `/api`).

Аккаунт `roomhacker@bezrabotnyi.com` (пароль — см. `.tmp/airlock-admin-creds`, вне git; ротирован 2026-09-11 после того, как черновик ранбука с паролем попал в публичный пуш) — admin, имеет grant admin на агента fleet-admin. Пароль выставлялся прямым bcrypt-хэшем в `users.password_hash` (через `airlock Users API` нельзя — он генерит temp-password и игнорирует переданный).

2026-09-11: бэкенд поднят как systemd-юнит `airlock.service` (WorkingDirectory = этот каталог, рантайм-оверлей поверх сабмодуля) — `systemctl restart airlock.service` вместо ручного `nohup`.
