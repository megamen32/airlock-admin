# TARGPatrol — created + emailverified + login verified (freeUI; ретрай 15.10 через резидентный прокси)

- статус: created + emailverified + login-verified; freeUI-only (организация пока не создана; External API — только платный Base, НЕ активирован, карта не вводилась)
- основание: https://app.targpatrol.com/sign-up ; https://targpatrol.com/pricing
- signup/login: https://app.targpatrol.com/ (Keycloak: вход email+пароль), email: airlock@bezrabotnyi.com, auth: password (зарезервированный пароль выставлен через reset-ссылку, вход проверен)
- trial/квота: Free forever до 10 пользователей (по pricing/research); 14-дневный trial Base требует карту Stripe — не активировался
- account/workspace IDs: Keycloak sub bc14ced0-4578-46b3-8a16-121bfa2eef6a (несекретный); организаций нет — «not currently a member of any organization»
- креды ref: ~/.config/airlock-marketplace-accounts/targpatrol.json (backup: primary 0600 + local2 + облако с readback, store.sh rc=0 2026-10-15 05:15 MSK)
- API-проверка: не выполнялась — External API отсутствует на Free (paid-only Base $15/user/мес); UI-вход подтверждён (personal-account загружается, профиль Никита Airlock)
- блокеры: нет по регистрации. Пункт «организация не создана»: визард из 5 шагов требует адрес/штат/индекс/индустрию компании — данных нет в контрактной идентичности, выдумывать не стал; человек может завершить за ~2 минуты (Add organization). CDN-деградация ассетов, блокировавшая прошлые попытки, не воспроизвелась через резидентный прокси 192.168.2.1:3128 (main.js 304, Keycloak жив).
- как пройдено: резидентный прокси + `agent-browser --headed` (авто-Xvfb) + `--args "--disable-blink-features=AutomationControlled"`; капчи нет вообще. Нюанс инфраструктуры: письма Keycloak живут 5 минут, а Gmail→UserIO может запаздывать — верификация пройдена через resend-цикл (письмо дошло за ~40 с при быстром полле); первая попытка UPDATE_PASSWORD истекла («Action expired») — пароль выставлен повторно через Forgot password.
