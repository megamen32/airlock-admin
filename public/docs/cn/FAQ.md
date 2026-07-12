# 常见问题解答

## GPT-Admin 是免费的吗？

是的。核心功能（hub、shellmcp、所有三个适配器、基础网页面板）根据 AGPL-3.0 协议永久免费。未来的付费功能（托管云、企业 SSO、高级面板）是增量的——现有功能保持免费。
请参阅 [路线图](./ROADMAP.md)。

## 我需要付费的 AI 订阅吗？

不需要。浏览器扩展支持**免费网络聊天**——包括 DeepSeek、Qwen、Yandex Alice、Sber GigaChat，甚至是免费版的 ChatGPT。请参阅 [适配器 → 浏览器扩展](./ADAPTERS.md#2-browser-extension)。

## 让 AI 访问我的服务器安全吗？

GPT-Admin 就是为此设计的。关键安全功能包括：

- **默认用户模式** — 无需 root/sudo
- **命令白名单** — 限制 AI 可以运行的内容
- **批准模式** — 对关键操作进行人工确认
- **审计日志** — 每个命令都会记录调用者 + 结果
- **日志中屏蔽密钥**
- **文件编辑前的管理备份**

请参阅 [安全](./SECURITY_DOCS.md)。

## AI 会在不知情的情况下运行命令吗？

不会。只有在您在聊天中要求时，命令才会运行。对于关键操作（删除、网络更改），批准模式需要人工确认。

## 三个适配器有什么区别？

同一个 hub，相同的能力——它们只是 AI 连接的不同方式：

- **MCP 客户端** — 用于 Claude/Codex/OpenCode（原生 MCP 支持）
- **浏览器扩展** — 用于免费网络聊天（无需 API）
- **OpenAI Action** — 用于 ChatGPT 自定义 GPT / Open WebUI

请参阅 [适配器](./ADAPTERS.md)。

## 为什么叫 CTL_TOKEN？

这是历史命名。`CTL_TOKEN` 是 hub API + 网页面板的管理员凭证令牌。该命名在 1.0 版本前可能会更改（并提供迁移路径）。
请参阅 [配置 → 命名](./CONFIGURATION.md)。

## `/mcp` 返回 401 — 为什么？

`/mcp` 不直接接受 `CTL_TOKEN`。它需要通过 `OAUTH_CLIENT_SECRET` 签名的 OAuth 凭证令牌。MCP 客户端通过 OAuth 流程自动处理这一点。对于本地开发，hub 会在 localhost 上放宽认证。请参阅 [配置 → OAuth](./CONFIGURATION.md#oauth)。

## 我需要自己的域名吗？

不需要。安装程序提供了一个通过 FRP 的自动隧道——您可以在 `frp.bezrabotnyi.com` 上获得一个公共 URL，无需设置 DNS。如果需要使用自己的域名，请使用 Cloudflare Tunnel 或 nginx + Certbot。请参阅 [隧道](./TUNNELS_DOCS.md)。

## 在 Windows 上可以使用吗？

可以。代理通过计划任务在 Windows 上运行（用户模式，无需管理员权限）。使用以下命令安装：

```powershell
iwr -UseBasicParsing https://became.bezrabotnyi.com/install_win.ps1 | iex
```

请参阅 [安装路径](./INSTALL_PATHS.md)。

## 我可以在没有浏览器扩展/自定义 GPT 的情况下使用吗？

可以——使用 **MCP 客户端**适配器连接 Claude Desktop、Codex 或 OpenCode。这些原生通过 MCP 远程 SSE 连接，无需浏览器。请参阅 [适配器 → MCP 客户端](./ADAPTERS.md#1-mcp-client)。

## 输出截断是如何工作的？

长的 stdout/stderr 会被分块（默认为 1MB）。AI 只能看到开头 + 结尾 + 一个“阅读更多”的指针。这可以节省令牌——AI 只读取它回答所需的内容。请参阅 [API 参考 → 输出截断](./API_REFERENCE.md#output-truncation)。

## 我可以接入其他 MCP 吗？

可以！hub 可以消费其他 MCP 服务器（用于网络搜索的 chrome-devtools、用于项目记忆的 openmemory 等），并将它们作为工具暴露给所有连接的 AI。请参阅 [架构](./ARCHITECTURE.md)。

## 如何轮换令牌？

请参阅 [安全 → 令牌轮换](./SECURITY_DOCS.md#token-rotation)。简而言之：使用 `openssl rand -hex 32` 生成新值，更新 hub 环境变量，重启，然后更新客户端。

## 出了问题。日志在哪里？

- Hub: `journalctl -u gptadmin_hub -n 100` (或 `--user` 用于用户模式)
- Agent: `journalctl -u shellmcp -n 100` (或 `--user`)
- 或者在网页面板中查看：`/admin` → Logs

## 如何卸载？

```bash
gptadmin uninstall
```

移除二进制文件、配置文件和服务单元。文件备份会保留。

## 仍然卡住了？

- [在 GitHub 上开 Issue](https://github.com/megamen32/gptadmin/issues)
- Telegram: [@careviolan](https://t.me/careviolan)
- 网站: https://gptadmin.bezrabotnyi.com
