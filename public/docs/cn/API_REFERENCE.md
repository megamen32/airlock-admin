# API 参考

由中心暴露的 REST + MCP 端点。

## 认证快速参考

| 端点 | 认证 |
|----------|------|
| `GET /admin` | Basic (`CTL_TOKEN`) |
| `GET /admin/api/*` | Bearer `CTL_TOKEN` |
| `POST /mcp` | OAuth bearer |
| `POST /heartbeat` | Bearer `SHELLMCP_TOKEN` |
| `GET /servers` | Bearer `CTL_TOKEN` |
| `GET /api.json` | none |
| `GET /openapi.yaml` | none |
| `POST /authorize` | `ADMIN_PASSWORD` form |
| `POST /oauth/token` | client credentials |

参见 [配置 → Auth 模型](./CONFIGURATION.md#auth-model)。

---

## 管理员 API (`/admin/api/*`)

使用 `CTL_TOKEN` 的 Bearer 认证。由 Web 面板和自定义 GPT 操作使用。

### `GET /servers`

列出已注册的 shellmcp 代理。

```json
{
  "servers": [
    { "name": "server-01", "url": "http://10.0.0.5:25901", "alive": true, "last_seen": "2026-06-29T10:00:00Z" }
  ]
}
```

### `POST /exec`

在目标代理上执行 shell 命令。

```json
{
  "server": "server-01",
  "cmd": "systemctl status nginx"
}
```

响应（如果过长则截断以节省令牌）：

```json
{
  "stdout": "● nginx.service - The nginx HTTP server...",
  "stderr": "",
  "exit_code": 0,
  "truncated": false
}
```

### `GET /tasks/{task_id}`

获取后台任务的状态。

### `POST /file/backup`

在编辑文件之前创建文件的管理备份。

### `GET /system/info?server=server-01`

目标代理的 CPU、RAM、磁盘和正常运行时间。

完整模式：将 `https://became.bezrabotnyi.com/api.json` 导入到您的客户端。

---

## MCP 端点 (`/mcp`)

OAuth bearer 认证。MCP 远程 SSE（可流式传输的 HTTP）。

MCP 客户端（Claude Desktop、Codex、OpenCode）连接到此处。中心将 shellmcp 工具作为 MCP 工具暴露：

- `shell_exec` — 运行 shell 命令
- `file_read` — 读取文件
- `file_write` — 写入文件（带备份）
- `file_backup` — 创建管理备份
- `systemd_status` / `systemd_start` / `systemd_stop` / `systemd_restart`
- `system_info` — CPU/RAM/磁盘/正常运行时间
- `system_health` — 快速健康检查
- `dir` — 列出目录

参见 [适配器 → MCP 客户端](./ADAPTERS.md#1-mcp-client) 设置。

---

## 代理端点 (shellmcp)

这些由中心调用，而不是直接由 AI 调用。Bearer `SHELLMCP_TOKEN`。

| 端点 | 方法 | 用途 |
|----------|--------|---------|
| `/exec` | POST | 运行 shell 命令 |
| `/file` | GET/POST | 读取/写入文件 |
| `/dir` | GET | 列出目录 |
| `/systemd/{action}` | POST | status/start/stop/restart/enable |
| `/system/info` | GET | CPU/RAM/磁盘/正常运行时间 |
| `/system/health` | GET | 健康检查 |
| `/heartbeat` | POST | 向中心注册（由代理 → 中心调用） |

---

## OAuth 端点

| 端点 | 方法 | 用途 |
|----------|--------|---------|
| `/oauth/authorize` | GET/POST | 授权端点 |
| `/oauth/token` | POST | 令牌端点 |
| `/.well-known/oauth-authorization-server` | GET | OAuth 服务器元数据 |

参见 [配置 → OAuth](./CONFIGURATION.md#oauth)。

---

## OpenAPI 模式

- `GET /api.json` — JSON 模式（用于自定义 GPT / Open WebUI 导入）
- `GET /openapi.yaml` — YAML 模式

这些是公开的（无认证），因此自定义 GPT 可以通过 URL 导入。

## 后台任务

长时间运行的命令返回 `task_id` 而不是阻塞：

```json
{ "task_id": "abc123", "status": "running" }
```

使用 `GET /tasks/abc123` 轮询，直到 `status: completed`。AI 会自动执行此操作。

## 输出截断

过长的 stdout/stderr 会被分块。响应包含：

```json
{
  "stdout": "...前 1MB...",
  "truncated": true,
  "spilled_path": "/tmp/spilled.stdout",
  "preview_head": "...",
  "preview_tail": "..."
}
```

AI 可以通过后续调用按需读取更多内容。这节省了令牌——AI 只读取其回答所需的。

## 每个服务器的 MCP 和 OpenAPI 操作代理

GPTAdmin 通过经过身份验证的每个服务器的专用路由暴露每个已注册的 MCP 服务器。用 `GET /mcp-relay/servers` 中的 `meta.public_mcp_slug` 替换 `{slug}`。

| 方法 | 路径 | 用途 |
|--------|------|---------|
| `GET` / `POST` | `/server/{slug}/mcp` | 用于单个服务器的 MCP 兼容端点 |
| `GET` | `/server/{slug}/card` | 服务器发现卡片 |
| `GET` | `/server/{slug}/health` | 服务器健康状态 |
| `GET` | `/server/{slug}/actions/openapi.yaml` | 为自定义 GPT 操作生成的 OpenAPI 模式 |
| `GET` | `/server/{slug}/actions/openapi.json` | 与 JSON 相同的模式 |
| `POST` | `/server/{slug}/actions/tools/{tool_name}` | 将 OpenAPI 操作调用代理到单个 MCP 工具 |

操作模式是从选定 MCP 服务器的 `tools/list` 生成的。每个操作请求体都是 MCP 工具的 `inputSchema`。操作调用响应包装了上游的 MCP 结果：

```json
{
  "server_id": "OpenMemory",
  "tool_name": "openmemory_query",
  "status": "completed",
  "response": {"content": []}
}
```

参见 [MCP 代理中继](./MCP_PROXY_RELAY.md) 获取示例。
