# 路线图

目前已经做了哪些、在做哪些、以及 open-core 的边界。

## 今天的状态

### ✅ 已完成、可用

- **Hub**（`go-hub/`）—— MCP remote SSE、admin API、OAuth、Web 管理面板
- **ShellMCP**（Go + Python）—— Linux/macOS/Windows 上的 agent
- **三种适配器**：
  - MCP 客户端（Claude Desktop、Codex、OpenCode）
  - 浏览器扩展（给免费网页 AI 用的 userscript）
  - OpenAI Action（Custom GPT、Open WebUI）
- **CLI**（`gptadmin`）—— setup、tunnel、status、logs、config
- **隧道** —— FRP + Cloudflare auto-tunnel
- **Web 管理面板**（`/admin`）—— 队列、agent 健康、logs
- **OAuth** 适配 OpenAI SDK
- **安装脚本** 覆盖 Linux/macOS/Windows（user-mode 与 system-mode）
- **后台任务** 带轮询
- **输出截断**（节省 token）
- **托管式文件备份** 带 TTL

### 🚧 即将到来

- **更完整的 Web 管理面板** —— 团队、RBAC、告警、审计日志导出
- **托管云服务** —— 不想自己 host？managed cloud 方案在规划中
- **企业级 SSO** —— SAML、OIDC、SCIM 配置
- **MCP 应用市场** —— 在面板里浏览、安装 MCP（openmemory、chrome-devtools、自定义）
- **更多适配器** —— Slack、Discord、Telegram bot 作为一等公民适配器

## Open-core 模型

GPT‑Админ 采用 **open-core**，许可证 AGPL-3.0。

### 永久免费（本仓库）

- Hub、shellmcp、三种适配器
- 基础 Web 管理面板（队列、健康、logs）
- 所有 CLI 命令
- 所有隧道
- 社区支持（GitHub issues、Discussions）

### 付费部分（独立仓库 / 云）

- 托管云（managed hub，无需自部署）
- 企业 SSO（SAML/OIDC）+ SCIM
- 高级 RBAC（角色、per-agent 权限）
- 扩展审计日志 + SIEM 导出
- SLA + 优先支持
- 高级管理面板（团队 dashboard、告警、分析）

核心永远开源。付费功能是叠加的 —— 已有功能绝不收费化。

## 版本号

GPT‑Админ 遵循 [SemVer](https://semver.org/)。发布历史见 [CHANGELOG.md](../CHANGELOG.md)。

- `0.x` —— 1.0 之前，小版本之间可能有不兼容变更
- `1.0` —— 第一个稳定版（在扩展管理面板交付后）
- `1.x+` —— 向后兼容的增量

## 贡献

PR 欢迎 —— 见 [CONTRIBUTING.md](../CONTRIBUTING.md)。比较欢迎的方向：

- 更多测试覆盖（隧道、MCP-SSE、CLI）
- 文档改进
- 新的 MCP 集成（写一个 MCP 包你最喜欢的工具）
- 打包（Homebrew formula、AUR 包、Scoop manifest）

## 另见

- [Architecture](./ARCHITECTURE.md) —— 它是如何构建的
- [CHANGELOG.md](../CHANGELOG.md) —— 变更记录