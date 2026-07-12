# Пути установки

Где GPT-Админ находится в каждой ОС, в пользовательском и системном режиме.

## Режимы

Установщик автоматически определяет режим:

- **user-mode** (по умолчанию) — устанавливает в домашний каталог пользователя, работает как служба пользователя. Не требуется sudo/Администратор.
- **system-mode** — устанавливает в систему, работает от имени root/системы. Используйте только тогда, когда вам требуются привилегированные операции (привязка к порту 80, управление системными службами для других пользователей и т. д.).

## Пути по ОС

### Linux

| | user-mode | system-mode |
|---|-----------|-------------|
| Бинарный файл | `~/.local/share/gptadmin/` | `/opt/gptadmin/` |
| Конфиг | `~/.config/gptadmin/` | `/etc/gptadmin/` |
| Служба | `systemctl --user` | `systemctl` (юнит systemd) |
| CLI | `~/.local/bin/gptadmin` | `/usr/local/bin/gptadmin` |

### macOS

| | user-mode | system-mode |
|---|-----------|-------------|
| Бинарный файл | `~/.local/share/gptadmin/` | `/opt/gptadmin/` |
| Конфиг | `~/.config/gptadmin/` | `/etc/gptadmin/` |
| Служба | LaunchAgents (`~/Library/LaunchAgents/`) | LaunchDaemons (`/Library/LaunchDaemons/`) |
| CLI | `~/.local/bin/gptadmin` | `/usr/local/bin/gptadmin` |

### Windows

| | user-mode | system-mode |
|---|-----------|-------------|
| Бинарный файл | `%LOCALAPPDATA%\gptadmin\` | `C:\Program Files\gptadmin\` |
| Конфиг | `%LOCALAPPDATA%\gptadmin\config\` | `C:\ProgramData\gptadmin\` |
| Служба | Планировщик заданий (при входе пользователя) | Служба Windows (Администратор) |
| CLI | `%LOCALAPPDATA%\gptadmin\gptadmin.exe` | `C:\Program Files\gptadmin\gptadmin.exe` |

## Команды установки

```bash
# Linux / macOS — user-mode (по умолчанию)
curl -s https://became.bezrabotnyi.com/install.sh | bash

# Linux / macOS — system-mode (когда нужен root)
curl -s https://became.bezrabotnyi.com/install.sh | sudo bash
```

```powershell
# Windows — user-mode (без Администратора)
iwr -UseBasicParsing https://became.bezrabotnyi.com/install_win.ps1 | iex
```

## Что делает установщик

1. Загружает CLI (`gptadmin.py`) и пакеты
2. Запускает `gptadmin setup --user` (или `--system`) — интерактивный мастер
3. Выбираете, что установить: хаб + агент, только хаб или только агент
4. Выбираете туннель: auto-tunnel (FRP/Cloudflare) или свой домен
5. Создает юнит службы и запускает их
6. Выводит ваш **Hub URL**, **CTL_TOKEN** и **SHELLMCP_TOKEN**

## Удаление

```bash
gptadmin uninstall
```

Удаляет бинарные файлы, конфиги и юниты служб. Резервные копии, созданные через
`file_backup`, сохраняются в `~/.gptadmin/file-backups/` (или
`/var/lib/gptadmin/file-backups/` в system-mode).

## См. также

- [Начать работу](./GETTING_STARTED.md)
- [Конфигурация](./CONFIGURATION.md)
- [Хаб](./HUB.md)
