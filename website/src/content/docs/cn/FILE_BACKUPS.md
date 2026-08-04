# GPTAdmin 管理的文件备份

`file_backup` 是编辑文件之前备份的首选 shell 代理工具。
它取代了分散在磁盘上的临时 `cp file file.bak.$date` 文件。

该工具通过中心暴露在每个 `shell:*` 虚拟代理上：

- `action=backup` 将文件复制或将目录打包到托管备份对象中。
- `action=list` 列出托管备份根目录中的已知备份。
- `action=cleanup` 删除过期的备份或早于 `max_age_days` 的备份。
- `action=restore` 恢复 `backup_id` 之前的备份。

目标主机上的默认存储为：

```text
~/.gptadmin/file-backups/
```

新备份的默认保留时间为 `ttl_days=30`。仅对不得自动过期的备份使用 `ttl_days=0`。

每个备份都有一个 `meta.json` 和一个仅附加的 `manifest.jsonl`。清理仅扫描此托管备份根，而不是整个文件系统。

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

对于特权文件，请传递`use_sudo=true`；目标主机必须允许非交互式 `sudo -n`。
