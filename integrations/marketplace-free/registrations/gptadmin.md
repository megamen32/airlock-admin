# GPTAdmin — отдельное демо чтения публичного файла

Отдельный native профиль `airlock-demo-public-catalog`, readonly/read_only,
один file target и один разрешённый child tool system_inspect. Facade schema/
execute разрешены для этого чтения; роль client, token30дней с15Oct2026.
Существующие профили/клиенты/сервисы не менялись. Admin CTL применяется только
локально для создания нового профиля и его токена; в Airlock его нет.

Креды: ~/.config/airlock-marketplace-accounts/gptadmin-demo.json,0600;
primary100 + вторая копия100 + Яндекс.Диск с чтением/сравнением, rc0.
Настоящий MCP initialize успешен, tools-list показывает только schema/execute.
Реальный execute system_inspect прочитал публичный apps.json; попытка shell_exec
с harmless true отклонена политикой. На начальном профиле без facade execute
чтение было корректно отклонено; исправлен только allowlist нового демо-профиля.

Файл demo-data/apps.json получен из действительного native списка Airlock:
семь подключённых приложений. Это явно датированный снимок каталога, не
мониторинг серверов; transient running не интерпретируется как исправность.
Новый адаптер не принимает пути, команды, target ID или произвольные URI.
Native MCP resource Admin-only, обычному гостю доступен только demo_workspace
и русская форма. Quota12/h/cache2min/1active/20s/32KiBfile/512KiBenvelope.
Состояние native-build и гостевая приёмка будут записаны после настоящей проверки.
