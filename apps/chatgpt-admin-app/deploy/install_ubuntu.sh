#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/chatgpt-admin-app"
SERVICE_NAME="chatgpt-admin-app"
APP_USER="roomhacker"

sudo mkdir -p "$APP_DIR"

sudo rsync -a --delete --exclude .env ./ "$APP_DIR/"

cd "$APP_DIR"

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

npm install

if [ ! -f .env ]; then
  cp .env.example .env
fi

sudo tee /etc/systemd/system/${SERVICE_NAME}.service >/dev/null <<SYSTEMD
[Unit]
Description=ChatGPT Admin MCP App
After=network.target

[Service]
Type=simple
User=${APP_USER}
WorkingDirectory=${APP_DIR}
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SYSTEMD

sudo systemctl daemon-reload
sudo systemctl enable ${SERVICE_NAME}
sudo systemctl restart ${SERVICE_NAME}

sleep 2

sudo systemctl --no-pager --full status ${SERVICE_NAME} || true

curl -fsS http://127.0.0.1:8787/ || true
