# Автограмм · AirLock

Нативное приложение Airlock для общего кабинета Автограмм 208. Доступ получают только Room Hacker и Олег по двум фиксированным Airlock UUID. Олегу достаточно app role `user`.

GET `/` показывает кнопку без входа в AFC. POST `/open` проверяет точный Origin и caller, затем через SDK Connection запрашивает одноразовый переход в AFC. AFC выдаёт штатную browser cookie после одноразового обмена. Код приходит во fragment и не является долговечным MCP bearer.

MCP `autogram` использует shared encrypted resource; app tool `cabinet_profile` читает профиль. Дополнительный direct resource grant `use` Олегу предоставляет инструменты самого AFC MCP согласно upstream scopes. Shared MCP token и отдельный handoff credential не попадают в app source, HTML, browser storage или URL. Connection credential injects платформа.

## Проверка

`go test ./...` проверяет оба разрешённых UUID, отрицательный третий, user route context, отсутствие mutation при GET, Origin до issue, exact redirect и TTL.

`provision.py` использует только собственный receipt app `autogram-airlock` и protected session. Операции разделены: create, upload, status, configure, readback. Upload не повторяет тот же digest; неизвестный результат сверять перед повтором. Секреты остаются вне Git в `/home/roomhacker/.local/share/airlock-afc/` с 0700/0600. Script не восстанавливает login и не ищет чужие токены.

Исходники ядра и общие app registry не меняются. Browser acceptance и resource grants фиксируются отдельной квитанцией; unit tests их не заменяют.

## Установленный результат 2026-10-23

App 2b149a01-34f2-4253-bdee-e74ade823d12, slug autogram-airlock. URL https://autogram-airlock.airlock.bezrabotnyi.com/ ; canonical login https://airlock.bezrabotnyi.com/ . Historical airlock2 не использовать.

Build dc944ca3-abf2-4116-bb17-26778ed28cd2 complete, source 9d284ecb4546f14d7202e9e7cfc1e150aca86a92, image 2b149a01-34f2-4253-bdee-e74ade823d12:9d284ecb4546, SDK0.8.1-alpha.12. Upload SHA256250f5d8b77532952415c1163d9c98161e56ca008a03de4d65b91e780cbfb5966. Первый build677b1948-8e7f-4cf6-82da-bda2c07e6dfe failed на отсутствующем styles/app.css, исправлен scaffold input.

MCP resource24e36776-ab8a-4a32-8fcc-8bfcc6af0844 callable autogram_airlock; ownerRoomHacker, единственный grantOleg98daa037-a87d-49b1-ba07-cd9e6f451864 capability use. Appmembers ровно RoomHackeradmin и Oleguser. Handoff connection77ba6d1a-5a58-4721-bf8c-a626687aaa49 без direct grants. Shared connection runtime resolution авторизует binding creator, caller не нужен direct resource grant (airlock-internal/db/queries/resource_needs.sql:121-138).

MCP direct HTTP200 и app tool run6d4a73d9-9380-4cff-8107-f68a21857b58 вернули cabinet208 AirLock, can_edit:false и8readonlytools. Unit tests green; независимый source security review без blockers. Browser SSO pending AFC rollout+независимая проверка; реальный клик Олега не проверен.

Protected receipts deployment.json, needs-readback.json, grants-readback.json, mcp-direct-receipt.json, mcp-app-receipt.json и собственная airlock-session.json находятся под /home/roomhacker/.local/share/airlock-afc/ (0700/0600). Session получена штатным RoomHacker login через SSS stdin, exact /me UUID подтверждён. Это API session, не browser fixture. Raw credentials и одноразовые handoff URL в отчёты не выводить.

При первом consumer open найден собственный CSP defect: frame-ancestors none блокировал штатный Airlock split-view. Исправлено на self + exact https://airlock.bezrabotnyi.com. Кнопка использует обычную пользовательскую form-навигацию в новую вкладку с noopener/noreferrer; form-action разрешает только self и exact AFC origin, включая303redirect. Политика embedding AFC не ослабляется. Регрессия проверяет exact parent и выход из iframe.
