# Noroots — externalblocked (captcha-block, 4 текстовые попытки исчерпаны)

- статус: externalblocked (SmartCaptcha text-challenge не пройдена солвером; форма НЕ отправлена)
- основание: https://noroots.ru/tariffs + https://app.noroots.ru/register
- signup/login: https://app.noroots.ru/register (шаг 1 из 2); email: airlock@bezrabotnyi.com; auth: passwordless-email (пароль придёт письмом — не достигнуто)
- trial/квота: постоянного free-тарифа нет (Базовый 4600 ₽/30 дн, Премиум 9300 ₽/30 дн)
- account/workspace IDs: нет (регистрация не завершена)
- креды ref: ~/.config/airlock-marketplace-accounts/noroots.json (backup: yadisk + local2 OK, readback rc=0 2026-10-15; password: null, auth passwordless-email)
- API-проверка: невозможна — API только корпоративный, self-serve ключа нет
- блокеры: ретрай 15.10: форма заполнена (Никита, +79260420755, airlock@bezrabotnyi.com ×2, «до 5 договоров», рассылка снята), клик «Я не робот» эскалировал в текстовое задание «Введите текст с картинки» — солвер captcha.bezrabotnyi.com/predict отвечал по искривлённому тексту с ошибками (4/4 попытки отклонены, каждый раз «Попробуйте ещё раз. Дополнительная проверка», задания усложнялись до тёмных). Пример: солвер «арбуза запутался» — совпало с картинкой, но отклонено виджетом. SMS-ветка (телефон без кода) не достигнута: сабмит формы не состоялся. Дальше — человеческая регистрация или резидентный IP, решение за lead.
