# NoticePlace — подключён: native форма/чат и реальная доставка в Matrix

- Собственный self-hosted сервис, без отдельной платы за API.
- Источники: https://notify.bezrabotnyi.com/v1/instructions ; https://github.com/megamen32/noticeplace .
- Создана отдельная private Matrix-комната Airlock — демо NoticePlace, без приглашений; joined_members подтверждает только служебную @aiadmin.
- Scoped consumer: project airlock-marketplace-demo, один matrix.message target; max_severity=info, max_repeats=1; телефоны/Telegram/health jobs отсутствуют.
- Первое учебное notification/info принято HTTP202; затем независимый Matrix /messages и /event GET подтвердили тот же текст/correlation_id. Это не вымышленная авария и не рабочий incident.
- Доступ: ~/.config/airlock-marketplace-accounts/noticeplace-demo.json, primary0600 + copy100 + Яндекс.Диск с readback PASS. В app передаётся только scoped intake token; операторский/Matrix токены не копируются.
- Main и admin сервисы не перезапускались, core/source не менялись. Один preflight admin GET встретил временный mesh SQL disconnect; следующий read200, создание scoped consumer успешно. Никакой неизвестной мутации не повторяли.
- UserIO Matrix account сейчас stored/unconfigured для live messenger actions; resolve не поддержал новый Matrix peer. Не обходили это и не меняли UserIO. Доставка сделана самим NoticePlace; MatrixReader/Store не дают outgoing-сообщениям права на автоматический разбор.
- Native source apps/noticeplace: русская форма/чат, fixed payload, admin-only raw connection, admission6/h100total и отсутствие повторной отправки UNKNOWN. Показывает подтверждённый приём API, доставку не выдаёт за приём.
- Local air update/templ/Tailwind/go test PASS10,643с, memory.peak695103488/OOM0. Финальный native build d0ad027e complete36,540с; SDK0.7.0. Source23файла совпали с опубликованным main65c01354, включая native Dockerfile с base:v0.7.0 и дополненные managed ignores.
- Private receipts: .tmp/noticeplace-demo-20261015/ ; room/create/consumer/event намерения сохранены. Не создавать их повторно и не повторять первое уведомление.

## Принятая проверка15Oct

- [Открыть приложение](https://d88-noticeplace-notifications.demo.airlockrun.ru/) · [Чат](https://demo.airlockrun.ru/agents/d88-noticeplace-notifications/chat?demo=1).
- Обычный guest: настоящий API приём, повтор формы использовал то же время квитанции; credential mutation403, source read403.
- Native send-chat ожидал штатного подтверждения run_js. Тестовый пользователь подтвердил ровно свой запрос; исходный checkpoint завершился, продолжение имело другой runId. Наблюдали продолжение, prompt/approval не переотправляли.
- Финальный status-chat15,119с: нормальный русский ответ без ready/state/имён инструментов; честно отличает API приём от доставки/прочтения.
- Независимый Matrix GET подтвердил ровно3сообщения: операторское одно, API guest одно и headed guest одно. Повтор формы/отправка через чат не создали дублей. Joined_members по-прежнему только1служебная учётная запись.
- Headed44: main-кнопка первая слева/видима375/1280, явно «демо NoticePlace»/«один компонент Штатно», правильный chat draft и0auto sends; реальная форма, светлая/тёмная темы и отсутствие overflow.12,753с. Тёмный мобильный screenshot просмотрен.
- Main release v25 поверхv24 сохраняет чужие portal/legal assets. Отдельный overlay main8b65cb2 и entry gateway развёрнуты до canary; сам Airlock Internal/RU frontend не менялся.
- В демо9nativeapps; полное «Штатно» и весь каталог не объявлены готовыми. Botmother после этой проверки всё ещё users/testers0 и ждёт /start.
