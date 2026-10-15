# Suvvy — created + emailverified; вход externalblocked (баг бэкенда password-reset)

- статус: created + emailverified; логин/кабинет externalblocked (баг бэкенда password-reset)
- основание: https://suvvy.ai/ (приветственные 500 ₽, без карты); docs https://docs.suvvy.ai/ru/kanaly/personalnyi-kanal-api
- signup/login: https://app.suvvy.ai/?register=true → login https://app.suvvy.ai; email: airlock@bezrabotnyi.com; auth: password — пароль НЕ установлен (форма регистрации пароля не содержит, сброс пароля сломан, см. блокер); телефон в форме был обязателен, введён
- trial/квота (заявлено): приветственные 500 ₽ на баланс (~33 диалога), далее платно; карта не нужна
- что сделано (ретрай 15.10, headed + резидентный прокси 192.168.2.1:3128 + AutomationControlled off): форма заполнена валидно (Никита/Airlock/airlock@bezrabotnyi.com/Airlock/+79260420755, согласие проставлено); reCAPTCHA v3 токен получен и POST регистрации принят; email подтверждён переходом по verify_email-ссылке из письма notifications@suvvy.ai (сервер подтвердил: «account already verified»)
- блокер (точный, перехвачено тело ответа): PUT https://api.suvvy.ai/api/frontend/password {new_password, token=<свежий reset-токен из письма «Обновление пароля»>, recaptcha_token, recaptcha_token_v2} → 400 {"detail":"Invalid verification code or account already verified.","error_code":"auth_invalid_verification_code"} — воспроизведено на ДВУХ свежих токенах (в т.ч. в чистой сессии с корректным токеном из URL); логин POST /api/frontend/login → 401 auth_invalid_credentials (пароль не установлен). Бэкенд путает сброс пароля с верификацией: для уже верифицированного аккаунта пароль установить нельзя, кабинет недоступен
- SMS: не достигнут (в веб-флоу не запрашивался)
- креды ref: ~/.config/airlock-marketplace-accounts/suvvy.json (backup: 100+Диск OK, rc=0) — пароль установленной сессии не имеет
- API-проверка: не выполнена (канал «Персональный API» создаётся только внутри кабинета, вход невозможен)
- разблокировка: тикет в поддержку suvvy от владельца (не отправляли) либо ручной вход человеком (если у него есть сессия) → Каналы → Персональный канал (API) → токен в encrypted resource
