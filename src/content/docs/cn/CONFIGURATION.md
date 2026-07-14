# 配置

完整的环境变量参考、身份验证模型和 OAuth 设置。

## 集线器环境变量 (`go-hub/`)

### 授权

|瓦尔 |必填|默认|目的|
|-----|----------|---------|---------|
| `CTL_TOKEN` | **是** | — |管理 API + Web 面板的不记名令牌。生成 `openssl rand -hex 32`。
| `ADMIN_PASSWORD` |对于 OAuth | — | `/authorize` HTML 表单（OAuth 流程）的密码。 |
| `OAUTH_CLIENT_SECRET` | `/mcp` | — |签署 OAuth 不记名令牌。生成 `openssl rand -hex 32`。
| `PUBLIC_ORIGIN` |推荐| — |公共基本 URL（例如 `https://your-hub.bezrabotnyi.com`）。用于 OAuth + OpenAPI。 |
| `MCP_RESOURCE` |推荐| `$PUBLIC_ORIGIN` | MCP 资源标识符。 |

### 网络

|瓦尔 |默认|目的|
|-----|---------|---------|
| `HUB_PORT` | 25900 | 25900监听端口 |
| `HUB_HOST` | 0.0.0.0 | 0.0.0.0听主持人|
| `CORS_ORIGINS` | `*` |允许的 CORS 来源（逗号分隔）|

### 行为

|瓦尔 |默认|目的|
|-----|---------|---------|
| `EXEC_TIMEOUT` | 300 | 300最大命令执行时间（秒）|
| `LOG_LIMIT_B` | 65536 |每 ShellMCP 代理内联 stdout/stderr 尾部预算。较大的命令输出被假脱机到磁盘；中心/客户端响应预算是单独配置的。 |
| `HEARTBEAT_TIMEOUT` | 60|座席被标记为离线前的秒数 |
| `BACKGROUND_TASK_TTL` | 3600 | 3600已完成的后台作业保留多长时间（秒） |

## ShellMCP 环境变量

请参阅[ShellMCP → 环境变量](./SHELLMCP.md#environment-variables)。
特别是，ShellMCP系统服务需要`SHELLMCP_DEFAULT_USER`来保持
非 root 的普通命令。安装程序将其设置为调用 sudo 用户。

## 授权模型

GPT‑Админ 有 **三种** 身份验证机制 - 它们是不同的，不要混淆。

### 1. `CTL_TOKEN`（持有人）

- 用于：`/admin`、`/admin/api/*`、`/servers`、`/tasks/*`、工件端点
- 标题：`Authorization: Bearer <CTL_TOKEN>`
- 这是“管理员”令牌。 Web 面板和自定义 GPT 操作使用它。

### 2. OAuth 持有者（`/mcp`）

- 用于：`/mcp`（MCP 远程 SSE）
- `/mcp` **不**直接接受 `CTL_TOKEN` 。它需要 OAuth 承载者
  中心通过 `OAUTH_CLIENT_SECRET` 签名的令牌。
- MCP 客户端（Claude Desktop、Codex）通过 OAuth 流获取此令牌。

### 3. `ADMIN_PASSWORD`（表格）

- 用于：OAuth 流程内 `/authorize` 处的 HTML 表单
- 这是人类授权 OAuth 客户端时键入的内容。

### 4. `SHELLMCP_TOKEN`（代理 → 中心）

- 用于：`POST /heartbeat`（代理注册）
- 每个代理都有自己的 `SHELLMCP_TOKEN` - 集线器根据心跳对其进行验证。

## OAuth

该中心实现与 OpenAI SDK OAuth 流程兼容的 OAuth 端点。

### 端点

|端点 |方法|目的|
|----------|--------|---------|
| `/oauth/authorize` |获取/发布 |授权端点（显示 `ADMIN_PASSWORD` 形式）|
| `/oauth/token` |发布 |令牌端点（客户端凭据/授权代码）|
| `/.well-known/oauth-authorization-server` |获取 | OAuth 服务器元数据 |

### 设置

1.在集线器上设置`OAUTH_CLIENT_SECRET`（用`openssl rand -hex 32`生成）
2.设置`ADMIN_PASSWORD`（这是用户在授权表单中输入的内容）
3. 将 `PUBLIC_ORIGIN` 设置为您的公共中心 URL
4. MCP 客户端将通过 `/.well-known/...` 发现 OAuth 端点

### 在哪里设置密码

在网页面板中：`/admin` → **安全** → 设置 `ADMIN_PASSWORD` 并生成
`OAUTH_CLIENT_SECRET`。或者在启动集线器时将它们设置为环境变量。

## 示例 `.env`

```bash
# Generate strong values:
# CTL_TOKEN=$(openssl rand -hex 32)
# OAUTH_CLIENT_SECRET=$(openssl rand -hex 32)

CTL_TOKEN=generate-a-strong-random-token
ADMIN_PASSWORD=choose-a-strong-password
OAUTH_CLIENT_SECRET=$(openssl rand -hex 32)
PUBLIC_ORIGIN=https://your-hub.example.com
MCP_RESOURCE=https://your-hub.example.com
```

## 另请参阅

- [Hub](./HUB.md) — 这些变量配置什么
- [Security](./SECURITY_DOCS.md) — 生产强化
- [API 参考](./API_REFERENCE.md) — 每个端点需要哪个身份验证
