# GPT-Admin — 文档

欢迎使用 GPT-Admin 文档。GPT-Admin 是一个自托管的 MCP 中心：将您的服务器和任何 MCP 工具连接到它，然后通过三个适配器连接任何 AI。

**网站:** https://gptadmin.bezrabotnyi.com
**安装:** `curl -s https://became.bezrabotnyi.com/install.sh | bash`

## 目录

| 页面 | 内容 |
|------|---------------|
| [Architecture](./ARCHITECTURE.md) | 中心、shellmcp 和 3 个适配器如何协同工作 |
| [Getting Started](./GETTING_STARTED.md) | 5 分钟内完成安装和第一个命令 |
| [Adapters](./ADAPTERS.md) | 连接 AI 的 3 种方式 (MCP / extension / Custom GPT) |
| [Hub](./HUB.md) | gptadmin_hub：配置、环境变量、端点、Web 面板 |
| [ShellMCP](./SHELLMCP.md) | 在目标机器上运行的代理 |
| [Install Paths](./INSTALL_PATHS.md) | GPT-Admin 在 Linux/macOS/Windows 上的位置 |
| [Configuration](./CONFIGURATION.md) | 完整的环境变量参考、认证模型、OAuth |
| [API Reference](./API_REFERENCE.md) | REST + MCP 端点 |
| [MCP Proxy Relay](./MCP_PROXY_RELAY.md) | 将 GPTAdmin 用作安全的每服务器 MCP 和 OpenAPI Action 代理 |
| [Security](./SECURITY_DOCS.md) | 认证、令牌、OAuth、负责任披露 |
| [Tunnels](./TUNNELS_DOCS.md) | 用于暴露中心的 FRP 和 Cloudflare 隧道 |
| [Failover](./FAILOVER.md) | 了解故障转移节点如何在降级模式下保持 GPTAdmin 的运行以及如何恢复 |
| [Roadmap](./ROADMAP.md) | 已构建的功能、即将推出的功能、核心开源分离 |
| [FAQ](./FAQ.md) | 常见问题 |

## 快速链接

- **新手？** 从 [Getting Started](./GETTING_STARTED.md) 开始。
- **想了解设计？** 阅读 [Architecture](./ARCHITECTURE.md)。
- **连接特定 AI？** 跳转到 [Adapters](./ADAPTERS.md)。
- **准备投入生产环境？** 查看 [Security](./SECURITY_DOCS.md) 和 [Tunnels](./TUNNELS_DOCS.md)。
- **规划弹性？** 在阅读 [Tunnels](./TUNNELS_DOCS.md) 后阅读 [Failover](./FAILOVER.md)。
