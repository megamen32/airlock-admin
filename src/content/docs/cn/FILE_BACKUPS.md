# GPTAdmin 管理的文件备份

`file_backup` 是在编辑文件之前首选的 shell-agent 备份工具。
它取代了那些散落在磁盘各处的临时 `cp file file.bak.$date` 文件。

该工具通过 hub 在每个 `shell:*` 虚拟代理上暴露：

- `action=backup` 将文件复制或将目录打包成受管理的备份对象。
- `action=list` 列出受管备份根目录中已知的备份。
- `action=cleanup` 移除过期的备份，或早于 `max_age_days` 的备份。
- `action=restore` 通过 `backup_id` 恢复备份。

目标主机的默认存储位置是：

```text
~/.gptadmin/file-backups/
```

新备份的默认保留期为 `ttl_days=30`。仅当备份绝对不能自动过期时，才使用 `ttl_days=0`。

每个备份都有一个 `meta.json` 和一个追加只读的 `manifest.jsonl`。清理操作只扫描这个受管的备份根目录，而不是整个文件系统。

示例：

```json
{"action":"backup","path":"/home/roomhacker/gptadmin/go-hub/internal/hub/server.go","ttl_days":30,"label":"before-admin-api-change"}
```

```json
{"action":"list","limit":20}
```

```json
{"action":"cleanup"}
```

```json
{"action":"restore","backup_id":"20260624_144633_host_abcd1234_label","overwrite":true}
```

对于特权文件，请传递 `use_sudo=true`；目标主机必须允许非交互式的 `sudo -n`。
