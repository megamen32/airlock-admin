# Shtab — демо-доска с настоящими задачами

Существующий предоставленный пользователем MCP-токен получен через opaque
AskSecret pipe без вывода значения. Сохранён в private0600 ref
~/.config/airlock-marketplace-accounts/shtab.json; primary100+copy+Яндекс.Диск
readback rc0. Ключ не менялся. В этот же ref добавлены board/datasource/task IDs.

Native MCP https://my.shtab.app/api/mcp/rpc, Bearer. tools/list подтверждён.
Отдельная доска «Airlock — демонстрационные задачи» создана один раз:
view379621/datasource138087. Три учебные задачи7025158/7025159/7025160, две
«Открыто» и одна «В процессе»; executors/responsibles пусты, без сроков/денег.
Точный MCP fetch_tasks подтвердилtotal3/page1/has_morefalse. Начальный
неограниченный fetch_tasks получилmissing_params; ничего не создавал, повтор
создания не делался. Все дальнейшие чтения ограничены конкретным datasource.

Адаптер изменён с company-wide count на имена/статусы только этой демо-доски.
Public team_tasks принимает пустой Input. Raw MCP остаётся Admin-only.
4/h/cache15min/1active/20s/64KiB, scope marker исключает старый счётчик из кэша,
история квоты не сбрасывается. Vendor10calls/h/company. Parser по настоящему
ответу и wrong-project/partial/error cases, unit0.019с в1GiB/CPU2/tasks128/max60с.
Гостевая форма/чат и финальная сборка будут проверены после доставки.
