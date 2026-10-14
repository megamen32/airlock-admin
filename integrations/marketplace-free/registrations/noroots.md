# Noroots — externalblocked

- статус: externalblocked (captcha-block на шаге 1/2; аккаунт НЕ создан, форма не отправлена)
- основание: https://noroots.ru/tariffs + https://app.noroots.ru/register
- signup/login: https://app.noroots.ru/register; email: airlock@bezrabotnyi.com; auth: passwordless-email (пароль присылают письмом — planned, не достигнуто)
- trial/квота: постоянного free-тарифа нет (Базовый 4600 ₽/30 дн, Премиум 9300 ₽/30 дн); условия «Попробовать бесплатно» публично не раскрыты
- account/workspace IDs: нет (регистрация не завершена)
- креды ref: ~/.config/airlock-marketplace-accounts/noroots.json (backup: 100+Диск OK, remote=yadisk:Backups/marketplace-accounts/noroots.json; password: null, auth passwordless-email)
- API-проверка: невозможна — API только корпоративный, self-serve ключа нет
- блокеры: Yandex SmartCaptcha на форме регистрации: клик по «Я не робот» эскалирует в advanced-режим «Введите текст с картинки» с датацентрового IP server-88; по контракту капча = СТОП (форма не отправлялась, SMS-ветка не достигнута). Телефон +79260420755 вводился только в неотправленную форму. Тот же класс блокера, что у beorg. Решение — за lead (человеческая регистрация или резидентный IP); SMS-политика не проверена из-за капчи.
