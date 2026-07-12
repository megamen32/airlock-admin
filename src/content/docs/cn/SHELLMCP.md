# ShellMCP

ShellMCP 是跑在每台目标机器上的 agent。它跟 hub 注册，在本地执行命令，把真正的输出回传。

## 它做什么

- **注册** 到 hub：通过 `POST /heartbeat`（发送 URL + token + hostname）
- **执行** shell 命令、文件操作、systemd 操作
- **回传** 真实的 stdout/stderr（hub 会把很长的输出截断，省 token）
- **运行** 默认是 user-mode（不拿 sudo），需要时切到 system-mode
- **支持** Linux、macOS、Windows

## 实现

| 实现 | 状态 | 路径 | 何时使用 |
|------|------|------|----------|
| Go（`go-shellmcp/`） | **主实现（且唯一）** | `go-shellmcp/` | 新部署 —— 更快、单二进制 |

> **注意。** 老的 Python 实现（`client/shellmcp*.py`）已从源码树删除，所有安装现在统一使用 Go 二进制 `shellmcp-go`。

## 在目标机器上安装

```bash
# Linux / macOS（默认把 Go 二进制装到 user-mode）
curl -s https://became.bezrabotnyi.com/install.sh | bash
```

安装脚本会：

- 自动判断模式：没有 sudo → user-mode（`~/.local/share/gptadmin`），有 sudo → system-mode（`/opt/gptadmin`）
- 注册一个用户级 service（Linux 上 `systemctl --user`，macOS 上 `LaunchAgents`）
- 打印 agent 的 URL 和 `SHELLMCP_TOKEN`

## 手动启动

```bash
# 用 Go 二进制向 hub 注册
SHELLMCP_TOKEN=agent-secret \
HUB_URL=http://your-hub:25900 \
./go-shellmcp/shellmcp
```

## 环境变量

| 变量 | 必填 | 默认值 | 用途 |
|------|------|--------|------|
| `SHELLMCP_TOKEN` | 是 | — | Bearer token（必须与 hub 期望的值一致） |
| `HUB_URL` | 是 | — | 要注册的 hub URL |
| `SHELLMCP_NAME` | 否 | hostname | 在 hub 上显示的 agent 名字 |
| `SHELLMCP_LISTEN` | 否 | 25901 | 本地监听端口 |
| `EXEC_TIMEOUT` | 否 | 120 | 命令最长执行时间（秒） |
| `LOG_LIMIT_B` | 否 | 65536 | 这个 ShellMCP agent 返回的 inline stdout/stderr 尾部的最大字节数；超出后完整流会落盘到 spool |

`LOG_LIMIT_B` 是按 ShellMCP agent 单体的。它控制本地 `/exec` 结果的尾部，不会替代 hub/客户端侧的响应预算；hub 对 ChatGPT Actions、Claude、或其他 MCP 客户端仍可能使用另一套响应预算。

## 暴露出来的操作

hub 把这些操作代理给 agent。三种适配器都能用：

| 操作 | 示例 |
|------|------|
| `shell_exec` | 跑一条 shell 命令，返回 stdout/stderr |
| `file_read` | 读文件 |
| `file_write` | 写文件（带备份） |
| `file_backup` | 在编辑前做一份托管式备份 |
| `systemd_*` | systemd unit 的 status / start / stop / restart / enable |
| `system_info` | CPU、RAM、磁盘、uptime |
| `system_health` | 快速健康检查 |
| `venv_*` | 管理 Python virtualenv |
| `dir` | 列目录 |

具体 schema 见 [API Reference](./API_REFERENCE.md)。

## 安全性

- agent 只接受带有它的 `SHELLMCP_TOKEN` 的请求
- 默认运行在安装它的用户下（非 root）—— system-mode（sudo）是 opt-in
- 可配置 IP 白名单和命令白名单
- 凭据在日志里会被遮罩

见 [Security](./SECURITY_DOCS.md)。

## 另见

- [Hub](./HUB.md) —— agent 跟谁对话
- [Install Paths](./INSTALL_PATHS.md) —— agent 在每个 OS 上安装在哪里
- [Configuration](./CONFIGURATION.md) —— 完整环境变量参考