#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SHELLMCP_UNIT="$SCRIPT_DIR/systemd/shellmcp.service"
HUB_UNIT="$SCRIPT_DIR/systemd/gptadmin_hub.service"
WATCHDOG_SERVICE="$SCRIPT_DIR/systemd/gptadmin-hub-watchdog.service"
WATCHDOG_TIMER="$SCRIPT_DIR/systemd/gptadmin-hub-watchdog.timer"

# Копируем юниты
sudo cp "$SHELLMCP_UNIT" /etc/systemd/system/
sudo cp "$HUB_UNIT" /etc/systemd/system/
sudo cp "$WATCHDOG_SERVICE" /etc/systemd/system/
sudo cp "$WATCHDOG_TIMER" /etc/systemd/system/
sudo install -m 0644 "$SCRIPT_DIR/systemd/gptadmin-hub-standby.service" /etc/systemd/system/gptadmin-hub-standby.service
sudo install -m 0644 "$SCRIPT_DIR/systemd/gptadmin-handover@.service" /etc/systemd/system/gptadmin-handover@.service
sudo install -m 0755 "$SCRIPT_DIR/../scripts/gptadmin_handover_local.sh" /usr/local/sbin/gptadmin-handover
sudo install -m 0755 "$SCRIPT_DIR/../scripts/gptadmin_hub_standby.sh" /opt/gptadmin/bin/gptadmin-hub-standby.sh

# Перечитываем systemd и запускаем оба
sudo systemctl daemon-reload
sudo systemctl enable shellmcp
sudo systemctl enable gptadmin_hub
sudo systemctl enable gptadmin-hub-watchdog.timer
sudo systemctl restart shellmcp
sudo systemctl restart gptadmin_hub
sudo systemctl restart gptadmin-hub-watchdog.timer

# Проверка
sudo systemctl status shellmcp
sudo systemctl status gptadmin_hub
sudo systemctl status gptadmin-hub-watchdog.timer
