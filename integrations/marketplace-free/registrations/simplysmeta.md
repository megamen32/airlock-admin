# ПростоСмета (Simplysmeta) — externalblocked (reCAPTCHA image-grid; ретрай 15.10 подтвердил)

- статус: externalblocked (captcha-block на регистрации; аккаунта нет)
- основание: https://simplysmeta.ru/ + https://simplysmeta.ru/help/restapi
- signup/login: https://simplysmeta.ru/register, https://simplysmeta.ru/login; email: airlock@bezrabotnyi.com; auth: password (аккаунт НЕ создан — пароль из подготовленного JSON не использован)
- trial/квота: регистрация бесплатна, карта не нужна; бесплатного trial/стартовых баллов не заявлено — работа по предоплаченным пакетам баллов от 200 ₽
- account/workspace IDs: нет (регистрация не прошла)
- креды ref: ~/.config/airlock-marketplace-accounts/simplysmeta.json (backup: 100+Диск OK, remote=yadisk:Backups/marketplace-accounts/simplysmeta.json)
- API-проверка: не проводилась (нет аккаунта); POST /api/v1/auth/login → JWT, GET /api/v1/balance — read-only; без баланса прочие методы отдают 402 Payment Required → API paid-only по документации
- блокеры: reCAPTCHA на форме регистрации отклоняет сабмит с датацентровых IP — «CAPTCHA failed» на server-44 (2 попытки, fill+JS) и server-88 (1 попытка, React-native fill). Ретрай 15.10 (server-88): форма заполнена доверенными клавиатурными событиями (Airlock/Никита/email/пароль×2, согласие проставлено), сабмит доверенным CDP-кликом мыши — открылась гугл-сетка «Выберите все квадраты, в которых изображены велосипеды» (мультираунд) вместо приёма формы; по контракту сетка = СТОП, яндекс-солвер для reCAPTCHA неприменим; 1 попытка, аккаунт не создан. Логин-форма капчи не имеет и отвечает «Пользователь с таким email не найден» — прошлый запуск воркера погиб до сабмита (JSON был в статусе pre-signup), аккаунта не существует. OAuth-вход через Mail.ru/Яндекс ID не подходит: идентичность требует email airlock@bezrabotnyi.com. Решение (человеческая регистрация или другой IP) — за lead.
