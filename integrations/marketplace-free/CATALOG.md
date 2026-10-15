# Бесплатные API/MCP из Airlock marketplace v9

Историческая проверка:14.10.2026. Актуальные подключения и цены — в README.md и REGISTRATION-STATUS.md. Источник списка — предоставленный пользователем
Airlock_marketplace_v9.zip, 37 карточек. Архив — статический каталог,
не установленный набор работающих интеграций. Цены и доступ проверялись по
официальным страницам; «не подтверждено» не означает доказанную платность.

## Начать здесь

| Сервис | Постоянный бесплатный доступ | Что сделать владельцу | Сценарий Airlock |
|---|---|---|---|
| [DaData](https://dadata.ru/pricing/) | До10 000 lookup/suggestions запросов в сутки; платные clean/enrichment исключены | [Регистрация и подтверждение почты](https://dadata.ru/profile/), скопировать API-ключ. Secret key не нужен | Найти реальную компанию по ИНН/ОГРН; отдельный native Connection |
| [Shtab](https://doc.shtab.app/kak-podkliuchit-chatgpt-claude-i-drugie-ii-assistenty-k-shtab-cherez-mcp/) | MCP10запросов/час на компанию | [Создать отдельную демо-команду](https://my.shtab.app/), ИИ-ассистенты и MCP → Для разработчиков → Создать токен; добавить несколько несекретных демо-задач | Читать задачи через native MCP callback; не давать гостю raw write tools |
| [Priceva](https://priceva.com/subscription) | Starter:20товаров/20сайтов/6200проверок в месяц, API включён, без карты | [Регистрация](https://app.priceva.com/), API-ключ и2–3 публичных товарных URL, дождаться первой проверки | Подключено: правильная кампания3jb, реальная цена1280₽ для демо-товара от15Oct07:18МСК, источник/регион/время в форме и чате. Без оплаты. |

DaData: POST https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party,
Authorization: Token API_KEY, JSON query/count/branch_type. [Официальный метод](https://dadata.ru/api/find-party/).
Native AuthInjectAPIKey с Name Authorization может хранить полное значение
`Token <ключ>` в encrypted resource: префикс добавляет оператор до сохранения,
не приложение и не пользователь чата. Это позволяет обойтись без core patch.
Shtab: https://my.shtab.app/api/mcp/rpc, Streamable HTTP, Bearer-токен.
API-ключи передаются только через AskSecret и native encrypted credentials.

## Семь исходных карточек

| Карточка | Условия / следующий шаг |
|---|---|
| GPT Admin | Self-hosted MCP уже есть у владельца; отдельная оплата подключения не нужна. Для публичного демо нужен отдельный ограниченный профиль/компьютер с демо-файлами. Не подключать администраторский fleet-токен. [Документация](https://github.com/megamen32/gptadmin_opensource) |
| Agent Herder | Собственный self-hosted MCP. Реальные coding sessions потребляют ресурсы/подписки и открывают рабочие данные; для демо требуется выделенное окружение, не основная координация. [Проект](https://github.com/megamen32/agent-herder) |
| Notice Place | Подключён отдельный scoped demo project/info и новая private Matrix-комната только со служебной учётной записью. Настоящие API202, guest форма/чат и доставка проверены; на сайте отдельная карточка NoticePlace. Рабочие инциденты, звонки и основные токены недоступны. [Проект](https://github.com/megamen32/noticeplace) |
| eXmanager | Подключено отдельное демо оригинальных личных памяти и задач. RU форма и native чат, изоляция пользователей; рабочие данные/сообщения/автоматизация не подключаются. На сайте отдельная карточка eXmanager. |
| User IO | Подключено изолированное демо учебной почты: отдельные user/ящик/read_only token, настоящее SMTP→IMAP→UserIO→Airlock письмо, форма и чат. Личные диалоги/отправка/автоматический секретарь не подключены. |
| Unify | Native Airlock карточка, внешний API/MCP и условия бесплатного доступа не заявлены. Нужно получить пакет приложения/демо от автора. [Источник](https://airlockrun.ru/) |
| Ферман | Карточка без опубликованного API/MCP reference и free API-квот. Не обещать автоматическое подключение без предоставленного доступа. [Сайт](https://fermanai.ru/) |

## Остальные30 партнёров

DaData и Shtab рассмотрены выше. Следующая таблица охватывает остальные28.

## Таблица 28 партнёров

| Продукт | Бесплатность API/MCP | Что требуется / протокол | Официальное основание |
|---|---|---|---|
| Dbrain | Бесплатный показ/демо заявлен; самодоступный бесплатный API и квота не подтверждены | Запрос демо и API-доступа у команды; HTTP API, параметры авторизации уточнить по предоставленному доступу | https://dbrain.io/ ; https://docs.dbrain.io/ |
| mymeet.ai | **Платный API/MCP**: Free выдаёт 403, доступ только Lite/Pro/Business | Регистрация app.mymeet.ai, платный workspace, Настройки → API Key; REST `X-API-KEY`; официальный MCP есть | https://github.com/MyMeetAI/API-Docs ; https://mymeet.ai/ru/blog/mcp-api-mymeet |
| Doczilla | Бесплатный внешний API не подтверждён; бесплатное автозаполнение из реестров внутри продукта не означает бесплатный API | Запросить демонстрационный доступ/условия интеграции; REST API описан на уровне возможностей | https://doczilla.pro/integration |
| TealBand | Бесплатная регистрация/создание опроса; **AI-анализ за баланс**. Промокод START5 опубликован, сумма/срок в тарифной странице не раскрыты | Регистрация app.teal.band и организация; REST Bearer персональный токен; MCP Streamable HTTP `/mcp`, OAuth scopes. Не менее 5 ответов для агрегатной аналитики | https://app.teal.band/pricing ; https://app.teal.band/docs/integrations/rest-api ; https://app.teal.band/docs/integrations/mcp-agent |
| Suvvy | Предоставление API как интерфейса без отдельной платы заявлено; бесплатное выполнение AI-запросов/постоянная квота не подтверждены | Аккаунт, бот, Каналы → Персональный канал (API); настройка канала/веб-сервера. Расход модели/тариф сервиса надо проверить отдельно | https://docs.suvvy.ai/ru/legal/terms-of-service ; https://docs.suvvy.ai/ru/kanaly/personalnyi-kanal-api |
| Beorg | **Trial: 25 OCR** при регистрации; +50 по запросу. Liveness отдельно рекламирует 100 ₽ бонуса, не смешивать пакеты | kyc.beorg.ru/self_sign → Доступы к API; token/machine_uid/project_id | https://beorg.ru/blog/guide-kak-nastroit-api-raspoznavanie-dokumentov-za-30-minut/ ; https://docs.beorg.ru/api_docs/integration_and_api/ |
| AllDocs | **Платный API**, 3 000 ₽/мес. Live docs требуют активный API-тариф, иначе 402. Cached search ещё показывает старую бесплатную beta — доверять live docs | Зарегистрироваться lk.alldocs.pro, оплатить API-тариф, Профиль → API → ключ; REST https://api.alldocs.pro/v1 , Bearer `ad_live_…` | https://alldocs.pro/developers ; https://alldocs.pro/offer |
| ПростоСмета | Постоянный бесплатный API не подтверждён; 402 означает нехватку средств | Аккаунт/баланс; POST `/auth/login` → JWT Bearer; база https://www.simplysmeta.ru/api/v1/ ; 60 запросов/мин с IP | https://simplysmeta.ru/help/restapi |
| Segmentable | **MCP в платном Team**: 980 000 ₽/год на русской странице. «Начать бесплатно» не обещает MCP | Team/Enterprise и проект; техническая настройка MCP не опубликована на тарифной странице | https://segmentable.io/plan/team |
| MaxFrame | Бесплатный API не подтверждён; ключ пока выдаётся вручную | Самому пользователю запросить ключ у @maxframe_info; REST https://maxframe.ru/api/maxframe/ , `X-Api-Key`. Я сообщения не отправлял | https://www.maxframe.ru/api-docs/ |
| TARGPatrol | Free продукт есть, 14-дневный trial Base рекламируется; **включён ли API в Free, не подтверждено** | app.targpatrol.com, Владелец → Управление → Внешний API → Добавить токен; API https://api.targpatrol.com | https://targpatrol.ru/blog/about-targpatrol/ ; https://targpatrol.ru/knowledge-base/otkrytyi-api-targpatrol/ ; https://api-docs.targpatrol.ru/docs/getting-started/try-swagger/ |
| Wikibot | Бесплатный тариф/приветственные кредиты есть; recurring AI-квота и доступ API на Free **не подтверждены** | app.wikibot.pro: бот, учебная база знаний, API-ключ; REST https://api.wikibot.pro/api , `Authorization: <key>` без доказанного Bearer-префикса | https://wikibot.pro/docs/quick-start/tariffs ; https://wikibot.pro/docs/api |
| Метриус | 7-дневный trial продукта; **API в платном Бизнес**, постоянного Free API нет | Аккаунт и свой канал/workspace; REST https://metrius.pro/api/v1 Bearer; MCP https://metrius.pro/mcp OAuth или Bearer | https://metrius.pro/pricing/ ; https://metrius.pro/api-docs |
| Semantica AI | **7-дневный trial** полного продукта; постоянного Free нет, бесплатность API в trial не следует однозначно из тарифной страницы | Аккаунт/проект и сайт; API-ключ в настройках, подробный REST reference в приложении; MCP OAuth, каталог/страница конфигурации. Не путать с MIT-проектом getsemantica.ai: это другой сервис | https://ai-semantica.com/ru ; https://ai-semantica.com/mcp/geo-seo-mcp/semantica |
| VseLLM | **Платный API**, регистрация + пополнение. Реферальные бонусы не бесплатная постоянная API-квота | Аккаунт, раздел Ключи; OpenAI-compatible https://api.vsellm.ru/v1 , Bearer | https://vsellm.ru/ ; https://vsellm.ru/docs |
| PolzaAI | **Платный API**, минимальное пополнение 100 ₽; бесплатная IDE не даёт бесплатных токенов | Аккаунт/организация, API-ключ, баланс; OpenAI-compatible https://polza.ai/api/v1 | https://polza.ai/collections/text ; https://polza.ai/ ; https://polza.ai/software-registry/functional-characteristics |
| Botmother | **Бесплатный Test**, до 10 ботов/5 тестеров; подходит ограниченному тесту, не массовому public demo | app.botmother.ru, бот, Настройки → События → Внешнее событие, секретный webhook URL; HTTP POST JSON | https://botmother.ru/price ; https://docs.botmother.ru/article/41072 |
| Priceva | **Сайт обещает бесплатный Starter с API**, до20 товаров/20сайтов,6200проверок/мес. **Правильная кампания3jb на модерации, новый ключ возвращаетJSON401**; работающий free API пока не подтверждён | app.priceva.com, API-настройки, ключ, URL публичных товаров, дождаться мониторинга; REST auth уточнить в Apiary/кабинете | https://priceva.com/subscription ; https://priceva.docs.apiary.io/ ; https://app.priceva.com/ai/client/vcr/settings/api |
| MoonAI | **3-дневный trial**, постоянного Free API нет | Аккаунт, агент, API-канал; платная подписка и AI-токены после пробника. Настройки авторизации канала по документации | https://mooonai.com/en/ai-salesperson ; https://mooonai.com/en/integrations/whatsapp ; https://docs.mooonai.com/channels/api_channel/ |
| Legiscan | Бесплатный первый документ в UI, **API только бизнес/PRO** | Бизнес-аккаунт и ключ; REST `X-API-Key` или Bearer; /api/edo/analyze и /api/edo/jobs/{id} | https://legiscan.ru/docs/api ; https://legiscan.ru/fizicheskim-litsam |
| Lexis Voice | Бесплатный первый UI-разговор не бесплатный API; **API в Стандартном от 34 000 ₽/мес** для тренировок (речевая аналитика — отдельный пакет) | Запросить ключ у команды после согласования сценария; HTTP API/webhooks, точные scopes | https://lexisvoice.ru/pricing ; https://lexisvoice.ru/integrations |
| DEERAY | API/SDK заявлены, постоянный бесплатный доступ/квота не подтверждены | Запрос демо/доступа. docs.deeray.com/api/conversations недоступна веб-инструменту, поэтому auth не домысливал | https://deeray.com/ru/ ; https://docs.deeray.com/api/conversations |
| Edumotion | **14-дневный trial** Профессионального, без карты; все ключевые функции тарифа, API-ключи заявлены. Постоянного Free нет | Аккаунт организации, отдельный API-ключ, курс/демоданные, подписанные webhooks; точный HTTP auth надо взять из reference | https://edumotion.ru/ ; https://edumotion.ru/legal/oferta/ ; https://edumotion.ru/vozmozhnosti/bitrix24-i-api/ |
| Logsheet.ai | Free UI: 1 компания/3 журнала/3 пользователя; **API только Enterprise**, trial Enterprise 14 дней по странице | Запрос Enterprise и API-доступа; Swagger https://api.logsheet.ai/api , auth не подтверждён | https://logsheet.ai/company/pricing ; https://logsheet.ai/de/unternehmensloesung/integrationen |
| SNABZHENETS+ | Оферта допускает **40-дневный тестовый период**, если иной срок не указан в UI. API-квоты/включённость trial не гарантированы | Собственный портал, уполномоченный пользователь → Настройки → Интеграции → API/Webhooks; `X-API-Key: spk_…` с read scopes; https://<portal>.snabplus.com/api/v1 | https://snabplus.com/legal/offer ; https://docs.snabplus.com/api/ |
| Inspecto | Бесплатный продукт до 5 пользователей/5 шаблонов, **API в платном Профессиональном** | Профессиональный тариф от 990 ₽/пользователя/мес; регистрация/ключ. docs.inspecto.in/docs/api/auth недоступна, auth не подтверждён | https://inspecto.in/pricing ; https://docs.inspecto.in/docs/api/auth |
| Фидли / Feedly.tech | «Try free»/демонстрация есть; **постоянный free API/MCP и квоты не опубликованы** | Вход app.feedly.tech, отдельный демопроект/публичный источник; HTTP MCP https://mcp.feedly.tech , OAuth/ключ не раскрыт на landing | https://feedly.tech/en/ |
| Noroots | API существует для корпоративных интеграций; постоянный бесплатный API/схема/квоты **не подтверждены** | app.noroots.ru и запрос конкретного API-сценария у команды; бесплатная UI-проверка не достаточна | https://noroots.ru/help ; https://noroots.ru/tariffs |

## Что можно показать после передачи ключей

- Priceva: сравнение реальных цен/наличия 2–3 публичных товаров. Запрашивать только read данные отдельного демонстрационного аккаунта, не автоматическое изменение цен.
- Beorg: распознанные поля из специально подготовленного, разрешённого для демонстрации документа; лимит 25 операций общий и невозобновляемый.
- Botmother: вызов экрана или сообщения для конкретного зарегистрированного тестера. Это внешняя отправка, поэтому текущая исследовательская задача её не выполняла; нужна отдельная явно согласованная демонстрация с тестовым получателем.
- TealBand: опрос/список опросов можно подключить отдельным персональным API-токеном; содержательная AI-аналитика требует баланса и минимум 5 ответов. START5 — разовое промо, размер не подтверждён.

Не публиковать пользовательские токены в архиве/лендинге и не давать анонимным гостям данные обычного рабочего аккаунта. Ключ — только в серверной конфигурации; лучше отдельный demo workspace и read scopes.

## История расхождения Priceva (14 октября; устранено15октября)

14.10.2026 настоящий пользовательский API-ключ проверен через официальные
POST product/list, source/list, report/list. HTTP200 содержит JSON errors
code403: `You are not allowed to use this method with your account type`.
Цена/товары не получены. Успешный HTTP200 не принимается за интеграцию.
Нужно проверить тип кампании/доступ API в кабинете или получить разъяснение
поставщика; платные тарифы и repricing не активировались, сообщения не отправлялись.

После настройки14.10: правильная бесплатная CompetitorPriceMonitoring3jb,
товарLogitechK120 и источникRegard созданы; стараяujb сохранена. UI прямо
«Кампания не активна/на модерации», финальные3метода даютJSON401 безresult.
Native приложение показывает отсутствие данных, не нулевые цены. Это внешняя
граница активации, не доказательство работающего freeAPI; платежи не включались.

15 октября: ключ разрешил API; оператор запустил один мониторинг существующего
товара/источника. Реальный региональный report/list вернул1280RUB для
regard.ru/Москвы, проверено07:18МСК. Native гостевые форма и чат показывают цену,
магазин, регион и время. Исторические401/403 выше больше не являются блокером.

15Oct актуализация: Beorg теперь подключён на существующем welcome-доступе,
тот же ранее обработанный s-1664407 вернул настоящий200 с полями. Native
форма/чат/изображение/переход из маркетплейса проверены. Прежнее500 снято
внешним провайдером; OCR повторно не запускался. Это ограниченный бонус,
постоянный бесплатный API не заявляется. Студия AgentHerder/FastAgent снята
владельцем с публикации; повторно её не открывать по старой таблице.
