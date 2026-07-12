# 安全

GPT‑Админ 让 AI agent 能访问你的服务器。安全是第一优先级。

## 鉴权模型（概述）

GPT‑Админ 有三种鉴权机制 —— 详见 [Configuration → Auth model](./CONFIGURATION.md#auth-model)：

1. **`CTL_TOKEN`**（Bearer）—— admin API + Web 管理面板
2. **OAuth bearer** —— `/mcp` 端点（给 MCP 客户端用）
3. **`ADMIN_PASSWORD`** —— OAuth 流程里 `/authorize` 表单

外加 `SHELLMCP_TOKEN`，用于 agent → hub 的注册。

## 最小权限

- **默认 user-mode** —— agent 跑在安装它的用户下，而不是 root。System-mode（sudo）需要显式 opt-in，只有当你需要特权操作时才开。
- **命令白名单** —— 限制 agent 允许执行的命令（在 `~/.config/gptadmin/allowlist.txt` 中配置）。
- **IP 白名单** —— 限制哪些 IP 可以访问 agent。

## 凭据处理

- **凭据在日志里会被遮罩** —— token、密码、API key 在写入日志之前会被脱敏。
- **"仅本地" 模式** —— 对于包含敏感数据的命令，可以把 agent 配置成不把输出回传 hub（本地跑，只报告状态）。
- **托管式备份** —— 编辑文件之前，`file_backup` 会创建一份带 TTL 的备份。关键文件（nginx、systemd、网络配置）默认 TTL 更长。

## 审批模式

对于关键操作（删文件、动网络配置），hub 支持 **审批模式**：AI 提议动作，hub 在执行前向人类请求确认。在 `/admin` → Security 下可以按 agent 启用。

## Token 轮换

```bash
# 生成一个新的 CTL_TOKEN
openssl rand -hex 32

# 更新 hub 的 env，重启
sudo systemctl restart gptadmin_hub  # 或：systemctl --user restart gptadmin_hub

# 如果改了 SHELLMCP_TOKEN，对每个 agent 同步更新 HUB_URL/TOKEN
# 在 Custom GPT / MCP 客户端配置里同步更新新的 CTL_TOKEN
```

一旦 token 泄露请立刻轮换。从历史 commit 里清掉泄露的值只是一次性补救，轮换才是稳妥的做法。

## MCP server 的 Gateway 模式

把 GPT‑Админ 当作一个安全的代理/中继时，外部客户端应该连 GPT‑Админ，而不是直接连那些私有的 stdio 或仅 LAN 的 MCP server。如果客户端只需要其中一种能力，优先用 per-server URL：

```text
/server/{slug}/mcp
/server/{slug}/actions/openapi.yaml
```

这样上游 MCP server 保持私有，而 GPT‑Админ 负责 HTTPS、Bearer/OAuth 鉴权、审计、路由和队列。只有在客户端真的需要完整中继/管理面时才用 `/server/hub/mcp`。

## 生产环境加固清单

- [ ] `CTL_TOKEN` 是一个强随机值（`openssl rand -hex 32`）
- [ ] `OAUTH_CLIENT_SECRET` 已设置（给 `/mcp` 用）
- [ ] `ADMIN_PASSWORD` 足够强
- [ ] Hub 走 HTTPS（Cloudflare/FRP 隧道，或者 nginx + Certbot）
- [ ] 已配置 agent 的 IP 白名单（只有 hub 可以访问 agent）
- [ ] 防火墙：对外只开 hub 的端口（25900）；agent 端口（25901）仅限内网
- [ ] 对关键操作启用了审批模式
- [ ] 日志有做轮换（`logrotate` 或 `journalctl --vacuum-time`）
- [ ] 备份已配置（`file_backup` 的 TTL）

## 上报漏洞

见 [SECURITY.md](../SECURITY.md)（仓库根目录）。简要版：

- **不要开公开 GitHub issue。**
- 通过 Telegram 上报：[@careviolan](https://t.me/careviolan)
- 48 小时内回复确认；严重问题的修复目标是 30 天。

## 审计日志

每条执行的命令都会记录：时间戳、agent、命令、调用方（哪个 AI / 适配器）、退出码。在 `/admin` → Logs 里查看。从 `/admin/api/logs/export` 导出供 SIEM 摄取。

## 另见

- [Configuration](./CONFIGURATION.md) —— 如何设置鉴权变量
- [Hub](./HUB.md) —— 端点
- [SECURITY.md](../SECURITY.md) —— 负责任的披露