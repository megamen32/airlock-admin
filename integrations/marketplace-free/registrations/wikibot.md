# Wikibot — API-key-and-real-read

- статус: api-key-and-real-read
- основание: https://wikibot.pro/docs/api ; https://wikibot.pro/docs/quick-start/tariffs
- signup/login: https://app.wikibot.pro (sign-in), email: airlock@bezrabotnyi.com, auth: passwordless (NextAuth magic-link на почту, пароля нет)
- trial/квота: бесплатный тариф с welcome-кредитами (количество не опубликовано); каждый вопрос тратит кредиты; демо-вопрос потратил 1 кредит; при исчерпании — перевод на живого оператора (не оставлять бота в проде без присмотра)
- account/workspace IDs: бот «Airlock Demo» (Оператор–Поддержка) `4c1594b6-85fe-4526-a48e-96fc40c69910`; источник БЗ: https://airlockrun.ru/ (парсер «Веб-сайт/Сайт», индексация запущена)
- креды ref: ~/.config/airlock-marketplace-accounts/wikibot.json (backup: yadisk:Backups/marketplace-accounts/, статус OK, readback rc=0 2026-10-15)
- API-проверка: POST https://api.wikibot.pro/api/bot/ask `{"chatId":"mktr-demo-1","query":"Что такое Airlock и как получить гостевой доступ?","format":"raw"}` с заголовком `Authorization: <ключ>` (БЕЗ Bearer) → HTTP 200, содержательный ответ: «Airlock — это платформа корпоративных приложений и одновременно шлюз…; каталог доступен без регистрации; гостевые доступы согласуются с командой Airlock» — бот ответил по базе знаний
- блокеры: нет. Замечания для адаптера: ключ передаётся голым значением в Authorization (native AuthInjectAPIKey); при регистрации на /sign-in нужно отметить все 3 согласия (оферта, политика, персональные данные)
