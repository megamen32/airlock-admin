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
Native agent1b1dd024-3f7c-4112-badf-35194946806b / d88-gptadmin-workspace.
Source main9f6ee268, build7eb0912b complete28.362с/source29ce352461f5/SDK0.7.0.
20 прикладных файлов совпали с native export. Parser unit по настоящему MCP
ответу и восьми отказам прошёл0.015с, ограничен1GiB/CPU2/tasks128/max60с.
Обычный гость: форма и nativechat83e4d284 success7.437с, настоящий tool message
readytrue/total7, корректная дата и отличие снимка от мониторинга. Изменение
MCP credentials гостем403. Headed44 проверил начало чата на375/1280 (autoPrompt0),
реальную вебформу/7ссылок и light/dark без выхода за экран;12.253с/max600с.
Root просмотрел dark screenshot. App1GiB, существующие aggregate/BuildKit
лимиты сохранены. Доступы дополнены agentid и немедленно backupreadbackPASS.
Внешний onboarding опубликован/deployed demo/main d1760b4, gateway-only restart,
прежний файл сохранён и смена защищена проверкой предыдущегоSHA.

[Чат](https://demo.airlockrun.ru/agents/d88-gptadmin-workspace/chat?demo=1)
· [Вебформа](https://d88-gptadmin-workspace.demo.airlockrun.ru/).
В текущем основном каталоге отдельного GPTAdmin нет: он объединён в «Штатно».
Этот пример чтения не объявляется полной демонстрацией ИТ-поддержки «Штатно»;
ложная готовая CTA на эту карточку не добавлялась.


При финальном review исправлен NOTES.md, ранее скопированный из другого
адаптера. Только документация: main6b6b8782; nativebuildac488219 complete35.765с,
source90585a528e3d. Все20прикладныхфайлов повторно совпали с nativeexport;
реальная guest вебформа после финальной сборки снова показала7приложений.
Новые модельные запросы для изменения документации не запускались.
