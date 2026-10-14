# TARGPatrol — externalblocked (SPA-ассеты не загружаются)

- статус: externalblocked
- основание: https://targpatrol.com/pricing ; https://app.targpatrol.com/
- signup/login: https://app.targpatrol.com/sign-up (Angular SPA), email предполагался: airlock@bezrabotnyi.com — регистрация не выполнена
- trial/квота: (по research) Free forever до 10 пользователей; External API и Webhooks — только в платном Base ($15/user/мес); 14-дневный trial Base требует карту Stripe — активировать запрещено
- account/workspace IDs: нет — аккаунт не создан
- креды ref: ~/.config/airlock-marketplace-accounts/targpatrol.json (пароль зарезервирован; backup: yadisk:Backups/marketplace-accounts/, статус OK, readback rc=0 2026-10-15)
- API-проверка: не выполнена (External API на Free отсутствует, аккаунта нет)
- блокеры: SPA не стартует из агентского браузера (server-44): index.html-заглушка отдаётся (HTTP 200), но модуль main-GZRRGI5U.js (181 КБ) и чанки качаются со скоростью <1 КБ/с (curl: 15,6 КБ из 181 КБ за 20 с, обрыв по таймауту), `app-root` не рендерится, формы нет; маркетинговый сайт targpatrol.com/pricing тоже не отвечает из нашей сети (таймаут 25 с). Деградация/блок сетевого пути до их CDN с наших IP — не капча и не модерация. Пароль в бэкапе — при ретрае использовать сохранённый, не генерировать новый.
