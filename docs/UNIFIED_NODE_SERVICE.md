# Служба единого узла

`deploy/systemd/gptadmin-node@.service` запускает один `gptadmin-node`:
маршрутизатор и локальный исполнитель работают в одном процессе. Имя экземпляра
определяет файл окружения и рабочий каталог. Это не заменяет службы старой
установки автоматически.

Для экземпляра `canary`:

- бинарник: `/opt/gptadmin/bin/gptadmin-node`;
- окружение: `/etc/gptadmin/nodes/canary.env`, доступ только root;
- рабочий каталог: `/var/lib/gptadmin/nodes/canary`;
- служба: `gptadmin-node@canary.service`.

Каталоги создаются до запуска. Пример несекретной части окружения:

```dotenv
GPTADMIN_CONFIG_DIR=/var/lib/gptadmin/nodes/canary
GPTADMIN_ROOT=/var/lib/gptadmin/nodes/canary
GPTADMIN_ENV_FILE=/etc/gptadmin/nodes/canary.env
GPTADMIN_HUB_HOST=127.0.0.1
GPTADMIN_HUB_PORT=19002
SHELL_NAME=vusa-unified
SHELL_IDENTITY_DIR=/var/lib/gptadmin/nodes/canary
SHELL_SPOOL_DIR=/var/lib/gptadmin/nodes/canary/spool
SHELL_OUTBOX_DIR=/var/lib/gptadmin/nodes/canary/spool/outbox
SHELL_DEFAULT_USER=gptadmin-canary
SHELL_DEFAULT_CWD=/var/lib/gptadmin/workspaces/canary
SHELL_DEFAULT_HOME=/var/lib/gptadmin/workspaces/canary
SHELLMCP_SELF_REPAIR_DISABLE=1
```

Существующие cluster credentials и общий issuer/resource настраиваются
отдельно доверенным provisioning. Не копируйте private identity другого узла,
его outbox или task DB. Состояние авторизации должно пройти проверку перед
публикацией listener. Обычный managed bearer не заменяется CTL в проверке.

До запуска создайте пользователя исполнения и принадлежащий ему workspace.
Каталог состояния Node остаётся доступен только root. Служба запускается от
root, чтобы исполнитель мог переключить пользователя; без `SHELL_DEFAULT_USER`
обычная shell-команда завершится отказом. Привилегированное выполнение требует
явного выбора `run_as_user=root` в разрешённом запросе.

После установки файлов:

```sh
systemd-analyze verify /etc/systemd/system/gptadmin-node@.service
systemctl daemon-reload
systemctl start gptadmin-node@canary.service
```

Сначала проверяются реальный MCP-вызов на нужном executor, запрет недопустимой
операции и restart. Затем измеряются RSS и размер состояния на данной машине.
Автозапуск включается `systemctl enable gptadmin-node@canary.service` после
этой проверки. Изменение публичного маршрута — отдельный проверяемый шаг.

`systemctl stop` отправляет SIGTERM одному процессу; runtime останавливает
локальные callback-и и группы команд перед завершением HTTP-сервера.

## Переход с отдельных Hub и Shell

Проверенный порядок для обновления той же установки:

1. Приостановить поступление новых заданий, оставив старые Hub и Shell работающими.
2. Дождаться завершения текущих заданий и доставки их результатов в Hub;
   проверить сохранённые receipts и пустой outbox.
3. Остановить старый Shell, затем старый Hub.
4. Запустить Node на прежнем порту с теми же `GPTADMIN_CONFIG_DIR`,
   `SHELL_NAME`, `SHELL_IDENTITY_DIR`, `SHELL_SPOOL_DIR` и `SHELL_OUTBOX_DIR`.
5. Проверить сохранность identity и старых receipts, выполнить безопасную новую
   команду и проверить её результат. После этого возобновить поступление заданий.

Этот порядок прошёл изолированный canary 2026-09-09: реальные Hub и Shell
v1002 → Node `b1b2aee`, общие каталоги состояния и identity. Старый receipt
остался `completed`, команда выполнилась ровно один раз, новая команда прошла.

Перекрытие старого Shell и нового Node не обеспечивает немедленную доставку
результата: в canary команда уже выполнялась при замене Hub, завершилась один
раз, но callback старого Shell получил HTTP **401** из-за нового локального
credential процесса. Результат сохранился в общем outbox, а receipt оставался
`running`. После остановки старого Shell Node доставил результат; `completed`
и пустой outbox наблюдались на **+96,1 с от начала canary**, не от остановки
Shell. Это наблюдаемая задержка, а не гарантированный срок восстановления;
проверка восстановления использовала общий outbox. Не повторять такую команду
с новым ключом только из-за задержки receipt — сначала проверить её результат.

Локальные доказательства: `.tmp/node-upgrade-review/summary.json`,
`case-aqvzz11b/report.json` (перекрытие) и `case-tfc9v301/report.json` (drain)
в том же каталоге. Эти временные артефакты не входят в поставку.
