# Биорг (Beorg KYC) — created+phone-verified+api-auth-live (полностью зарегистрирован)

- статус: created+emailverified+phone-verified; API-доступ подтверждён реальным запросом (авторизация живая); один учебный счёт обработан ранее; его реальный результат теперь доступен
- основание: https://kyc.beorg.ru/ ; https://beorg.ru/blog/guide-kak-nastroit-api-raspoznavanie-dokumentov-za-30-minut/ ; Swagger https://api.beorg.ru/swagger
- signup/login: https://kyc.beorg.ru/ , email: airlock@bezrabotnyi.com, auth: password; API-схема: заголовки `Authorization: token <token>`, `machine_uid`, `project_id`
- как закрыт SMS-гейт (шаг 2/2, висел с 14.10): UserIO SMS-синк ожил и показал старый код (SMS от retry2-P1, 04:52 MSK); код оказался ещё активен сервером — принят через POST /auth/service/verify_phone (поле `phone-code`) → need_verify=false. Регистрация завершена 15.10 ~03:39 MSK. Резерв: resend_sms_code и change_phone_number сервер не реализует (NotImplementedError), UI-кнопки повторной отправки нет; официальный фолбэк сервиса — их Telegram/WhatsApp (по контракту не использовались)
- trial/квота: тариф «Биорг.KYC (Демо)», на счёт начислено 200 ₽ тестового бонуса (историческое состояние до единственного счёта; позднее42₽ использованы, без пополнения); попап предлагает +50% при оплате за 24ч — не покупали
- account/workspace IDs: демо-проекты предсозданы сервисом: «Биорг.KYC (Демо)» project_id U_RATE_3 (id 3584) и «Биорг.Разметка датасетов» project_id COMMON_MARKUP (id 3585); token/machine_uid — в кред-файле
- креды ref: ~/.config/airlock-marketplace-accounts/beorg.json (пароль + api.{kyc_demo,markup}.{token,machine_uid,project_id}; backup: yadisk:Backups/marketplace-accounts/, store.sh rc=0 2026-10-15)
- API-проверка: POST https://api.beorg.ru/api/bescan/ping/ с токеном KYC-Демо → 200 {"result": true} и тем же способом с токеном проекта разметки → {"result": true} — авторизация token+machine_uid+project_id подтверждена на production API; POST /api/bescan/license_info → AccessDenied (модуль bescan не входит в демо-тариф); полный набор: add_document/add_task/verification/check_idempotency_status/document/result, upload/create_set (Swagger 2.0, 68 КБ, отдаётся с нашим токеном)
- блокеры: нет критичных; содержательная OCR-демо требует фото документа (не генерировали) и списывает тестовые 200 ₽ — решение за root на этапе подключения

15 октября, root: одна реальная отправка вымышленного счёта INV принята API200
(document s-1664407); результат пока425 «обрабатывается». Повторных отправок нет,
платежей/пополнений нет. Прежнее утверждение «ни одного распознавания» выше
описывает состояние до этого запроса. Демо-приложение не объявлено готовым.

Root 15 октября, итог одной OCR-попытки: кабинет показывает «Обработан»,296с,
баланс158₽ (из приветственных200₽ списано42₽). Настоящий result API после425
возвращает500 с пустой ошибкой; штатный просмотр кабинета
POST /api/loading/ui/get_result_details с XHR/json даёт TypeError:
argument of type 'NoneType' is not iterable. Повторный upload запрещён,
личных документов/платежей нет. Дальше: получить исправленный результат
существующего s-1664407 у провайдера; адаптер подготовлен, но не опубликован
как рабочее гостевое приложение. Доказательства в .tmp/beorg-root-20261015/.
Другой номер не требуется, верификация телефона завершена.

## Текущий результат15Oct: восстановлено и подключено

Прежний500 снят внешним провайдером: GET того же s-1664407 вернул200
с documents/INV1/INV. Повторного upload или другого OCR не было. Новый
результат содержит DocNumberDEMO-001, дату15.10.2026, вымышленные стороны,
Products[0]:2×4900,00=9800,00 без НДС. DocTotalAmountWithNDS и Currency пусты;
OCR опечатка AIRLICK сохранена. Поле broken отсутствует в настоящем ответе,
поэтому парсер принимает отсутствие и отказывает при явномtrue.

Native d48c127c-6f4e-4b4f-99a5-a65f142cd57d, d88-beorg-invoice: сравнение
изображения и полей, invoice_ocr, только прежний GET, encrypted admin-only
Connection с существующим token как query param. Токен не перевыпускался,
остаётся в прежнем primary/copy100/Яндекс.Диск backup. Финальный код99653e82,
build296b1f65; ordinary guest form/chat18.654с и403 source/key/edit, actual
CTA375/1280 и browser320/375/1280lightdark приняты. Техническая проверка
не заменяет будущую оценку дизайна владельцем.

Все неизвестные или accepted внешние действия остаются неповторяемыми;
изменился только исход чтения существующего документа. Остаток/стоимость
в предыдущих абзацах — исторический снимок, не новая финансовая проверка.
