# UserIO — подключение отдельной учебной почты

Self-hosted, без отдельной платы за API. Основной UserIO и регистрационная/личная почта не передаются гостям.

Созданы новый обычный UserIO-пользователь, отдельный доменный ящик и штатное user-owned IMAP подключение через /v1/imap/accounts. До подключения включён account opt-out и выключены все automatic kinds; send/subscribe/download false. Дополнительный personal token read_only, public HTTPS чтение200 и запрет мутации403 проверены. Пароли и оба токена primary0600+copy100+Яндекс.Диск, readback PASS; без нового ключа шифрования.

Оператор ровно один раз отправил учебное письмо AIRLOCK-MAIL-001 со служебного airlock@ на отдельный ящик. Message-ID сохранён до SMTP DATA; SMTP acceptance, независимый IMAP BODY.PEEK/UIDVALIDITY/UID и фактическое появление письма в UserIO подтверждены. Никакой инъекции fake records в БД. Это учебное сообщение, не клиентская заявка.

Native SDK приложение apps/userio: admin raw Connection, один фиксированный GET, точные account/conversation/provider-message IDs и хэш содержимого. Остальные письма отбрасываются, нет выбора аккаунта/пути и отправки. Кэш5мин,12API-чтений/час. Русские MVC форма и demo_mail используют один backend.

Local source generation + parser tests PASS5.130s, peak227328000B, OOM0. Это НЕ native deployment/consumer acceptance. Current native status: pending.

Подготовленные доступы: ~/.config/airlock-marketplace-accounts/{mail-airlock-demo,userio-demo}.json; только вне Git. Private receipts .tmp/userio-demo-20261015/. Основной API source/runtime/restart не менялись. Браузер только44/88 с конечным бюджетом; sealed demo88 high8/max12GiB/app1GiB/BuildKit4GiBCPU2/onebuild.
