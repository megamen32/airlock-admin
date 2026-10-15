# Shtab native read-only demo

Native MCP binding stays Admin-only; user team_tasks and Russian HTML form share
summary.Service. Fixed fetch_tasks(datasource_id=138087,completed=false,
archived=false,limit10) reads only a separate Airlock demo board. No user-supplied
IDs, paths or tool names. No writes, executor details, descriptions or private
company-wide task data enter the public result: only selected names/statuses.

Board379621 / datasource138087 was created15Oct2026 and seeded exactly once
with three explicitly marked learning tasks, no executors/responsibles/deadlines.
Two open and one in progress; actual get page reported total3 and matching rows.
Intent/result receipts preserve task IDs; never replay an unknown creation.

Report rejects wrong project, missing/partial page, duplicate IDs, completed or
archived rows and malformed data. Old company-wide counter cache is excluded
by an explicit scope marker, quota history is not reset. Persistent cap4/hour,
15min cache,oneactive,20s,64KiB decoded page; provider10calls/hour/company.
API errors never turn into zero. Existing app1GiB, aggregate/build limits unchanged.

DaisyUI light/dark, responsive Russian form and explicit left primary action.
After source delivery verify real ordinary-guest form/tool-chat; build is not
consumer acceptance. Public app source does not contain the MCP token.
