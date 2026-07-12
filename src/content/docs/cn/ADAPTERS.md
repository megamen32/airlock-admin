# 适配器

该中心为 AI 提供了**三种**连接方式。同一个中心，相同的能力
— 选择与您的 AI 匹配的那个。

| 适配器 | 用于 | 如何 |
|---------|-----|-----|
| [MCP 客户端](#1-mcp-client) | Claude Desktop, Codex, OpenCode | MCP 远程 SSE，路径为 `/mcp` |
| [浏览器扩展](#2-browser-extension) | DeepSeek, Qwen, Alice, GigaChat, ChatGPT (免费版) | 用户脚本 (Tampermonkey/Firefox) |
| [OpenAI Action](#3-openai-action) | ChatGPT 自定义 GPT, Open WebUI | REST + OpenAPI，Bearer 令牌 |

---

## 1. MCP 客户端

**用于:** Claude Desktop, Codex, OpenCode, 任何兼容 MCP 的客户端。

**协议:** MCP 远程 SSE (可流式传输的 HTTP)。

**端点:** `https://your-hub.bezrabotnyi.com/mcp`

### 设置

将中心添加为客户端配置中的 MCP 服务器。对于 Claude Desktop，请编辑
`claude_desktop_config.json`：

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

对于 Codex / OpenCode，相同的配置应放入它们各自的 MCP 设置中。

重启客户端。您应该能看到 `gptadmin` 工具（shell_exec、文件操作、
systemd 等）可用。

### 注意事项

- `/mcp` **不**直接接受 `CTL_TOKEN`。它需要一个由中心通过 `OAUTH_CLIENT_SECRET` 签名的 OAuth bearer
  令牌。请参阅 [配置 → OAuth](./CONFIGURATION.md#oauth)。
- 对于本地开发，您可以使用 `http://localhost:25900/mcp` 而无需 OAuth（中心会在 localhost 上放宽认证）。

---

## 2. 浏览器扩展

**用于:** DeepSeek, Qwen, Yandex Alice, Sber GigaChat, ChatGPT (免费版) —
任何免费的网页聊天。

**协议:** 用户脚本 (通过 Tampermonkey/Firefox 在浏览器中运行)。

**安装:** https://became.bezrabotnyi.com/mcp-bridge.user.js

### 工作原理

该用户脚本会在网页聊天 UI 中添加两个按钮：
- **MCP All** (`Alt+M`) — 将所有 MCP 代理及其工具的简洁描述插入聊天输入框。还会将提示词复制到剪贴板。
- **MCP** — 打开一个面板，用于选择具有详细工具文档的特定代理。

当 AI 回复包含包含 JSON 命令的 ` ```mcp ` 代码块时，
脚本会自动：
1. 突出显示该代码块
2. 将调用发送到您的中心
3. 将结果插入聊天中

### 按平台设置

| 平台 | 管理器 | 步骤 |
|----------|---------|-------|
| macOS / Windows / Linux | Chrome + [Tampermonkey](https://www.tampermonkey.net/) | 从 Chrome 网上应用店安装 Tampermonkey，然后点击安装链接。 |
| iPhone | Safari + [Userscripts](https://apps.apple.com/app/userscripts/id1463298887) | 安装 Userscripts 应用，在 Safari → 扩展中启用，然后安装。 |
| Android | Firefox + Tampermonkey | 从 Google Play 安装 Firefox，添加 Tampermonkey，然后安装。 |

### 配置

按 `Alt+K`（或右下角的钥匙图标）并输入：
- **Bridge URL** — 您的中心 URL (`https://your-hub.bezrabotnyi.com`)
- **Bridge Key** — 您的 `CTL_TOKEN`

### 支持的网站

| 网站 | 状态 |
|------|--------|
| chatgpt.com | 完全支持 |
| chat.deepseek.com | 完全支持 |
| chat.qwen.ai | 完全支持 |
| ya.ru / chat.yandex.ru | 完全支持 |

> 如果自动插入不起作用（罕见，在某些网站上），提示词始终在
> 您的剪贴板中 — 只需 `Ctrl+V` / `Cmd+V`。

---

## 3. OpenAI Action

**用于:** ChatGPT 自定义 GPT, Open WebUI。

**协议:** REST + OpenAPI 模式，Bearer 认证。

**端点:** `https://your-hub.bezrabotnyi.com/admin/api/*`

### 设置 (ChatGPT 自定义 GPT)

1. 打开 https://chatgpt.com/gpts/editor
2. 创建或编辑一个 GPT → 配置 → Actions → 创建新动作
3. 通过 URL 导入 OpenAPI: `https://became.bezrabotnyi.com/api.json`
4. 在 `servers` 块中，用您的中心 URL 替换 `url`
5. 认证 → API 密钥 → Bearer → 粘贴您的 `CTL_TOKEN`
6. 保存。现在您可以要求 ChatGPT 运行服务器命令了 — 没有 Codex 限制。

### 设置 (Open WebUI)

在 Open WebUI 设置中将中心添加为工具/函数端点：
- URL: `https://your-hub.bezrabotnyi.com/admin/api`
- OpenAPI 模式: 从 `https://became.bezrabotnyi.com/api.json` 导入
- 认证: Bearer `CTL_TOKEN`

### 为什么是“无 Codex 限制”

自定义 GPT 动作没有像 Codex 那样的每小时工具调用配额。只要
您的中心在线，ChatGPT 就可以调用它所需次数。

---

## 我应该使用哪个适配器？

- 原生使用 **Claude Desktop / Codex / OpenCode**？→ **MCP 客户端**
- 想使用 **免费网页聊天** (Qwen, Alice, GigaChat)？→ **浏览器扩展**
- 在 **ChatGPT Plus** 上并想要自定义 GPT？→ **OpenAI Action**

所有三种都提供相同的能力 — 中心不关心 AI 使用了哪个适配器。请参阅 [架构](./ARCHITECTURE.md) 查看原因。
