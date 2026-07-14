# ShellMCP

ShellMCP 是在每台目标计算机上运行的代理。它注册到
hub，在本地执行命令，并返回真实的输出。

## 它的作用

- **通过 `POST /heartbeat` 向集线器注册**（发送 URL + 令牌 + 主机名）
- **执行** shell 命令、文件操作、systemd 操作
- **返回**真实的标准输出/标准错误（集线器截断长输出以保存令牌）
- **以配置的非 root 用户身份运行**普通命令
- **适用于** Linux、macOS、Windows 和 Android/Termux

## 实施

|实施 |状态 |地点 |何时使用 |
|------|--------|----------|------------|
|去 (`go-shellmcp/`) | **主要（仅）** | `go-shellmcp/` |新部署 - 更快、单一二进制文件 |

> **注意。** 旧版 Python 实现 (`client/shellmcp*.py`) 已
> 从源代码树中删除。现在所有安装都使用 Go 二进制文件 `shellmcp-go`。

## 在目标机器上安装

```bash
# Linux / macOS (installs the Go binary in user-mode by default)
curl -s https://became.bezrabotnyi.com/install.sh | bash
```

安装程序：
- 自动检测模式：无 sudo → 用户模式 (`~/.local/share/gptadmin`)，
  使用 sudo → 系统模式 (`/opt/gptadmin`)
- 注册用户服务（Linux 上为 `systemctl --user`，macOS 上为 `LaunchAgents`）
- 打印代理 URL + `SHELLMCP_TOKEN`

对于 Android Termux，请使用 Android 安装程序。它安装了 `android-arm64`
二进制文件，在 Termux 中启动它，并启用相同的基于清单的自动更新：

```bash
curl -fsS https://became.bezrabotnyi.com/install-android.sh | bash
```

## 手动运行

```bash
# Register with a hub using the Go binary
SHELLMCP_TOKEN=agent-secret \
HUB_URL=http://your-hub:25900 \
./go-shellmcp/shellmcp
```

## 环境变量

|瓦尔 |必填 |默认 |目的|
|-----|----------|---------|---------|
| `SHELLMCP_TOKEN` |是的 | — |不记名令牌（必须符合集线器的期望）|
| `HUB_URL` |是的 | — |用于注册的集线器 URL |
| `SHELLMCP_NAME` |没有|主机名 |中心显示的代理名称 |
| `SHELLMCP_BIND` |没有| `127.0.0.1` |本地监听地址 |
| `SHELLMCP_PORT` |没有| `25900` |本地监听端口 |
| `SHELLMCP_DEFAULT_USER` |需要根服务| — |非root身份执行普通命令 |
| `EXEC_TIMEOUT` |没有| `300` |最大命令执行时间（秒）|
| `SHELLMCP_AUTO_UPDATE` |没有|来自安装人员的 `1` |启用基于清单的二进制更新 |
| `SHELLMCP_UPDATE_INTERVAL_S` |没有|来自安装人员的 `3600` |更新检查间隔（秒） |
| `SHELLMCP_UPDATE_MANIFEST_URL` |没有|集线器工件 URL |发布清单； Android使用`shellmcp-android-arm64.json` |
| `SHELLMCP_UPDATE_TOKEN` |没有|代理令牌|私有工件端点的承载令牌 |
| `LOG_LIMIT_B` |没有| 65536 |在将完整流假脱机到磁盘之前此 ShellMCP 代理返回的最大内联 stdout/stderr 尾部（字节） |

`LOG_LIMIT_B` 是每个 ShellMCP 代理。它控制本地 `/exec` 结果尾部，并且不会替换集线器/客户端响应预算；中心仍可能对 ChatGPT Actions、Claude 或其他 MCP 客户端应用不同的响应预算。

## 暴露的操作

集线器将这些代理给代理。适用于所有 3 个适配器：

|运营|示例|
|------------|---------|
| `shell_exec` |运行 shell 命令，返回 stdout/stderr |
| `file_read` |读取文件 |
| `file_write` |写一个文件（带备份） |
| `file_backup` |编辑前创建托管备份 |
| `systemd_*` |状态/启动/停止/重新启动/启用单元|
| `system_info` | CPU、RAM、磁盘、正常运行时间 |
| `system_health` |快速健康检查|
| `venv_*` |管理 Python virtualenvs |
| `dir` |列表目录 |

请参阅 [API 参考](./API_REFERENCE.md) 了解确切的架构。

## 安全

- 代理仅接受带有 `SHELLMCP_TOKEN` 的请求
- 默认情况下，安装以安装用户身份运行。系统服务可能
  以 root 身份启动，但普通命令会降级为 `SHELLMCP_DEFAULT_USER`。
- 没有 `SHELLMCP_DEFAULT_USER` 的根服务拒绝普通命令
  而不是以 root 身份默默地执行它们。
- 仅出于故意使用 `run_as_user: "root"` 或显式 `sudo` 命令
  特权操作。
- 可以配置IP白名单和命令白名单
- 秘密被隐藏在日志中

请参阅[安全](./SECURITY_DOCS.md)。

## 另请参阅- [Hub](./HUB.md) — 代理与什么对话
- [安装路径](./INSTALL_PATHS.md) - 它在每个操作系统上的位置
- [Configuration](./CONFIGURATION.md) — 完整的环境变量参考
