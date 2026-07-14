# 适配器

该集线器公开了人工智能连接的**三种方式**。相同的中心，相同的功能
— 选择与您的人工智能相匹配的一个。

|适配器|对于 |如何|
|---------|-----|-----|
| [MCP客户端](#1-mcp-client) |克劳德桌面、Codex、OpenCode | MCP 远程 SSE 为 `/mcp` |
| [浏览器扩展](#2-browser-extension) | DeepSeek、Qwen、Alice、GigaChat、ChatGPT（免费）|用户脚本（Tampermonkey/Firefox）|
| [OpenAI 行动](#3-openai-action) | ChatGPT 自定义GPT，打开WebUI | REST + OpenAPI，不记名令牌 |

---

## 1.MCP客户端

**适用于：** Claude Desktop、Codex、OpenCode、任何 MCP 兼容客户端。

**协议：** MCP 远程 SSE（流式 HTTP）。

**端点：** `https://your-hub.bezrabotnyi.com/mcp`

### 设置

将集线器添加为客户端配置中的 MCP 服务器。对于 Claude Desktop，编辑
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

对于 Codex / OpenCode，相同的配置位于各自的 MCP 设置中。

重新启动客户端。您应该看到 `gptadmin` 个工具（shell_exec、文件操作、
systemd 等）可用。

### 注释

- `/mcp` **不**直接接受 `CTL_TOKEN` 。它需要 OAuth 承载者
  中心通过 `OAUTH_CLIENT_SECRET` 签名的令牌。请参阅
  [配置→OAuth](./CONFIGURATION.md#oauth)。
- 对于本地开发，您可以使用 `http://localhost:25900/mcp` 而不使用 OAuth（
  集线器放宽了本地主机上的身份验证）。

---

## 2. 浏览器扩展

**适用于：** DeepSeek、Qwen、Yandex Alice、Sber GigaChat、ChatGPT（免费套餐）—
任何免费的网络聊天。

**协议：** 用户脚本（通过 Tampermonkey/Firefox 在浏览器中运行）。

**安装：** https://became.bezrabotnyi.com/mcp-bridge.user.js

### 它是如何工作的

用户脚本向网络聊天 UI 添加两个按钮：
- **MCP 全部** (`Alt+M`) — 插入所有 MCP 代理的简洁描述
  并将他们的工具放入聊天输入中。还将提示复制到剪贴板。
- **MCP** — 打开一个面板来选择具有详细工具文档的特定代理。

当AI响应包含JSON命令的` ```mcp `代码块时，
自动执行脚本：
1.高亮区块
2. 将呼叫发送至您的中心
3. 将结果插入回聊天中

### 每个平台的设置

|平台|经理 |步骤|
|----------|---------|--------|
| macOS / Windows / Linux | Chrome + [Tampermonkey](https://www.tampermonkey.net/) |从 Chrome 网上应用店安装 Tampermonkey，然后单击安装链接。 |
| iPhone | Safari + [用户脚本](https://apps.apple.com/app/userscripts/id1463298887) |安装 Userscripts 应用程序，在 Safari → 扩展中启用，然后安装。 |
|安卓 |火狐 + 篡改猴 |从 Google Play 安装 Firefox，添加 Tampermonkey，然后安装。 |

### 配置

按 `Alt+K`（或右下角的钥匙图标）并输入：
- **桥 URL** — 您的中心 URL (`https://your-hub.bezrabotnyi.com`)
- **桥钥匙** — 您的 `CTL_TOKEN`

### 支持的网站

|网站 |状态 |
|------|--------|
|聊天gpt.com |全力支持|
|聊天.deepseek.com |全力支持|
|聊天.qwen.ai |全力支持|
| ya.ru / chat.yandex.ru |全力支持|

> 如果自动插入不起作用（在某些网站上很少见），则提示始终处于
> 你的剪贴板 — 只是 `Ctrl+V` / `Cmd+V`。

---

## 3. OpenAI 行动

**对于：** ChatGPT 自定义 GPT，打开 WebUI。

**协议：** REST + OpenAPI 架构、承载身份验证。

**端点：** `https://your-hub.bezrabotnyi.com/admin/api/*`

### 设置（ChatGPT 自定义 GPT）

1.打开https://chatgpt.com/gpts/editor
2. 创建或编辑 GPT → 配置 → 操作 → 创建新操作
3.通过URL导入OpenAPI：`https://became.bezrabotnyi.com/api.json`
4. 在 `servers` 块中，将 `url` 替换为您的 Hub URL
5. 身份验证→API密钥→承载→粘贴您的`CTL_TOKEN`
6. 保存。您现在可以要求 ChatGPT 运行服务器命令——没有 Codex 限制。

### 设置（打开 WebUI）

在 Open WebUI 设置中将集线器添加为工具/功能端点：
- 网址：`https://your-hub.bezrabotnyi.com/admin/api`
- OpenAPI架构：从`https://became.bezrabotnyi.com/api.json`导入
- 授权：持有者 `CTL_TOKEN`

### 为什么“没有法典限制”

自定义 GPT 操作没有像 Codex 那样的每小时工具调用配额。只要
您的集线器已启动，ChatGPT 可以根据需要调用它。

---

## 我应该使用哪个适配器？- 本地使用**Claude Desktop / Codex / OpenCode**？ → **MCP 客户端**
- 想要使用**免费网络聊天**（Qwen、Alice、GigaChat）？ → **浏览器扩展**
- 使用 **ChatGPT with Plus** 并想要自定义 GPT？ → **OpenAI 行动**

所有这三个都为您提供相同的功能 - 集线器并不关心哪个适配器
使用的人工智能。请参阅 [Architecture](./ARCHITECTURE.md)] 了解原因。
