# 入门指南

安装 GPT-Admin，连接您的 AI，运行您的第一个命令——只需 5 分钟。

## 1. 安装中心节点 (hub)

在将运行中心节点的机器上（您的 PC、VPS 或服务器）：

```bash
# Linux / macOS — 自动检测用户/系统模式
curl -s https://became.bezrabotnyi.com/install.sh | bash
```

```powershell
# Windows (PowerShell，无需管理员权限)
iwr -UseBasicParsing https://became.bezrabotnyi.com/install_win.ps1 | iex
```

安装程序会打印您的 **Hub URL** 和 **CTL_TOKEN**——请保存它们。

> 不需要域名：选择自动隧道选项（FRP 或 Cloudflare），您将获得一个公共 URL。请参阅 [Tunnels](./TUNNELS_DOCS.md)。

## 2. 在目标机器上安装代理 (agent)

在您想要管理的每台服务器上：

```bash
curl -s https://became.bezrabotnyi.com/install.sh | bash
```

提示时选择“仅代理 (agent only)”。代理会自动注册到您的中心节点。

## 3. 连接您的 AI

选择一个适配器（您可以使用所有三个适配器连接到同一个中心节点）：

- **Claude Desktop / Codex / OpenCode** → [MCP 客户端设置](./ADAPTERS.md#1-mcp-client)
- **DeepSeek / Qwen / Alice / GigaChat**（免费网页聊天）→ [浏览器扩展](./ADAPTERS.md#2-browser-extension)
- **ChatGPT 自定义 GPT / Open WebUI** → [OpenAI Action](./ADAPTERS.md#3-openai-action)

## 4. 运行您的第一个命令

用自然语言询问您的 AI：

- «покажи статус nginx на server-01»
- «поставь docker на vps-prod»
- «почему openchamber отдаёт 503? посмотри логи»
- «запусти codex чтобы пофиксить баг в этом репо»

AI 调用中心节点，中心节点路由到代理，代理执行命令并返回实际输出。AI 读取这些输出并报告给您。

## 显示连接 URL

设置完成后，打印当前的公共中心节点 URL、隧道模式、MCP 端点和自定义 GPT Action 模式：

```bash
sudo gptadmin urls
```

有用的变体：

```bash
sudo gptadmin urls --all   # 包括所有已注册的 MCP 服务器
sudo gptadmin urls --json  # 机器可读的输出
```

## 后续步骤

- [架构](./ARCHITECTURE.md) — 了解各个组件如何协同工作
- [配置](./CONFIGURATION.md) — 调整环境变量、认证、OAuth
- [安全](./SECURITY_DOCS.md) — 生产环境加固
- [Web 面板](./HUB.md#web-panel-admin) — 通过浏览器管理

## 故障排除

**代理未显示在 `/admin`**
- 检查 `HUB_URL` 是否已设置且可从代理访问
- 检查 `SHELLMCP_TOKEN` 是否与中心节点期望的匹配
- 查看代理日志：`journalctl --user -u shellmcp -n 50`

**`/mcp` 返回 401**
- 您直接使用了 `CTL_TOKEN`。`/mcp` 需要 OAuth bearer。请参阅
  [配置 → OAuth](./CONFIGURATION.md#oauth)。

**浏览器扩展按钮未出现**
- 刷新页面
- 确保 Tampermonkey/Userscripts 已启用脚本
- 在某些网站上，自动插入会失败——请将提示词复制到剪贴板，然后手动粘贴

**自定义 GPT action 测试失败**
- 验证 `servers.url` 中的 Hub URL 是否与您的中心节点匹配
- 验证 Bearer token 是否是您的 `CTL_TOKEN`，而不是 `SHELLMCP_TOKEN`
