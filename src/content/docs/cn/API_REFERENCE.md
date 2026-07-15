# API 参考

集线器公开的 REST + MCP 端点。

## 授权快速参考

|端点 |授权 |
|----------|------|
| `GET /admin` |基本 (`CTL_TOKEN`) |
| `GET /admin/api/*` |持票人 `CTL_TOKEN` |
| `POST /mcp` | OAuth 承载 |
| `POST /heartbeat` |持票人 `SHELLMCP_TOKEN` |
| `GET /servers` |持票人 `CTL_TOKEN` |
| `GET /api.json` |无 |
| `GET /openapi.yaml` |无 |
| `POST /authorize` | `ADMIN_PASSWORD` 表格 |
| `POST /oauth/token` |客户凭证|

请参阅[配置→验证模型](./CONFIGURATION.md#auth-model)。

---

## 管理API (`/admin/api/*`)

持有者身份验证为 `CTL_TOKEN`。由 Web 面板和自定义 GPT 操作使用。

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

响应（如果太长则被截断以保存标记）：

```json
{
  "stdout": "● nginx.service - The nginx HTTP server...",
  "stderr": "",
  "exit_code": 0,
  "truncated": false
}
```

命令通常以 ShellMCP 代理配置的非 root 用户身份运行。套装
`run_as_user: "root"` 仅用于有意的特权操作；一个根
没有配置默认用户的 ShellMCP 会拒绝普通命令。

### `GET /tasks/{task_id}`

获取后台任务的状态。

### `POST /file/backup`

在编辑之前创建文件的托管备份。

### `GET /system/info?server=server-01`

目标代理的 CPU、RAM、磁盘、正常运行时间。

完整架构：将 `https://became.bezrabotnyi.com/api.json` 导入到您的客户端。

---

## MCP 端点 (`/mcp`)

OAuth 承载身份验证。 MCP 远程 SSE（流式 HTTP）。

MCP 客户端（Claude Desktop、Codex、OpenCode）连接至此处。集线器暴露
shellmcp 工具作为 MCP 工具：

- `shell_exec` — 运行 shell 命令
- `file_read` — 读取文件
- `file_write` — 写入文件（带备份）
- `file_backup` — 创建托管备份
- `systemd_status` / `systemd_start` / `systemd_stop` / `systemd_restart`
- `system_info` — CPU/RAM/磁盘/正常运行时间
- `system_health` — 快速健康检查
- `dir` — 列出目录

请参阅[适配器 → MCP 客户端](./ADAPTERS.md#1-mcp-client) 设置。

---

## 代理端点 (shellmcp)

这些由集线器调用，而不是直接由人工智能调用。持有者 `SHELLMCP_TOKEN`。

|端点|方法|目的|
|----------|--------|---------|
| `/exec` |发布 |运行 shell 命令 |
| `/file` |获取/发布 |读/写文件 |
| `/dir` |获取 |列出目录 |
| `/systemd/{action}` |发布 |状态/启动/停止/重新启动/启用 |
| `/system/info` |获取 | CPU/RAM/磁盘/正常运行时间 |
| `/system/health` |获取 |健康检查|
| `/heartbeat` |发布 |向集线器注册（由代理→集线器调用）|

---

## OAuth 端点

|端点 |方法|目的|
|----------|--------|---------|
| `/oauth/authorize` |获取/发布 |授权端点 |
| `/oauth/token` |发布 |令牌端点 |
| `/.well-known/oauth-authorization-server` |获取 | OAuth 服务器元数据 |

请参阅[配置 → OAuth](./CONFIGURATION.md#oauth)。

---

## OpenAPI 架构

- `GET /api.json` — JSON 架构（用于自定义 GPT/开放 WebUI 导入）
- `GET /openapi.yaml` — YAML 架构

这些是公共的（无身份验证），因此自定义 GPT 可以通过 URL 导入。

## 后台任务

长时间运行的命令返回 `task_id` 而不是阻塞：

```json
{ "task_id": "abc123", "status": "running" }
```

使用 `GET /tasks/abc123` 进行轮询，直到 `status: completed`。AI 会执行此操作
自动。

## 输出截断

长的 stdout/stderr 被分块。响应内容包括：

```json
{
  "stdout": "...first 1MB...",
  "truncated": true,
  "spilled_path": "/tmp/spilled.stdout",
  "preview_head": "...",
  "preview_tail": "..."
}
```

人工智能可以通过后续通话按需阅读更多内容。这节省了代币——
人工智能只读取它需要回答的内容。

## 中继目标合约

对于集线器中继，请在 `listMcpTools` 之前拨打 `listMcpServers` 或
`callMcpTool`，然后将返回的显式服务器id传递为`target`。有
没有 `default` 目标，`target: "default"` 返回 `400`。


## 每服务器 MCP 和 OpenAPI Action 代理

GPTAdmin 通过经过身份验证的每服务器路由公开每个注册的 MCP 服务器。将 `{slug}` 替换为 `GET /mcp-relay/servers` 中的 `meta.public_mcp_slug`。|方法|路径|目的|
|--------|------|---------|
| `GET` / `POST` | `/server/{slug}/mcp` |一台服务器的 MCP 兼容端点 |
| `GET` | `/server/{slug}/card` |服务器发现卡 |
| `GET` | `/server/{slug}/health` |服务器健康状况 |
| `GET` | `/server/{slug}/actions/openapi.yaml` |为自定义 GPT 操作生成 OpenAPI 架构 |
| `GET` | `/server/{slug}/actions/openapi.json` |与 JSON 相同的架构 |
| `POST` | `/server/{slug}/actions/tools/{tool_name}` |将 OpenAPI 操作调用代理到一个 MCP 工具 |

Action 架构是根据所选 MCP 服务器的 `tools/list` 生成的。每个操作请求正文是 MCP 工具 `inputSchema`。Action 调用响应包装上游 MCP 结果：

```json
{
  "server_id": "OpenMemory",
  "tool_name": "openmemory_query",
  "status": "completed",
  "response": {"content": []}
}
```

有关示例，请参阅 [MCP 代理中继](./MCP_PROXY_RELAY.md)]。
