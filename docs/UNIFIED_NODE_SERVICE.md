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
SHELL_DEFAULT_CWD=/var/lib/gptadmin/nodes/canary
SHELL_DEFAULT_HOME=/root
SHELLMCP_SELF_REPAIR_DISABLE=1
```

Существующие cluster credentials и общий issuer/resource настраиваются
отдельно доверенным provisioning. Не копируйте private identity другого узла,
его outbox или task DB. Состояние авторизации должно пройти проверку перед
публикацией listener. Обычный managed bearer не заменяется CTL в проверке.

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
