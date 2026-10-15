# Inspecto — created (freeUI-only)

- статус: created; скоуп freeUI-only (API платный)
- основание: https://inspecto.in/pricing (тариф 0₽: до 5 пользователей, до 5 шаблонов чек-листов); API — только «Профессиональный» 990 ₽/польз./мес (https://docs.inspecto.in/docs/api/auth)
- signup/login: https://inspecto.in/auth → «Создать аккаунт» (SPA, 3 шага: email+телефон (оба обязательны, SMS-кода нет) → имя/фамилия → пароль+согласие), email: airlock@bezrabotnyi.com, auth: password
- trial/квота: постоянный Free 0₽: 5 пользователей, 5 шаблонов чек-листов, чек-листы, отчёты, несоответствия, email-уведомления, базовая аналитика
- account/workspace IDs: профиль «Никита Airlock», организация автосоздана (инициалы «НА»), вход в систему https://inspecto.in/main работает
- креды ref: ~/.config/airlock-marketplace-accounts/inspecto.json (backup: yadisk:Backups/marketplace-accounts/, status OK, remote=yadisk:Backups/marketplace-accounts/inspecto.json)
- API-проверка: не выполнялась — ключ сервисного аккаунта создаётся только в платном тарифе («Организация → Сервисные аккаунты», токен показывается однократно)
- блокеры: API платный-only; для Free-UI блокеров нет
