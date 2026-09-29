# Nginx vhost for airlock.bezrabotnyi.com — direct edge proxy.
# Replaces the caddy-proxy indirection (nginx 443 -> 127.0.0.1:8444 ssl ->
# caddy-proxy:4280 -> airlock:8080). Now nginx terminates TLS and proxies
# straight to the native airlock backend on 127.0.0.1:8080.
#
# Layout (matching the old caddy/Caddyfile.proxy + routes.caddy behaviour):
#   apex (airlock.bezrabotnyi.com)
#     - SPA static (frontend/dist) for browser routes
#     - backend API for /api/* /auth/* /ws /webhooks/* /.well-known/* /oauth/* /health
#     - all other paths fall back to SPA (index.html) for client-side routing
#   s3.airlock.bezrabotnyi.com
#     - public S3 endpoint -> rustfs on 127.0.0.1:42900 (Host header preserved
#       so the rustfs-side signature recomputation matches the URL airlock signed)
#   *.airlock.bezrabotnyi.com (per-agent subdomains)
#     - require X-Airlock-Proxy-Auth shared secret header (matches old caddy
#       behaviour); strip the header before forwarding; reverse-proxy to airlock
#     - excludes fleet-admin (it has its own vhost below)

server {
    listen 127.0.0.1:8444 ssl;
    listen 8444 ssl;
    server_name airlock.bezrabotnyi.com ~^[^.]+\.airlock\.bezrabotnyi\.com$;

    ssl_certificate /etc/letsencrypt/live/airlock-wildcard.bezrabotnyi.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/airlock-wildcard.bezrabotnyi.com/privkey.pem;

    # ACME http-01 challenge (letsencrypt) — must not go through auth_secret check.
    location ^~ /.well-known/acme-challenge/ {
        root /var/www/letsencrypt;
        default_type "text/plain";
        try_files $uri =404;
    }

    # Backend endpoints — same carve-outs as the old caddy @backend matcher.
    location ~ ^/(api|auth|auth-external|ws|webhooks|health|\.well-known|oauth)(/|$) {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
        proxy_buffering off;
    }

    # Per-agent subdomain: requires shared proxy-auth secret, forwards to
    # airlock without the secret. The @subagent location is referenced by the
    # SPA fallback `try_files` below so agent subdomains land here too.
    location @subagent {
        if ($http_x_airlock_proxy_auth != $proxy_auth_secret) {
            return 403;
        }
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
        proxy_buffering off;
        proxy_set_header X-Airlock-Proxy-Auth "";
    }

    # SPA fallback for browser-side routes. /auth/relay (GET) and
    # /oauth/consent (GET) are SPA routes; their POSTs / codes are backend
    # paths, matched above.
    location / {
        # If the request hits an asset that exists in the SPA dist, serve it;
        # else serve index.html so client-side router takes over.
        root /home/roomhacker/airlock-admin/airlock/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Security headers (apex path; parity with caddy's
    # dashboard_security_headers + https_security_headers).
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=(), publickey-credentials-get=(self), publickey-credentials-create=(self)" always;
    add_header X-Frame-Options "DENY" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Content-Security-Policy "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob: http: https:; media-src 'self' blob: http: https:; connect-src 'self' ws://airlock.bezrabotnyi.com wss://airlock.bezrabotnyi.com ws://*.airlock.bezrabotnyi.com wss://*.airlock.bezrabotnyi.com; form-action 'self'; worker-src 'self' blob:" always;
}

server {
    listen 127.0.0.1:8444 ssl;
    listen 8444 ssl;
    server_name fleet-admin.airlock.bezrabotnyi.com;

    ssl_certificate /etc/letsencrypt/live/fleet-admin.airlock.bezrabotnyi.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/fleet-admin.airlock.bezrabotnyi.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
        proxy_buffering off;
    }
}

# NOTE: s3.airlock.bezrabotnyi.com lives in its own vhost at
# sites-available/s3.airlock.bezrabotnyi.com — not duplicated here.

server {
    listen 80;
    listen [::]:80;
    server_name airlock.bezrabotnyi.com fleet-admin.airlock.bezrabotnyi.com ~^[^.]+\.airlock\.bezrabotnyi\.com$;

    location ^~ /.well-known/acme-challenge/ {
        root /var/www/letsencrypt;
        default_type "text/plain";
        try_files $uri =404;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}
