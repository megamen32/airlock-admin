# Туннели

Хаб должен быть доступен из интернета (чтобы ваш ИИ / MCP-клиенты могли подключаться). Свой домен не обязателен — GPT‑Админ поддерживает два авто-туннеля.

## FRP (по умолчанию)

[FRP](https://github.com/fatedier/frp) — быстрый обратный прокси. GPT‑Админ гоняет публичный FRP-сервер; установщик умеет авторегистрироваться на нём.

### Настройка

Во время `gptadmin setup` выберите вариант **1** (авто-туннель через FRP). Установщик:

1. Скачивает FRP-клиент
2. Регистрирует случайный поддомен на публичном FRP-сервере
3. Запускает FRP-клиент сервисом рядом с хабом
4. Печатает ваш публичный URL: `https://random-sub.frp.bezrabotnyi.com`

### Плюсы и минусы

- ✅ Домен не нужен, никакой DNS-настройки
- ✅ Быстро (прямой TCP-туннель)
- ⚠️ URL на `frp.bezrabotnyi.com` (общий домен)
- ⚠️ У бесплатного FRP-сервера есть лимиты по нагрузке

## Cloudflare Tunnel

[Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) создаёт защищённый исходящий туннель до edge-сети Cloudflare. Нужен аккаунт Cloudflare и домен в Cloudflare.

### Настройка

Во время `gptadmin setup` выберите вариант с Cloudflare. Или настройте позже:

```bash
gptadmin tunnel cloudflare
```

Понадобится:

- `CLOUDFLARE_TOKEN` — API-токен Cloudflare с правами на Tunnel
- Домен, управляемый в Cloudflare

CLI:

1. Устанавливает `cloudflared`
2. Создаёт туннель
3. Привязывает его к поддомену на вашем домене в Cloudflare
4. Запускает `cloudflared` как сервис
5. Печатает ваш публичный URL: `https://hub.yourdomain.com`

### Плюсы и минусы

- ✅ Свой домен
- ✅ DDoS-защита и edge-кэш Cloudflare
- ✅ На сервере не нужны входящие порты
- ⚠️ Нужен аккаунт Cloudflare и домен

## Свой домен (nginx + Certbot)

Если у вас уже есть сервер с публичным IP и доменом:

1. Пропишите A-запись в DNS на ваш сервер
2. Используйте шаблон nginx-конфига: `deploy/nginx/` (скопируйте и отредактируйте)
3. Получите сертификат: `certbot --nginx -d hub.yourdomain.com`
4. Хаб пусть слушает localhost, nginx проксирует

```bash
# Пример location-блока nginx
location / {
    proxy_pass http://127.0.0.1:25900;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";  # для MCP SSE
}
```

## Что выбрать?

| Сценарий | Рекомендация |
|----------|--------------|
| Быстрый старт, домен не нужен | FRP (авто-туннель) |
| Свой домен, хочется DDoS-защиту | Cloudflare Tunnel |
| Уже есть сервер + домен | nginx + Certbot |
| Только локальная разработка | ничего (`localhost:25900`) |

## Смотрите также

- [Getting Started](./GETTING_STARTED.md)
- [Configuration](./CONFIGURATION.md) — `PUBLIC_ORIGIN` и др.
- [Hub](./HUB.md)