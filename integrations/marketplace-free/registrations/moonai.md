# MoonAI — externalblocked pending-SMS (аккаунт создан, email подтверждён)

- статус: externalblocked (pending-SMS); внутри: created+emailverified, агент создан
- основание: https://mooonai.com/ (лендинг «3 дня бесплатного доступа»); signup https://auth.mooonai.com/auth/signup?lang=ru
- signup/login: auth.mooonai.com (email-регистрация, не Google), email: airlock@bezrabotnyi.com, auth: password, username: airlock
- регистрация: 2026-10-15 — аккаунт создан, email подтверждён переходом по verify-ссылке из письма no-reply@mooonai.com, вход по паролю выполнен, платформа сама создала первого агента («Агент успешно создан»)
- trial/квота: 3 дня бесплатного доступа при регистрации (лендинг); далее $50/мес за агента + оплата AI-токенов; карта не привязывалась
- блокер (точный): финальный шаг онбординга dashboard.mooonai.com/onboarding требует «Ваш номер WhatsApp *» с кнопкой «Отправить код подтверждения» (код приходит SMS/WhatsApp); без него «Начать работу» disabled и разделы дашборда (в т.ч. API-канал) недоступны — любой URL редиректит на onboarding. По контракту решение по SMS принимает lead: номер в форме введён, но код НЕ запрашивался
- креды ref: ~/.config/airlock-marketplace-accounts/moonai.json (backup: yadisk:Backups/marketplace-accounts/, status OK)
- API-проверка: не выполнена — API-канал (X-API-Key, платформа выдаёт endpoint URL) создаётся в дашборде за шагом подтверждения телефона; внешний webhook URL для канала НЕ подключался (по заданию)
- разблокировка: lead подтверждает отправку кода на +79260420755 → завершить онбординг → создать API-канал; либо использовать промокод-поле онбординга при наличии
