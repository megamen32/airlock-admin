# MaxFrame — created (freeUI) + externalblocked (key-manual-only)

- статус: created (аккаунт «Базовый», вход проверен) + externalblocked key-manual-only (API-ключ выдаётся только вручную)
- основание: https://maxframe.ru/auth/yeti-register/ (self-signup без email); данные «Для доступа к данным необходима Premium подписка» (https://maxframe.ru/); «API-ключи выдаются в ручном режиме через поддержку» — https://t.me/maxframe_info
- signup/login: https://maxframe.ru/auth/yeti-register/ → https://maxframe.ru/auth/yeti-login/, логин — UID, генерируемый сервисом (показан однократно, сохранён), auth: password (service-generated); email не привязывается
- trial/квота: уровень «Базовый» бесплатен; данные API и премиум-функции закрыты подпиской Premium
- account/workspace IDs: UID сервисный (несекретный, хранится в кредах); профиль: каналы 0, боты 0; регистрация 14.10.2026
- креды ref: ~/.config/airlock-marketplace-accounts/maxframe.json (backup: yadisk:Backups/marketplace-accounts/, status OK, remote=yadisk:Backups/marketplace-accounts/maxframe.json)
- API-проверка: не выполнялась — ключа нет; при появлении ключа: GET https://maxframe.ru/api/maxframe/channels/?page=1 с заголовком X-Api-Key (read-only)
- блокеры: API-ключ только вручную через Telegram @maxframe_info — сообщение НЕ отправлялось по контракту (решение за lead)
