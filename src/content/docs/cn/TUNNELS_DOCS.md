# 隧道

为了让你的 AI / MCP 客户端能连进来，hub 必须可以从公网访问到。自己持有域名不是必需的 —— GPT‑Админ 支持两种自动隧道。

## FRP（默认）

[FRP](https://github.com/fatedier/frp) 是一个高性能的反向代理。GPT‑Админ 在公网上跑了一个 FRP server，安装脚本能自动注册。

### 安装

跑 `gptadmin setup` 时选择 **1**（用 FRP 自动隧道）。安装脚本会：

1. 下载 FRP 客户端
2. 在公网 FRP server 上注册一个随机子域名
3. 把 FRP 客户端作为常驻服务跟 hub 一起启动
4. 打印你的公网 URL：`https://random-sub.frp.bezrabotnyi.com`

### 优缺点

- ✅ 不需要域名，也不用配 DNS
- ✅ 速度很快（直接 TCP 隧道）
- ⚠️ URL 在 `frp.bezrabotnyi.com`（共享域名）
- ⚠️ 免费 FRP server 有速率限制

## Cloudflare Tunnel

[Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) 会建一条到 Cloudflare 边缘网络的安全出站隧道。你需要一个 Cloudflare 账号和一个托管在 Cloudflare 上的域名。

### 安装

跑 `gptadmin setup` 时选 Cloudflare 选项。也可以之后单独配：

```bash
gptadmin tunnel cloudflare
```

你需要准备：

- `CLOUDFLARE_TOKEN` —— 一个带 Tunnel 权限的 Cloudflare API token
- 一个托管在 Cloudflare 上的域名

CLI 会：

1. 安装 `cloudflared`
2. 创建一个 tunnel
3. 把它绑到你在 Cloudflare 上的某个子域名
4. 把 `cloudflared` 作为常驻服务启动
5. 打印你的公网 URL：`https://hub.yourdomain.com`

### 优缺点

- ✅ 用你自己的域名
- ✅ Cloudflare 的 DDoS 防护 + 边缘缓存
- ✅ 服务器无需开放入站端口
- ⚠️ 需要一个 Cloudflare 账号 + 域名

## 自有域名（nginx + Certbot）

如果你已经有一台带公网 IP 和域名的服务器：

1. 在 DNS 里配一条 A 记录指向你的服务器
2. 用仓库里的 nginx 配置模板：`deploy/nginx/`（拷一份再改）
3. 申请证书：`certbot --nginx -d hub.yourdomain.com`
4. hub 监听 localhost，由 nginx 反向代理

```bash
# 一个 nginx location 块示例
location / {
    proxy_pass http://127.0.0.1:25900;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";  # 给 MCP SSE 用
}
```

## 怎么选？

| 场景 | 推荐 |
|------|------|
| 快速上手、不想用域名 | FRP（自动隧道） |
| 有自己的域名、想要 DDoS 防护 | Cloudflare Tunnel |
| 已经有服务器 + 域名 | nginx + Certbot |
| 只是本地开发 | 不用（直接 `localhost:25900`） |

## 另见

- [入门](./GETTING_STARTED.md)
- [Configuration](./CONFIGURATION.md) —— `PUBLIC_ORIGIN` 等
- [Hub](./HUB.md)