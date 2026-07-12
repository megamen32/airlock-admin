# Hub (`go-hub/`)

Hub 是 GPT-Админ 的核心进程。它负责将来自 AI 的命令代理到
shellmcp 代理，处理认证，并提供 Web 面板。

## 功能概述

1. **注册代理** — shellmcp 代理向 `POST /heartbeat` 发送心跳；
   hub 跟踪它们，如果心跳停止则标记为离线。
2. **路由命令** — 当 AI 调用工具时，hub 会查找目标
   代理并转发命令。
3. **认证** — 管理员 API 使用 Bearer (`CTL_TOKEN`)，`/mcp` 使用 OAuth bearer，OAuth 授权表单使用 `ADMIN_PASSWORD`。
4. **截断输出** — 长篇 stdout/stderr 会被分块以节省 token（AI
   可以按需阅读更多内容）。
5. **提供面板** — `/admin` 处的 Web UI（队列、代理健康状态、日志）。
6. **暴露 MCP** — 为 MCP 客户端提供 `/mcp` 的 MCP 远程 SSE。
7. **暴露 OpenAPI** — 为自定义 GPT 导入提供 `/api.json` 和 `/openapi.yaml`。

## 运行

```bash
CTL_TOKEN=your-token go run ./go-hub/cmd/gptadmin-hub
```

默认监听 `0.0.0.0:25900`。使用 `--port` 或 `HUB_PORT` 更改。

## 关键端点

| 端点 | 认证 | 用途 |
|----------|------|---------|
| `GET /admin` | `CTL_TOKEN` (basic) | Web 面板 |
| `GET /admin/api/*` | Bearer `CTL_TOKEN` | 管理员 REST API |
| `POST /mcp` | OAuth bearer | MCP 远程 SSE (用于 MCP 客户端) |
| `POST /heartbeat` | Bearer `SHELLMCP_TOKEN` | 代理注册 |
| `GET /servers` | Bearer `CTL_TOKEN` | 列出已注册的代理 |
| `GET /api.json` | 无 | OpenAPI 模式 (用于自定义 GPT 导入) |
| `GET /openapi.yaml` | 无 | OpenAPI YAML |
| `POST /authorize` | `ADMIN_PASSWORD` 表单 | OAuth 授权端点 |
| `POST /oauth/token` | 客户端凭证 | OAuth 令牌端点 |

有关完整详细信息，请参阅 [API 参考](./API_REFERENCE.md)。

## Web 面板 (`/admin`)

在浏览器中打开 `https://your-hub.bezrabotnyi.com/admin`，使用
`CTL_TOKEN` 进行认证。您将看到：

- **队列** — 每个代理的活动和已完成任务（状态、时间、结果）
- **代理健康状态** — shellmcp 代理列表 + 连接的 MCP（openmemory、
  chrome-devtools 等）的实时在线/离线状态
- **日志** — 命令日志和输出，可在浏览器中阅读（无需 SSH）

## 环境变量

有关完整列表，请参阅 [配置](./CONFIGURATION.md)。核心变量：

| 变量 | 是否必需 | 默认值 | 用途 |
|-----|----------|---------|---------|
| `CTL_TOKEN` | 是 | — | 管理员 API + 面板的 Bearer 令牌 |
| `ADMIN_PASSWORD` | 用于 OAuth | — | `/authorize` 表单的密码 |
| `OAUTH_CLIENT_SECRET` | 用于 `/mcp` | — | 签名 OAuth bearer 令牌 |
| `PUBLIC_ORIGIN` | 推荐 | — | 公共基础 URL (用于 OAuth, OpenAPI) |
| `HUB_PORT` | 否 | 25900 | 监听端口 |

## 监督

Go hub 由 systemd 直接监督，设置了 `Restart=always`。已移除旧的 Python watchdog 单元。手动重启：

```bash
systemctl restart gptadmin-hub.service
```

## 另请参阅

- [配置](./CONFIGURATION.md) — 完整的环境变量参考
- [API 参考](./API_REFERENCE.md) — 端点详情
- [安全](./SECURITY_DOCS.md) — 认证模型
- [ShellMCP](./SHELLMCP.md) — 代理
