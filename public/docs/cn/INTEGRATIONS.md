# 集成

把 AI 客户端连到你的 GPTAdmin hub 有四种方式。

| # | 适配器 | 最适合 | 鉴权 |
|---|--------|--------|------|
| 1 | [OpenAI Action](#1-openai-action-custom-gpt) | ChatGPT（Plus/Team/Desktop）的 Custom GPT | Bearer `CTL_TOKEN` 或 OAuth |
| 2 | [MCP remote](#2-mcp-remote-streamable-http) | Claude Desktop / Codex / OpenCode / Mavis | Bearer JWT（OAuth） |
| 3 | [OAuth 握手](#3-oauth-handshake) | 给 #1 和 #2 提供凭证的鉴权流程 | PKCE S256 |
| 4 | [浏览器扩展](#4-browser-extension) | DeepSeek / Qwen /  Alice / 任何网页聊天 | `Bridge Key` = `CTL_TOKEN` |

这四种方式最终都连到同一个 hub、同样的工具集。详见 [ADAPTERS.md](./ADAPTERS.md)（旧的三个分类总览）和 [GPTADMIN_INSTRUCTIONS.md]()（给 AI 代理的只读参考）。

---

## 1. OpenAI Action（Custom GPT）

**何时使用。** 只适用于 ChatGPT 家族客户端：`chat.openai.com`、ChatGPT Desktop、Plus/Team。任何能导入 OpenAPI 3.x schema 的工具都行。当你想要一个能调用 hub、但又不受 Codex 那样的每小时工具调用配额限制的 Custom GPT 时，这是首选。

**协议。** REST + OpenAPI 3.1、Bearer 鉴权，跑在 `/mcp-relay/*` 系列（`list_mcp_agents`、`list_mcp_tools`、`call_mcp_tool`、`get_mcp_job`、`resources/list`、`resources/read`）。

**Schema URL。** `https://<your-hub>/actions/openapi.yaml` —— 官方在线 serving 的规范。仓库里也带一份 `public/openapi.json`（和上面的规范同义），方便本地 `curl`。

### 连接步骤

1. 打开 `https://chatgpt.com/gpts/editor` → **Create** 或编辑一个 GPT。
2. **Configure → Actions → Create new action。**
3. **Import OpenAPI by URL** → `https://<your-hub>/actions/openapi.yaml`。
4. **Authentication → API key → Bearer** → 粘贴 `CTL_TOKEN`（在 hub 主机上的 `config/gptadmin.env`）。
5. **Save。** Custom GPT 现在把每个操作暴露为一个工具。

### 例子

```bash
curl -sS -X POST https://<your-hub>/mcp-relay/list_mcp_agents \
  -H "Authorization: Bearer $CTL_TOKEN" \
  -H "Content-Type: application/json" -d '{}'
```

```text
POST /mcp-relay/call_mcp_tool
{
  "agent_id": "shell:roomhacker-server-100",
  "tool_name": "shell_exec",
  "arguments": { "cmd": "uptime" }
}
```

> **Bearer vs OAuth。** 现在 hub 在 `/mcp-relay/*` 上同时接受 Bearer `CTL_TOKEN`，方便快速上手。生产环境（每个客户端独立 scope、轮换、审计、撤销）请把鉴权块切换到 OAuth（[§3](#3-oauth-handshake)）。接口一样，鉴权更强。

### 排错

- **"Action not found"** —— schema URL 在 ChatGPT 那边无法访问。hub 必须在公开的 HTTPS 上（Cloudflare Tunnel、公网域名或 `become.bezrabotnyi.com` 那种镜像）；`http://localhost` 不行。
- **每次调用都 401** —— `CTL_TOKEN` 不对，或者从剪贴板复制时夹带了空白 / 换行。
- **schema 导入了，但工具不显示** —— GPT 编辑器对 schema 缓存得很激进。重新导入。
- **细节参考** —— 看 `docs/CHATGPT_ACTION.md`（旧版）和 `public/openapi.json`，里面有完整操作列表。

---

## 2. MCP remote（Streamable HTTP）

**何时使用。** 任何支持 MCP 的客户端 —— Claude Desktop、Codex、OpenCode、Mavis、Cherry Studio、现代 AI IDE/CLI。2026 年 AI 工具链的主线适配器。

**协议。** MCP over Streamable HTTP，JSON-RPC 2.0。

**端点。** `POST https://<your-hub>/mcp`（同时也支持 `GET` 用于 `initialize` 发现）。

**鉴权。** Bearer JWT，hub 用 `OAUTH_CLIENT_SECRET` 通过 HS256 签名，有效期 12 h，`iss = PUBLIC_ORIGIN`，`aud = MCP_RESOURCE`。通过 [§3](#3-oauth-handshake) 获取。

> `/mcp` 只接受 OAuth 颁发的 JWT；`CTL_TOKEN` 用于 REST/admin API。本地例外：hub 主机本地的 `http://localhost:<port>/mcp`，hub 会放宽鉴权（方便 `claude_desktop_config.json` 调试）。

### 连接步骤

#### Claude Desktop —— `claude_desktop_config.json`

```json
{
  "mcpServers": {
    "gptadmin": {
      "type": "http",
      "url": "https://<your-hub>/mcp",
      "headers": {
        "Authorization": "Bearer  <paste JWT here>"
      }
    }
  }
}
```

重启 Claude Desktop。`gptadmin` 服务器出现在工具列表里，包含 `list_mcp_agents`、`list_mcp_tools`、`call_mcp_tool`、`get_mcp_job`、`resources/list`、`resources/read`。

#### Mavis

```bash
mavis mcp add gptadmin '{"url":"https://<your-hub>/mcp"}'
mavis mcp auth login gptadmin     # 打开浏览器 → 跑 OAuth 流程 → 写入 JWT
```

#### Codex / OpenCode / 其他

形态一样：HTTP 类型的 MCP server 指向 `https://<your-hub>/mcp`，并配 `Authorization: Bearer <JWT>`。

### OAuth 发现

现代 MCP 客户端会自动发现鉴权服务器：

```bash
curl -sS https://<your-hub>/.well-known/oauth-authorization-server
```

```json
{
  "issuer": "https://<your-hub>",
  "authorization_endpoint": "https://<your-hub>/authorize",
  "token_endpoint": "https://<your-hub>/token",
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code"],
  "code_challenge_methods_supported": ["S256"],
  "token_endpoint_auth_methods_supported": ["none"],
  "client_id_metadata_document_supported": true,
  "registration_endpoint": "https://<your-hub>/register",
  "scopes_supported": ["gptadmin.read", "gptadmin.exec"]
}
```

支持 [RFC 8414](https://www.rfc-editor.org/rfc/rfc8414) / [RFC 9728](https://www.rfc-editor.org/rfc/rfc9728) 的客户端会拉这份元数据，在 `/register` 注册，跑 PKCE `authorize → callback → token`，然后展示 hub 自己的同意页。

### 排错

- **每次请求都 401** —— JWT 过期（12 h TTL），或者签名用的 `OAUTH_CLIENT_SECRET` 不对。重跑 OAuth 流程。
- **"Transport not supported"** —— 客户端只支持 stdio。用 `mcp-remote` 包一层（`npx -y mcp-remote https://<your-hub>/mcp`），或者换一个适配器。
- **流式调用中途卡住** —— 公司代理在缓冲 SSE / chunked 响应。强制客户端走轮询模式，或者用一个不缓冲的隧道。

---

## 3. OAuth 握手

**何时使用。** 任何时候 —— 你（或一个 MCP 客户端）需要给 `/mcp`（适配器 #2）拿一个 Bearer JWT，或者想把 OpenAI Action 的鉴权块从 `CTL_TOKEN` 切换到 OAuth（适配器 #1）。**握手本身不是客户端适配器**，它是给前两个**喂凭证**的流程。

**授权类型。** `authorization_code` 配合 PKCE。**仅支持 `S256`** —— 提交明文 verifier 会被拒绝。

**授权范围。**

- `gptadmin.read` —— 列出 server / 工具、读取资源、读取任务。
- `gptadmin.exec` —— 调用工具（`call_mcp_tool`）、把任务排进队列。

hub 的 `/authorize` 页面会列出请求的 scope，用户输入管理员密码来同意。

### 端点

| 端点 | 方法 | 用途 |
|------|------|------|
| `/.well-known/oauth-authorization-server` | `GET` | RFC 8414 issuer 元数据。 |
| `/.well-known/oauth-protected-resource` | `GET` | RFC 9728 资源元数据。 |
| `/register` | `POST` | 动态客户端注册 —— 返回 `client_id = "chatgpt-dynamic"`。 |
| `/authorize` | `GET` | 渲染同意页（在浏览器里打开）。 |
| `/authorize` | `POST` | 提交同意表单（`password` = 管理员密码）。 |
| `/token` | `POST` | 用 `code` + `code_verifier` 换 JWT `access_token`。 |

### 流程

1. 客户端生成 `code_verifier`（随机 43–128 字符）和 `code_challenge = BASE64URL(SHA256(verifier))`。
2. 客户端 `POST /register` 带 `redirect_uris`（例如 `https://chatgpt.com/connector/oauth/...`，或者本地 CLI 客户端的 `http://127.0.0.1:<port>/callback`） → 收到 `client_id`。
3. 浏览器打开 `GET /authorize?response_type=code&client_id=...&redirect_uri=...&code_challenge=...&code_challenge_method=S256&resource=<hub>&scope=gptadmin.read+gptadmin.exec`。
4. 用户看一眼 scope → 输入管理员密码 → 提交。
5. Hub 302 跳到 `redirect_uri?code=...&state=...`。
6. 客户端 `POST /token` 带 `code`、`code_verifier`、`redirect_uri`、`client_id` → 拿到 `access_token`（JWT） → 存进 MCP 配置。
7. 之后每次 `/mcp` 调用都带上 `Authorization: Bearer <access_token>`。

### JWT 结构

```json
{
  "sub": "<user-entered name, optional>",
  "client_id": "chatgpt-dynamic",
  "scope": "gptadmin.read gptadmin.exec",
  "iss": "<PUBLIC_ORIGIN>",
  "aud": "<MCP_RESOURCE>",
  "iat": 1719820000,
  "exp": 1719863200
}
```

> **redirect_uri 白名单。** `/authorize` 默认只接受 `https://chatgpt.com/.../connector/oauth/...` 和 `*.chatgpt.com`。其他客户端需要在 Go hub OAuth 的 redirect 白名单里加上。

### 排错

- **`invalid_request: invalid redirect_uri`** —— 不在白名单里。用规范的 `https://chatgpt.com/connector/oauth/...`，或者放宽 hub 上的白名单。
- **`invalid_grant` on `/token`** —— `code_verifier` 跟 `code_challenge` 对不上，或超过了 5 分钟的 code 窗口。重跑 `/authorize`。
- **每次调用都 "expired"** —— JWT 的 TTL 是 12 h。大部分 MCP 客户端会默默重跑流程。
- **一键撤销所有凭证** —— 在 `https://<your-hub>/admin` → **Security → Revoke all** 重置 `OAUTH_CLIENT_SECRET`，让所有在线 JWT 全部失效。

---

## 4. 浏览器扩展

**何时使用。** 不原生支持 MCP 的免费网页聊天 AI —— DeepSeek、Qwen、通义千问、Yandex Alice、ChatGPT（免费版）。扩展把"任何网页聊天"变成 gptadmin 客户端：拦截 AI 输出里的 ` ```mcp ` 代码块，POST 到你的 hub，把结果粘贴回去。

**产物。** `apps/chatgpt-admin-app/` —— 一个 Tampermonkey / Userscripts 用户脚本；发布版镜像在 `public/mcp-bridge.user.js`。

### 连接步骤

1. **安装用户脚本管理器：**
   - 桌面 Chrome / Edge / Brave → [Tampermonkey](https://www.tampermonkey.net/)。
   - iPhone / iPad → Safari + [Userscripts](https://apps.apple.com/app/userscripts/id1463298887) app；在 Safari → 扩展里启用。
   - Android → 从 Google Play 装 Firefox + 从 [tampermonkey.net](https://www.tampermonkey.net/) 装 Tampermonkey。
2. **安装脚本** —— 打开 `https://<your-hub>/mcp-bridge.user.js`（或者从 `apps/chatgpt-admin-app/` 直接加载文件）。Tampermonkey 读到 `@userscript` 元数据块 → **Install**。
3. **配置：** 按 <kbd>Alt</kbd>+<kbd>K</kbd>（或者右下角的图标按钮）：
   - **Bridge URL** —— `https://<your-hub>`（不带末尾斜杠）。
   - **Bridge Key** —— 你的 `CTL_TOKEN`（和 §1 同一个）。

### 工作方式

在网页聊天界面加两个按钮：

- **MCP All**（`Alt+M`）—— 把每个 agent 及其工具的简述插到聊天输入框，并复制同样的提示词到剪贴板。
- **MCP** —— 打开一个面板，选定某个具体 agent，里面有详细的工具说明。

当 AI 用一个 ` ```mcp ` 围栏的 JSON 块回复时，脚本会高亮它，把它 POST 到 `<Bridge URL>/mcp-relay/call_mcp_tool`，然后把 block 替换成 hub 返回的结果。

> 如果某个站点用了自定义编辑器导致自动插入失败，提示词始终在剪贴板里 —— <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>V</kbd> 粘贴。

### 支持的站点（来自 `@match` 指令）

| 站点 | 状态 |
|------|------|
| `chatgpt.com` | 完整支持 |
| `chat.deepseek.com` | 完整支持 |
| `tongyi.aliyun.com` | 完整支持 |
| `qwenlm.github.io`、`chat.qwenlm.ai`、`chat.qwen.ai` | 完整支持 |
| `ya.ru`、`yandex.ru`、`alice.yandex.ru`、`chat.yandex.ru` | 完整支持 |

要加新站点，就在 `apps/chatgpt-admin-app/public/userscript-header`（或者已发布的 `mcp-bridge.user.js`）里追加一行 `@match`，然后重装。

### 排错

- **按钮不出现** —— 用户脚本管理器没在该站点启用，或者脚本崩了（Tampermonkey 面板 → 脚本 → Errors）。
- **从 bridge 返回 401** —— `CTL_TOKEN` 不对，或者 hub 在没隧道、只有 localhost 的状态下（hub 只在 `127.0.0.1` 上放宽鉴权）。
- **没有自动插入** —— AI 没有用 ` ```mcp ` 围栏输出代码块。重新提示它：*"respond with the call inside a fenced block tagged `mcp`."* 备用方案：从剪贴板粘贴。
- **`GM_xmlhttpRequest` 被拦截** —— Tampermonkey 脚本设置：把 **Run at** 设成 `document-idle`，确保元数据块里有 `@grant GM_xmlhttpRequest`。

---

## 跨适配器排错

- **`CTL_TOKEN` 在哪？** 在 hub 主机上：`grep ^CTL_TOKEN config/gptadmin.env`。修改文件后 `systemctl restart gptadmin-hub` 即可轮换。
- **ChatGPT / Claude / 我的客户端连不上 hub** —— 必须是公网 HTTPS。localhost 和 LAN IP 只能手动测试，ChatGPT Actions 和远端 MCP 客户端都不行。用 Cloudflare Tunnel（见 [TUNNELS_DOCS.md](./TUNNELS_DOCS.md)）或带真域名的反向代理。
- **MCP 连上了，但每个工具都返回 "unauthorized"** —— 在浏览器里打开 `https://<your-hub>/.well-known/oauth-authorization-server`；如果 404，说明 hub 版本里 OAuth 路由没启用。检查 `apps/chatgpt-admin-app/` 是否部署了（或者 Go hub 的 OAuth handler 是启用状态）。
- **Custom GPT 看不到 Action** —— 确认 schema URL 是公开的：从外网 `curl -I https://<your-hub>/actions/openapi.yaml`。如果 4xx/5xx，隧道 / DNS 没指向 hub。
- **浏览器扩展没有注入** —— 用户脚本管理器权限：Tampermonkey Dashboard 里 "Allow user scripts" 必须打开；iOS Safari → Settings → Safari → Extensions → Userscripts → Allow；Android Firefox → 给当前站点启用该扩展。
- **OAuth 同意页 500** —— `config/gptadmin.env` 里的 `PUBLIC_ORIGIN` 和客户端实际访问的 URL 不一致。把它设成客户端实际用的 origin（scheme + host + port）完全一致。
- **按客户端快速选择。** ChatGPT（Plus/Team/Custom GPT）→ [§1](#1-openai-action-custom-gpt)。Claude Desktop / Codex / OpenCode / Mavis → [§2](#2-mcp-remote-streamable-http)。免费网页聊天（DeepSeek / Qwen / Alice / ChatGPT 免费版）→ [§4](#4-browser-extension)。还是卡住 → [FAQ](./FAQ.md)、[SECURITY_DOCS.md](./SECURITY_DOCS.md)，或者 `https://<your-hub>/admin` 上各小节的帮助面板。

## 安全 MCP 代理/中继

对于单一用途的集成，单独暴露一个已注册的 MCP server，而不是把整个 GPTAdmin 中继都开出来。每个 server 都有：

```text
/server/{slug}/mcp
/server/{slug}/actions/openapi.yaml
/server/{slug}/actions/tools/{tool_name}
```

如果 Custom GPT 只该访问 OpenMemory，就用 `/server/openmemory/actions/openapi.yaml`。如果 MCP 兼容客户端只该访问 OpenMemory，就用 `/server/openmemory/mcp`。OpenAPI schema 是从所选 server 的 `tools/list` 生成的，所以它会跟着实际的 MCP 工具走。

见 [MCP Proxy Relay](./MCP_PROXY_RELAY.md)。