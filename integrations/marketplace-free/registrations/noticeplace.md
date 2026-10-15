# NoticePlace — изолированный Matrix-сценарий проверен; native app в подготовке

- Собственный self-hosted сервис, без отдельной платы за API.
- Источники: https://notify.bezrabotnyi.com/v1/instructions ; https://github.com/megamen32/noticeplace .
- Создана отдельная private Matrix-комната Airlock — демо NoticePlace, без приглашений; joined_members подтверждает только служебную @aiadmin.
- Scoped consumer: project airlock-marketplace-demo, один matrix.message target; max_severity=info, max_repeats=1; телефоны/Telegram/health jobs отсутствуют.
- Первое учебное notification/info принято HTTP202; затем независимый Matrix /messages и /event GET подтвердили тот же текст/correlation_id. Это не вымышленная авария и не рабочий incident.
- Доступ: ~/.config/airlock-marketplace-accounts/noticeplace-demo.json, primary0600 + copy100 + Яндекс.Диск с readback PASS. В app передаётся только scoped intake token; операторский/Matrix токены не копируются.
- Main и admin сервисы не перезапускались, core/source не менялись. Один preflight admin GET встретил временный mesh SQL disconnect; следующий read200, создание scoped consumer успешно. Никакой неизвестной мутации не повторяли.
- UserIO Matrix account сейчас stored/unconfigured для live messenger actions; resolve не поддержал новый Matrix peer. Не обходили это и не меняли UserIO. Доставка сделана самим NoticePlace; MatrixReader/Store не дают outgoing-сообщениям права на автоматический разбор.
- Native source apps/noticeplace: русская форма/чат, fixed payload, admin-only raw connection, admission6/h100total и отсутствие повторной отправки UNKNOWN. Показывает подтверждённый приём API, доставку не выдаёт за приём.
- Local air update/templ/Tailwind/go test PASS10,643с, memory.peak695103488/OOM0. Native build/guest form/chat/browser/source match ещё обязательны перед готовой карточкой.
- Private receipts: .tmp/noticeplace-demo-20261015/ ; room/create/consumer/event намерения сохранены. Не создавать их повторно и не повторять первое уведомление.
