# SNABZHENETS+ — created+emailverified+pending-moderation
- статус: created+emailverified+pending-moderation (портал создан, почта подтверждена, 1 день бесплатного доступа активен; логин/пароль придут письмом после ручной модерации)
- основание: https://snabplus.com/register , оферта https://snabplus.com/legal/offer , API docs https://docs.snabplus.com/api/
- signup/login: https://snabplus.com/register → подтверждение кодом на почту → автологин; email: airlock@bezrabotnyi.com, auth: password-sent-after-moderation (пароль придёт отдельным письмом — дописать в кред-файл при получении)
- портал: airlock-demo.snabplus.com (https://airlock-demo.snabplus.com/)
- trial/квота: 1 день бесплатно сразу после подтверждения почты; расширение до 40 дней — ручной шаг «Продлить» в портале через MAX или Telegram (требует человека, НЕ делали); тариф «Профи» от 8 630 ₽/мес — не покупаем
- account/workspace IDs: портал airlock-demo (поддомен airlock-demo.snabplus.com)
- креды ref: ~/.config/airlock-marketplace-accounts/snabzhenets-plus.json (backup: yadisk:Backups/marketplace-accounts/, status OK, remote readback пройден)
- API-проверка: отложена — GET https://airlock-demo.snabplus.com/api/v1/integration-api/meta (заголовок X-API-Key, формат spk_…) выполнить, когда модерация выдаст доступ и появится ключ (Настройки → Интеграции → API/Webhooks)
- блокеры: ручная модерация (пароль/доступ), продление до 40 дней вручную через MAX/Telegram — вне автоматизации
