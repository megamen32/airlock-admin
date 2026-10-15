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
