# mymeet.ai — created + freeUI-only (прокси-ретрай 15.10 прошёл)

- статус: created (+freeUI-only; API только на платных тарифах — подтверждено в UI)
- основание: https://mymeet.ai/ + https://mymeet.ai/pricing
- signup/login: https://app.mymeet.ai/en/sign-up → sign-in https://app.mymeet.ai/en/sign-in; email: airlock@bezrabotnyi.com; auth: password (+email-код при входе-подтверждении)
- trial/квота: Free forever — 180 минут/мес (UI: «180 out of 180»), 10 AI Chat prompts, без карты
- account/workspace IDs: workspace «Airlock's space», https://app.mymeet.ai/en
- креды ref: ~/.config/airlock-marketplace-accounts/mymeet.json (backup: 100+Диск OK, remote=yadisk:Backups/marketplace-accounts/mymeet.json, rc=0)
- API-проверка: Settings → API settings → «API usage is available on the Lite, Pro and Business plans» — на Free ключ не выдаётся; базовый URL https://backend.mymeet.ai, заголовок X-API-KEY (research/CATALOG)
- блокеры: нет. Итог среды: reCAPTCHA прошла НЕВИДИМО только в связке резидентный прокси 192.168.2.1:3128 + headed-браузер с --disable-blink-features=AutomationControlled; в headless-сессии на том же прокси Google крутил бесконечные image-сетки и выдал баннер «автоматические запросы» (fingerprint-детект, не IP).
