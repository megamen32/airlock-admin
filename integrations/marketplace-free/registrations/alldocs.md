# AllDocs — created+emailverified, freeUI-only (API paid-only)

- статус: created+emailverified; API/MCP — paid-only
- основание: https://alldocs.pro/ (тарифы), live-кабинет https://lk.alldocs.pro/#profile (раздел «API»)
- signup/login: https://lk.alldocs.pro/signup → https://lk.alldocs.pro/login, email: airlock@bezrabotnyi.com, auth: password
- trial/квота: бесплатный UI-тариф 0 ₽: 3 бесплатных скачивания в подарок, поиск бесплатно, до ~50 распознаваний/день; роль «УЧАСТНИК», баланс 0 ₽
- account/workspace IDs: имя в кабинете «Airlock Никита» (фамилия Airlock, имя Никита); несекретных workspace ID кабинет не показывает
- креды ref: ~/.config/airlock-marketplace-accounts/alldocs.json (backup: yadisk:Backups/marketplace-accounts/, status OK, rc=0, sha256 подтверждён store.sh)
- API-проверка: ключей нет — кабинет прямо пишет «API — по тарифу API: 3 000 ₽ в месяц или 30 000 ₽ в год… После оплаты здесь появится “Создать ключ”. Ключей пока нет»; MCP-эндпоинт https://api.alldocs.pro/mcp показан в разделе «ИИ-помощники», подключённых помощников нет. Реальный API-запрос невозможен без оплаты (исслед.: 402 api_plan_required) — карточ/платёж не проводились
- блокеры: нет; e-mail подтверждён (письмо «Подтвердите e-mail — AllDocs» от 14.10.2026, ссылка /verify?token=… использована 15.10.2026)

Примечание: первый запуск (14.10) погиб до сабмита формы — письмо о регистрации в ящике отсутствовало,
пароль из хранилища не подходил; регистрация выполнена заново 15.10.2026 с тем же сохранённым паролем.
Скриншот кабинета: /tmp/mktr-alldocs-profile.png (вне Git).
