# Отличия демо от Airlock Internal

> Канонический исходник demo adapter перенесён в приватный
> [megamen32/airlock-demo](https://github.com/megamen32/airlock-demo).
> Эта директория сохранена как исторический снимок; следующие правки — в новом репозитории.

Проверено на работающем server-88 14.10.2026. **Код Airlock для этого демо
не изменён.** Backend — официальный ghcr.io/airlockrun/airlock:v0.7.0,
RU frontend — официальный airlock-enterprise-frontend:v0.7.0.
OCI revision: 690a90e7bafd781e39c5618f12598e42f5d9c306, source airlock-internal.

## Что сохранено отдельно
Все собственные изменения находятся в wrapper, а не внутри upstream:

| Файл | Назначение |
|---|---|
| guest-lifecycle.mjs | TTL24часа неактивности, постоянные timestamps и native удаление только broker гостей |
| gateway.mjs | Отдельные обычные гостевые сессии, создание через broker, запрет изменения/удаления, native WebSocket и проверка гостевого run |
| prepare-runtime.sh | Отдельный compose.demo.yml поверх официального Compose, rootless runtime, русский официальный frontend |
| setup-rootless.sh | Выделенный UID, отдельная файловая система и конечные бюджеты |
| bootstrap.mjs | Штатная активация, UI locale ru, отдельный AI-провайдер |
| Caddyfile.vps-demo | HTTPS вход и разрешённые домены проектов |
| README.md | Развёртывание, права, ресурсы, реальная приёмка |

Опубликовано в main megamen32/airlock-admin. Первоначальная доставка:
581ebefd5acf8ae6305355fcf0281dfa2f2f9ce1. Инфраструктурные ingress и inventory
отдельно в megamen32/ServersAdministartion, первоначально0c15c657.
Эти commits фиксируют изменения независимо от чужого WIP в рабочем checkout.
Первоначальный gateway SHA256: a3fca650835f38a412e8b7ae46dbdc4343fe49c7e382ce49473c421207c2f7f4;
следующее изменение wrapper добавляет независимый guestTTL, официальный core тот же.

Приватный исходный архив и переводы не копируются в публичный wrapper.
Старый detached checkout megamen32/airlock и его прежние патчи не являются
источником образов demo88; они не менялись при этой доставке.

## Перед обновлением Airlock
1. Сохранить dump отдельной БД demo88, S3/agent data, owner.json и .env в
   закрытое резервное хранилище. Последние два содержат секреты.
2. Записать текущие RepoDigests всех официальных образов и Compose config;
   использовать согласованную Internal-версию backend/frontend/builder/base/executor.
3. Сверить новые штатные API auth/users/members/runs и WebSocket со шлюзом.
   Русский язык остаётся штатной настройкой uiLocale=ru.
4. Сохранить overlay и gateway при замене upstream release artifact.
   Нельзя запускать prepare-runtime.sh поверх обновления без предварительного
   изменения его pinned версии: скрипт сейчас фиксирует v0.7.0.
5. Проверить нового гостя, создание, живой русский ответ, app relay и отказы
   edit/delete/admin. Проверить новые внешние интеграции на настоящих сервисах.
6. При несовместимой миграции откатывать БД из сделанного dump вместе со старым
   образом; простая замена образа не гарантирует обратимости миграций.

## Возможные будущие PR, без изменения core сейчас
Это наблюдения v0.7.0 и кандидаты для обсуждения с Олегом, а не уже внесённые
upstream-патчи:
- Эффективное членство через «Все пользователи» должно давать подписку на
  события проектов: в демо нужны дополнительные прямые user memberships.
- Обычному пользователю нужен ограниченный статус run собственного диалога,
  без админских входных данных/логов/секретов: сейчас это projection шлюза.
- Гостевой режим и создание проекта без получения прав управления можно
  оформить штатной возможностью, если upstream согласует такой контракт.

Интеграции маркетплейса добавляются как отдельные native SDK приложения и
ресурсы. Они не требуют форка Airlock или изменения приватного RU frontend.

TTL wrapper принят отдельно: guest-lifecycle.mjs и gateway.mjs опубликованы,
точныеSHA256 сохранены в private ttl-proof.json и совпали с runtime. Один
agedfixtureguest удалён реальнымnativeAPI, новыйгость/HttpOnlyrefresh/WS/DaData
работают; все5appIDsсохранены. При обновлении сохранить gateway-state/guests.json
вместе сoverlay: безнего срок существующихгостей начнётся заново.

15.10.2026: demo build/exec defaults switched through native provider/settings
APIs to a dedicated subscription combo (GLM5.3Flash → MiniMaxM3.1FlashPreview).
Model policy is in model-combo.json; no upstream/core/RU code changed.
bootstrap preserves registered models during the native referenced-model guard.
