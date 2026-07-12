# 配置

完整的环境变量参考、认证模型和 OAuth 设置。

## Hub 环境变量 (`go-hub/`)

### 认证

| 变量 | 是否必需 | 默认值 | 用途 |
|-----|----------|---------|---------|
| `CTL_TOKEN` | **是** | — | 管理 API + Web 面板的 Bearer 令牌。使用 `openssl rand -hex 32` 生成。 |
| `ADMIN_PASSWORD` | 用于 OAuth | — | `/authorize` HTML 表单的密码（OAuth 流程）。 |
| `OAUTH_CLIENT_SECRET` | 用于 `/mcp` | — | 签名 OAuth bearer 令牌。使用 `openssl rand -hex 32` 生成。 |
| `PUBLIC_ORIGIN` | 推荐 | — | 公共基础 URL（例如 `https://your-hub.bezrabotnyi.com`）。用于 OAuth + OpenAPI。 |
| `MCP_RESOURCE` | 推荐 | `$PUBLIC_ORIGIN` | MCP 资源标识符。 |

### 网络

| 变量 | 默认值 | 用途 |
|-----|---------|---------|
| `HUB_PORT` | 25900 | 监听端口 |
| `HUB_HOST` | 0.0.0.0 | 监听主机 |
| `CORS_ORIGINS` | `*` | 允许的 CORS 源（逗号分隔） |

### 行为

| 变量 | 默认值 | 用途 |
|-----|---------|---------|
| `EXEC_TIMEOUT` | 120 | 最大命令执行时间（秒） |
| `LOG_LIMIT_B` | 65536 | 每个 ShellMCP-agent 行内 stdout/stderr 尾部预算。较大的命令输出会溢出到磁盘；hub/client 响应预算单独配置。 |
| `HEARTBEAT_TIMEOUT` | 60 | 标记代理离线前的秒数 |
| `BACKGROUND_TASK_TTL` | 3600 | 保留已完成后台作业的时长（秒） |

## ShellMCP 环境变量

请参阅 [ShellMCP → 环境变量](./SHELLMCP.md#environment-variables)。

## 认证模型

GPT-Admin 有**三种**认证机制——它们是不同的，不要混淆。

### 1. `CTL_TOKEN` (Bearer)

- 用于：`/admin`, `/admin/api/*`, `/servers`, `/tasks/*`, artifact 端点
- 头部：`Authorization: Bearer <CTL_TOKEN>`
- 这是“管理员”令牌。Web 面板和自定义 GPT 操作使用它。

### 2. OAuth bearer (用于 `/mcp`)

- 用于：`/mcp` (MCP 远程 SSE)
- `/mcp` **不**直接接受 `CTL_TOKEN`。它需要一个由 hub 通过 `OAUTH_CLIENT_SECRET` 签名的 OAuth bearer 令牌。
- MCP 客户端（Claude Desktop, Codex）通过 OAuth 流程获取此令牌。

### 3. `ADMIN_PASSWORD` (表单)

- 用于：OAuth 流程中的 `/authorize` HTML 表单
- 这是人类用于授权 OAuth 客户端的内容。

### 4. `SHELLMCP_TOKEN` (agent → hub)

- 用于：`POST /heartbeat`（代理注册）
- 每个代理都有自己的 `SHELLMCP_TOKEN`——hub 在心跳时验证它。

## OAuth

hub 实现了与 OpenAI SDK OAuth 流程兼容的 OAuth 端点。

### 端点

| 端点 | 方法 | 用途 |
|----------|--------|---------|
| `/oauth/authorize` | GET/POST | 授权端点（显示 `ADMIN_PASSWORD` 表单） |
| `/oauth/token` | POST | 令牌端点（客户端凭证 / 授权码） |
| `/.well-known/oauth-authorization-server` | GET | OAuth 服务器元数据 |

### 设置

1. 在 hub 上设置 `OAUTH_CLIENT_SECRET`（使用 `openssl rand -hex 32` 生成）
2. 设置 `ADMIN_PASSWORD`（这是用户在授权表单中输入的）
3. 将 `PUBLIC_ORIGIN` 设置为您的公共 hub URL
4. MCP 客户端将通过 `/.well-known/...` 发现 OAuth 端点

### 在哪里设置密码

在 Web 面板中：`/admin` → **安全** → 设置 `ADMIN_PASSWORD` 并生成 `OAUTH_CLIENT_SECRET`。或者在启动 hub 时将其作为环境变量设置。

## 示例 .env

```bash
# 生成强值：
# CTL_TOKEN=$(openssl rand -hex 32)
# OAUTH_CLIENT_SECRET=$(openssl rand -hex 32)

CTL_TOKEN=generate-a-strong-random-token
ADMIN_PASSWORD=choose-a-strong-password
OAUTH_CLIENT_SECRET=$(openssl rand -hex 32)
PUBLIC_ORIGIN=https://your-hub.example.com
MCP_RESOURCE=https://your-hub.example.com
```

## 另请参阅

- [Hub](./HUB.md) — 这些变量配置了什么
- [Security](./SECURITY_DOCS.md) — 生产环境加固
- [API 参考](./API_REFERENCE.md) — 每个端点需要哪种认证
