# Dbrain — externalblocked (demo-request-only)
- статус: externalblocked demo-request-only (self-signup отсутствует; лид-форму «Запросить демо» по контракту НЕ отправляем)
- основание: https://dbrain.io/ , документация https://docs.dbrain.io/
- signup/login: нет самостоятельной регистрации; кнопки «Попробовать бесплатно»/«Протестировать» на лендинге открывают попап-заявку на демо (не аккаунт)
- бесплатный режим: отсутствует; доступ по лицензии, ключ выдаёт команда вендора (Telegram или hello@dbrain.io); 403 при исчерпании лимитов/истечении лицензии
- API: HTTP API есть (base https://latest.dbrain.io/), авторизация — query-параметр token (не заголовок), multipart/form-data; MCP не заявлен
- API-проверка: не выполнялась (ключа нет, без лицензии доступ закрыт)
- креды ref: ~/.config/airlock-marketplace-accounts/dbrain.json (запись-заглушка, секретов нет; backup: yadisk:Backups/marketplace-accounts/, status OK)
- блокеры: ручная выдача лицензии после коммуникации с вендором; решение о демо-заявке — за lead
