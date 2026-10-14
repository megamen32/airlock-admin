# Botmother — created+emailverified (+внешнее событие проверено)

- статус: created+emailverified; бот создан, внешнее событие настроено и отвечает на реальный запрос
- основание: https://botmother.ru/price (Тестовый тариф — до 10 ботов, 5 тестировщиков, без карты); https://docs.botmother.ru/article/41072
- signup/login: https://app.botmother.ru, email: airlock@bezrabotnyi.com, auth: password
- регистрация: 2026-10-15 (прошлый запуск воркера погиб до сабмита формы — JSON был pre-signup,
  аккаунта не существовало: login 401 + писем от botmother в ящике не было; зарегистрирован
  сохранённым паролем из бэкапа, маркетинговые рассылки не согласованы)
- email: подтверждён ссылкой активации из письма mail@botmother.com (2026-10-14 22:00 UTC)
- trial/квота: Тестовый тариф автоматически; до 10 тестовых ботов, бот работает только у 5 тестировщиков; без карты
- account/workspace IDs: bot_id 6acffbf4d2f2123197060073; событие "Airlock Demo Event" (тип «Внешнее событие», экран «Стартовый экран»)
- креды ref: ~/.config/airlock-marketplace-accounts/botmother.json (backup: yadisk:Backups/marketplace-accounts/, status OK; webhook URL внутри JSON)
- API-проверка: POST на ссылку внешнего события (signed URL) с телом {} → HTTP 400 `{"error":"users or platform is not defined"}` — эндпоинт живой, валидация работает, доставка тестерам не выполнялась (по условию задания сообщения тестерам не отправлять)
- блокеры: нет. Для содержательной демонстрации нужен зарегистрированный тестер в мессенджере и валидное тело запроса (users/platform) — отдельное согласованное действие
