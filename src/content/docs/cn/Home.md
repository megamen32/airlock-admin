# GPT‑Админ — 文档

欢迎使用 GPT‑Админ 文档。 GPT‑Админ 是一个自托管 MCP 集线器：插入您的
服务器和任何 MCP 工具进入其中，然后通过以下三个之一连接任何 AI
适配器。

**网站：** https://gptadmin.bezrabotnyi.com
**安装：** `curl -s https://became.bezrabotnyi.com/install.sh | bash`

## 目录

|页 |里面有什么 |
|------|----------------|
| [架构](./ARCHITECTURE.md) | hub、shellmcp 和 3 个适配器如何组合在一起 |
| [入门](./GETTING_STARTED.md) | 5 分钟内安装 + 第一个命令 |
| [适配器](./ADAPTERS.md) |连接 AI 的 3 种方式（MCP/扩展/自定义 GPT）|
| [集线器](./HUB.md) | gptadmin_hub：配置、环境变量、端点、Web 面板 |
| [ShellMCP](./SHELLMCP.md) |在目标机器上运行的代理 |
| [安装路径](./INSTALL_PATHS.md) | GPT‑Админ 在 Linux/macOS/Windows 上的位置 |
| [配置](./CONFIGURATION.md) |完整的环境变量参考、身份验证模型、OAuth |
| [API参考](./API_REFERENCE.md) | REST + MCP 端点 |
| [MCP 代理中继](./MCP_PROXY_RELAY.md) |使用 GPTAdmin 作为安全的每服务器 MCP 和 OpenAPI 操作代理 |
| [安全](./SECURITY_DOCS.md) |身份验证、令牌、OAuth、负责任的披露 |
| [隧道](./TUNNELS_DOCS.md) | FRP 和 Cloudflare 隧道公开集线器 |
| [故障转移](./FAILOVER.md) |后备节点如何在降级模式下使 GPTAdmin 保持活动状态以及如何恢复 |
| [路线图](./ROADMAP.md) |已构建什么，即将发生什么，开放核心拆分 |
| [常见问题](./FAQ.md) |常见问题 |

## 快速链接

- **这里是新的？** 从[入门](./GETTING_STARTED.md)]开始。
- **想了解设计吗？** 阅读[架构](./ARCHITECTURE.md)。
- **连接特定 AI？** 跳转至 [Adapters](./ADAPTERS.md)。
- **进入生产？** 请参阅 [Security](./SECURITY_DOCS.md) 和 [Tunnels](./TUNNELS_DOCS.md)]。
- **规划弹性？** 在[隧道](./TUNNELS_DOCS.md)之后阅读[故障转移](./FAILOVER.md)。
