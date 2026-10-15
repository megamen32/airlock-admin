# Биорг (Beorg KYC) — created+phone-verified+api-auth-live (полностью зарегистрирован)

- статус: created+emailverified+phone-verified; API-доступ подтверждён реальным запросом (авторизация живая); OCR-распознавание не запускали
- основание: https://kyc.beorg.ru/ ; https://beorg.ru/blog/guide-kak-nastroit-api-raspoznavanie-dokumentov-za-30-minut/ ; Swagger https://api.beorg.ru/swagger
- signup/login: https://kyc.beorg.ru/ , email: airlock@bezrabotnyi.com, auth: password; API-схема: заголовки `Authorization: token <token>`, `machine_uid`, `project_id`
- как закрыт SMS-гейт (шаг 2/2, висел с 14.10): UserIO SMS-синк ожил и показал старый код (SMS от retry2-P1, 04:52 MSK); код оказался ещё активен сервером — принят через POST /auth/service/verify_phone (поле `phone-code`) → need_verify=false. Регистрация завершена 15.10 ~03:39 MSK. Резерв: resend_sms_code и change_phone_number сервер не реализует (NotImplementedError), UI-кнопки повторной отправки нет; официальный фолбэк сервиса — их Telegram/WhatsApp (по контракту не использовались)
- trial/квота: тариф «Биорг.KYC (Демо)», на счёт начислено 200 ₽ тестового бонуса (квота НЕ тронута — ни одного распознавания); попап предлагает +50% при оплате за 24ч — не покупали
- account/workspace IDs: демо-проекты предсозданы сервисом: «Биорг.KYC (Демо)» project_id U_RATE_3 (id 3584) и «Биорг.Разметка датасетов» project_id COMMON_MARKUP (id 3585); token/machine_uid — в кред-файле
- креды ref: ~/.config/airlock-marketplace-accounts/beorg.json (пароль + api.{kyc_demo,markup}.{token,machine_uid,project_id}; backup: yadisk:Backups/marketplace-accounts/, store.sh rc=0 2026-10-15)
- API-проверка: POST https://api.beorg.ru/api/bescan/ping/ с токеном KYC-Демо → 200 {"result": true} и тем же способом с токеном проекта разметки → {"result": true} — авторизация token+machine_uid+project_id подтверждена на production API; POST /api/bescan/license_info → AccessDenied (модуль bescan не входит в демо-тариф); полный набор: add_document/add_task/verification/check_idempotency_status/document/result, upload/create_set (Swagger 2.0, 68 КБ, отдаётся с нашим токеном)
- блокеры: нет критичных; содержательная OCR-демо требует фото документа (не генерировали) и списывает тестовые 200 ₽ — решение за root на этапе подключения

15 октября, root: одна реальная отправка вымышленного счёта INV принята API200
(document s-1664407); результат пока425 «обрабатывается». Повторных отправок нет,
платежей/пополнений нет. Прежнее утверждение «ни одного распознавания» выше
описывает состояние до этого запроса. Демо-приложение не объявлено готовым.
