# MaxFrame — created (freeUI) + externalblocked (key-manual-only)

- статус: created (аккаунт «Базовый», вход проверен) + externalblocked key-manual-only (API-ключ выдаётся только вручную)
- основание: https://maxframe.ru/auth/yeti-register/ (self-signup без email); данные «Для доступа к данным необходима Premium подписка» (https://maxframe.ru/); «API-ключи выдаются в ручном режиме через поддержку» — https://t.me/maxframe_info
- signup/login: https://maxframe.ru/auth/yeti-register/ → https://maxframe.ru/auth/yeti-login/, логин — UID, генерируемый сервисом (показан однократно, сохранён), auth: password (service-generated); email не привязывается
- trial/квота: уровень «Базовый» бесплатен; данные API и премиум-функции закрыты подпиской Premium
- account/workspace IDs: UID сервисный (несекретный, хранится в кредах); профиль: каналы 0, боты 0; регистрация 14.10.2026
- креды ref: ~/.config/airlock-marketplace-accounts/maxframe.json (backup: yadisk:Backups/marketplace-accounts/, status OK, remote=yadisk:Backups/marketplace-accounts/maxframe.json)
- API-проверка: не выполнялась — ключа нет; при появлении ключа: GET https://maxframe.ru/api/maxframe/channels/?page=1 с заголовком X-Api-Key (read-only)
- блокеры: API-ключ только вручную через Telegram @maxframe_info; бесплатная квота API пока не подтверждена. Согласованный пользователем запрос отправлен, следующий шаг — ответ поддержки с условиями и способом выдачи ключа.

## 15.10.2026 — запрос бесплатного API-доступа

Официальная [документация API](https://maxframe.ru/api-docs/) предлагает обратиться в [@maxframe_info](https://t.me/maxframe_info) для ручной выдачи ключа. Само наличие Basic-аккаунта не доказывает право на API; условия бесплатной тестовой квоты требуется подтвердить у поддержки.

Профиль контакта подтверждён: «Maxframe info Поддержка сервиса Maframe.ru», ID 8070860358, bio называет его официальной поддержкой maxframe.ru. До обращения диалог пуст. Пользователь отдельно одобрил точный текст сообщения: представление ИИ-секретарём Никиты, ссылка на Airlock, запрос бесплатной тестовой квоты только на чтение каналов/статистики, без подключения платного тарифа.

Отправлено одно сообщение 1987495, 15.10.2026 11:20:36 UTC. Текст прочитан в диалоге. Доступы и ключи в запрос не включались; новые аккаунты/платежи не создавались. Ключ пока не получен, сервис не считается подключённым к демо. Receipts: `.tmp/maxframe-support-20261015/` (вне Git).

Проверка истории в 11:21:47 UTC: одна копия, дублей 0, ответа пока нет.
