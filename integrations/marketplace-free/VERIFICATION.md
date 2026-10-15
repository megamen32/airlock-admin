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

## Wikibot: публичный код вместо landing-only,15Oct2026

По новому поручению пользователя website6802 сохранён, отдельный DOCXsource6803
получил public GitHub snapshot e605529334a250d3158d546b5702c7651eb052c6.
Источник взят unauthenticated с airlockrun/airlock; Internalне использовался.
478файлов core/API/SQL/auth/container/docs,3,627,185sourcebytes; frontend,
сгенерированные DB Go bindings и тесты исключены для5MBfreeKB. Снимок статичен,
автосинхронизацииGitHubнет. Загрузка57малыхDOCX+849characterточнойвыжимки
поместилась в существующий DOCXsource; сайт остаётся второй source type.

Три крупных файла получили upload200, затем истинный owner dataset status
TOO_LARGE; это не считалось успешной индексацией. После разделения owner API
подтвердил57parsedDOCX3,759,731bytes +7websitepages70,276bytes; после короткой
выжимки total65pages/indexedPages65. Vendor embedding очередь ещё hasIndexing=true,
поэтому полная поисковая доступность всех478файлов НЕ заявляется. Реальный
GET /bot/search уже извлёк docker-compose из public-code guide со ссылкой наDOCX.
Приватные operator receipt/login/cookies внеGit. UserIO explicit channels.read
не получил новое login-письмо; messenger.history(refresh=true) вернул
provider_history_unavailable. Для этого разрешённого входа письмо прочитано
через существующий документированный serviceIMAP,readonly/BODY.PEEK; UserIO
runtime не менялся; mail provider refresh этим путём не подтверждён.

Ранний многотемный Wikibotответ был корректен напрямую, но занял52.7s,
native proxy по неизменённому core обрывает upstream30s. На широком коротком
вопросе наблюдался необоснованный nginx/traefik; такой canary НЕ принят.
Финальный фиксированный пример ограничен одним docker-compose.yml и70словами,
требует правильные image-значения и immutableGitHubURL до кеширования. Старый
ответ исключён новым exactsource marker; квоты и история не сбрасывались.

| Проверка | Категория | Что обнаруживает | Ожидаемо/max | Результат |
|---|---|---|---|---|
| verifiedComposeAnswer actual good/bad responses | fast unit | Не выдавать прежнюю неподтверждённую nginx/traefik догадку за compose-данные |1/60s|PASS0.006s, только локальная логика |
| Native source build666b6138 | focused integration | Реальная SDK/Go/templ компиляция/запуск |60/600s|Complete, sourceRef4009d0ff48b0bacff4f48b49371d53aae8f7367e |
| Native guest form | focused integration | Encrypted Connection и фактический ответ Wikibot внутри Airlock |300/3000s|Настоящий POST /summary: pgvector/pgvector:pg17 и caddy:2-alpine, ссылка на docker-compose.yml, timestamp23:23:21Z |
| Native guest tool chat64a61f0e | focused integration | Доставка реального результата обычному гостю |300/3000s|success19.957s; user/assistant/tool/assistant, readytrue, те же image-значения и GitHubfilelink; /meTENANT_ROLE_USER |
| Source export comparison | focused integration | Опубликованный код реально доставлен |20/200s|Все25файлов Wikibot совпали byte-for-byte с native export |
| Public snapshot builder | focused integration | Воспроизводимый экспорт без private source/credentials |30/300s|Реальный publicdownload pinnedSHA,478files3,627,185bytes →59малыхDOCX; без повторной vendorзагрузки |

CTA/onboarding/webUI — отдельная работа user-requested worker в private
megamen32/airlock-demo/main78c7eaa; source и runtime сверены. Landing основной
VPSv16, все5карточек имеют chat+webUI; nativechatмаршрут /agents/<slug>/chat.
Реальный headed44 DaData card→draft→manualsend→SberbankOGRN1027700132195 и
webUIauthrelay/formPASS. Rootнезависимопросмотрел screenshot/verification.
Wikibotquestionнакарточке теперь соответствует конкретному compose-примеру;
worker не расходовал его квоту. Проверки описаны в airlock-demo/landing/VERIFICATION.md.
Core/RUfrontend не менялись. Существующий whole-checkoutforeignWIP сохранён;
строгий whole-treeGSDgateBLOCKED_REPOSITORY_STATE остаётся отдельной границей.

## Semantica AI: onboarding, MCP, ordinary guest —15Oct2026

Existing account only; no duplicate signup. Russian Airlock project
1867448b-0052-47d3-9859-a7bd974dc56e created via actual headed44UI; countryru,
one manual topic/prompt. NativeAPI/MCP key created once and immediately copied
primary/private100/YandexDisk with realreadback. No card/payment/subscription.
One UI scan confirmed at displayed7gift tokens; scan4e433437-a94b-4308-8067-b2647c5725cc
completed01:50:28UTC. Real get_project/get_scan returned2received/3requested,
0mentions,GoogleAIO1failed. ChatGPT/Perplexity answered the one fixed question;
this does not substantiate general market awareness or a successful Google answer.

Native app d2c05666-fdc9-4882-be5b-be2d195d3b4e / d88-semantica-visibility,
SDK0.7.0. Buildc0584a1a finished36.179s, sourcee4dd8734c26d;20ownedbusinesssource
files matched native export byte-for-byte. Published25ownedsource/cardfiles in
main d6ccd22a; shared foreignbranch/index/WIP preserved. Normalizing generated
scaffold trailingEOF was excluded from gitwhitespacecheck, no checks disabled
forbusinesssource. Actual parseraccountingunit passed0.843s in1GiB/CPU2/tasks128,
max120s; incomplete/missing/foreign/inflated reports rejected. No integration mocks.

Real ordinaryuser verifiedTENANT_ROLE_USER. Native POST /summary showed2/3,
separateGoogleAIO«Нетданных» and timestamp, no inventedanswers/mentions. Native
chatdf35fb57 success16.779s, actualrun_jstool resultbrand_visibility readytrue,
received2/requested3/failed1/mentions0; finalRussiananswer distinguished failure
from absentmentions. Credentialmutation403. NativeencryptedMCP authorized,
raw115tools defaultAccess empty; onlytypedfixedreadtoolandform exposed.

Persistence: PostgreSQLquota4/h20total includesfailures,cache30min,1active,
20sdeadline512KiBdecodedcap; two fixedreadcalls perrefresh. Sealedapp1GiB and
demo88aggregatehigh8/max12GiB/swap0/CPU4/tasks4096/disk48GiB unchanged;
BuildKit4GiB/CPU2,onebuild. Headedvendorbrowser44ownunit2GiB/CPU2/tasks256
RuntimeMax2h closed and stopped afteronboarding. Newwelcomecredits arefinite;
paid-onlyscan/writeAPI notexposed. Core/Internal/RUfrontend unchanged.

Private receipts: .tmp/semantica-ai-20261015/{create-result.json,upload-result.json,
source-permission-proof.json,guest-form.html,chat-proof.json,publication-result.json}.
Publicentryoverlay now includessemantica-ai; headedmarketplace/CTA acceptance
is recorded separately in privateairlock-demo landing/verification-cta-20261015.md.

## SNABZHENETS+ —15 октября 2026 года

Вход существующим аккаунтом после модерации. Через настоящий интерфейс
установлена бесплатная интеграция API/Webhooks, без исходящих endpoint или
доставки событий. Один ключ Airlock-demo-readonly-20261015 с единственным
scope `purchase_requisitions.read`; немедленные private100 + вторая копия100 +
Яндекс.Диск проверены чтением. GET `/api/v1/integration-api/meta` подтвердил scope;
GET purchase-requisitions вернул настоящий пустой портал. Через UI создана одна
внутренняя `AIRLOCK-DEMO-001`, ID51c11e0a-f038-43ab-8f92-93ce99aa183c, draft.
Первая форма не прошла валидацию заказчика, API оставался пуст; после указания
текстового демонстрационного заказчика создана ровно одна запись. Поставщики,
контакты, отправки, покупки и платежи не создавались.

Native agent5e66e0c7-c265-42a8-a03d-9f2f31cdbadb / d88-snabplus-procurement.
Source опубликован в airlock-admin/main dce4830c. Первая сборка выявила
ошибочную запись однострочного templ if; исправлена нормальными блоками,
без ослабления сборки или платформы. Финальная builda8c83017 complete за34.050s,
sourceb755fb8a05bd, SDK0.7.0. Двадцать прикладных файлов совпали с native export.
Узкий parser unit по настоящей обезличенной странице и отказам прошёл0.580s
в1GiB/CPU2/tasks128/max50s. Ошибки/неполные страницы не превращаются в total0.

Настоящий обычный гость TENANT_ROLE_USER: POST формы показал total1, номер,
описание и «Черновик». Native run8f06e443 success12.938s, фактический результат
procurement_summary ready=true/total1/draft, финальный русский ответ различил
черновик и отправку поставщику и не придумал стоимость. Изменение Connection
гостем получило403. Кэш и квота PostgreSQL;12/h,cache15min,1active,20s,512KiB,5rows.
Суточный trial портала до16Oct явно показан. Существующие app1GiB и demo88
high8/max12GiB/swap0/CPU4/tasks4096/disk48GiB не расширялись; один BuildKit4GiB/CPU2.

Основной сайт v23 сохранён поверхv22 (и исходного portal/legalv18), не откатан.
Новая седьмая CTA первая слева: x64/y389 на1280, x19/y523 на375; полностью
в первом экране, без горизонтального выхода. Реальное нажатие открыло нужный
native чат с объяснением и редактируемым вопросом, auto /prompt запросов0.
Вебформа открылась через настоящий auth relay и по кнопке показала ту же запись.
Светлая/тёмная тема и ширина375 проверены headed Chrome на44; оба скриншота
просмотрены root. Первый QA остановился во время redirect из-за ещё пустого body;
добавлено ожидание DOM, следующий реальный проход завершился7.597s. Это не
имитация auth или API, дополнительные AI-чаты не запускались. Браузер2GiB/CPU2/
tasks512/RuntimeMax2h; Python QA1GiB/CPU2/tasks128/RuntimeMax600s.

Private receipts: `.tmp/snabplus-20261015/`: meta-read.json, purchases-seeded.json,
seed-purchase-intent.json, key-create-intent.json, source-permission-proof.json,
guest-form.html, chat-proof.json, browser-proof.json, cta-375.png,
webui-light.png, webui-dark.png. Секреты не опубликованы.


## Edumotion: один настоящий учебный курс, 15Oct

Source приложения не менялся. Через настоящий UI44 создан/наполнен вручную
и опубликован один курс, ID28971d7b-0380-4dcc-ba37-0fd2297b32a2, с одним русским
уроком. Сертификат отключён, персональных назначений/приглашений/рассылок нет,
AI-генерация не использовалась. Vendor courses HTTP200 total1. Fresh ordinary
TENANT_ROLE_USER form показывает правильный курс. Native run13e217ae success
16.888с, настоящий training_catalog readytrue total1 и русский ответ, включая
ограничение14дней trial. Headed44 фактическая вебформа после auth relay и
нажатия кнопки совпадает; screenshot просмотрен root. Новый onboarding draft
в thin overlay8b752fd отражает опубликованный курс вместо пустого каталога.
Focused integration expected60s/emergency600s, actual20.989s. Runner1GiB/CPU2/
tasks128/swap0; существующий browser44 2GiB/CPU2/tasks512/max2h. Остальные
ресурсы, core, frontend, native credentials неизменны. Доступы+seed IDs backup
primary100+copy+Яндекс.Диск readback rc0.
Private evidence `.tmp/edumotion-seed-20261015/{vendor-catalogue.json,chat-proof.json,
guest-form.html,browser-form.json,guest-form.png,create-intent.json,lesson.txt}`.


## GPTAdmin: настоящий scoped MCP, 15Oct

Добавлен новый профиль airlock-demo-public-catalog через штатный локальный
admin API, If-Match защищает создание/изменение; действующий CTL только в памяти
оператора. Существующие профили/клиенты не менялись. readonly/read_only,client,
file:server100/system_inspect + facadeschema/execute, токен30дней; немедленный
primary100+copy+Яндекс.Диск readback. Native MCPinitialize/tools-list/read-file
настоящие; shell_exec(true) тем же токеном отказан политикой. Это отдельный
allowlist профиль, а не основной fleet-token. Начальный отказ без разрешения
facade исправлен добавлением только schema/execute в новый профиль.

Source9f6ee268, SDK0.7 build7eb0912b complete28.362с/source29ce352461f5;20business
files nativeexportmatch. Узкий unitactual-MCPparser+8badcases0.015с в1GiB/CPU2/
tasks128/max60с; неполные файлы, неверный target/path, повторы и внешниеURL
отклоняются. Native app1b1dd024/d88-gptadmin-workspace, MCPAdmin-only, единственный
user tool demo_workspace и русская форма. Fixedfile32KiB, envelope512KiB,
20s,cache2min,12/h,1active; посторонних операций/параметров нет.

Настоящий обычный guest form и nativechat83e4d284 success7.437с, readytrue,total7,
корректные названия/ссылки/дата, снимок не выдан за livehealth. Credential mutation
гостем403. Headed44: emptychat375/1280 описывает приложение и даёт редактируемый
вопрос;autoPrompt0. Настоящий authrelay→webform→explicitbutton→7ссылок. Light/dark
на375 читаемы, overflowfalse; dark screenshot просмотрен root. Focusedintegration
ожидание60с/max600с, browserQA12.253с. Runner1GiB/CPU2/tasks128, browser44ownunit
2GiB/CPU2/tasks512/swap0/IOWeight10/max3600с,profilebound512MiB; measured44free104GiB.
App1GiB, aggregate88high8/max12GiB/CPU4/tasks4096/swap0 иодинBuildKit4GiB/CPU2
не расширялись. Core/frontend/GPTAdmin executable не менялись. Onboardingthin
source d1760b4 опубликован/доставленсrollbackcopy/SHAguard, gateway-onlyrecreate;
реальныйпустойчатподтвердилновыйтекст. GPTAdmin объединён в Штатно в текущем
основном каталоге; этот file-demo не выдаётся за весь сценарий Штатно.
Private receipts `.tmp/gptadmin-demo-20261015/` (MCP/profiles/build/source/guest/browser).


GPTAdmin final review: неверные унаследованные Semantica design notes заменены
на собственный NOTES.md (единственное изменениеsource6b6b8782). Настоящий build
ac488219 complete35.765с/source90585a528e3d;20businessfilesnativeexportmatch и
настоящая форма показала7приложений после этой финальной сборки. Код не менялся,
повторные AI-чаты/платные проверки не запускались. Первичный secret-scan документов
ложно считал публичное api_key_name секретом; исправлен на точные поля значений
ключа/пароля/токенов и выполнен для всех30карточек, PASS, без вывода значений.


## 15 октября: Shtab — настоящие учебные задачи и темы всех 8 приложений

В отдельной доске Shtab созданы три демонстрационные задачи без исполнителей,
сроков и внешних уведомлений. team_tasks теперь читает только эту доску и
показывает названия/статусы вместо общего счётчика компании. Обычный гость
получил 3 задачи в форме и в native tool-chat (17,254 с). Ключ сохранён в
приватном хранилище, второй копии на100 и Яндекс.Диске с readback.

В пяти адаптерах (DaData, Shtab, Priceva, Edumotion, Wikibot) убран атрибут,
принудительно включавший светлую тему. Исходные light/dark CSS уже были штатными.
Сборки проведены по очереди; остальные native файлы сохранены. Все 8 реальных
веб-форм проверены headed браузером44 при375×812 в обеих темах: цвета фона
действительно различаются, текст читаем, горизонтального переполнения нет.
Новых API/LLM запросов этот аудит тем не делал. Отдельная Shtab проверка прошла
путь основной CTA слева → чат с черновиком → настоящая форма с тремя задачами.

Исходники:7ecb7198 (Shtab),87404e84 (5 layout); overlaycc404dc.
Доказательства: .tmp/shtab-seed-20261015/{chat-proof,browser-proof}.json,
.tmp/theme-fix-20261015/browser-proof.json и build-result.json каждого приложения.


## 15 октября: Priceva — первая настоящая региональная котировка

Причина прежнего отсутствия цены: расписание существовало, но last_start0 и
очередь пустая. Одна операторская monitoring/run_product для существующего
товараp/источникаf принята urls_count1 в04:17:51UTC. Не повторялась.
General_stat processing0 ещё не означал готовность отчёта: он появился позже.
Реальный report/list выбранного regard.ru/Москвы вернул min/avg/max1280RUB,
competitor_cnt1, date1792037917=15Oct07:18:37МСК. Собственные price/
default_price/recommended_price0 не являются рыночными значениями.

Тонкий адаптер теперь выбирает настоящий товар, источник и региональный отчёт,
строго проверяет IDs/связь/URL/регион/валюту/время/ценовой диапазон. Пустой отчёт
остаётся без котировки. Кэш приватно версионирован, persistent4/h не сбрасывался.
Fast unit реальных fixtures+malformed/foreign-scope cases PASS0,013с;
1GiB/CPU2/tasks128/swap0, ожидаемо6с, аварийный60с. Никаких mock в приёмке.

Native final build bcc6f56f complete33,616с; source/published main d3077309.
Обычная гостевая форма показывает1280₽/товар/магазин/Москву/время; credentials403.
Финальный native tool-chat success20,163с, реальная quote из API, человеку
обычный русский ответ без ready/quote/имён методов. До этого один принятый
price-chat пришлось перечитать после gateway recreate: run/prompt/scan не
повторяли. Финальный canary прошёл уже после последней сборки без deployment.

Headed44: две ширины375/1280, настоящая основная CTA первой слева и видима,
новый чат с нужным черновиком и0автоотправок, переход в форму с1280₽/Москвой/
07:18МСК, реальные light/dark, без горизонтального переполнения.13,636с.
Root посмотрел настоящий тёмный скриншот: цена видна на телефоне.
Сайт v24 добавлен поверх livev23 без потери portal/legal/чужих файлов;
изменён только Priceva note в owned JS и его HTML include.

Receipt: .tmp/priceva-details-20261015/{monitor-run-result,report-specific-region,
friendly-chat-proof,browser-proof,source-match-proof}.json, финальные картинки
priceva-quote-light.png/priceva-quote-dark.png. Доступ и no-replayreceipt
сохранены в primary0600, второй копии100 и Яндекс.Диске с readback.
Beorg по тому же документу снова500; upload не повторён. NoticePlace quiet
профиль через штатные consumers не поддерживается: generic требует реального
получателя, пустые/disabled policies отклоняются. Никаких рабочих рассылок/
звонков, новых scopes и рестартов NoticePlace в исследовании не делалось.


## 15 октября: Botmother — подключён отдельный Telegram-канал

Получен ранее сохранённый tgleadsbot, без нового ввода человеком. getMe200
подтвердил @airlockleadsbot/8626594536; getWebhookInfo до привязки — URL пустой,
pending0. getUpdates, ротация и удаления webhook не выполнялись. В scoped
документах Airlock/infra/UserIO другой потребитель не найден; это ограниченная
проверка документов, не утверждение об отсутствии любого polling во всей сети.

В managed headed44 вошли в существующий Botmother аккаунт, не создавая второй.
Первое действие с невидимым checkbox было отклонено браузером до ввода токена;
после screenshot/reconcile использован видимый переключатель. Первое сохранение
не прошло обязательную категорию. Выбрана «Автоматизация процессов», затем
сохранено. Реальный getWebhookInfo подтвердил w-1.botmother.com, pending0,
ошибки доставки нет. Это доказательство подключения канала, не выполнения
Botmother-сценария и не готовой Airlock-интеграции. Пользователей и тестировщиков
в кабинете пока0. Группы, каналы, рассылки и платный тариф не включались.

Токен/доступы/receipt сохранены primary0600, второй копией100 и Яндекс.Диск,
readback PASS. Пользователю показан один конкретный шаг: открыть собственного
бота и нажать «Старт». До него доставка не инициируется. Документирован маршрут
Request-only экрана с bearer-проверяемым native Airlock callback, без Telegram
сообщений при каждом гостевом вызове. Этот маршрут ещё не реализован/не принят;
готовых native приложений по-прежнему8, публичных готовых карточек7.

Дополнительно: повторный installed hosted UserIO accounts_list в root вернул
ok=true/17accounts. Ранее наблюдённая транспортная ошибка не воспроизводится;
UserIO source/runtime/ключи не менялись. Повторная регистрация/OTP не выполнялись.
Evidence: .tmp/botmother-root-20261015/{telegram-bind-intent,telegram-bind-summary}.json;
полные Bot API receipts private0600, без копирования секретов в документацию.


## 15 октября: исходники Botmother подготовлены без публикации незавершённого демо

apps/botmother: MVC native web form + botmother_demo(status/run), owner setup
одного bm_id, admin-only credential Connection, native bearer callback. SQL
admission сохраняет intent до HTTP; pending/unknown своего пользователя
переиспользуется без повторной отправки; поздний callback не регрессирует,
дубли не меняют время завершения.6/h,100total; нет users=everyone/пустых users.
Callback требует существующий admitted UUIDv4 и фиксированные scenario/order/result.
Результаты читаются по native caller user.ID; модель не получает bm_id/секреты.

SDK air update, templ и Tailwind generation PASS. Исправлены синтаксис templ и
слишком широкая тестовая проверка: native SDK сам добавляет public GET
/static/{name}, он оставлен как положено; остальные routes user/admin.
Финальный go test -count=1 ./... PASS1,576с:5fast unit, compile whole app.
Собственный конечный source unit1GiB/CPU2/tasks128/swap0/IO10/temp2GiB,
expected30/max300с; свежий MemAvailable~28GiB при20GiB host reserve.
Финальный native memory.peak139083776bytes/OOM0; generationcheck578351104/OOM0.
Проверки строго local logic/manifest, без fake network/process providers.
Native build, настоящий PostgreSQL admission и callback, guest UI/chat/themes
не проверены и не заявлены. Botmother native агент пока не создавался.
Код подготовлен независимо от ожидаемого собственного /start; общий goal
остаётся неполным,8готовых интеграций сохранены.
Evidence: .tmp/botmother-root-20261015/check-{b,c,d}/source-check-result.json.


## 15 октября: NoticePlace — девятое настоящее native приложение

Создана новая private Matrix-комната, joined_members толькослужебныйaiadmin;
нет приглашений другим людям. Через штатную admin API создан consumer одного
project airlock-marketplace-demo: только matrix.message, maxSeverityinfo,
maxRepeats1, без звонков/healthjobs. Основные токены, каналы, сервисы и source
NoticePlace не менялись. Один read admin GET встретил transient mesh SQL
connection loss, следующий GET200 и создание успешно; service restart не нужен.
Intake токен до первой доставки primary0600/copy100/Яндекс.Диск readbackPASS.
Один операторский notification/info202 и независимые Matrix messages/event
GET подтвердили текст/correlation. Не использованы ложные health-инциденты.

App d88-noticeplace-notifications: русские MVC form/chat, admin-only raw
Connection с одним scoped intake, фиксированный текст/получатель/info. Intent
доPOST,6/h100total,10min reuse поnativeuser.ID; UNKNOWN никогда не повторяется.
Настоящий API приём отделён в UI/модели от асинхронной доставки/прочтения.
Local air update/templ/Tailwind/go test PASS10,643с, memory.peak695103488/OOM0
в1GiB/CPU2/tasks128/swap0/IO10/temp2GiB, expected30/max300. Fastunit проверяет
реальный202fixture/ошибки/prohibitedfields/manifest; не заменяет acceptance.
Native final buildd0ad027e complete36,540с/SDK0.7.0. Все23sourcefiles совпали
с main65c01354; builder-generated base:v0.7.0 и managed ignores сохранены,
без повторной сборки уже работающих байтов. Public source/private overlay
синхронизированы без смены чужой ветки/index/WIP airlock-admin.

Обычный guest form: принят настоящий API запрос, повтор дал ту же квитанцию;
credentialPOST403, sourceGET403. Send-chat был suspended на штатном run_js
request_confirmation. Свой canary approved один раз с exact resumeRunId;
native ответ вернул новый runId, наблюдали именно продолжение18714d92,
success12,643с (parent36a1611c success сам по себе не был завершением ответа).
Машинные ready/state в первой реплике убраны явной app-инструкцией; новый
status-chat success15,119с с обычным русским объяснением без полейJSON.
Тот же запрос/approval/уведомление не переотправлялись.

Headed44: две ширины375/1280, main partial-componentCTA первая слева,
видима и явно NoticePlace/один компонент «Штатно»; верный native chat draft,
0auto sends. Реальная webform, две системные темы с разными background/color,
безoverflow;12,753с. Root посмотрел тёмный mobile screenshot: всё читается.
Независимый Matrix readback и3GETevent подтвердили всего3ожидаемых сообщения
(operator/APIguest/headedguest), без дублей после повторной формы и чата.
Roomпо-прежнему один serviceaccount. Scopenegative: чужойprojectGET denied.
UI не выдаёт само202 за доставку; доставку проверил внешний Matrix consumer.

Main release20261015-v25-noticeplace-demo создан поверхv24, сохранил portal/
legal и другие чужие assets; privateoverlay8b65cb2, gateway entry обновлён
до canary, не прерывал его. Никаких рестартов core/backend/NoticePlace.
Итог9nativeapps;7полных готовых карточек плюс явная component-demoCTA
«Штатно». Полный набор «Штатно» и оставшиеся платные/ошибочные API не готовы.
Botmother liveheaded послеэтоговсёещёusers/testers0; неизвестные действиянеповторять.
Evidence:.tmp/noticeplace-demo-20261015/{check-a/source-check-result,
guest-form-proof,approval-result,approved-chat-proof,friendly-chat-proof,
final-matrix-proof,browser-proof,final-source-match-proof,scope-negative-proof}.json.


## 15 октября: десятое приложение — оригинальная память и задачи eXmanager

Доставлено отдельное демо `d88-exmanager-memory`, agent7f94d17b-d93f-4eeb-80c3-a2a05460510c.
Исходники canonical exmanager не менялись: архив pinned b57ae063, один вызов
фабрики и отдельный facade/UI/admission в private airlock-demo/adapters/exmanager-demo.
Оригинальные store.remember/searchMemory/createTask/listTasks и L3/manual L2
используются напрямую. Fresh demo DB, без внешних MCP/соединений/credentials,
коннекторов, тем, cron/jobs и производственных данных. Пользователь может
создать только собственный факт/задачу; общая квота6/час100всего, нормализованный
повтор возвращает сохранённый результат, UNKNOWN не повторяется.

Focused generation/unit PASS18.451s, peak849432576 B/OOM0; category fast unit,
expected120/max1200s. Первый native build упал при компиляции optional phone
connector из-за лимита процессов. В пакете исключены4его файла; старый runtime
оставил пустые каталоги и попытался собрать их. Удалены только2доказанно пустых
каталога rmdir в собственном source workspace, core не патчили. Одинаковый
PUT не запускает rebuild — старые квитанции сохранены, неизвестные операции
не повторялись. Исходный код SDK CLI подставлял latest; финальная сборка
b46e7499-540d-4131-b8d8-8c319bf373fa complete48.441s, SDK0.7.0, sourceRef
1f9a832b8fd3f8f29cacd21998a904bb2d3b8b05. Native builder нормализовал version+digest
к v0.7.0 tag: наблюдаемый digest записан отдельно, digest-pin runtime не заявляется.
Source export233files,232совпали с пакетом + одно объяснённое managed Dockerfile;
прикладные методы byte-identical, optional phone connector отсутствует.

Реальные формы сохранили «Орбиту»/янтарный цвет/задачу, повтор без дублей;
другой native user видит пустые списки и получает404на чужой conversation
с теми же валидными before/limit (первый запрос без обязательных параметров
дал400 и не был принят как доказательство). Source/credential/PATCH403.
Данные пережили final rebuild. Новый native chat success17.771s прочитал
точные данные. Headed44 после final build: другой гость через вебформу
сохранил «Луну»/синий цвет/задачу и в обычном native чате прочитал их.

VPS releasev26 поверхv25 сохраняет чужие portal/legal assets. Shtatno теперь
имеет2явно подписанных component CTA (NoticePlace/eXmanager), рядом слева;
375/1280, корректный draft/0автоотправок, real form в light/dark, nooverflow
PASS12.869s. Dark mobile form, CTA и настоящий chat screenshot просмотрены.
Native build/exec config обоих типов наследует combo/airlock-demo-subscriptions.
Браузерh закрыт/unitinactive; чужие процессы и production exmanager не трогали.
Новых секретов/регистраций/платежей нет. Private proofs:
.tmp/exmanager-demo-20261015/, card registrations/exmanager.md.

Теперь10nativeapps, main7полных product CTA +1частичное «Штатно» с2компонентами;
полное «Штатно» и все37исходных/33текущих карточки НЕ объявлены готовыми.
Beorg/TealBand/Botmother и платные/manual ограничения сохраняются; общий
мини-чат не содержит новых signup результатов после финальной волны20аккаунтов.


## 15 октября — одиннадцатое подключение: UserIO учебная почта

Предыдущий goal turn: PROGRESS — принят Exmanager10. Текущий: подключён
UserIO11, native app a3d4f646-e68b-4725-87f3-bdf396041937/d88-userio-mail.
Это следующий исходный self-hosted продукт, не повтор регистрации/OTP.
Новый обычный UserIO user + отдельный ящик airlock-demo@bezrabotnyi.com;
до native IMAP подключения account AI opt-out/all kinds ignore, read true,
send/subscribe/download false. Дополнительный personal read_only token:
publicHTTPS GET200, POST capability403. Пользователь видит ровно1свой ящик.
Доступы/пароли/оба токена сразу primary0600 + copy100 + Яндекс.Диск readback;
никакого нового ключа. App получил только отдельный readonly token через
native encrypted admin-only Connection; owner/личная/регистрационная почта
не используются. API UserIO PID1359622/NRestarts0/source/restart неизменны.

Настоящая цепочка SMTP→IMAP→UserIO→Airlock, без fake DB injection. Первое
письмо выявило источник UserIO: parsedate_to_datetime(-0000).timestamp на
MSK даёт3часа смещения. Header06:43:20-0000/IMAP09:43:22+0300/API03:43:20Z.
По официальной Python documentation такая naive Date означает UTC.
Отдельный GMT control AIRLOCK-MAIL-002 с новымMessageID/другимbody —
диагностический контроль, не replay первого accepted. SMTP250/queue receipt,
независимый IMAP exactBODY/UID и UserIO epoch подтвердили06:56:43Z.
RFC folding Message-ID нормализован strip при проверке, без повторной отправки.
Два настоящих учебных письма сохранены; app выбирает только002 по source/
conversation/providerID/sender/contentSHA. Cached result привязан к содержимому,
после source upgrade прежний001не вернулся; invented timezone поправки нет.
Общий -0000 parser defect не исправлен вне разрешённого Airlock boundary:
userio-imap-date-issue.md и canonical UserIO .agents/tasks/
20261015-imap-naive-date-from-airlock.md содержат доказательство/следующий шаг;
UserIO src зарезервирован другим владельцем. Core/source/runtime не трогали.

Source generation/3parser unit5.130s peak227328000. Native первый build
f23108bc failed на обязательном Connection.Description; исправлено, добавлен
manifest/access regression. Финальные5fastunit PASS2.105s/peak199598080/OOM0,
expected60/max600s/source1GiBCPU2tasks128swap0temp2GiB. Final native build
848b3f95-2fad-4b56-83ea-1860b42764c7 complete33.099s,SDK0.7.0, sourceRef
fcb4dae2fcc82d2c0b3d53d5299c38d75c8cbb6d. Все26exportfiles byte-match published
source main5e315363. Никаких лишних rebuild или широких/nightly тестов.

Обычный guest form: реальное письмо002/дата06:56:43Z/старыйкэшотсутствует;
source/credential/PATCH403. Final native read-chat success16.156s, real tool
result/тема/отправитель/содержание/дата и честное учебное ограничение.
Одна read-only preflight проверка столкнулась с gateway recreate и не принята;
после завершения rollout тот же guest GETme200, весь consumer proof повторён.
Не было повторного SMTP/send/создания нового user из-за этого.

Headed44 userIO form/lightdark/375/1280/nooverflow PASS13.522s, correctdraft/
0autosend. Dark mobile form screenshot просмотрен. VPSv27добавилUserIO,
v28поверхv27даёт все4доступных component CTA «Штатно»: NoticePlace/eXmanager/
UserIO/GPTAdmin. Все4в основной левой группе, visible375/1280 безoverflow;
GPTAdmin draft+webUI accessible,0provider reads/newchat sends,10.560s.
Фактический поиск «Штатно» вMarketplace.html привёл к карточке с4CTA,
безгоризонтальногоoverflow; mobile screenshot просмотрен. Foreignportal/legal
assets сохранены. Браузерыi/j закрыты/unitinactive. Общий scope7полных ready
productCTA +1partialShtatno4components/11nativeintegrations; полный37original/
33currentcatalog НЕ выполнен, подписки/платежи/менеджерские заявки не делали.

Улучшены инструкции Server Administration для новых native user-owned IMAP
аккаунтов без глобального Himalaya/release/restart. Existing infrastructure
checkout divergence26ahead/25behind и чужой WIP сохранены; опубликован только
owned docs/runbooks/domain-mail.md через отдельный index от origin/main.
Обычный source/credential/task state сохранён; общий assignment/quickplan
не заменялись и goal остаётся active. Privateproof .tmp/userio-demo-20261015/.

## Wikibot: собственный вопрос вместо фиксированного — 15 октября

Исправлен фактический дефект: native tool игнорировал вопрос посетителя.
Теперь форма и чат передают question в один Service; кэш учитывает вопрос,
квоты/бот/ключ/индекс не сбрасываются. Два реальных guest POST про Authorize
и secret-storage вернули различные правильные ответы с source links,
сверены с immutable публичными файлами. Native chat success19.255с,
точный вопрос в настоящем tool result. Native SDK0.7.0 build42874909 complete,
26/26exportfiles match published source. Source fastunit/gen6.138с/403MB/OOM0.
Headed44:375/1280/lightdark/nooverflow, реальный ввод/ответ,13.236с; mobile
dark screenshot просмотрен. Entry0autosend объясняет произвольный вопрос.
Ни нового приложения, ни полной готовности37исходных карточек не заявляем.
Receipt folder .tmp/wikibot-questions-20261015/, source7f27ca60/overlay887ceb5.

Проверка существующих зависимостей: Beorg тот же document s-1664407 всё ещё
result500, никаких повторных OCR uploads; Botmother0users/0testers на07:21UTC,
поэтому запуск через Airlock по-прежнему требует первого /start своего
тестировщика. Это внешние блокеры, готовые CTA для них не добавлены.

## Настоящая VM и студия страниц,15.10.2026

| Проверка | Категория | Что обнаруживает | Ожидаемо/max | Результат |
|---|---|---|---|---|
| VM-only bearer → GPTAdmin shell → Herder → Fast Agent | focused integration | Настоящее исполнение и запись файла |180/1800с|demo/UID1000, реальный agent-proof.py и assertion2+2=4;~23с|
| Перезагрузка только guest | focused integration | Потерю данных/сессии/авторизации |120/1200с|boot_id изменился, тот же hash/вывод/история/bearer и сервисы сохранены, prompt не повторялся|
| Native guest card form и rebuild | focused integration | MCP HTTPS/binding и чтение реального файла |180/1800с|Готовый HTML8700bytes, preview sandbox, исходник; пережил SDK rebuild|
| Native coding_demo action=status chat | focused integration | Реальный user tool callback и ответ |60/600с|success19.122с, readytrue, ссылка на веб-интерфейс; число coding jobs осталось4(2rejected,1done,1failed)|
| Отдельные два native гостя и права | focused integration | Утечку чужого HTML/управления |30/300с|Один видит свою готовую страницу; другой — только свой отказ без чужого preview. Source/credential/PATCH403|
| Headed44 форма375/1280 light/dark | focused integration | Нечитаемый UI/overflow/preview |60/600с|Четыре варианта прошли, мобильный dark screenshot просмотрен|
| Source generation/compile/3unit | fast unit | Manifest/templ/parser/name ошибки |18/180с|8.254с, peak557465600bytes, OOM0/swap0; не runtime proof|
| Native source export | focused integration | Несоответствие бизнес-кода |20/200с|21businessfile совпал с09e18518; SDK Dockerfile pinv0.7.0 и отсутствующий.gitignore документированы|

Final native build2577d29c-5a4b-4cc3-a51f-08b2635ba744 complete,SDK0.7.0.
Первый HTTP MCP URL отвергнут native HTTPS policy до transport; обе собственные
QA-квитанции сохранены как rejected, агент/VM folder для них не запускались.
HTTPS ingress /_mcp/airlock-vm только проксирует MCP к отдельному VM Node с
его обычным Bearer. Source URL update не меняет уже bound reusable resource:
штатный createNew:true создал HTTPS binding без нового VM token и core patch.

Отдельная browser pricing задача fast-agent:2610150856-bw4pFO отменена ровно
на180с до первого tool call; файла нет. Это НЕ успешное создание тарифов.
Native adapter теперь честно показывает completed/no-file и переводит только
свою запись в failed, освобождая очередь; запуск не повторяется. Python CLI
launcher получает emergency wall1800с при ожидаемых180; RAM/CPU/tasks/swap
не изменены.30минутная устойчивость модели этим не доказана.

Самостоятельные карточки опубликованы другим владельцем87a0105, релиз
20261015-independent-products-9cf1e37; основной каталог37уникальных продуктов.
Корневой агент не менял public current. Entry-only0d233d7 убирает устаревшие
формулировки eXmanager/NoticePlace как компонентов «Штатно».
Private receipts: .tmp/herder-demo-vm-20261015. Новые доступы primary0600,
copy100 и Яндекс.Диск с readback; ключей в опубликованном исходнике нет.

UserIO instruction-only correction0f743824: removed stale fixed MAIL001 from
the model instruction; actual provider selected message002 unchanged. Native
buildf7ab498e complete, native exported main.go exactly matches source. Same
ordinary guest form read actual002 and source/credential/PATCH403; read-only
chat18.126с showed actual002/sender/content and no old001. No SMTP send, new
provider account or raw UserIO/runtime changes.

Final owned browser n closed and unitinactive. Fresh guest sees only an empty
studio form, no other user's iframe/source. Marketplace actual studio-link
click reached that form without submitting a task. Updated standalone entry
payloads returned200 without old Shtatno labels; fresh eXmanager entry had
editable draft and0prompt requests. Private evidence stored under VM receipt
folder; source code and cloud backups contain no new untracked credentials.

## Отзыв публикации студии владельцем,15Oct2026

Технические проверки выше не подтвердили качество демонстрации для продажи.
Владелец прямо отверг недоделанный сценарий, пример и интерфейс. По его
поручению studio снята с публикации без повторного задания и без удаления VM.
Native owner API:111обычных membership удалены,remainingGuestMembers0,
statusstopped/runningfalse. Gateway пропускает её при автодоступе новых гостей
и возвращает410 для webhost, chat/id/API/prompt и публичного VM MCP.
Настоящий freshguest список не содержит студии, POSTprompt410; других
приложений и учётных данных это не меняло.

Overlaya1ae9ca опубликовал объединённую согласованную правку: studiooff и
параллельное выравнивание соседних карточек владельца01a13e7f. VPS current
20261015-withdraw-studio-a1ae9ca поверх9cf1e37; JSsha256
1b1aad77905374614532613743ee7e80d41e07ac5c18bd5fe9a95504a1fa73e5.
37продуктов и значения всех карточек unchanged,11protected cabinet/legal/Beorg
files byte-identical. Ссылка отсутствует в живом JS. Runtimegateway/entry
deployed из того же опубликованного commit с SHAguard иrollback, только
gateway recreated. Подробная визуальная приёмка rowalignment у её владельца;
корень не выдаёт это за свою проверку. Private receipt .tmp/withdraw-studio-20261015.

## Beorg: восстановленный OCR и полноценный пользовательский путь15Oct

Один безопасный GET существующего s-1664407 теперь200; новый документ, upload
и OCR не создавались. Реальный ответ сохранён sanitised fixture: нет обязательного
broken, позиции вложены Products, сумма безНДС9800,00, итогсНДС/валюта пустые,
AIRLICK оставлен как в OCR.3meaningful parser units отказывают foreign/broken
и неверномутипуProducts; значения и ошибки не заменяются ожидаемым текстом.

| Проверка | Категория | Назначение | Expected/max | Результат |
|---|---|---|---|---|
| go tool air build | fast unit/source | Полная SDK generation/compile,3parser tests |18/180с|Final successful, peak215617536bytes, OOM0/swap0; runtime этим не доказывается|
| Native encrypted Connection → реальныйresult | focused integration | Авторизация/данные/cache |60/600с|Raw invoice fields visible, matching PNG; cache survives native rebuild|
| Admin boundaries | focused integration | Обычный гость не меняет код/ключ/проект |30/300с|source/credentials/PATCH403|
| Native guest chat | focused integration | Деловой вопрос → actualinvoice_ocr |60/600с|18.753с; настоящие пропуски и AIRLICK, без новой обработки|
| Headed44 actual form | focused integration | Сравнение документа/данных и читаемость |60/600с|320/375/1280lightdark,0overflow; desktop/mobile screenshots reviewed, mobile result before source|
| Marketplace actual left CTA → native entry | focused integration | Покупатель находит Airlock и понимает задачу |60/600с|375/1280visibleleft; editable business draft,0auto-prompt; studio absent|
| Явная отправка в настоящем браузере | focused integration | Реальный пользовательский ответ после последнего исправления |60/600с|18.654с success, факты/пропуски + рабочие original/app links, безinternalid/API/UTC|
| Final native source export | focused integration | Доставлен именно опубликованный код |20/200с|27of28files byte-match99653e82, только.gitignore omitted bySDK|
| Original document URL | focused integration | Новый посетитель открывает исходник без прежней appsession |60/600с|Cold browser /document: passwordless,320/375/1280nooverflow; authenticated PNG200/bytes-SHA match|

Final native build296b1f65-b4d5-44b0-898b-68d1c8788d1e/SDK0.7.0, source
99653e821061de0a47d1de194a0e027039be867d. Общая лимитированная инфраструктура
не расширялась: source1/2GiB,CPU1,tasks128,swap0,temp512MiB, browser44
2GiB/CPU2/tasks512/profile512MiB/wall3600. BuildKit4GiB/CPU2 single; app1GiB.

Две первые старые metadata-heavy реплики помогли обнаружить плохое поведение:
чат предлагал «подключить» уже существующий файл. Финальный ToolResult отдаёт
только invoice facts и рабочиеURLs, системная инструкция требует ссылки для
сверки; actual browser reply это подтвердил. Отдельной live fault injection
провайдера не было; error handling ограничен source checks, не runtimeclaim.

Operator staging apps больше не auto-grant новым посетителям: список прошедших
демо берётся из demoApps, отдельные guest-created проекты сохраняются по
штатному broker slug contract. Настоящий freshguest видел прежние13проектов,
кандидатBeorg был скрыт до приёмки, снятаяstudioскрыта. После публикации тот
же набор13 +Beorg иегоactualHTML; studio всё ещё410. AllUsers/globalgrants
даны только после private ordinaryguest proof.

Overlay9736b3b и readableentry6932da8 опубликованы/доставлены. Publiccurrent
20261015-beorg-demo-9736b3b поверх настоящего82be8f2; первая попытка на старой
базе отказала **до записи** и не повторялась вслепую.37catalogueproducts и
все их значения сохранены,11cabinet/legal/Beorgasset files byte-identical.
Peerrowalignment не отменялся. Новый CTA — единственное изменение live JS.
Private evidence .tmp/beorg-result-20261015; новые секреты не выпускались.
Результат по бизнес-цели:12ready integrations, studiowithdrawn; fullINT04 открыт.

Последняя проверка нового посетителя нашла401 на rawstaticURL, если appsession
ещё не была получена. Это не было GREEN для firstvisit. Исправлено обычной
native HTML route /document (AccessUser, без новых разрешений/снятия auth),
с настоящим исходным PNG и возвратом к полям. После очистки только своей
headed44сессии прямой /document прошёл passwordless relay, image1600px
загрузился на320/375/1280, raw PNG с той же appsession вернул200/точныйSHA.
Длинная кнопка возврата давала0.6pxoverflow на375; укорочена, navwrap, теперь
все3ширины проходят. Итоговый новый browser user из document→form→chat дал
факты/2пропуска/правильный/documentURL за18.654с. Прежние сообщения не
повторялись/не редактировались; каждый исправленный canary — новый read-only
диалог, без новых OCR. Исходные raw-asset401 не выдаются за общий отказ API.

Source runtime27files byte-match опубликованному коду,SDK omitted.gitignore.
Последний источник/manifest/compiledsource build: expected18/max180с, elapsed15.054с.
Только реплики обычного посетителя и provider tool output доказывают рабочую
интеграцию; владелец ещё не оценивал новый дизайн.

Operational NOTES.md updated after native-code proof without a redundant rebuild;
source byte-match claim refers to pinned code99653e82, not this later docs commit.


## Botmother:15октября — настоящий обратный вызов и публикация

Сценарий Request-only реально прошёл Airlock→Botmother→native bearer webhook
за11.385с. Повторная кнопка не увеличила DB run/quota. Настоящий браузерный
запуск и одновременный второй гость подтвердили общий single-inflight: только
одна новая отправка, чужой результат недоступен. Неверный bearer401; обычному
гостю source/credential/edit/tester403. Никаких Telegram-сообщений.

Финальный nativeSDK build8e38d363 complete, все22файла совпали с main0f5df710.
Полный локальный air build12.152с, finite1GiB/CPU2/tasks128/swap0, OOM0; ранее
пойманные ошибки templ исправлены и не считались успешной проверкой.
Реальная форма320/375/1280 в light/dark без overflow, результат первым на
телефоне; desktop/mobile screenshots просмотрены. Реальная карточка сайта
375/1280: CTA первый слева, чат с черновиком/0autosend, явный Enter → русский
ответ19.210с с подтверждением/МСК/вебссылкой, без служебных полей и новой отправки.

Overlay3b6121a; actualcurrent20261015-botmother-demo-3b6121a поверх
20261015-product-brandmarks. JS_SHA256
3ef2063029eacf3b9207c2bf01c4de0f1d758ae5bcf8c623289e8211449909d6.
37products и все прочие файлы побайтно сохранены;8HTMLcache-bust только
demo-links.js. Старый ожидаемый baseline отклонён до записи, повтор выполнен
только после чтения фактического current и проверки прежнего SHA.
Доступы nativeencrypted плюс primary/copy100/Яндекс.Диск/readback.
Квитанции .tmp/botmother-connect-20261015/. Готовых13; общая цель не завершена.
