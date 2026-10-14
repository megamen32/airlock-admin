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

## Новые реальные подключения15.10.2026

Это дополнение заменяет прежний статус Priceva401: сейчас настоящий API
разрешает чтение каталога, но рыночные цены всё ещё не приняты.

| Проверка | Категория | Что обнаруживает | Ожидаемо/max | Реальный результат |
|---|---|---|---|---|
| Priceva countPage шесть узких случаев | fast unit | Пустая реальная страница без objects; противоречивый count; отсутствие структуры | 1/60с | PASS0.003с; это только локальная логика разбора |
| Priceva native upgrade9ec44e00 | focused integration | Реальная компиляция, SDK, запуск после исправления | 60/600с | Complete38с, sourceRef f71c5ba6300e1e88dd4acbf48ea8bf08efbb672c |
| Priceva guest form+tool chat99356853 | focused integration | Настоящий encrypted Connection и доставка результата обычному гостю | 300/3000с | API и форма: products1/sources1/reports0; run success14.040с, роли user/assistant/tool/assistant; цен нет |
| Edumotion native build5f7329ff | focused integration | Реальный SDK/templ build и запуск | 60/600с | Complete; sourceRef71fe8b246185e2c2b37e5bb3b436c6c275b022ba; предыдущая ошибка templ исправлена и не считалась GREEN |
| Edumotion guest form+tool chat67949b50 | focused integration | Public API с X-Api-Key, честный пустой каталог и trial notice | 300/3000с | ready=true,total0,sourceEdumotion; run success16.165с, настоящий tool result; trial14дней явно указан |
| Wikibot native build eb03467e | focused integration | Реальный SDK, PostgreSQL quota/cache и запуск | 60/600с | Complete; ключ bound в native encrypted resource; All users роль user |
| Wikibot guest form+tool chat719c118e | focused integration | Реальный ответ AI по публичной БЗ через API, не текст-заглушка | 300/3000с | Содержательный SUCCESS ответ об Airlock, источник airlockrun.ru/platform.html#control; run success30.848с с tool result, кэш совпал с формой |
| Native export comparison | focused integration | Запущенный исходник соответствует файлам адаптера | 20/200с | Edumotion22, Priceva18 и Wikibot22source files byte-for-byte |

Guest API canary использует настоящий fresh passwordless /auth/refresh accessToken
и Bearer на subdomain. Ручной airlock_session cookie в ранней HTTP-пробе дал401:
это неверный тестовый способ авторизации, не обнаруженный дефект продукта.
Для poll native runs нужен штатный Referer с agent/conversation ownership.
HTTP HTML form проверена настоящим POST к приложению; новый headed-browser
прогон в этой волне пока не заявляется. Прежний browser auth relay принят ранее.
Private admission/proof/source exports хранятся в .tmp/marketplace-wave2-20261015,
секреты и browser auth там не публикуются. API-квоты постоянные, не сбрасывались.

Общий shared checkout остаётся на чужой nginx-direct-airlock-proxy с чужим WIP
(AIRLOCK_ADMIN.md,AIRLOCK_RUNBOOK.md,README.md,gptadmin и другими файлами).
Owned source публикуется поверх origin/main отдельным индексом, без reset/stash/
переключения ветки. Поэтому строгий whole-checkout GSD verdict остаётся
BLOCKED_REPOSITORY_STATE; это не отменяет доказанные рабочие native API/chat
пути, но не даёт объявить весь checkout чистым или весь marketplace завершённым.

Финальная проверка после публикации source: Edumotion presentation-only upgrade
04588a99 complete37.101с, sourceRef dc4e2f8e8c2fb76aa61421ffccce3d39963402d1;
views не импортируют domain package, controller проектирует CourseView.
Все22файла Edumotion и22Wikibot совпали с native source export. После финальных
build/bind/grant настоящие POST /summary трёх приложений прошли повторно:
Edumotion total0/trial notice, Wikibot содержательный ответ Airlock, Priceva1/1/0.
Обычный гостевой /me подтвердил TENANT_ROLE_USER; попытки POST credentials
с пустым телом для Edumotion/Wikibot дали403 и не меняли данные.
Это focused integration, expected300/max3000с для всей consumer-проверки;
никакой тест не обрывался из-за оценки времени. Последний parser-only unit
повторён перед публикацией, PASS0.006с; broad/nightly suite не запускались.
