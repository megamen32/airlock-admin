# 中心 (`go-hub/`)

hub 是 GPT‑Админ 的中央进程。它将来自人工智能的命令代理到
shellmcp 代理、处理身份验证并为 Web 面板提供服务。

## 它的作用

1. **注册代理** — shellmcp代理向`POST /heartbeat`发送心跳；
   集线器会跟踪它们，并在心跳停止时将其标记为离线。
2. **路由命令** — 当 AI 调用工具时，集线器会查找目标
   代理并转发命令。
3. **身份验证** — 管理 API 的承载 (`CTL_TOKEN`)，OAuth 承载
   `/mcp`、`ADMIN_PASSWORD` 用于 OAuth 授权表单。
4. **截断输出** — 长的 stdout/stderr 被分块以保存标记（AI
   可以根据需要阅读更多内容）。
5. **为面板提供服务** — Web UI 位于 `/admin`（队列、代理运行状况、日志）。
6. **公开 MCP** — 对于 MCP 客户端，MCP 远程 SSE 位于 `/mcp`。
7. **公开 OpenAPI** — `/api.json` 和 `/openapi.yaml` 用于自定义 GPT 导入。

## 运行

```bash
CTL_TOKEN=your-token go run ./go-hub/cmd/gptadmin-hub
```

默认情况下，它侦听 `0.0.0.0:25900`。更改为 `--port` 或 `HUB_PORT`。

## 关键端点

|端点 |授权 |目的|
|----------|------|---------|
| `GET /admin` | `CTL_TOKEN`（基本）|网页面板|
| `GET /admin/api/*` |持票人 `CTL_TOKEN` |管理 REST API |
| `POST /mcp` | OAuth 承载 | MCP 远程 SSE（适用于 MCP 客户端）|
| `POST /heartbeat` |持票人 `SHELLMCP_TOKEN` |代理注册|
| `GET /servers` |持票人 `CTL_TOKEN` |注册代理列表 |
| `GET /api.json` |无 | OpenAPI 架构（用于自定义 GPT 导入）|
| `GET /openapi.yaml` |无 | OpenAPI YAML |
| `POST /authorize` | `ADMIN_PASSWORD` 表格 | OAuth 授权端点 |
| `POST /oauth/token` |客户凭证| OAuth 令牌端点 |

有关完整详细信息，请参阅 [API 参考](./API_REFERENCE.md)。

## 网页面板 (`/admin`)

在浏览器中打开 `https://your-hub.bezrabotnyi.com/admin`，进行身份验证
`CTL_TOKEN`。您会看到：

- **队列** — 每个代理的活动任务和已完成任务（状态、时间、结果）
- **代理运行状况** — shellmcp 代理 + 连接的 MCP 列表（openmemory、
  chrome-devtools，...）具有实时在线/离线状态
- **日志** — 命令日志和输出，可从浏览器读取（无 SSH）

## 环境变量

有关完整列表，请参阅[配置](./CONFIGURATION.md)]。要点：

|瓦尔 |必填|默认|目的|
|-----|----------|---------|---------|
| `CTL_TOKEN` |是的 | — |管理 API + 面板的不记名令牌 |
| `ADMIN_PASSWORD` |对于 OAuth | — | `/authorize` 表格的密码 |
| `OAUTH_CLIENT_SECRET` | `/mcp` | — |签署 OAuth 不记名令牌 |
| `PUBLIC_ORIGIN` |推荐| — |公共基本 URL（用于 OAuth、OpenAPI）|
| `HUB_PORT` |没有| 25900 | 25900监听端口 |

## 监督

Go hub 由 systemd 直接监控，编号为 `Restart=always`。旧版 Python 看门狗单元已被删除。手动重启：

```bash
systemctl restart gptadmin-hub.service
```

## 另请参阅

- [Configuration](./CONFIGURATION.md) — 完整的环境变量参考
- [API 参考](./API_REFERENCE.md) — 端点详细信息
- [Security](./SECURITY_DOCS.md) — 身份验证模型
- [ShellMCP](./SHELLMCP.md) — 代理
