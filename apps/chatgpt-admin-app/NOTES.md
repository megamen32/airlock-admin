# ChatGPT Admin MCP App Notes

Current state: working MCP Apps SDK connector for ChatGPT.

Architecture now:

```text
ChatGPT
  -> OAuth + MCP
  -> Node MCP adapter at /opt/chatgpt-admin-app
  -> gptadmin_hub on http://127.0.0.1:9001
  -> shellmcp servers
```

Important decisions:

- MCP adapter should stay thin.
- Source of truth for servers, alive/offline state, tokens and routing is `gptadmin_hub`.
- MCP tools translate to gptadmin_hub APIs:
  - `list_servers` -> `GET /servers`
  - `exec_command` -> `POST /bulk/exec`
- Widget is served from a separate domain with CSP:
  - `https://widgets-gptadmin.bezrabotnyi.com/admin.html`
- MCP endpoint:
  - `https://gptadminmcp.bezrabotnyi.com/mcp`
- OAuth is enabled and uses ChatGPT dynamic redirect handling.

Next preferred refactor:

Move MCP/OAuth directly into Python `gptadmin_hub.py` so gptadmin_hub itself becomes the MCP server. That should reduce dependencies and simplify deployment on Ubuntu, macOS, Home Assistant and small devices.
