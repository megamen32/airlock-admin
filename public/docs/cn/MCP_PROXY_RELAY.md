# GPT‑Админ 作为安全的 MCP 代理/中继

GPT‑Админ 可以通过两个公开的、带鉴权的兼容层来暴露每个已注册的 MCP server：

1. **MCP 兼容端点** —— 给能讲 MCP over HTTP 的客户端用，例如 Claude Desktop、Codex、OpenCode、Cursor 类工具。
2. **OpenAPI Action 端点** —— 给 ChatGPT Custom GPT 和其他 OpenAPI-action 客户端用。

这样真实的 MCP server 可以放在私有机器后面（NAT、stdio、内部隧道），而对外的 AI 客户端只需要面对一个 HTTPS 入口，由 GPT‑Админ 统一负责鉴权、审计日志、路由、队列和输出处理。

## 为什么要在前面放 GPT‑Админ

- 一个公共 HTTPS 入口，而不是把一堆 MCP server 直接暴露出去。
- 网关层的 Bearer/OAuth 鉴权。
- 每个 server 拥有稳定的 URL 和 slug。
- 同时支持 stdio MCP、远程 MCP、shell 连接器和 GPT‑Админ 内部 hub 工具。
- OpenAPI schema 是从 upstream MCP server 的 `tools/list` 响应动态生成的，所以 Action schema 始终跟真实工具集一致。
- 调用只会代理到选中的那一个 MCP server；Custom GPT 看到的可以只是 OpenMemory、只是 FileShare，或者别的某个单一 server，而不是整个 GPT‑Админ 中继的全部工具。

## URL 布局

假设你的 hub 公开发布在：

```text
https://hub.example.com
```

每个已注册的 MCP server 都会拿到一个 slug，在 `/admin` 和 `GET /mcp-relay/servers` 的 `meta.public_mcp_slug` 字段里能看到。

| 用途 | URL |
|------|-----|
| MCP 兼容端点 | `https://hub.example.com/server/{slug}/mcp` |
| server 卡片 / 发现 | `https://hub.example.com/server/{slug}/card` |
| 健康检查 | `https://hub.example.com/server/{slug}/health` |
| OpenAPI Action（YAML） | `https://hub.example.com/server/{slug}/actions/openapi.yaml` |
| OpenAPI Action（JSON） | `https://hub.example.com/server/{slug}/actions/openapi.json` |
| OpenAPI Action 工具调用 | `POST https://hub.example.com/server/{slug}/actions/tools/{tool_name}` |

老的 `/agent/{slug}/...` 路由保留为兼容别名，新客户端请使用 `/server/{slug}/...`。

## 示例：只把 OpenMemory 暴露给一个 Custom GPT

在 GPT 编辑器导入 Action 时，使用这个 schema URL：

```text
https://hub.example.com/server/openmemory/actions/openapi.yaml
```

在鉴权部分选 API key / bearer token，并填入你的 hub 接受的 GPT‑Админ token。

生成的 schema 会包含 OpenMemory 的工具，例如：

```text
openmemory_query
openmemory_store_project
openmemory_store
openmemory_list
```

除非选中的 server 是内部 `hub`，否则不会包含 GPT‑Админ 中继自己的工具（比如 `call_mcp_tool`）。

一次直接的 Action 调用长这样：

```bash
curl -fsS \
  -H 'Authorization: Bearer <GPTADMIN_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{"query":"deployment notes","project_id":"gptadmin","k":3}' \
  https://hub.example.com/server/openmemory/actions/tools/openmemory_query
```

响应结构：

```json
{
  "server_id": "OpenMemory",
  "tool_name": "openmemory_query",
  "status": "completed",
  "response": {
    "content": [
      {"type": "text", "text": "..."}
    ]
  }
}
```

## 示例：连一个 MCP 兼容客户端

如果客户端本来就讲 MCP，使用 per-server MCP URL：

```text
https://hub.example.com/server/openmemory/mcp
```

这个端点接受标准的 MCP JSON-RPC 方法，例如：

```text
initialize
tools/list
tools/call
resources/list
resources/read
prompts/list
prompts/get
```

要使用整个 GPT‑Админ hub 的能力：

```text
https://hub.example.com/server/hub/mcp
```

要只用某一个 upstream server，用它的 slug：

```text
https://hub.example.com/server/fileshare/mcp
https://hub.example.com/server/chromedevtools-roomhacker-server-100/mcp
https://hub.example.com/server/openmemory/mcp
```

## schema 是怎么生成的

当客户端请求：

```text
GET /server/{slug}/actions/openapi.yaml
```

GPT‑Админ 把 `{slug}` 解析到唯一一个已注册的 MCP server，调用 `tools/list`，把每个 MCP 工具描述符转换成一条 OpenAPI 的 `POST /server/{slug}/actions/tools/{tool_name}` 操作。MCP 的 `inputSchema` 直接变成 OpenAPI 请求体的 schema。

这意味着：

- 新增一个 MCP 工具会立刻反映到 OpenAPI Action schema；
- 删除一个工具会把它从生成的 schema 中移除；
- 每个 server 的 Custom GPT 都保持小而精；
- 用户不需要手写庞大的 OpenAPI 文件。

## 安全注意事项

- 不要把裸的 stdio MCP server 直接暴露到公网，请把 GPT‑Админ 放在前面。
- 公网 hub 请用 HTTPS。
- 使用足够强的 Bearer/OAuth 凭据；如果凭据分享给 Custom GPT 或 MCP 客户端，请定期轮换。
- 当一个 GPT 只需要一种能力时，优先给它 per-server 的 OpenAPI schema。
- 只有在客户端真的需要完整的中继/管理面时才用 `/server/hub/mcp` 或 GPT‑Админ 的 Apps SDK。

## 另见

- [API Reference](./API_REFERENCE.md)
- [Integrations](./INTEGRATIONS.md)
- [Security](./SECURITY_DOCS.md)
- [Hub](./HUB.md)