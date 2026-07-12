# Адаптеры

Хаб предоставляет **три способа** подключения ИИ. Один и тот же хаб, те же возможности — выберите тот, который подходит вашему ИИ.

| Адаптер | Для | Как |
|---------|-----|-----|
| [MCP client](#1-mcp-client) | Claude Desktop, Codex, OpenCode | MCP remote SSE по `/mcp` |
| [Browser extension](#2-browser-extension) | DeepSeek, Qwen, Alice, GigaChat, ChatGPT (бесплатно) | userscript (Tampermonkey/Firefox) |
| [OpenAI Action](#3-openai-action) | ChatGPT Custom GPT, Open WebUI | REST + OpenAPI, Bearer token |

---

## 1. MCP client

**Для:** Claude Desktop, Codex, OpenCode, любой клиент, совместимый с MCP.

**Протокол:** MCP remote SSE (потоковый HTTP).

**Конечная точка:** `https://your-hub.bezrabotnyi.com/mcp`

### Настройка

Добавьте хаб как MCP-сервер в конфигурацию вашего клиента. Для Claude Desktop отредактируйте
`claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "gptadmin": {
      "type": "http",
      "url": "http://localhost:25900/mcp",
      "headers": {
        "Authorization": "Bearer  YOUR_CTL_TOKEN"
      }
    }
  }
}
```

Для Codex / OpenCode те же настройки помещаются в соответствующие разделы MCP.

Перезапустите клиент. Вы должны увидеть доступные инструменты `gptadmin` (shell_exec, file ops,
systemd и т. д.).

### Примечания

- `/mcp` **не** принимает `CTL_TOKEN` напрямую. Он требует токен Bearer OAuth, который хаб подписывает через `OAUTH_CLIENT_SECRET`. См.
[Configuration → OAuth](./CONFIGURATION.md#oauth).
- Для локальной разработки вы можете использовать `http://localhost:25900/mcp` без OAuth (хаб ослабляет аутентификацию на localhost).

---

## 2. Browser extension

**Для:** DeepSeek, Qwen, Yandex Alice, Sber GigaChat, ChatGPT (бесплатный тариф) —
любой бесплатный веб-чат.

**Протокол:** userscript (работает в браузере через Tampermonkey/Firefox).

**Установка:** https://became.bezrabotnyi.com/mcp-bridge.user.js

### Как это работает

Userscript добавляет две кнопки в интерфейс веб-чата:
- **MCP All** (`Alt+M`) — вставляет краткое описание всех ваших агентов MCP
  и их инструментов в поле ввода чата. Также копирует запрос в буфер обмена.
- **MCP** — открывает панель для выбора конкретного агента с подробной документацией по инструментам.

Когда ИИ отвечает блоком кода ` ```mcp ` с JSON-командой,
скрипт автоматически:
1. Выделяет блок
2. Отправляет вызов в ваш хаб
3. Вставляет результат обратно в чат

### Настройка для платформы

| Платформа | Менеджер | Шаги |
|----------|---------|-------|
| macOS / Windows / Linux | Chrome + [Tampermonkey](https://www.tampermonkey.net/) | Установите Tampermonkey из Chrome Web Store, затем нажмите ссылку для установки. |
| iPhone | Safari + [Userscripts](https://apps.apple.com/app/userscripts/id1463298887) | Установите приложение Userscripts, включите в Safari → Расширения, затем установите. |
| Android | Firefox + Tampermonkey | Установите Firefox из Google Play, добавьте Tampermonkey, затем установите. |

### Конфигурация

Нажмите `Alt+K` (или значок клавиши в правом нижнем углу) и введите:
- **Bridge URL** — ваш URL хаба (`https://your-hub.bezrabotnyi.com`)
- **Bridge Key** — ваш `CTL_TOKEN`

### Поддерживаемые сайты

| Сайт | Статус |
|------|--------|
| chatgpt.com | Полная поддержка |
| chat.deepseek.com | Полная поддержка |
| chat.qwen.ai | Полная поддержка |
| ya.ru / chat.yandex.ru | Полная поддержка |

> Если автовставка не работает (редко, на некоторых сайтах), запрос всегда находится
> в вашем буфере обмена — просто `Ctrl+V` / `Cmd+V`.

---

## 3. OpenAI Action

**Для:** ChatGPT Custom GPT, Open WebUI.

**Протокол:** REST + схема OpenAPI, Bearer auth.

**Конечная точка:** `https://your-hub.bezrabotnyi.com/admin/api/*`

### Настройка (ChatGPT Custom GPT)

1. Откройте https://chatgpt.com/gpts/editor
2. Создайте или отредактируйте GPT → Configure → Actions → Create new action
3. Импортируйте OpenAPI по URL: `https://became.bezrabotnyi.com/api.json`
4. В блоке `servers` замените `url` на URL вашего хаба
5. Authentication → API key → Bearer → вставьте ваш `CTL_TOKEN`
6. Сохраните. Теперь вы можете просить ChatGPT выполнять команды сервера — без ограничений Codex.

### Настройка (Open WebUI)

Добавьте хаб как конечную точку инструмента/функции в настройках Open WebUI:
- URL: `https://your-hub.bezrabotnyi.com/admin/api`
- Схема OpenAPI: импортировать из `https://became.bezrabotnyi.com/api.json`
- Auth: Bearer `CTL_TOKEN`

### Почему "без ограничений Codex"

Действия Custom GPT не имеют квот на вызов инструментов в час, как Codex. Пока
ваш хаб работает, ChatGPT может вызывать его столько, сколько потребуется.

---

## Какой адаптер мне использовать?

- Используете **Claude Desktop / Codex / OpenCode** нативно? → **MCP client**
- Хотите использовать **бесплатные веб-чаты** (Qwen, Alice, GigaChat)? → **Browser extension**
- На **ChatGPT с Plus** и хотите Custom GPT? → **OpenAI Action**

Все три дают вам одинаковые возможности — хабу неважно, какой адаптер
использовал ИИ. См. [Architecture](./ARCHITECTURE.md), почему.
