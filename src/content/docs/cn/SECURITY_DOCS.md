# 安全

GPT‑Админ 允许 AI 代理访问您的服务器。安全是重中之重。

## 认证模型（总结）

GPT‑Админ 具有三种身份验证机制 - 请参阅[配置 → 身份验证模型](./CONFIGURATION.md#auth-model)
详情：

1. **`CTL_TOKEN`** (承载) — 管理 API + 网页面板
2. **OAuth 承载** — `/mcp` 端点（对于 MCP 客户端）
3. **`ADMIN_PASSWORD`** — OAuth 流程中的 `/authorize` 表单

加 `SHELLMCP_TOKEN` 用于代理 → 中心注册。

## 最小权限

- **默认用户模式** — 代理以安装用户身份运行，而不是 root 用户。
  仅当您需要特权操作时，系统模式 (sudo) 是可选的。
- **根服务失败关闭** — 当 ShellMCP 以 root 身份运行时，配置
  `SHELLMCP_DEFAULT_USER`。否则普通命令将被拒绝；他们从不
  默默继承根。仅使用 `run_as_user: "root"` 或显式 `sudo`
  故意的特权行为。
- **命令允许列表** — 限制代理将执行的命令
  （配置为`~/.config/gptadmin/allowlist.txt`）。
- **IP 白名单** — 限制哪些 IP 可以到达代理。

## 秘密处理

- 秘密**隐藏在日志中** - 令牌、密码、API 密钥均经过编辑
  在记录之前。
- **“仅限本地”模式** — 对于包含敏感数据的命令，代理可以是
  配置为不将输出返回到集线器（本地运行，仅报告状态）。
- **托管备份** — 在编辑文件之前，`file_backup` 创建备份
  带TTL。关键文件（nginx、systemd、网络）通过以下方式获得更长的 TTL：
  默认。

## 批准模式

对于关键操作（删除文件、更改网络配置），集线器
支持**批准模式**：人工智能提出行动，中心要求
执行前人工确认。在 `/admin` → 安全中启用每个代理。

## 代币轮换

```bash
# Generate a new CTL_TOKEN
openssl rand -hex 32

# Update the hub env, restart
sudo systemctl restart gptadmin_hub  # or: systemctl --user restart gptadmin_hub

# Update each agent's HUB_URL/TOKEN if you changed SHELLMCP_TOKEN
# Update Custom GPT / MCP client configs with the new CTL_TOKEN
```

如果令牌泄漏，请立即轮换。清除泄漏的值
历史提交只是一种一次性措施——轮换是安全的途径。


## MCP 服务器的网关模式

当 GPTAdmin 用作安全代理/中继时，外部客户端应连接到 GPTAdmin，而不是直接连接到专用 stdio 或仅限 LAN 的 MCP 服务器。当客户端仅需要一项功能时，首选每服务器 URL：

```text
/server/{slug}/mcp
/server/{slug}/actions/openapi.yaml
```

这使上游 MCP 服务器保持私有，同时 GPTAdmin 应用 HTTPS、承载/OAuth 身份验证、审核日志记录、路由和队列处理。仅对需要跨服务器中继/管理功能的可信客户端使用完整的 `/server/hub/mcp` 表面。

## 生产强化清单

- [ ] `CTL_TOKEN` 是一个强随机值 (`openssl rand -hex 32`)
- [ ] `OAUTH_CLIENT_SECRET` 已设置（对于 `/mcp`）
- [ ] `ADMIN_PASSWORD` 很强
- [ ] Hub 位于 HTTPS 后面（通过 Cloudflare/FRP 隧道或 nginx + Certbot）
- [ ] 代理 IP 允许列表已设置（只有集线器可以到达代理）
- [ ] 防火墙：仅集线器端口（25900）是公共的；代理端口 (25901) 是内部端口
- [ ] 为关键操作启用批准模式
- [ ] 日志轮换（`logrotate` 或 `journalctl --vacuum-time`）
- [ ] 备份已配置 (`file_backup` TTL)

## 报告漏洞

请参阅[SECURITY.md](../SECURITY.md)（存储库根）。简短版本：

- **不要打开公共 GitHub 问题。**
- 通过电报举报：[@careviolan](https://t.me/careviolan)
- 48 小时内确认，关键问题在 30 天内修复目标。

## 审核日志

每个执行的命令都会记录：时间戳、代理、命令、调用者
（哪个AI/适配器），退出代码。可在 `/admin` → 日志中查看。导出到
`/admin/api/logs/export` 用于 SIEM 摄取。

## 另请参阅

- [Configuration](./CONFIGURATION.md) — 如何设置身份验证变量
- [Hub](./HUB.md) — 端点
- [SECURITY.md](../SECURITY.md) — 负责任的披露
