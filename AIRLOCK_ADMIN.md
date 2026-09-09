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

## Интеграция — Proposed (не реализована)

Целевая архитектура: Airlock стоит фронтом аккаунтов и авторизации, GPTAdmin-хаб —
бэкендом управления машинами за ним.

1. Аутентификация MCP-клиентов хаба через ключи/сессии Airlock вместо отдельного JWT.
2. Проксирование MCP-эндпоинтов GPTAdmin через ingress Airlock с проверкой grants.
3. Регистрация shell-нод GPTAdmin как connectors/hosts в Airlock (у Airlock уже есть
   `api/hosts.go`, `api/connectors.go`).

## Статус

Объединение дерева и сборочные проверки выполнены (см. `.agents/tasks/`).
Рантайм-интеграция из раздела Proposed не реализована и не проверялась.
