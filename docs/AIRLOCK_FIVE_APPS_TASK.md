# Пять действующих приложений в Airlock

## Текущая задача: полноценные веб-интерфейсы и единый вход

Статус: **завершено, независимая реальная приёмка PASS**. Прямое поручение владельца 09.10.2026 после проверки
страницы Notice Place: убрать промежуточную страницу подключения и показывать
существующие веб-интерфейсы всех пяти продуктов через Airlock.

Исполнитель остаётся Codex `01a12171-d815-7680-a037-1dd0d599c1fe` на
server-100; координатор и независимая браузерная приёмка —
`01a1216e-62ff-7543-852b-928e2c58c268`. Существующие пять UUID, ресурсы,
администраторы и результаты предыдущего API-этапа сохраняются.

Результат для пользователя: войти в Airlock, открыть любое из пяти приложений
и сразу получить полноценный существующий интерфейс продукта на его
`*.airlock.bezrabotnyi.com`, с правильной учётной записью и проектными правами.
Основные разделы, статические файлы, API, необходимые WebSocket и обновление
страницы должны работать. Вход связывается штатными средствами, тонким
веб-прокси и адаптерами авторизации. Интерфейсы и базы продуктов не дублируются.

Промежуточная HTML-страница, ссылка на внешний сайт, iframe или успешный
MCP-вызов не закрывают этот пользовательский результат. Core Airlock и чужой
WIP сохраняются. Изменения в продуктах ограничиваются их поддерживаемыми
настройками/адаптерами входа; точные файлы и владельцы фиксируются до правки.

Первый срез: настоящий Notice Place UI через Airlock с рабочим входом и
браузерной проверкой; затем UserIO, GPTAdmin, Agent Herder и GrepMesh.
Операторский вход уже имеется в защищённом хранилище native CLI; повторно
пароль не запрашивается. Личные внешние аккаунты пользователей не подменяются.
Открытый тестовый стенд остаётся отдельным будущим этапом.

Приёмка текущего этапа: после окончательной доставки пройти реальные
интерфейсы в видимом браузере, проверить штатные разделы и перезагрузку,
права обоих администраторов, отказ без входа и отсутствие подмены личных данных.
Все найденные отказы остаются задачами исполнителя до исправления и повторной
проверки. Прежний результат ниже относится только к API/MCP-этапу.

## Итог полноценного UI-этапа

Все пять действующих продуктов открываются сразу своими существующими
интерфейсами после единого входа Airlock. Native приложения не пересоздавались,
оба подтверждённых пользователя имеют project-admin во всех пяти.

| Приложение | Рабочий native маршрут | Браузерная приёмка |
| --- | --- | --- |
| Notice Place | https://noticeplace.airlock.bezrabotnyi.com/ | Original Admin,59forms, CSRF/history, reload PASS |
| Universal UserIO | https://universal-userio.airlock.bezrabotnyi.com/ | Original React/assets, accounts/preferences API200, reload PASS |
| GPTAdmin | https://gptadmin.airlock.bezrabotnyi.com/ | Original console/assets, clients API200, reload PASS |
| Agent Herder | https://agent-herder.airlock.bezrabotnyi.com/ | Original React/assets, adapters API200, native SSE, reload PASS |
| GrepMesh | https://grepmesh.airlock.bezrabotnyi.com/ | Original Files/ui/assets, host-status API200, reload PASS |

Олег входит в эти UI через свою Airlock identity без подмены owner cookie.
В UserIO он получает свой отдельный пустой профиль. Подключение собственных
внешних почтовых/мессенджерских провайдеров остаётся обычным личным действием;
оно не требуется для входа в приложение или выдачи project-admin.
GPTAdmin admin UI связывает подписанного caller с actor/audit; owner OAuth
credential не подставляется Олегу. Личный OAuth MCP slot GPTAdmin — отдельная
возможность предыдущего API-этапа, не условие единого UI-входа.
Admin позволяет менять integration source/resources; это доверенная native
authority, а не обещание изоляции от самого project-admin.

Исходные product UI, пользовательские данные и исходные production domains
сохранены; core Airlock не изменялся. Чужой WIP сохранён. Gateway и пять native
контейнеров имеют конечные workload budgets с lazy-generation reconciliation.

## Текущее подтверждённое состояние full UI

NoticePlace: независимая cookie-only headed browser приёмка PASS: исходная
консоль, 59 форм, переход /admin/, фильтр истории, CSRF и location.reload.
Доказательство: /tmp/airlock-real-ui-root-verification.json и
/tmp/airlock-noticeplace-ui-reload-pass.png.

UserIO, GPTAdmin, Herder, GrepMesh: текущие native HTTP requests возвращают
полные исходные страницы и assets, без промежуточной страницы. Независимая
конечная cookie-only браузерная проверка четырёх продуктов координатором PASS.
UserIO Олега штатно provisioned как отдельный пустой local user; его token
используется только по его principal. Owner accounts не переносились.
GPTAdmin SSO принимает подписанного native caller, строго проверяет loopback
и записывает UUID/email актёра в аудит без assertion. Источник a04e0bf включён
в remote main7db69e1; canonical checkout clean и синхронизирован с этим main.
Herder и GrepMesh исходники/чужой WIP не менялись.

Общий UI gateway172.17.0.1:19419 и exact private Docker CIDR ingress входят
в согласованный scope. Все requests требуют подписи native SDK caller и
подтверждённых UUID/email двух администраторов. Старые owner auth cookies
не переопределяют подписанного пользователя; CSRF/preferences сохраняются.
При lazy recreation gateway проверяет exact run.airlock.agent label и
применяет256MiB RAM/128MiB reservation/CPU1/pids128/swap0 для нового containerID.
Проверка имеет5s deadline, ошибку нельзя обойти. service_read выполняет тот же
signed budget handshake до MCP; cron/нового scheduler/platform patch нет.
Действующие UI и пользовательские данные остаются в исходных продуктах.

| Текущая проверка | Category | Purpose / defect | Expected/max seconds |
| --- | --- | --- | --- |
| Signature verifier | fast unit | Exact native user/app/request/time binding; forgery denied | <1/5 |
| SDK full UI + MCP guard | focused integration | Original HTML and caller identity; missing caps block MCP | 10/45 |
| Gateway identity/cookies + SSE/upgrade + lazy caps | focused integration | Own UserIO bearer, preserved CSRF/binary/stream, current generation bounded | <1/5 |
| Original five UI/assets/API/admin/anonymous/caps | focused integration | Real native HTTP route and original product output | 4/35 each |
| Herder real EventSource | focused integration | Stream not buffered or broken | 1/10 |

Ordinary release has aggregate hard180s including setup. Slow nightly remains
reserved for genuinely slow coverage; no nightly job needed for this slice.
Earlier API/MCP-stage records below are historical, not a substitute for full UI.

### Конечный source/runtime freeze

Owned source опубликован и проверен на remote main:
`fa2ee89188d3092ff97ea5cba6ed587d1cb3057b`. Shared wrapper checkout остаётся
`nginx-direct-airlock-proxy` с сохранённым чужим WIP; clean-main не заявляется.
Пять replacement builds complete; native UUID/resources/grants сохранены.
Обычный release GREEN: 8 checks, 28.097s, hard180s включая setup. Получены
исходные HTML/assets/API всех пяти, обе admin memberships, anonymous denial,
фактические Docker caps и начальная строка действующего Herder EventSource.
Receipt: `/tmp/airlock-real-ui-release-check.json`.
Live delegated Oleg UserIO read с legacy owner cookies вернул собственный
пустой accounts array. Это проверка доверенного private SDK delegation,
не имитация native login: `/tmp/airlock-userio-own-principal-proof.json`.
Конечная независимая cookie-only browser приёмка всех пяти PASS: 58.303s
включая setup11.723s/browser45.418s, hard180s. Для каждого приложения
подтверждены оригинальный DOM, родные assets/CSS, реальные API200 и
location.reload с новым timeOrigin/navigationType=reload. NoticePlace59forms.
Receipt: /tmp/airlock-real-ui-root-browser-batch.json. Runtime/source freeze
сохранён. Ранний RED сохранён как ошибка устаревшего Herder test selector;
скриншот просмотрен, оригинальный UI совпал с live18787, runtime не менялся.
Старые wrapper templates сохранены как история предыдущего этапа; они
не embedded, не routed и не входят в текущий deployment tar.

## История API/MCP-этапа

Исполнитель: Codex `01a12171-d815-7680-a037-1dd0d599c1fe` на server-100.
Координатор и независимая проверка: `01a1216e-62ff-7543-852b-928e2c58c268`.

Цель: подключить Notice Place, Universal UserIO, GPTAdmin, Agent Herder и
независимый GrepMesh штатным SDK/MCP/resources, без изменения продуктов и core.
Закрытый production; отдельный открытый тестовый стенд в эту задачу не входит.

Подтверждённые администраторы каждого приложения:

- `roomhacker@bezrabotnyi.com`, `5e438326-6339-4ac8-a328-59dae1d6241f`.
- `cyberteaborg@gmail.com`, Олег Карпов, `98daa037-a87d-49b1-ba07-cd9e6f451864`.

| Приложение | Native app UUID / маршрут | Доказанный результат | Следующий шаг |
| --- | --- | --- | --- |
| Notice Place | `ac873193-77d4-46ff-a272-4539517b7ff1` / https://noticeplace.airlock.bezrabotnyi.com/ | ACTIVE, native MCP credential и instructions response | Браузерный read consumer PASS |
| Universal UserIO | `d45583e2-649b-44e7-865d-2ea1817b4167` / https://universal-userio.airlock.bezrabotnyi.com/ | ACTIVE, owner resource bound, accounts.list response | Олег: отдельно авторизовать собственный UserIO slot |
| GPTAdmin | `178f37c3-283d-48b9-82ef-03775e772438` / https://gptadmin.airlock.bezrabotnyi.com/ | ACTIVE, owner OAuth resource reused, discover response | Олег: отдельно авторизовать собственный GPTAdmin slot |
| Agent Herder | `4b9ec929-d8f3-44c3-b6d0-50b23329d374` / https://agent-herder.airlock.bezrabotnyi.com/ | ACTIVE, protected HTTPS MCP, list_agents response | Браузерный read consumer PASS |
| GrepMesh | `eb9c7250-33c4-46c0-ae49-1b0e756b4e81` / https://grepmesh.airlock.bezrabotnyi.com/ | ACTIVE, независимый MCP без GPTAdmin, list_locations response | Браузерный read consumer PASS |


Штатный device login владельца подтверждён координатором. Человеческий пароль
не сбрасывали, JWT не подделывали. Секреты и результаты чтения личных данных
не сохраняются в этом документе.

Исходники исполнителя: `integrations/airlock-apps/`, `scripts/airlock_apps*`
и этот отдельный контракт. Foreign WIP: AIRLOCK_ADMIN.md, AIRLOCK_RUNBOOK.md,
README.md, gptadmin pin, старые untracked scripts/reports и документы сохранены.
Shared checkout остаётся на `nginx-direct-airlock-proxy`; публикация только
новых owned paths поверх remote main через временный index разрешена
координатором. Нельзя публиковать чужую историю `HEAD:main`.

Завершение требует пяти работающих приложений, реальных service responses,
readback двух admin grants, отказа без входа и независимой проверки поверхности.
Незаполненный личный credential Олега не означает разрешение читать owner data.

## Контракт эксплуатации и приёмки

Native source загружается `scripts/airlock_apps.py upload`; приложения не
пересоздаются, source state защищён ETag. Только перечисленные authored files
попадают в tar; foreign scripts/WIP/submodules не входят. После native build
`python3 scripts/airlock_apps.py budget` восстанавливает лимиты только пяти
контейнеров с проверенным `run.airlock.agent` label: 128 MiB reservation,
256 MiB RAM, CPU1, tasks128, swap0. Пересоздание контейнера Airlock сбрасывает
его Docker limits, поэтому этот шаг обязателен после каждого deployment.
Измеренный idle рабочий набор до ограничения: 16-35 MiB / 34 threads на app.
Платформу `airlock.service` и соседние containers не изменяли.

`integrations/airlock-mcp-proxy.service` обслуживает только loopback19418:
`/herder` →18787/mcp и `/grepmesh` →9419/mcp. Отдельные protected bearer tokens
в encrypted native resources. Публичные HTTPS endpoints:
`https://agent.bezrabotnyi.com/airlock-mcp` и
`https://grep.bezrabotnyi.com/airlock-mcp`. Anonymous401; authenticated discovery
43 и8 tools. UI routing продуктов сохраняется. Proxy имеет RAM128/256MiB,
CPU0.5, tasks32, swap0, максимум16 concurrent requests и bounded body/timeouts.
GET/POST/DELETE и MCP session/protocol headers сохраняются.

Native app AccessAdmin включает право менять app source и вызывать bound
resources: это ожидаемая privileged authority, а не обещание изоляции от
доверенного администратора. Обычный UserIO/GPTAdmin callback выбирает слот
строго по principal. Токен владельца не подставляется в слот Олега.
Для своих личных подключений Олег использует штатные настройки агента; на
странице есть понятная ссылка `/agents/{UUID}` и отдельное пояснение. Права
администратора не заменяют его собственную OAuth/credential авторизацию.

Независимый браузер нашёл реальную ошибку Origin: SubdomainProxy заменяет Host
container address. Regression сначала получил403 на legitimate public Origin;
исправление использует авторитетный X-Forwarded-Host штатного proxy. Legitimate
browser callback проходит, foreign Origin403 и upstream не вызывается.
Все пять приложений пересобраны с этим исправлением; ресурсы/гранты сохранены.

### Проверки: обычный release ≤180 секунд

`systemd-run --user --scope` с RAM4/6GiB, CPU2, tasks512, swap1GiB запускает
`timeout 180 python3 -B scripts/airlock_apps_verify.py`. Внутри SIGALRM180
прерывает даже блокирующий API call; finally сохраняет false receipt при отказе.
Timeout, missing summary и incomplete coverage никогда не считаются GREEN.

| Сценарий | Категория | Цель / обнаруживаемая ошибка | Expected / max seconds |
| --- | --- | --- | --- |
| Private binding selection | fast unit | Второй admin не получает owner slot в обычном callback | <1 /5 |
| SDK callback + browser Origin | focused integration | Native callback, confirmation, forwarded Host, foreign Origin rejection | 8 /45 |
| MCP auth + session transport | focused integration | Denial до upstream; сохранение session/protocol IDs | 1 /10 |
| Browser JS syntax | fast unit | Страница может выполнить native request | 1 /5 |
| Four live apps | focused integration | Реальные callback responses, обе admin memberships, anonymous denial | 3 /30 each |
| Herder live app | focused integration | Реальная session discovery (измерено 30-34s) с теми же grants/auth checks | 35 /45 |

Slow nightly coverage не требуется для этой тонкой интеграции; новых очередей,
cron или runners не создавали. Ранний release receipt RED сохранён: max30 для
измеренного Herder33.9s был слишком коротким. Последующая проверка использует
измеренный finite scenario envelope, общий hard180 остаётся неизменным.

Доказательства без private bodies: `/tmp/airlock-five-apps-deployment.json`,
`/tmp/airlock-five-apps-release-check.json`, независимый
`/tmp/airlock-five-apps-root-verification.json`; final UI receipt координатора.
Токены/auth responses/личные сообщения в контракт и отчёты не записываются.

## Итог предыдущего API/MCP-этапа: выполнено 09.10.2026

Независимая реальная приёмка координатора: headed AgentBrowser на MacMini6,2,
с действующей owner identity. Для каждого из пяти публичных native app URLs:
открыть страницу → проверить title → открыть диагностику → fresh snapshot →
выполнить default read → увидеть «Получен ответ действующего сервиса» и
непустой ответ. Все пять journeys PASS после финальных replacements и caps;
Origin проверен браузером, а не только запросом без Origin.

Обычный release: 8 checks GREEN за50.117s при hard180s. Обе подтверждённые
admin memberships во всех пяти apps прочитаны обратно; anonymous operations
отклоняются. Runtime и конфигурация после final freeze не менялись.

Independent evidence: `/tmp/airlock-final-browser-proof.json`,
`/tmp/airlock-five-apps-root-verification.json`; безопасный screenshot NoticePlace
`/tmp/airlock-noticeplace-success.png` с закрытым результатом диагностики.
Исходники/runtime candidate опубликованы в wrapper remote main `f7887dbc`.
Infra ingress `1a64401` и matching inventory `b136865` опубликованы в infra main.
Последняя публикация этого документа содержит только acceptance metadata.

Оставшееся действие Олега: авторизовать собственные личные UserIO и GPTAdmin
подключения через штатный экран. Это отдельно от уже выданных admin rights;
чужую OAuth identity не имитировали и owner credential в его слот не помещали.

Репозиторий целиком не объявляется clean/synchronized: canonical wrapper
сохранил `nginx-direct-airlock-proxy` и foreign WIP. Remote main содержит только
owned integration source и эту запись; foreign branch history не публиковали.


### Full UI continuation: первый срез Notice Place принят

Нативный SDK catch-all route проверяет текущего Airlock user UUID/email и
AccessAdmin, затем делегирует одну HTTP/WS request через короткую подписанную
identity assertion в приватный gateway172.17.0.1:19419. Gateway использует
существующую NoticePlace auth seam X-Notify-Admin:1 к loopback8092.
Shared owner cookie, iframe и новый интерфейс не используются.

Root real headed browser с server-issued Secure HttpOnly __air_session,
без Authorization header, подтвердил NoticePlace Admin, исходные59форм,
Health dashboard/Producer projects/Delivery profiles/Event history,
отсутствие wrapper. Screenshot: /tmp/airlock-noticeplace-real-ui-first.png.
Worker native owner request с browser Origin также получил200 и исходные
формы за6.81s. Остальные четыре full UI продолжаются; это не общий done.

Gateway имеет RAM128/256MiB, CPU1, tasks96, swap0. Один scoped UFW rule
разрешает192.168.128.0/20→172.17.0.1:19419/tcp, весь остальной firewall/SSH
сохранён. Подпись проверяет UUID приложения, principal, роль, host, HTTP
method, request URI и срок; ключ — write-only encrypted native EnvVar.
