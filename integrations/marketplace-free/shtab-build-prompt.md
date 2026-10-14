# Демо задач — Shtab MCP

Build Russian native Airlock app "Задачи команды — Shtab". Use current
/libs/agentsdk/REFERENCE.md and managed scaffold AGENTS.md; read in chunks
when tools truncate display. Do not change Airlock core or managed scaffold.

Official docs, read live:
https://doc.shtab.app/kak-podkliuchit-chatgpt-claude-i-drugie-ii-assistenty-k-shtab-cherez-mcp/
Remote Streamable HTTP MCP https://my.shtab.app/api/mcp/rpc,
Authorization: Bearer personal token. Free tier10requests/hour per company.
Operator already probed real MCP: server shtab1.28.1, protocol2025-03-26.
Native builder should also run go tool air mcp probe before RegisterMCP.
Register slug shtab with MCPAuthToken, bearer injection, EMPTY MCP.Access
so raw remote tools are excluded from guest chat. Credentials will be bound
by operator through Airlock; never include tokens in code/environment/logs.

Only expose a typed AccessUser tool team_tasks calling MCPHandle.CallTool
with FIXED tool name fetch_tasks and args {"limit":5,"offset":0,
"completed":false,"archived":false}. Tool input is empty. Do not accept
arbitrary MCP names, queries, project IDs, paths or write operations from guests.
Official live probe confirms fetch_tasks is readOnlyHint=true and supports
these exact parameters. Response is real MCP content; inspect its text/JSON
structure safely, return compact task titles/status/deadlines and source Shtab.
Never return user emails, tokens or raw debug data. Empty actual workspace
must display "В демо-команде пока нет незавершённых задач"; never invent tasks.

Use only native SDK PostgreSQL database and goose migration storage for persisted cache15minutes and
hard cap4external fetch_tasks calls/hour shared by all guests. Bound provider
timeout20s and content to64KiB. Missing credentials and401/403/429 return
short Russian setup/quota messages. No background polling, no mutation tools.
If a cache is used show its actual timestamp; do not pretend cached data is live.

Provide a small Russian mobile-friendly native HTML page with button
"Показать задачи" calling the same service as team_tasks, actual results,
cache time, and source. Chat uses team_tasks when asked "Покажи задачи команды".
No hardcoded/sample result data, no custom chat backend.

Record endpoint, auth, fixed read-only call, quotas and separate demo-workspace
requirement in NOTES.md. Run go tool air build and finish only after compilation.
