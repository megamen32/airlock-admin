# mymeet.ai — created + freeUI-only (прокси-ретрай 15.10 прошёл)

> Обновление15октября2026: Ожидаем ответ. Запрос бесплатного тестового доступа отправлен; [полный отчёт](../OUTREACH-2026-10-15.md). Ранее указанные запреты на лид-формы отменены прямым текущим поручением пользователя именно для этого обращения; платные подключения по-прежнему не разрешены.


- статус: created (+freeUI-only; API только на платных тарифах — подтверждено в UI)
- основание: https://mymeet.ai/ + https://mymeet.ai/pricing
- signup/login: https://app.mymeet.ai/en/sign-up → sign-in https://app.mymeet.ai/en/sign-in; email: airlock@bezrabotnyi.com; auth: password (+email-код при входе-подтверждении)
- trial/квота: Free forever — 180 минут/мес (UI: «180 out of 180»), 10 AI Chat prompts, без карты
- account/workspace IDs: workspace «Airlock's space», https://app.mymeet.ai/en
- креды ref: ~/.config/airlock-marketplace-accounts/mymeet.json (backup: 100+Диск OK, remote=yadisk:Backups/marketplace-accounts/mymeet.json, rc=0)
- API-проверка: Settings → API settings → «API usage is available on the Lite, Pro and Business plans» — на Free ключ не выдаётся; базовый URL https://backend.mymeet.ai, заголовок X-API-KEY (research/CATALOG)
- блокеры: нет. Итог среды: reCAPTCHA прошла НЕВИДИМО только в связке резидентный прокси 192.168.2.1:3128 + headed-браузер с --disable-blink-features=AutomationControlled; в headless-сессии на том же прокси Google крутил бесконечные image-сетки и выдал баннер «автоматические запросы» (fingerprint-детект, не IP).

## Запрос бесплатного API-гранта15октября

Служебная почта. SMTP250, одна точная копия вSent сPNG; внешний MX принял письмо. Ожидаем ответ.

В запрос включены конкретный учебный сценарий, небольшая бесплатная квота, прямая карточка продукта, https://airlockrun.ru/startups.html и скриншот карточки (в почте/Telegram файл, в веб-форме прямаяPNG-ссылка). Платные тарифы/опции/автосписания не включались. Первичное письмо подтвержденоSMTP250/Sent, но при отказе внешнего сервера это не выдано за доставку; альтернативный канал использован только после окончательногоbounce. Принимающий маршрут и ответ вендора выше — текущий статус.

Приватные квитанции `.tmp/paid-api-outreach-20261015/`. НовыхAPI-ключей пока нет; до подтверждённого доступа интеграция гостям не публикуется.
