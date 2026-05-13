#!/usr/bin/env bash
set -euo pipefail

DOMAIN="widgets-gptadmin.bezrabotnyi.com"
WIDGET_DIR="/var/www/widgets-gptadmin"
SRC_HTML="/opt/chatgpt-admin-app/public/admin-widget.html"
NGINX_CONF="/etc/nginx/sites-available/${DOMAIN}.conf"

sudo mkdir -p "$WIDGET_DIR"
sudo cp "$SRC_HTML" "$WIDGET_DIR/admin.html"

sudo tee "$NGINX_CONF" >/dev/null <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    root ${WIDGET_DIR};
    index admin.html;

    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src https://gptadminmcp.bezrabotnyi.com; frame-ancestors https://chatgpt.com https://*.chatgpt.com;" always;
    add_header X-Frame-Options "ALLOWALL" always;

    location / {
        try_files \$uri /admin.html;
    }
}
NGINX

sudo ln -sf "$NGINX_CONF" "/etc/nginx/sites-enabled/${DOMAIN}.conf"

sudo nginx -t
sudo systemctl reload nginx

sudo /usr/bin/certbot --nginx \
  -d "$DOMAIN" \
  --non-interactive \
  --agree-tos \
  -m admin@bezrabotnyi.com \
  --redirect

sudo nginx -t
sudo systemctl reload nginx

curl -Ik https://${DOMAIN}/admin.html
