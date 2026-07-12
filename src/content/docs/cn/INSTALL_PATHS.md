# 安装路径

GPT-Админ 在每个操作系统上的用户模式和系统模式下的存放位置。

## 模式

安装程序会自动检测模式：

- **user-mode** (默认) — 安装到用户主目录，作为用户服务运行。无需 sudo/管理员权限。
- **system-mode** — 系统级安装，作为 root/系统运行。仅在需要特权操作（绑定到 80 端口、为其他用户管理系统服务等）时使用。

## 按操作系统划分的路径

### Linux

| | user-mode | system-mode |
|---|-----------|-------------|
| 二进制文件 | `~/.local/share/gptadmin/` | `/opt/gptadmin/` |
| 配置 | `~/.config/gptadmin/` | `/etc/gptadmin/` |
| 服务 | `systemctl --user` | `systemctl` (systemd unit) |
| 命令行工具 | `~/.local/bin/gptadmin` | `/usr/local/bin/gptadmin` |

### macOS

| | user-mode | system-mode |
|---|-----------|-------------|
| 二进制文件 | `~/.local/share/gptadmin/` | `/opt/gptadmin/` |
| 配置 | `~/.config/gptadmin/` | `/etc/gptadmin/` |
| 服务 | LaunchAgents (`~/Library/LaunchAgents/`) | LaunchDaemons (`/Library/LaunchDaemons/`) |
| 命令行工具 | `~/.local/bin/gptadmin` | `/usr/local/bin/gptadmin` |

### Windows

| | user-mode | system-mode |
|---|-----------|-------------|
| 二进制文件 | `%LOCALAPPDATA%\gptadmin\` | `C:\Program Files\gptadmin\` |
| 配置 | `%LOCALAPPDATA%\gptadmin\config\` | `C:\ProgramData\gptadmin\` |
| 服务 | 计划任务 (在用户登录时) | Windows 服务 (管理员) |
| 命令行工具 | `%LOCALAPPDATA%\gptadmin\gptadmin.exe` | `C:\Program Files\gptadmin\gptadmin.exe` |

## 安装命令

```bash
# Linux / macOS — user-mode (默认)
curl -s https://became.bezrabotnyi.com/install.sh | bash

# Linux / macOS — system-mode (需要 root 时)
curl -s https://became.bezrabotnyi.com/install.sh | sudo bash
```

```powershell
# Windows — user-mode (无需管理员权限)
iwr -UseBasicParsing https://became.bezrabotnyi.com/install_win.ps1 | iex
```

## 安装程序的作用

1. 下载 CLI (`gptadmin.py`) 和包
2. 运行 `gptadmin setup --user` (或 `--system`) — 一个交互式向导
3. 您选择要安装的内容：hub + agent、仅 hub 或仅 agent
4. 您选择一个隧道：自动隧道 (FRP/Cloudflare) 或您自己的域名
5. 写入服务单元并启动它们
6. 打印您的 **Hub URL**、**CTL_TOKEN** 和 **SHELLMCP_TOKEN**

## 卸载

```bash
gptadmin uninstall
```

移除二进制文件、配置文件和服务单元。通过
`file_backup` 创建的备份保留在 `~/.gptadmin/file-backups/` (或
系统模式下的 `/var/lib/gptadmin/file-backups/`)。

## 另请参阅

- [入门](./GETTING_STARTED.md)
- [配置](./CONFIGURATION.md)
- [Hub](./HUB.md)
