# ToolKeeper demo connector

Official interface: https://toolkeeper.io/developers . Signup on15Oct2026
created two sample tools in an isolated demonstration workspace6439. Read-only
API key is limited to that workspace and items:read/workspaces:read/stats:read;
no write, employee, billing or permission grants. Credentials are protected
outside Git and backed up to a second local copy plus Yandex Disk with readback.

Native Connection uses bearer injection. User tool equipment_catalog and the
HTML form call one fixed GET /openapi/v1/items?page=1&per_page=10. The adapter
returns only ID, title, workspace, status and responsible display name. It does
not expose telephone numbers, account credentials or any other workspace.
Cache5min,12refreshes/hour, one in-flight operation,20s timeout,512KiB cap,
10items maximum. Native app budget1GiB/no swap/1024tasks; existing buildkit
4GiB/2CPU/parallelism1 and shared UID budget remain unchanged. Trial is stopped
conservatively at22Oct00MSK even if the key is still valid. No paid activation.

Acceptance requires actual ToolKeeper response, ordinary guest form and native
chat, both visual themes and a working marketplace CTA. Compile or HTTP200 alone
is insufficient. No synthetic items or fake provider transport are used.
