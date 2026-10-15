# Бесплатные подключения к русскому демо Airlock

Демо: https://demo.airlockrun.ru . Каталог: [37 карточек и условия](CATALOG.md).
Код Airlock Internal не изменён. Приложения ниже — отдельные native SDK проекты;
гостевой gateway/Compose и фиксация upstream находятся в отдельном private
[airlock-demo](https://github.com/megamen32/airlock-demo).

## Уже подключено

| Приложение | Сценарий | Доступ |
|---|---|---|
| [DaData](https://d88-dadata-companies.demo.airlockrun.ru/) | Настоящие сведения по ИНН/ОГРН: название, ИНН, ОГРН, статус, адрес, основной ОКВЭД | Обычный гость, форма и find_company в чате |
| [Shtab](https://d88-shtab-tasks.demo.airlockrun.ru/) | Реальное число незавершённых задач демо-команды | Обычный гость, кнопка и team_tasks; raw MCP скрыт |
| [Priceva](https://d88-priceva-monitor.demo.airlockrun.ru/) | Каталог мониторинга:1товар,1источник,0отчётов; рыночные цены пока не получены | Обычный гость, форма и price_monitor |
| [Edumotion](https://d88-edumotion-courses.demo.airlockrun.ru/) | Реальный каталог курсов: новая организация пока пуста | Обычный гость, форма и training_catalog; trial14дней с15.10.2026 |
| [Wikibot](https://d88-wikibot-faq.demo.airlockrun.ru/) | Технический обзор Airlock по публичному коду GitHub и сайту со ссылками на файлы | Обычный гость, форма и airlock_faq; ограниченные бесплатные кредиты |

Проверенные реальные результаты14.10.2026: DaData вернула Сбербанк поИНН7707083893,
ОГРН1027700132195, адресМосква/Вавилова19. Shtab вернул task_count total0:
в новой демо-команде пока нет незавершённых задач. Ноль не подставляется при
ошибке сервиса. Данные/время кэша явно показаны в русском интерфейсе.

## Минимальные изменения

- apps/dadata и apps/shtab — отдельный исходный код приложений, не форк core.
- operator.mjs — operator-only native API helper внутри demo-gateway;
  JSON на stdin. Owner login читается из закрытого runtime owner.json.
- Ключи DaData/Shtab получены через AskSecret и сохранены в native encrypted
  resources. Их нет в Git, HTML, frontend storage или инструкциях модели.
- DaData raw Connection — AccessAdmin; обычный пользователь получает только
  фиксированный lookup через typed tool/форму. Native callback проверен с user.
- Shtab MCP.Access пустой; из56remote tools гостю доступна только обёртка
  count_tasks с фиксированными аргументами. Изменение задач отсутствует.
- Манифесты/credentials создаёт штатный SDK/API; БД core вручную не меняется.

## Ограничения

DaData public demo: до1000внешних запросов/UTC-день, до5активных; успешные ответы
кэшируются10минут. Shtab: до4calls/hour, один активный, кэш15минут. Квоты и кэш
хранятся в native PostgreSQL Agent.DB через goose migrations и атомарную
reservation. Перезапуск приложения не сбрасывает квоту. Ошибки, неподключённый
ключ, недействительный ввод, пустой ответ и нулевое количество различаются.

Ресурсы: существующий общий UID993 бюджет demo88 high8/max12GiB, swap0, CPU4,
tasks4096,48GiBдиск; BuildKit4GiB/CPU2/cpuset0,1, одна сборка одновременно;
каждое приложение1GiB. Отдельные сервисы/таймеры/базы не добавлены.
Native source deployment ожидаемо30–60с, emergency max600с; первоначальная
AI-генерация наблюдалась437с и не останавливалась из-за оценки времени.
Новые лёгкие source deploy прошли без LLM; чужие процессы не останавливались.

## Обновление приложения

1. Изменить только apps/<name>, проверить diff, опубликовать owned source.
2. Скачать текущий native source через operator source в закрытый файл.
3. Упаковать source root с go.mod. Native PUT /api/v1/agents/<id>/source
   использует If-Match от HEAD; не использовать force и не повторять UNKNOWN.
4. Дождаться настоящего завершения source build и миграций; один HTTP202
   означает только приём. Сверить финальный source с опубликованными файлами.
5. Проверить обычного гостя в браузере, реальный результат и отказы управления.

Временные файлы .tmp содержат закрытые artifacts и не публикуются.
Нативная генерация дважды отказалась из-за якобы обрезанного AGENTS.md,
хотя на диске подтверждено581строка. Для этих приложений использован штатный
source deployment; это не изменение платформы и не доказанный дефект upstream.

## Priceva

[Native приложение](https://d88-priceva-monitor.demo.airlockrun.ru/) читает данные
бесплатной Competitor Price Monitoring кампании3jb.15.10.2026 API впервые
подтверждённо вернул1товар LogitechK120,1источник Regard и0отчётов. Исправлен
разбор настоящей пустой страницы отчётов, где objects отсутствует при objects_cnt=0.
Настоящие guest form и native tool chat прошли. Рыночные цены ещё не получены:
поле default_price=0 не является ценой из мониторинга. Старая кампания сохранена.

apps/priceva использует native encrypted Connection Apikey, Admin-only raw
resource и user tool price_monitor/кнопку. Кэш2минуты,4обновления/час,
один активный запрос; persistent PostgreSQL, без repricing и платных действий.

## Edumotion и Wikibot

apps/edumotion читает только опубликованные курсы отдельной организации через
официальный Public API. Реальный каталог пока пуст — ошибок нулём не маскируем.
Это14-дневный Professional trial без карты, не постоянный бесплатный API.
Кэш5минут,12обращений/час,1active,20sdeadline,512KiBresponsecap.
Персональные данные пользователей и назначение обучения не доступны.

apps/wikibot вызывает официальный API отдельного бота. Основной источник —
публичные исходники https://github.com/airlockrun/airlock, дополнительный —
https://airlockrun.ru/. Снимок478файлов ядра/API/SQL/документации разбит на57
малыхDOCX в одном источнике, также добавлена краткая выжимка с точными строками кода; сайт сохранён отдельным источником. Это снимок
commit e605529334a2, не автоматическая синхронизация. Frontend,генерируемые
DBbindings и тесты исключены для бесплатного лимита5МБ. Приватный Internal
не загружается. Демонстрационный вопрос разбирает конкретный docker-compose.yml: образы
базы данных и reverse proxy со ссылкой на файл; код в приоритете. Ответ проверяется
на фактические значения снимка до кэширования. Полная embedding-обработка
оставшегося кода у провайдера ещё продолжается; весь репозиторий не объявляется
полностью доступным поиску. Бесплатный тариф расходует
welcome-кредиты; точный остаток ask-only ключу не доступен. Лимиты сохраняются
в PostgreSQL:4новых вызова/час и20за всё время, включая ошибки; кэш10минут,
1active,60sdeadline,128KiBresponsecap. Для каждого вызова новый случайный chatId;
гостевые диалоги не смешиваются. Ключ без Bearer в encrypted Connection,
raw resource Admin-only; нет оплаченных пополнений, каналов связи с людьми,
управления ботом или автоматического обращения к оператору при ошибке API.

Все три приложения проверены15.10.2026 настоящими гостевыми HTML-формами и
нативными чатами с реальными tool results. Core и русская frontend-сборка
Airlock Internal не менялись. Подробности: [VERIFICATION.md](VERIFICATION.md).

## Следующие регистрации

По прямому поручению владельца отдельная ZCode GLM5.3Flash сессия
airlock-marketplace-free-signups получила весь список30 партнёров, включая
trial/UI-free с неподтверждённым API; existing аккаунты не пересоздаются.
Служебная почта airlock@bezrabotnyi.com создана на существующем DMS44
и подключена к UserIO как gmail-airlock. Весь аккаунт исключён из AIсекретаря;
реальные отправка и чтение проверены. [Почтовый runbook](https://github.com/megamen32/ServersAdministartion/blob/main/docs/runbooks/domain-mail.md)
ведёт отдельный владелец UserIO/ServerAdministration. Пароли/ключи хранятся внеGit;
пользователь выбрал немедленные обычные резервные копии на server100 и
на Яндекс.Диске без отдельного клиентского ключа шифрования.
Факт постановки этих задач не считается выполненными регистрациями/backup.

Последнее уточнение владельца: выбран именно Яндекс.Диск; первоначальное
упоминаниеS3 отменено. Служебный адрес — airlock@bezrabotnyi.com.
Файловый мини-чат исполнителей расположен в .agents/shared-session/
marketplace-chat.jsonl внеGit; ключи/пароли в него не записываются.

## Semantica AI

[Видимость бренда в ИИ](https://d88-semantica-visibility.demo.airlockrun.ru/)
подключена через официальный MCP. Онбординг существующего аккаунта завершён:
проект Airlock / airlockrun.ru, Россия, русский язык, одна тема и один вопрос
о self-hosted ИИ-платформах. В кабинете выполнен один скан за7подарочныхтокенов.
Результат15Oct2026: ChatGPT иPerplexity ответили безупоминанийAirlock;
GoogleAIOverview неответил. Неполученныйответ неявляетсянулевымупоминанием.

apps/semantica-ai даёт только фиксированный get_project+get_scan через
brand_visibility и русскую вебформу. Все115исходных MCPtools скрыты отгостей;
нет arbitraryproject/scanID, запусковсканов, записей илиплатежей. Ключ хранится
в штатном encryptedMCPresource; privateJSON немедленноскопированна100 и
Яндекс.Диск сreadback. Доступ наwelcomeкредитах; текущееusage-basedподключение
разрешаетчтение. Полный7дневныйtrial/бессрочнобесплатныйAPI неутверждается.
Кэш30минут,4refresh/h20totalвключаяошибки,2MCPreadнаrefresh,1active,20s,512KiB.
ИсходныйInternal/RUfrontendнеменялся. Обычныйguestform/toolchat приняты;
подробныеприёмки вVERIFICATION.md.
