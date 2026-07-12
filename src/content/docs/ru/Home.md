# GPT-Admin — Документация

Добро пожаловать в документацию GPT-Admin. GPT-Admin — это саморазмещаемый хаб MCP: подключайте свои серверы и любые инструменты MCP, а затем подключайте любую ИИ через один из трех адаптеров.

**Веб-сайт:** https://gptadmin.bezrabotnyi.com
**Установка:** `curl -s https://became.bezrabotnyi.com/install.sh | bash`

## Оглавление

| Страница | Что внутри |
|------|---------------|
| [Architecture](./ARCHITECTURE.md) | Как взаимодействуют хаб, shellmcp и 3 адаптера |
| [Getting Started](./GETTING_STARTED.md) | Установка + первая команда за 5 минут |
| [Adapters](./ADAPTERS.md) | 3 способа подключения вашей ИИ (MCP / расширение / Custom GPT) |
| [Hub](./HUB.md) | gptadmin_hub: конфигурация, переменные окружения, конечные точки, веб-панель |
| [ShellMCP](./SHELLMCP.md) | Агент, работающий на целевых машинах |
| [Install Paths](./INSTALL_PATHS.md) | Где находится GPT-Admin в Linux/macOS/Windows |
| [Configuration](./CONFIGURATION.md) | Полное руководство по переменным окружения, модель аутентификации, OAuth |
| [API Reference](./API_REFERENCE.md) | Конечные точки REST + MCP |
| [MCP Proxy Relay](./MCP_PROXY_RELAY.md) | Использование GPTAdmin в качестве безопасного прокси MCP и OpenAPI Action для каждого сервера |
| [Security](./SECURITY_DOCS.md) | Аутентификация, токены, OAuth, ответственное раскрытие информации |
| [Tunnels](./TUNNELS_DOCS.md) | Туннели FRP и Cloudflare для экспозиции хаба |
| [Failover](./FAILOVER.md) | Как узлы резервирования поддерживают работу GPTAdmin в деградированном режиме и как восстановиться |
| [Roadmap](./ROADMAP.md) | Что построено, что будет, разделение на open-core |
| [FAQ](./FAQ.md) | Частые вопросы |

## Быстрые ссылки

- **Новичок?** Начните с [Getting Started](./GETTING_STARTED.md).
- **Хотите понять дизайн?** Прочтите [Architecture](./ARCHITECTURE.md).
- **Подключаете конкретную ИИ?** Перейдите в [Adapters](./ADAPTERS.md).
- **Готовитесь к продакшену?** Ознакомьтесь с [Security](./SECURITY_DOCS.md) и [Tunnels](./TUNNELS_DOCS.md).
- **Планируете отказоустойчивость?** Прочтите [Failover](./FAILOVER.md) после [Tunnels](./TUNNELS_DOCS.md).
