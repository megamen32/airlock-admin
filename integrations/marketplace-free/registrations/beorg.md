# Биорг (Beorg KYC/OCR) — externalblocked

- статус: externalblocked
- основание: https://beorg.ru/blog/guide-kak-nastroit-api-raspoznavanie-dokumentov-za-30-minut/ ; CATALOG.md
- signup/login: https://kyc.beorg.ru/self_sign (SPA; форма регистрации доступна через «Войти» → «ЗАРЕГИСТРИРОВАТЬСЯ» → /login?step=login), email: airlock@bezrabotnyi.com, auth: password (пароль зарезервирован и в бэкапе)
- trial/квота: (не достигнуто) по гайду 25 OCR-распознаваний при регистрации; токен/machine_uid/project_id берутся в «Проектах» после входа
- account/workspace IDs: нет — аккаунт создать не удалось
- креды ref: ~/.config/airlock-marketplace-accounts/beorg.json (backup: yadisk:Backups/marketplace-accounts/, статус OK, readback rc=0 2026-10-15)
- API-проверка: не выполнена — без аккаунта
- блокеры: Yandex SmartCaptcha «advanced»: при сабмите формы регистрации показывает интерактивное image-задание, кнопка «ЗАРЕГИСТРИРОВАТЬСЯ» disabled до решения (2 попытки: первая сабмит и повтор после полной перезагрузки страницы, агентский браузер server-44). Форма входа капчу прошла невидимо, но бэкенд вернул «Ошибка аутентификации. Некорректно указан логин» — аккаунта на airlock@bezrabotnyi.com нет (предыдущий запуск погиб до сабмита, в ящике писем от beorg не было). Доказательство: скриншот /tmp/mktr-beorg-captcha.png. Пароль из /tmp/mktr-beorg.json зарезервирован под этот email, лежит в бэкапе — при следующей попытке использовать его, не генерировать новый.
