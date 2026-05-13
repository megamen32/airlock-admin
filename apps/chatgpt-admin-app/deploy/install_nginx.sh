#!/usr/bin/env bash
set -euo pipefail

DOMAIN="gptadminmcp.bezrabotnyi.com"
UPSTREAM_PORT="8787"
NGINX_CONF="/etc/nginx/sites-available/${DOMAIN}.conf"
NGINX_LINK="/etc/nginx/sites-enabled/${DOMAIN}.conf"
EMAIL="admin@bezrabotnyi.com"

sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx

sudo tee "$NGINX_CONF" >/dev/null <<NGINX
server {
    listen 80;
    listen [::]:80;

    server_name ${DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:${UPSTREAM_PORT};

        proxy_http_version 1.1;

        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
}
NGINX

sudo ln -sf "$NGINX_CONF" "$NGINX_LINK"

sudo nginx -t
sudo systemctl reload nginx

sudo certbot --nginx \
  -d "$DOMAIN" \
  --non-interactive \
  --agree-tos \
  -m "$EMAIL" \
  --redirect

sudo nginx -t
sudo systemctl reload nginx

curl -I https://${DOMAIN}/ || true
curl -I https://${DOMAIN}/mcp || true
