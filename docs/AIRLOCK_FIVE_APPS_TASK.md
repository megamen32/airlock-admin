# Пять действующих приложений в Airlock

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

## Итог: выполнено 09.10.2026

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
