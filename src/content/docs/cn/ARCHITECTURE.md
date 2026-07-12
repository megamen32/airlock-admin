# 架构

GPT‑Админ 是一个**MCP 中心**，拥有**三个适配器**。工具插入到中心；
AI 从中心连接出去。

```
   MCP 工具插入            AI 连接出去 (3 个适配器)
  ┌─────────────────┐          ┌──────────────────────┐
  │ shellmcp        │          │ Claude · Codex       │ (MCP 客户端)
  │ chrome-devtools │  ──►  ┌──┴──────────────┐       │
  │ openmemory      │       │   GPT‑Админ     │  ──►  │ DeepSeek · Qwen  │ (浏览器扩展)
  │ any MCP         │  ◄──  │   MCP 中心       │       │ Alice · GigaChat │
  └─────────────────┘       └──┬──────────────┘  ──►  │ ChatGPT · OpenUI │ (OpenAI Action)
                              │                │       └──────────────────────┘
                              ▼
                        您的服务器
                     (Linux · macOS · Windows)
```

## 组件

### 1. 中心 (`go-hub/`)

核心进程。它：
- 接收来自 shellmcp 代理的心跳信号（注册它们，跟踪存活状态）
- 在 `/mcp` 处暴露 MCP 远程 SSE，供 MCP 客户端使用（Claude、Codex、OpenCode）
- 在 `/admin/api/*` 处暴露 REST 管理 API（由 Web 面板 + 自定义 GPT 使用）
- 将来自 AI 的命令代理到正确的 shellmcp 代理
- 处理 OAuth（用于 OpenAI SDK OAuth 流程）和 Bearer 认证（CTL_TOKEN）
- 在 `/admin` 处提供 Web 面板

### 2. ShellMCP (`go-shellmcp/`, `client/`)

在每台目标机器上运行的代理。它：
- 通过心跳信号注册到中心（`POST /heartbeat`）
- 在本地执行 shell 命令、文件操作、systemd 操作
- 将真实的 stdout/stderr 返回给中心，中心再返回给 AI
- 支持 Linux、macOS、Windows
- 默认在用户模式（无 sudo），需要时在系统模式运行

Go 实现 (`go-shellmcp/`) 是主要的。Python 客户端
(`client/`) 保留以保持兼容性。

### 3. 三个适配器

中心为 AI 连接提供了三种方式。中心相同，能力相同——
选择适合您 AI 的那一种。

| 适配器 | 协议 | 用于 | 端点 |
|---------|----------|-----|----------|
| **MCP 客户端** | MCP 远程 SSE | Claude Desktop, Codex, OpenCode | `/mcp` |
| **浏览器扩展** | userscript (Tampermonkey/Firefox) | DeepSeek, Qwen, Alice, GigaChat, ChatGPT (免费) | 注入到 Web UI |
| **OpenAI Action** | REST + OpenAPI | ChatGPT 自定义 GPT, Open WebUI | `/admin/api/*` |

有关每个适配器的设置，请参阅 [Adapters](./ADAPTERS.md)。

## 数据流

当您要求 AI “在 server-01 上重启 nginx”时：

1. **AI** 决定调用一个工具（MCP 工具 / OpenAI Action / 注入的 mcp 块）
2. **适配器** 将调用路由到中心（`POST /mcp` 或 `/admin/api/exec`）
3. **中心** 查找 `server-01`，找到其 shellmcp 代理，转发命令
4. `server-01` 上的 **shellmcp** 运行 `systemctl restart nginx`，捕获输出
5. **shellmcp** 将 stdout/stderr 返回给中心
6. **中心** 截断过长的输出（节省 token），返回给适配器
7. **适配器** 将结果返回给 AI，AI 读取结果并报告回来

## 为什么采用这种设计

- **中心辐射型 (Hub-and-spoke)**：一个地方管理认证、日志记录、截断、审计。
  增加新的 AI = 增加一个适配器，而不是重写代理。
- **MCP 原生**：中心使用 MCP 协议，因此任何 MCP 客户端都适用。中心本身还可以
  消费其他 MCP（chrome-devtools, openmemory）——它们会成为所有连接的 AI 可用的工具。
- **自托管**：您的服务器，您的 token，您的数据。没有任何东西会离开您的
  基础设施。
- **任何 AI，甚至是免费的**：浏览器扩展意味着您不需要付费 API。免费的 Web 聊天（Qwen, Alice, GigaChat）可以作为 GPT‑Админ 客户端使用。

## 另请参阅

- [中心](./HUB.md) — 中心内部、配置、端点
- [ShellMCP](./SHELLMCP.md) — 代理内部
- [适配器](./ADAPTERS.md) — 如何连接每个 AI
