# Suvvy — externalblocked (invisible reCAPTCHA v3 не выдаёт токен)

- статус: externalblocked (captcha-submit)
- основание: https://suvvy.ai/ (приветственные 500 ₽, без карты); docs https://docs.suvvy.ai/ru/kanaly/personalnyi-kanal-api
- signup/login: https://app.suvvy.ai/?register=true, email: airlock@bezrabotnyi.com, auth: password (пароль сохранён, но не использован — аккаунт не создан)
- trial/квота (заявлено): приветственные 500 ₽ на баланс (~33 диалога), далее платно; карта не нужна
- что сделано: форма заполнена полностью и валидно (Имя Никита, Фамилия Airlock, компания Airlock, рабочий телефон, согласие с условиями; рекламные рассылки НЕ согласованы). Кнопка «Зарегистрироваться» остаётся disabled
- блокер (точный): невидимая Google reCAPTCHA v3 (render=6LdHB2osAAAAAHjMvUg-HUYvZqBZz7PqZAd_jiq8) не выполняется в браузере автоматизации — `grecaptcha.getResponse()` → «No reCAPTCHA clients», токен не выдаётся, регистрационный POST не отправляется. Воспроизводится после чистой перезагрузки + 20 c ожидания. Дополнительно фронтенд пишет «Disconnected from websocket». Также: в начале на странице висит модалка «Email не подтвержден» (с кнопкой «Отправить еще раз», сетевых вызовов не делает) ещё до любой регистрации
- SMS: не достигнут (блокировка до отправки формы); телефон в форме был обязателен, введён, нигде не использован
- креды ref: ~/.config/airlock-marketplace-accounts/suvvy.json (backup: yadisk:Backups/marketplace-accounts/, status OK) — пароль про запас для ручной регистрации человеком
- API-проверка: не выполнена (канал «Персональный API» создаётся только внутри кабинета)
- разблокировка: ручная регистрация в обычном браузере (капча v3 пройдёт человеческим фингерпринтом), затем Каналы → Персональный канал (API) → токен канала в encrypted resource
