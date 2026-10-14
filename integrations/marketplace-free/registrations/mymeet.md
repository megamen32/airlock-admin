# mymeet.ai — externalblocked

- статус: externalblocked (captcha-block на регистрации; аккаунта нет)
- основание: https://mymeet.ai/ + https://mymeet.ai/pricing + https://mymeet.ai/api
- signup/login: https://app.mymeet.ai/en/sign-up, https://app.mymeet.ai/en/sign-in; email: airlock@bezrabotnyi.com; auth: password (аккаунт НЕ создан)
- trial/квота: Free forever — 180 минут/мес, 10 AI Chat prompts, файлы до 1 ГБ, без карты; API/MCP только на платных (Lite $8–10+, Pro $28–32+ за пользователя/мес)
- account/workspace IDs: нет (регистрация не прошла)
- креды ref: ~/.config/airlock-marketplace-accounts/mymeet.json (backup: 100+Диск OK, remote=yadisk:Backups/marketplace-accounts/mymeet.json)
- API-проверка: не проводилась (нет аккаунта); на Free ключ API отдаёт 403 (зафиксировано в research/CATALOG), базовый URL https://backend.mymeet.ai, заголовок X-API-KEY
- блокеры: невидимая reCAPTCHA на форме регистрации эскалирует в интерактивную image-капчу («выберите все изображения, где есть автомобили») сразу после «Continue with email» с датацентрового IP server-44; по контракту капча = СТОП. «Continue with Yandex ID» не подходит (идентичность требует email airlock@). Решение — за lead (человеческая регистрация или резидентный IP).
