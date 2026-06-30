import { type LucideIcon, KeyRound, Lock, Radio, Server, Settings2, Shield } from "lucide-react";

export type AuthVariable = {
  env: string;
  label: string;
  usedBy: string;
  appliesTo: string;
  notes: string;
};

export type EndpointRow = {
  path: string;
  auth: string;
  usedFor: string;
  notes: string;
};

export type EnvRow = {
  env: string;
  defaultValue: string;
  purpose: string;
};

export type EnvGroup = {
  title: string;
  icon: LucideIcon;
  scope: string;
  rows: EnvRow[];
};

export type DetailRow = {
  name: string;
  value: string;
  notes: string;
};

export type TunnelBackendRow = {
  backend: string;
  purpose: string;
  env: string;
  urlShape: string;
  notes: string;
};

export const AUTH_VARIABLES: AuthVariable[] = [
  {
    env: "CTL_TOKEN",
    label: "Hub admin bearer",
    usedBy: "ручной Bearer token",
    appliesTo: "/admin, /admin/api/*, /mcp-relay/*, /servers, /tasks/*, artifacts",
    notes: "Это не OAuth password и не client secret. Название историческое: control token.",
  },
  {
    env: "ADMIN_PASSWORD",
    label: "OAuth login password",
    usedBy: "HTML-форма на /authorize",
    appliesTo: "только OAuth authorize flow для /mcp",
    notes: "Пользователь вводит именно этот пароль, когда OAuth-клиент открывает страницу авторизации.",
  },
  {
    env: "OAUTH_CLIENT_SECRET",
    label: "JWT signing secret",
    usedBy: "сам gptadmin_hub",
    appliesTo: "подпись и проверка OAuth bearer token для /mcp",
    notes: "Не выдаётся пользователю. Это серверный секрет, а не пароль входа.",
  },
  {
    env: "MCP_RELAY_AGENT_TOKEN",
    label: "Relay agent token",
    usedBy: "реальные MCP relay agents",
    appliesTo: "/mcp-relay/register, /mcp-relay/poll/*, /mcp-relay/result/*",
    notes: "Нужен агентам, которые общаются с relay как backend, а не обычным пользователям.",
  },
  {
    env: "MCP_BRIDGE_KEY",
    label: "Userscript bridge key",
    usedBy: "mcp-bridge.user.js",
    appliesTo: "/mcp-prompt/*",
    notes: "По умолчанию равен CTL_TOKEN, но может быть отдельным ключом для bridge-сценариев.",
  },
];

export const ENDPOINT_ROWS: EndpointRow[] = [
  {
    path: "/mcp",
    auth: "OAuth bearer token",
    usedFor: "remote MCP / Streamable HTTP endpoint",
    notes: "Прямой CTL_TOKEN сюда не подходит: код проверяет JWT через OAUTH_CLIENT_SECRET.",
  },
  {
    path: "/authorize",
    auth: "ADMIN_PASSWORD",
    usedFor: "OAuth login screen",
    notes: "Форма спрашивает пароль и после успешного ввода выдаёт code.",
  },
  {
    path: "/token",
    auth: "authorization_code + PKCE",
    usedFor: "обмен OAuth code на bearer token",
    notes: "Секрет клиента не требуется: token_endpoint_auth_method = none.",
  },
  {
    path: "/register",
    auth: "none",
    usedFor: "dynamic client registration",
    notes: "Hub возвращает metadata для OAuth clients.",
  },
  {
    path: "/admin",
    auth: "CTL_TOKEN",
    usedFor: "веб-панель",
    notes: "Панель хранит CTL_TOKEN в localStorage и использует его для admin API.",
  },
  {
    path: "/admin/api/*",
    auth: "CTL_TOKEN",
    usedFor: "данные панели и admin MCP operations",
    notes: "Сюда относятся overview, audit, jobs, clients, mcp manage, resource list/read.",
  },
  {
    path: "/mcp-relay/*",
    auth: "CTL_TOKEN",
    usedFor: "list tools / call tools / poll relay jobs",
    notes: "Это admin relay API, не remote MCP transport endpoint.",
  },
];

export const QUICK_SNIPPETS = {
  adminCurl: `curl -H 'Authorization: Bearer YOUR_CTL_TOKEN' \\
  https://your-hub.example.com/admin/api/overview`,
  relayCurl: `curl -H 'Authorization: Bearer YOUR_CTL_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{"target":"hub"}' \\
  https://your-hub.example.com/mcp-relay/tools`,
  mcpConfig: `{
  "mcpServers": {
    "gptadmin": {
      "type": "http",
      "url": "https://your-hub.example.com/mcp"
    }
  }
}`,
  envExample: `CTL_TOKEN=generate-a-strong-random-token
ADMIN_PASSWORD=choose-a-strong-password
OAUTH_CLIENT_SECRET=$(openssl rand -hex 32)
PUBLIC_ORIGIN=https://your-hub.example.com
MCP_RESOURCE=https://your-hub.example.com`,
};

export const HUB_ENV_GROUPS: EnvGroup[] = [
  {
    title: "Авторизация и OAuth",
    icon: Shield,
    scope: "gptadmin_hub.py",
    rows: [
      { env: "CTL_TOKEN", defaultValue: "chatgpt_secret", purpose: "Bearer-токен для admin API и веб-панели." },
      { env: "PUBLIC_ORIGIN", defaultValue: "https://gptadminmcp.bezrabotnyi.com", purpose: "Публичный HTTPS-адрес хаба для OAuth metadata и редиректов." },
      { env: "MCP_RESOURCE", defaultValue: "PUBLIC_ORIGIN", purpose: "OAuth resource/audience для bearer-токенов /mcp." },
      { env: "ADMIN_PASSWORD", defaultValue: "changeme", purpose: "Пароль для формы POST /authorize при OAuth-логине." },
      { env: "OAUTH_CLIENT_SECRET", defaultValue: "random token_hex(32)", purpose: "Серверный секрет для подписи и проверки OAuth JWT-токенов." },
      { env: "OAUTH_PERMISSIVE_REDIRECTS", defaultValue: "0", purpose: "Разрешить любой redirect_uri вместо строгого allowlist." },
      { env: "OAUTH_PERMISSIVE_RESOURCES", defaultValue: "0", purpose: "Разрешить любой OAuth resource вместо MCP_RESOURCE." },
      { env: "MCP_RELAY_AGENT_TOKEN", defaultValue: "random token_urlsafe(32)", purpose: "Токен для relay-агентов: /mcp-relay/register|poll|result." },
      { env: "MCP_BRIDGE_KEY", defaultValue: "CTL_TOKEN", purpose: "Отдельный ключ для userscript bridge: /mcp-prompt/*." },
      { env: "MCP_PROMPT_CACHE_TTL", defaultValue: "90", purpose: "TTL кэша (сек) для MCP prompt metadata bridge-стороны." },
      { env: "GPTADMIN_NONCE_TTL_S", defaultValue: "300", purpose: "TTL для кэша nonce подписи запросов." },
    ],
  },
  {
    title: "Пути и идентичность",
    icon: Server,
    scope: "gptadmin_hub.py",
    rows: [
      { env: "GPTADMIN_CONFIG_DIR", defaultValue: "repo/config or frozen app config dir", purpose: "Базовая папка конфига, откуда резолвятся state-файлы." },
      { env: "GPTADMIN_CLI_PATH", defaultValue: "repo/cli.py", purpose: "Путь к CLI, который хаб вызывает для своих действий." },
      { env: "GPTADMIN_PYTHON", defaultValue: "current python executable", purpose: "Python-интерпретатор для вспомогательных subprocess." },
      { env: "LICENSE_FILE", defaultValue: "CONFIG_DIR/license.json", purpose: "Путь к подписанному license-файлу." },
      { env: "PUBLIC_KEY_FILE", defaultValue: "CONFIG_DIR/public.pem", purpose: "Публичный ключ для проверки подписи license." },
      { env: "GPTADMIN_HOME", defaultValue: "/opt/gptadmin", purpose: "Базовая папка установки, от неё считается artifact dir." },
      { env: "GPTADMIN_ARTIFACT_DIR", defaultValue: "derived from cwd/build/GPTADMIN_HOME", purpose: "Папка, откуда раздаются shellmcp артефакты сборки." },
      { env: "GPTADMIN_APPROVED_SERVERS_FILE", defaultValue: "CONFIG_DIR/approved_servers.json", purpose: "Реестр одобренных серверов (на диске)." },
      { env: "GPTADMIN_PENDING_SERVERS_FILE", defaultValue: "CONFIG_DIR/pending_servers.json", purpose: "Реестр ожидающих серверов (на диске)." },
      { env: "GPTADMIN_TRANSFERS_DIR", defaultValue: "CONFIG_DIR/transfers", purpose: "Папка-буфер для file transfers хаба." },
      { env: "GPTADMIN_PORT_FORWARDS_FILE", defaultValue: "CONFIG_DIR/port_forwards.json", purpose: "Состояние port forwards (на диске)." },
      { env: "GPTADMIN_FILE_TRANSFER_MAX_INLINE_BYTES", defaultValue: "52428800", purpose: "Лимит инлайн file transfer (байт)." },
      { env: "GPTADMIN_HUB_PRIVATE_KEY_FILE", defaultValue: "CONFIG_DIR/hub_ed25519", purpose: "Приватный ключ хаба для подписей." },
      { env: "GPTADMIN_HUB_PUBLIC_KEY_FILE", defaultValue: "CONFIG_DIR/hub_ed25519.pub", purpose: "Публичный ключ хаба для агентов." },
      { env: "GPTADMIN_HUB_ID", defaultValue: "main-hub", purpose: "Стабильный идентификатор хаба." },
      { env: "GPTADMIN_SERVERS_STATE_FILE", defaultValue: "CONFIG_DIR/hub_servers_state.json", purpose: "Снапшот state shell-серверов (на диске)." },
      { env: "GPTADMIN_TASKS_STATE_FILE", defaultValue: "CONFIG_DIR/hub_tasks_state.json", purpose: "Снапшот задач (на диске)." },
      { env: "GPTADMIN_MCP_AGENTS_STATE_FILE", defaultValue: "CONFIG_DIR/hub_mcp_agents_state.json", purpose: "Снапшот state relay-агентов (на диске)." },
      { env: "GPTADMIN_MCP_JOBS_STATE_FILE", defaultValue: "CONFIG_DIR/hub_mcp_jobs_state.json", purpose: "Снапшот relay-задач (на диске)." },
      { env: "GPTADMIN_AUTH_CLIENTS_STATE_FILE", defaultValue: "CONFIG_DIR/hub_auth_clients_state.json", purpose: "State замеченных auth-клиентов (на диске)." },
    ],
  },
  {
    title: "Relay, очередь, ретраи",
    icon: Radio,
    scope: "gptadmin_hub.py",
    rows: [
      { env: "DEAD_S", defaultValue: "180", purpose: "Порог свежести heartbeat для shell-серверов." },
      { env: "HUB_STATE_TTL_S", defaultValue: "259200", purpose: "TTL хранения общего state хаба." },
      { env: "MCP_RELAY_STALE_TTL_S", defaultValue: "259200", purpose: "TTL до признания relay-агентов stale." },
      { env: "MCP_RELAY_STALE_RETENTION_S", defaultValue: "2592000", purpose: "Сколько stale relay-агенты хранятся до удаления." },
      { env: "HUB_DEFERRED_DISPATCH_INTERVAL_S", defaultValue: "2", purpose: "Интервал фонового dispatch-цикла." },
      { env: "HUB_DEFERRED_DEFAULT_TTL_S", defaultValue: "604800", purpose: "TTL по умолчанию для deferred-задач." },
      { env: "HUB_DEFERRED_MAX_ATTEMPTS", defaultValue: "1000", purpose: "Макс. ретраев для deferred-задач." },
      { env: "HUB_SYNC_TIMEOUT_S", defaultValue: "15", purpose: "Таймаут синхронного ожидания для операций хаба." },
      { env: "MCP_RELAY_SYNC_WAIT_MAX_S", defaultValue: "min(HUB_SYNC_TIMEOUT_S, 15)", purpose: "Макс. синхронное ожидание relay-результата bridge-стороне." },
      { env: "MCP_RELAY_REQUEST_TIMEOUT_MAX_S", defaultValue: "3600", purpose: "Верхняя граница таймаута relay-запросов." },
      { env: "MCP_RELAY_RUNNING_REQUEUE_S", defaultValue: "300", purpose: "Порог requeue для running relay-задач." },
      { env: "MCP_RELAY_NO_RETRY_TTL_S", defaultValue: "300", purpose: "TTL для relay-задач без ретраев." },
      { env: "HUB_DEFAULT_RETRY_POLICY", defaultValue: "none", purpose: "Политика ретраев для generic deferred-задач." },
      { env: "MCP_RELAY_DEFAULT_RETRY_POLICY", defaultValue: "HUB_DEFAULT_RETRY_POLICY", purpose: "Политика ретраев для relay-задач." },
      { env: "MCP_RELAY_DEFAULT_TIMEOUT", defaultValue: "30", purpose: "Таймаут для relay tools/list и tools/call." },
      { env: "MCP_RELAY_POLL_MAX_TIMEOUT", defaultValue: "55", purpose: "Верхняя граница poll-таймаута relay-задач." },
      { env: "QUEUE_LONG_POLL_MAX_TIMEOUT", defaultValue: "55", purpose: "Верхняя граница poll-таймаута queue endpoints." },
      { env: "QUEUE_LONG_POLL_SLEEP_S", defaultValue: "0.5", purpose: "Пауза между проверками queue poll." },
      { env: "GPTADMIN_PORT_FORWARD_STOPPED_TTL_SEC", defaultValue: "86400", purpose: "TTL хранения остановленных port-forwards." },
    ],
  },
  {
    title: "Ответы, spill, аудит",
    icon: Settings2,
    scope: "gptadmin_hub.py",
    rows: [
      { env: "LOG_LEVEL", defaultValue: "INFO", purpose: "Уровень логирования Python." },
      { env: "GPTADMIN_AUDIT_LOG", defaultValue: "/var/log/gptadmin/audit.log", purpose: "Путь к audit-логу." },
      { env: "HUB_GENERIC_RESPONSE_TOKEN_LIMIT", defaultValue: "CHATGPT_RESPONSE_TOKEN_LIMIT", purpose: "Бюджет токенов для не-chatgpt клиентов." },
      { env: "HUB_RESPONSE_CHARS_PER_TOKEN", defaultValue: "4", purpose: "Оценка символов/токен для бюджетирования ответа." },
      { env: "HUB_CHATGPT_RESPONSE_TOKEN_LIMIT", defaultValue: "12000", purpose: "Бюджет токенов для ответов chatgpt-клиенту." },
      { env: "HUB_CHATGPT_RESPONSE_LIMIT", defaultValue: "token_limit * chars_per_token", purpose: "Бюджет символов для ответов chatgpt." },
      { env: "HUB_SPILL_FIELD_MIN_CHARS", defaultValue: "HUB_CHATGPT_RESPONSE_LIMIT", purpose: "Мин. размер поля до spill-to-store." },
      { env: "HUB_DEFAULT_RESPONSE_CLIENT", defaultValue: "chatgpt", purpose: "Профиль бюджетирования ответов по умолчанию." },
      { env: "HUB_SPILL_PREVIEW_HEAD_CHARS", defaultValue: "600", purpose: "Начальные символы в spill preview." },
      { env: "HUB_SPILL_PREVIEW_TAIL_CHARS", defaultValue: "160", purpose: "Конечные символы в spill preview." },
      { env: "HUB_SPILL_HINT_STYLE", defaultValue: "compact", purpose: "Как spill-hints отдаются клиенту." },
      { env: "HUB_HEADROOM_SPILL_ENABLED", defaultValue: "0", purpose: "Включить headroom-компрессию spill." },
      { env: "HUB_HEADROOM_SPILL_MAX_CHARS", defaultValue: "200000", purpose: "Макс. размер для headroom spill summarizer." },
      { env: "HUB_HEADROOM_SPILL_PREVIEW_CHARS", defaultValue: "1200", purpose: "Бюджет preview для headroom spill summary." },
      { env: "HUB_HEADROOM_SITE_PACKAGES", defaultValue: "", purpose: "Доп. site-packages для headroom-компрессии." },
      { env: "HUB_HEADROOM_MODEL", defaultValue: "claude-sonnet-4-5-20250929", purpose: "Модель для headroom spill summarizer." },
      { env: "HUB_OUTPUT_STORE_DIR", defaultValue: "CONFIG_DIR/outputs", purpose: "Папка для больших spilled-выводов." },
      { env: "HUB_OUTPUT_STORE_MAX_BYTES", defaultValue: "524288000", purpose: "Макс. байт в output store." },
    ],
  },
  {
    title: "Сеть и runtime",
    icon: Lock,
    scope: "gptadmin_hub.py",
    rows: [
      { env: "HUB_PORT", defaultValue: "9001", purpose: "TCP-порт (если без socket activation)." },
      { env: "HUB_BIND", defaultValue: "0.0.0.0", purpose: "Предпочтительный bind host для uvicorn." },
      { env: "HUB_HOST", defaultValue: "0.0.0.0", purpose: "Fallback bind host если HUB_BIND не задан." },
      { env: "LISTEN_PID", defaultValue: "", purpose: "systemd socket activation metadata." },
      { env: "LISTEN_FDS", defaultValue: "", purpose: "systemd socket activation metadata." },
      { env: "SYSTEMD_SOCKET_FD", defaultValue: "", purpose: "Явный override унаследованного socket fd." },
    ],
  },
];

export const SHELL_ENV_GROUPS: EnvGroup[] = [
  {
    title: "ShellMCP — ядро",
    icon: KeyRound,
    scope: "go-shellmcp/internal/server/server.go",
    rows: [
      { env: "SHELL_TOKEN or SHELLMCP_TOKEN", defaultValue: "srv_secret", purpose: "Bearer token for shellmcp HTTP API." },
      { env: "SHELL_PORT or SHELLMCP_PORT or PORT", defaultValue: "25900", purpose: "Listen port." },
      { env: "SHELL_HOST or SHELLMCP_HOST", defaultValue: "", purpose: "Listen host. Empty usually means all interfaces." },
      { env: "SHELL_NAME or SHELLMCP_NAME", defaultValue: "", purpose: "Logical server name advertised to hub." },
      { env: "SHELL_URL or SHELLMCP_URL", defaultValue: "http://127.0.0.1:<port>", purpose: "Public base URL advertised to hub." },
      { env: "HUB_URL", defaultValue: "", purpose: "Hub heartbeat/register base URL." },
      { env: "SHELL_IDENTITY_DIR or SHELLMCP_IDENTITY_DIR", defaultValue: "/etc/gptadmin", purpose: "Directory with shell identity and hub public key files." },
      { env: "HUB_PUBLIC_KEY_FILE", defaultValue: "<identity_dir>/hub_ed25519.pub", purpose: "Hub public key file used to verify signed traffic." },
      { env: "HUB_PUBLIC_KEY", defaultValue: "", purpose: "Inline hub public key override." },
    ],
  },
  {
    title: "ShellMCP — поведение",
    icon: Server,
    scope: "go-shellmcp/internal/server/server.go",
    rows: [
      { env: "LOG_LIMIT_B", defaultValue: "8192", purpose: "Max bytes kept from command output logs." },
      { env: "EXEC_TIMEOUT", defaultValue: "300", purpose: "Default exec timeout in seconds." },
      { env: "SHELL_SPOOL_DIR or SHELLMCP_SPOOL_DIR", defaultValue: "tempdir/shellmcp-go-spool", purpose: "Spool root for task data." },
      { env: "SHELL_OUTBOX_DIR or SHELLMCP_OUTBOX_DIR", defaultValue: "<spool>/outbox", purpose: "Outbox for queued responses." },
      { env: "SHELL_MODE or SHELLMCP_MODE", defaultValue: "", purpose: "Explicit runtime mode override." },
      { env: "SHELL_QUEUE or SHELLMCP_QUEUE", defaultValue: "0", purpose: "Enable queue polling mode." },
      { env: "QUEUE_LONG_POLL_TIMEOUT_S", defaultValue: "55", purpose: "Long-poll timeout for queue mode." },
      { env: "HB_INTERVAL_S", defaultValue: "60", purpose: "Heartbeat interval in seconds." },
      { env: "SHELL_HEARTBEAT or SHELLMCP_HEARTBEAT", defaultValue: "0", purpose: "Enable periodic heartbeat to hub." },
    ],
  },
  {
    title: "ShellMCP — exec по умолчанию",
    icon: Settings2,
    scope: "go-shellmcp/internal/server/server.go",
    rows: [
      { env: "SHELL_DEFAULT_USER or SHELLMCP_DEFAULT_USER", defaultValue: "", purpose: "Default OS user for command execution." },
      { env: "SHELL_DEFAULT_HOME or SHELLMCP_DEFAULT_HOME", defaultValue: "", purpose: "Default HOME for execution context." },
      { env: "SHELL_DEFAULT_CWD or SHELLMCP_DEFAULT_CWD", defaultValue: "SHELL_DEFAULT_HOME", purpose: "Default working directory." },
    ],
  },
];

export const HUB_DETAIL_ROWS: DetailRow[] = [
  {
    name: "Роль",
    value: "control plane / auth / routing / OAuth / relay / admin UI",
    notes: "Hub не исполняет shell-команды на удалённых хостах сам. Он хранит реестр, выдаёт auth и маршрутизирует вызовы.",
  },
  {
    name: "Главный код",
    value: "gptadmin_hub.py",
    notes: "Основной HTTP-сервис с admin API, OAuth, relay, queue fallback и legacy shell endpoints.",
  },
  {
    name: "Главные публичные endpoint'ы",
    value: "/admin, /mcp, /mcp-relay/*",
    notes: "С точки зрения современного клиента это три разные поверхности: admin UI, remote MCP endpoint и admin relay API.",
  },
  {
    name: "Legacy/internal endpoint'ы",
    value: "/servers, /srv/*, /tasks/*, /queue/*, /ws/shellmcp",
    notes: "Оставлены как fallback и transport-level plumbing.",
  },
  {
    name: "Основные runtime файлы",
    value: "config/*.json, outputs/, transfers/, artifacts/",
    notes: "Пути по умолчанию строятся от GPTADMIN_CONFIG_DIR и GPTADMIN_ARTIFACT_DIR.",
  },
  {
    name: "systemd",
    value: "deploy/systemd/gptadmin_hub.service",
    notes: "В репо есть unit для hub; actual deployment может переопределять пути и env.",
  },
];

export const HUB_FUNCTION_ROWS: DetailRow[] = [
  {
    name: "Auth",
    value: "CTL_TOKEN, ADMIN_PASSWORD, OAUTH_CLIENT_SECRET",
    notes: "Разделение уже описано выше: admin bearer, OAuth password и server signing secret.",
  },
  {
    name: "Server registry",
    value: "POST /heartbeat + approved/pending state",
    notes: "ShellMCP присылает подписанный heartbeat; hub решает active/pending/fingerprint_changed.",
  },
  {
    name: "Shell transport",
    value: "signed direct shellmcp calls + queue fallback",
    notes: "Hub может стучаться напрямую в shellmcp и может использовать signed queue transport при polling-mode.",
  },
  {
    name: "MCP relay",
    value: "register/poll/result job broker",
    notes: "Реальные MCP агенты общаются с hub через отдельный relay transport.",
  },
  {
    name: "Remote MCP server",
    value: "GET/POST /mcp",
    notes: "Это OAuth-protected MCP endpoint для клиентов вроде Codex, Claude Desktop и OpenCode.",
  },
  {
    name: "Artifacts/update",
    value: "/artifacts/shellmcp.json + /artifacts/shellmcp.tar.gz",
    notes: "Hub раздаёт runtime artifact для shellmcp bootstrap/update.",
  },
];

export const HUB_PATH_ROWS: DetailRow[] = [
  {
    name: "CONFIG_DIR",
    value: "GPTADMIN_CONFIG_DIR or repo/config",
    notes: "База для approved_servers.json, pending_servers.json, hub_*_state.json и других JSON state файлов.",
  },
  {
    name: "ARTIFACT_DIR",
    value: "GPTADMIN_ARTIFACT_DIR or derived build dir",
    notes: "Здесь лежат gptadmin-shellmcp.tar.gz и gptadmin-shellmcp.json.",
  },
  {
    name: "AUDIT_LOG",
    value: "GPTADMIN_AUDIT_LOG or /var/log/gptadmin/audit.log",
    notes: "Отдельный audit log; часть путей исключена из audit spam.",
  },
  {
    name: "OUTPUT_STORE_DIR",
    value: "HUB_OUTPUT_STORE_DIR or CONFIG_DIR/outputs",
    notes: "Спилл больших результатов, чтобы не рвать transport по размеру ответа.",
  },
  {
    name: "TRANSFERS_DIR",
    value: "GPTADMIN_TRANSFERS_DIR or CONFIG_DIR/transfers",
    notes: "Промежуточное хранилище для file transfer workflow.",
  },
];

export const SHELL_DETAIL_ROWS: DetailRow[] = [
  {
    name: "Роль",
    value: "durable execution transport on the host",
    notes: "ShellMCP живёт на конкретной машине и реально исполняет команды, а не маршрутизирует их.",
  },
  {
    name: "Главный код",
    value: "go-shellmcp/cmd/shellmcp-go + internal/server/server.go",
    notes: "Go-реализация теперь основной transport; старая Python-версия помечена deprecated.",
  },
  {
    name: "Главные endpoint'ы",
    value: "/exec, /exec/live, /jobs/<id>, /system/info, /system/health, /file",
    notes: "Есть buffered exec, live NDJSON stream, background jobs и чтение spool files.",
  },
  {
    name: "Транспортные режимы",
    value: "webhook or long_poll",
    notes: "SHELL_MODE и SHELL_QUEUE/SHELL_HEARTBEAT определяют heartbeat и queue behavior.",
  },
  {
    name: "systemd compatibility",
    value: "service name shellmcp.service is kept",
    notes: "В проде имя сервиса может оставаться legacy, даже если исполняется Go binary.",
  },
];

export const SHELL_FUNCTION_ROWS: DetailRow[] = [
  {
    name: "Process execution",
    value: "timeouts + process-group kill + bounded RAM",
    notes: "Главная задача Go transport: не держать неограниченный stdout/stderr в памяти.",
  },
  {
    name: "Streaming",
    value: "/exec/live NDJSON",
    notes: "Hub умеет использовать live path, а при отсутствии fallback'нуться к buffered exec.",
  },
  {
    name: "Background jobs",
    value: "{\"background\": true} + GET /jobs/<id>",
    notes: "Долгие команды могут уходить в background и потом опрашиваться по job id.",
  },
  {
    name: "Queue mode",
    value: "signed long-poll queue runner",
    notes: "Используется, когда shellmcp не принимает прямой входящий HTTP и сам опрашивает hub.",
  },
  {
    name: "Heartbeat",
    value: "optional signed heartbeat to hub",
    notes: "Hub сверяет подпись, server_id, fingerprint и approved identity.",
  },
  {
    name: "User defaults",
    value: "SHELL_DEFAULT_USER / HOME / CWD",
    notes: "Непривилегированные команды можно по умолчанию запускать от отдельного юзера.",
  },
];

export const SHELL_PATH_ROWS: DetailRow[] = [
  {
    name: "Identity dir",
    value: "SHELL_IDENTITY_DIR or /etc/gptadmin",
    notes: "Там живут shellmcp_ed25519, shellmcp_identity.json и hub public key file.",
  },
  {
    name: "Spool dir",
    value: "SHELL_SPOOL_DIR or tempdir/shellmcp-go-spool",
    notes: "Корневая spool-директория для больших output и internal runtime state.",
  },
  {
    name: "Outbox dir",
    value: "SHELL_OUTBOX_DIR or <spool>/outbox",
    notes: "Нужен для durable queue result delivery.",
  },
  {
    name: "Hub URL",
    value: "HUB_URL",
    notes: "Базовый URL hub для heartbeat/register/update bootstrap.",
  },
];

export const TUNNEL_DETAIL_ROWS: DetailRow[] = [
  {
    name: "Роль",
    value: "public ingress to hub",
    notes: "Tunnel не исполняет команды и не знает про shellmcp semantics; он только делает hub доступным извне.",
  },
  {
    name: "Основной документ",
    value: "TUNNELS.md",
    notes: "Там уже есть quick start, архитектура и security notes по backend'ам.",
  },
  {
    name: "Точка входа",
    value: "TUNNEL_TYPE=... uv run python -m gptadmin.hub",
    notes: "Судя по текущим докам, tunnel orchestration живёт в hub launcher и подключает backend автоматически.",
  },
];

export const TUNNEL_BACKENDS: TunnelBackendRow[] = [
  {
    backend: "Cloudflare Quick Tunnel",
    purpose: "временный публичный URL без аккаунта",
    env: "TUNNEL_TYPE=cloudflare",
    urlShape: "https://random-words.trycloudflare.com/mcp",
    notes: "Хорошо для теста. URL меняется после рестарта. Нет стабильного custom domain в этом quick режиме.",
  },
  {
    backend: "FRP",
    purpose: "свой VPS / полный контроль над ingress",
    env: "TUNNEL_TYPE=frp, FRP_SERVER_ADDR, FRP_SERVER_PORT, FRP_TOKEN, FRP_SUBDOMAIN, FRP_DOMAIN",
    urlShape: "https://subdomain.example.com/mcp",
    notes: "Лучший вариант, если нужен стабильный URL и не хочется отдавать ingress стороннему SaaS.",
  },
  {
    backend: "None / local",
    purpose: "без туннеля, свой reverse proxy или localhost",
    env: "TUNNEL_TYPE=none",
    urlShape: "http(s)://your-host/mcp",
    notes: "Полезно, если hub уже стоит на VPS или закрыт вашим nginx/caddy.",
  },
];

export const RELAY_DETAIL_ROWS: DetailRow[] = [
  {
    name: "Роль",
    value: "job broker between admin API and real MCP agents",
    notes: "Relay нужен не для shellmcp-хостов, а для настоящих MCP capability agents, которые регистрируются отдельно.",
  },
  {
    name: "Auth",
    value: "admin side: CTL_TOKEN; agent side: MCP_RELAY_AGENT_TOKEN",
    notes: "Это два разных контекста: пользователь вызывает relay через admin API, агент общается с backend relay endpoints.",
  },
  {
    name: "Virtual agents",
    value: "hub + shell:<server_name>",
    notes: "Hub и shell-сервера показываются GPT как MCP agents, чтобы у модели был единый mental model.",
  },
  {
    name: "Real relay agents",
    value: "POST /mcp-relay/register + GET /poll + POST /result",
    notes: "Это отдельные внешние агенты, которые тянут задания long-poll'ом и возвращают result.",
  },
];

export const RELAY_FLOW_ROWS: DetailRow[] = [
  {
    name: "1. Admin request",
    value: "POST /mcp-relay/tools or /mcp-relay/call with CTL_TOKEN",
    notes: "Пользователь или admin UI вызывает relay API и явно указывает target agent.",
  },
  {
    name: "2. Target select",
    value: "hub / virtual shell / real relay agent",
    notes: "Hub может ответить сразу для target=hub, для shell:<server> маппит вызов на shell tools, а для real agent ставит job в очередь relay.",
  },
  {
    name: "3. Enqueue",
    value: "mcp_relay_jobs + retry_policy",
    notes: "Для real agent создаётся job; при offline agent возможен queued_offline если policy это разрешает.",
  },
  {
    name: "4. Agent poll",
    value: "GET /mcp-relay/poll/{agent_id}",
    notes: "Агент long-poll'ит hub, получает следующее queued задание и обновляет last_seen.",
  },
  {
    name: "5. Tool execution",
    value: "agent runs actual MCP tool locally",
    notes: "Hub не выполняет сам real agent tool, а лишь доставляет задание и ждёт результат.",
  },
  {
    name: "6. Result return",
    value: "POST /mcp-relay/result/{agent_id}",
    notes: "Hub принимает payload, при необходимости spill'ит large response, обновляет job status и аудит.",
  },
  {
    name: "7. Consumer read",
    value: "GET /mcp-relay/job/{job_id}",
    notes: "Admin UI или клиент забирает completed/failed result по job id.",
  },
];
