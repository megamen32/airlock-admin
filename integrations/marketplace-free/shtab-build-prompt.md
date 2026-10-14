# Сводка задач — Shtab MCP

Current native source: apps/shtab. Official reference:
https://doc.shtab.app/kak-podkliuchit-chatgpt-claude-i-drugie-ii-assistenty-k-shtab-cherez-mcp/
Remote https://my.shtab.app/api/mcp/rpc; MCPAuthToken, bearer injection,
empty MCP.Access excludes raw tools. Only fixed typed team_tasks at AccessUser
calls count_tasks(completed=false,archived=false,group_by=status).
Live server1.28.1 protocol2025-03-26 returned structuredContent
{type:task_count,total:0,group_by:status,groups:[]}.
fetch_tasks requires view_id/user_id/datasource_id/search even though its schema
marks them optional, so no unscoped task-list call is exposed.
Native PostgreSQL Agent.DB cache15min and atomic persisted cap4provider calls/hour.
Free Shtab limit10calls/hour/company. Empty actual workspace is reported honestly;
missing/error/malformed responses are never substituted with fabricated zero.
Russian full HTML page and chat use the same service. No writes, owner profile,
raw MCP tools, arbitrary names, credentials in code or Airlock core changes.
Native source deployment compiles the app; native startup applies migrations; real
provider result and ordinary guest UI remain required for acceptance.
