# Реальная приёмка14.10.2026

Источник — неизменённый Airlock Internal v0.7.0; официальные OCI images и
source revision690a90e7 проверены на живой инстанции. Свой gateway SHA256
совпал с опубликованным wrapper. Обновление/откат описаны в UPSTREAM-DELTA.md.

| Проверка | Категория | Что обнаруживает | Ожидаемо / max | Реальный результат |
|---|---|---|---|---|
| node --check operator.mjs, gofmt source | fast unit/static | Ошибки синтаксиса/формата operator и Go | 2/20с | Успех; внешние сервисы этим не проверяются |
| Native DaData source build9234c7b8 | focused integration | SDK/templ compile и реальный запуск | 60/600с | Complete19:54:17–19:54:58,41с; отдельный app runtime |
| Native Shtab source build ea3149ec | focused integration | Правильный MCP API SDK и запуск | 60/600с | Complete19:58:09; предшествующие templ/field ошибки исправлены, не считались GREEN |
| DaData live API с ключом | focused integration | Реальная авторизация и lookup | 20/200с | ИНН7707083893 → ПАОСбербанк, ACTIVE |
| DaData guest HTML form | focused integration | Native encrypted Connection и русский UI | 60/600с | Реальные ОГРН1027700132195, адресВавилова19, ОКВЭД64.19; langru, stylesheet, результатвHTML |
| DaData cache после native rebuild | focused integration | Долговечность нового PostgreSQL cache | Вместе с rebuild | Timestamp19:50:10 остался после build19:54:58 и lookup; квота/кэш не in-memory |
| Shtab native MCP + guest button | focused integration | Авторизация и CallTool через native proxy | 60/600с | Сервисshtab1.28.1,56tools metadata; fixed count_tasks вернулtotal0, UIпоказал реальныйtimestamp19:59:14 |
| DaData native guest chat | focused integration | Реальный инструмент и доставка ответа | 60/600с | Run0adfca6f success15.259с; роли user/assistant/tool/assistant; ответ с ОГРН/адресом |
| Shtab native guest chat | focused integration | Реальный MCP callback и ответ | 60/600с | Run85b08e6a success13.270с; роли user/assistant/tool/assistant; ответ0задач с actualcachetimestamp |
| Guest mutation boundary | focused integration | Гость не управляет приложением/ключом | 20/200с | PATCH того же имени и POST credentials с пустым телом403; данные/ключ не менялись |
| Published/deployed source comparison | focused integration | Несовпадение доставленного кода | 10/100с |10businessfilesDaData,8Shtab совпали byte-for-byte сnativeexport |
| Resource budget | focused integration | Выход за общий конечный бюджет | 10/100с | UID993~8.45GB/12GiB,447/4096tasks,15GB/48GiBdisk; приложения~16MiB/1GiBкаждое |

Браузер: штатный managed route server88, отдельная сессия;
живой /api/v1/me подтвердил TENANT_ROLE_USER. Shtab screenshot сохранён как
собственный browser artifact /tmp/airlock-marketplace-shtab-20261014.png на88.
Private receipt со scoped conversation/run IDs находится в .tmp, без ключей.
Source refs native apps: DaData47ed977ee090a793359757eca149a0b4a6b50d9b,
Shtabba8c333918b393a77fa9d7ea2b2a8b8eaf3ad681.

Ни один mocked/fake provider не использовался для приёмки. Отдельный полный
Go unit suite и nightly не запускались; компиляция, реальные runtime/API/DB/UI
проверены непосредственно. SQL tables/caches проверены реальными lookup/callback,
проверка миграций up/down/up отдельно не заявляется.

## Priceva

Исходный новый аккаунт: три real read methods вернули403 account type приHTTP200.
Найдена кампания Assortment, API SDKPriceMonitoring для неё не подходит.
Пользователь затем разрешил полноценную настройку и дал обязательный контакт
через текущий диалог; номер не сохраняется здесь. В его настоящем ChromeM1
создана отдельная кампания Competitor Price Monitoring на бесплатном0рубтарифе.
Старая кампания сохранена. API/data и модерация проверяются отдельным владельцем;
пока они не подтверждены, Priceva не отмечается принятой.

Финальная проверка Priceva: campaign3jb на бесплатном0рубтарифе,
один товарp LogitechK120 и один источникRegard. UI «Кампания не активна/на
модерации»;3реальных APIread вернулиJSON401,resultabsent. Новый ключ сохранён
native encrypted Connection. Source build05c5d427 complete20:21:23,
sourceRef9abb6594057823fb2c91ffecf263180996661da7.8businessfiles nativeexport
совпали с опубликованными исходниками.

Реальный обычный гость открыл приложение и нажал «Получить данные»;
DOM на /summary с langru показал «Данные Priceva пока недоступны. Цены из
сервиса ещё не получены; подключение проверяет владелец демо». Количества/цены
не показываются. Это успешная проверка честного отказа, **не приёмка цен**.
Категория focused integration, ожидаемо60/max600с; mocks не использовались.
Внешний шаг: активация Priceva, затем реальный контракт объектов/цен и canary.

## GuestTTL24h wrapper

Отдельный gateway/module, опубликован до gateway-only deployment; core OCI не
менялся. Unit eligibility/точная24hграница/сохранениеактивности/неуспешныйdelete
прошёл~0.1с (fastunit,max20с). Контролируемому собственному nativeguest в
постоянномstate задан старый timestamp; настоящий DELETE удалилакаунт,
его прежний /api/v1/me получил401. Это не24часовойsoak.

Focusednativecanary (ожидаемо30/max300с): новыйобычныйгость +последующийrefresh
сHttpOnlycookies вернултого жепользователя; все5appIDsдо/послеравны. После
штатногоперезапускаgateway дата созданиясохранилась, lastSeenнеоткатилась.
НативныйWS?since=1 сCookie дал101, реальнаяформаDaDataвернулаОГРН1027700132195.
РанняяручнаяWSпробасBearerвернула401: upstreamWSпринимаетHttpOnlycookie,
правильныйпутьзатемпроверен. ПервоначальнаяошибкаполяqueryвручнойHTTPпробе
исправлена на штатноеidentifier; вappcodeдляэтогонетправок.
Runtime gateway/module bytes совпали с опубликованным source; privateполный
receipt ttl-proof.json хранитchecks иhashes. Обновленияисторий/паролейнетвGit.
