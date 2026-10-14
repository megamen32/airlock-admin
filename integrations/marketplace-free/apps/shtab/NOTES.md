# Shtab native read-only demo
Native RegisterMCP(shtab), MCPAuthToken, empty Access hides raw remote tools.
Only team_tasks and HTML POST/summary call fixed count_tasks(completed=false,archived=false,group_by=status).
Official docs: https://doc.shtab.app/kak-podkliuchit-chatgpt-claude-i-drugie-ii-assistenty-k-shtab-cherez-mcp/
Streamable HTTP https://my.shtab.app/api/mcp/rpc; Bearer encrypted native resource.
Live verified structuredContent type task_count/total/groups on14Oct2026; provider returned total0.
Free Shtab quota10calls/hour/team; local persisted cap4/hour and15min cache in Agent.DB PostgreSQL, atomic SQL reservation.
No task writes, personal profile or arbitrary tool names exposed. This demo is an actual count, not a task list.
fetch_tasks without scope was rejected by real provider; use count_tasks for whole-team count.
API errors/malformed result never count as zero. Build alone is not consumer proof.
