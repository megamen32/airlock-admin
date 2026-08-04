# 开始使用

安装 GPT‑Админ、连接您的 AI、运行您的第一个命令 — 只需 5 分钟。

## 1. 安装集线器

在将运行集线器的计算机（您的 PC、VPS 或服务器）上：

```bash
# Linux / macOS — auto-detects user/system mode
curl -s https://became.bezrabotnyi.com/install.sh | bash
```

```powershell
# Windows (PowerShell, no Administrator needed)
iwr -UseBasicParsing https://became.bezrabotnyi.com/install_win.ps1 | iex
```

安装程序会打印您的 **Hub URL** 和 **CTL_TOKEN** - 保存它们。

> 无需域名：选择自动隧道选项（FRP 或 Cloudflare），然后您
> 获取公共 URL。请参阅[隧道](./TUNNELS_DOCS.md)。

## 2. 在目标机器上安装代理

在您要管理的每台服务器上：

```bash
curl -s https://became.bezrabotnyi.com/install.sh | bash
```

出现提示时选择“仅限代理”。代理会自动向您的集线器注册。

## 3. 连接您的人工智能

选择一个适配器（您可以将所有三个适配器与同一集线器一起使用）：

- **Claude Desktop / Codex / OpenCode** → [MCP 客户端设置](./ADAPTERS.md#1-mcp-client)
- **DeepSeek / Qwen / Alice / GigaChat**（免费网络聊天）→ [浏览器扩展](./ADAPTERS.md#2-browser-extension)
- **ChatGPT 自定义 GPT / 打开 WebUI** → [OpenAI Action](./ADAPTERS.md#3-openai-action)

## 4. 运行你的第一个命令

用简单的语言询问你的人工智能：

- “显示 server-01 上的 nginx 状态”
- “在 vps-prod 上安装 docker”
- “为什么 openchamber 返回 503？检查日志”
- “运行 codex 来修复此存储库中的错误”

AI呼叫hub，hub路由到agent，agent运行命令
并返回实际输出。人工智能会读取它并返回报告。

## 显示连接 URL

设置后，打印当前公共集线器 URL、隧道模式、MCP 端点和自定义 GPT 操作架构：

```bash
sudo gptadmin urls
```

有用的变体：

```bash
sudo gptadmin urls --all   # include every registered MCP server
sudo gptadmin urls --json  # machine-readable output
```

## 后续步骤

- [Architecture](./ARCHITECTURE.md) — 了解它如何组合在一起
- [Configuration](./CONFIGURATION.md) — 调整环境变量、身份验证、OAuth
- [Security](./SECURITY_DOCS.md) — 生产强化
- [网页面板](./HUB.md#web-panel-admin) — 从浏览器管理

## 故障排除

**代理未出现在 `/admin`**
- 检查 `HUB_URL` 是否已设置并且可以从代理处访问
- 检查 `SHELLMCP_TOKEN` 是否与集线器期望的相符
- 查看代理日志：`journalctl --user -u shellmcp -n 50`

**`/mcp` 返回 401**
- 您直接使用 `CTL_TOKEN`。 `/mcp` 需要 OAuth 承载。参见
  [配置→OAuth](./CONFIGURATION.md#oauth)。

**浏览器扩展按钮不出现**
- 刷新页面
- 确保 Tampermonkey/Userscripts 已启用脚本
- 在某些网站上，自动插入失败 - 提示位于剪贴板中，请手动粘贴

**自定义 GPT 操作测试失败**
- 验证 `servers.url` 中的 Hub URL 是否与您的 Hub 匹配
- 验证承载令牌是您的 `CTL_TOKEN`，而不是 `SHELLMCP_TOKEN`
