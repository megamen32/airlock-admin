"use client";

import { ArrowRight, Boxes, BrainCircuit, Cpu, Plug, Server, Terminal, Check, Copy, Radio } from "lucide-react";
import { PageHero, Step } from "../page-hero";
import { Reveal, Stagger, StaggerItem } from "../reveal";
import { InstallCommand } from "../install-command";
import { useCopy } from "@/hooks/use-copy";
import { useHashRoute } from "@/hooks/use-hash-route";

const CLIENTS = [
  { name: "Claude Desktop", icon: BrainCircuit },
  { name: "Codex", icon: Terminal },
  { name: "OpenCode", icon: Cpu },
];

// MCP remote SSE (Streamable HTTP) config — OAuth flow happens against /mcp.
const MCP_CONFIG = `{
  "mcpServers": {
    "gptadmin": {
      "type": "http",
      "url": "https://your-hub.example.com/mcp"
    }
  }
}`;

const CODEX_LOCAL_MCP_COMMAND = "bash <<'SH'\nset -euo pipefail\nENV_FILE=\"${GPTADMIN_CONFIG_DIR:-$HOME/.config/gptadmin}/gptadmin.env\"\n[ -f \"$ENV_FILE\" ] || { echo \"Не найден $ENV_FILE. Сначала установите GPT-Админ.\" >&2; exit 1; }\ncommand -v codex >/dev/null || { echo \"Не найден codex CLI.\" >&2; exit 1; }\nmkdir -p \"$HOME/.config/gptadmin\" \"$HOME/.codex\"\n\npython3 - \"$ENV_FILE\" > \"$HOME/.config/gptadmin/codex-mcp-token.env\" <<'PY'\nfrom pathlib import Path\nimport base64, hashlib, hmac, json, os, time, sys\n\ndef read_env(path):\n    env = {}\n    for line in Path(path).read_text().splitlines():\n        line = line.strip()\n        if not line or line.startswith(\"#\") or \"=\" not in line:\n            continue\n        k, v = line.split(\"=\", 1)\n        env[k] = v.strip().strip('\"').strip(\"'\")\n    return env\n\ndef b64url(data):\n    return base64.urlsafe_b64encode(data).rstrip(b\"=\").decode()\n\nenv = read_env(sys.argv[1])\nsecret = env.get(\"OAUTH_CLIENT_SECRET\")\nif not secret:\n    raise SystemExit(\"В gptadmin.env нет OAUTH_CLIENT_SECRET; обновите GPT-Админ или переустановите hub.\")\norigin = (env.get(\"HUB_PUBLIC_URL\") or env.get(\"PUBLIC_ORIGIN\") or \"http://127.0.0.1:9001\").rstrip(\"/\")\nresource = (env.get(\"MCP_RESOURCE\") or origin).rstrip(\"/\")\nnow = int(time.time())\nheader = {\"alg\": \"HS256\", \"typ\": \"JWT\"}\npayload = {\n    \"sub\": \"admin\",\n    \"scope\": \"gptadmin.read gptadmin.exec\",\n    \"client_id\": \"codex-local\",\n    \"iss\": origin,\n    \"aud\": resource,\n    \"iat\": now,\n    \"exp\": now + 365 * 24 * 3600,\n}\nmsg = f\"{b64url(json.dumps(header, separators=(',', ':')).encode())}.{b64url(json.dumps(payload, separators=(',', ':')).encode())}\".encode()\ntoken = msg.decode() + \".\" + b64url(hmac.new(secret.encode(), msg, hashlib.sha256).digest())\nprint(\"export GPTADMIN_CODEX_MCP_BEARER=\" + json.dumps(token))\nPY\nchmod 600 \"$HOME/.config/gptadmin/codex-mcp-token.env\"\n# shellcheck disable=SC1090\n. \"$HOME/.config/gptadmin/codex-mcp-token.env\"\nlaunchctl setenv GPTADMIN_CODEX_MCP_BEARER \"$GPTADMIN_CODEX_MCP_BEARER\" 2>/dev/null || true\n\ncodex mcp remove gptadmin >/dev/null 2>&1 || true\ncodex mcp add gptadmin --url http://127.0.0.1:9001/mcp --bearer-token-env-var GPTADMIN_CODEX_MCP_BEARER\ncodex mcp get gptadmin\nprintf '\\nГотово. Для Codex Desktop перезапустите приложение, чтобы оно увидело launchctl env.\\n'\nprintf 'Для Codex CLI в новом терминале выполните: source ~/.config/gptadmin/codex-mcp-token.env\\n'\nSH";

export function McpServerPage() {
  const { navigate } = useHashRoute();

  return (
    <>
      <PageHero
        eyebrow="Адаптер 2 · MCP remote SSE"
        title={
          <>
            MCP‑сервер для{" "}
            <span className="text-gradient-violet">Claude · Codex · OpenCode</span>
          </>
        }
        lead="GPT‑Админ — это MCP remote SSE (Streamable HTTP). Подключите его в настройках клиента — и AI получает единый доступ ко всей инфраструктуре через нативные tool calls. Тот же хаб, что и для других адаптеров."
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.06] px-3 py-1.5 text-xs font-medium text-primary">
          <Radio className="h-3.5 w-3.5" />
          MCP remote SSE · Streamable HTTP
        </div>
        <div className="w-full max-w-xl">
          <InstallCommand variant="compact" />
        </div>
      </PageHero>

      {/* Clients + diagram */}
      <section className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal className="flex flex-col items-start">
              <h2 className="display text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                Один мост —{" "}
                <span className="text-gradient-violet">все сервера</span>
              </h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
                Hub проксирует команды, shellmcp исполняет их локально. Любой
                MCP‑совместимый клиент получает доступ к Linux, macOS и Windows машинам.
              </p>

              <Stagger className="mt-7 flex w-full flex-col gap-3" stagger={0.08}>
                {[
                  "Нативные tool calls — без copy‑paste",
                  "Любой MCP ставится один раз — доступен всем агентам",
                  "Команды выполняются локально, результат возвращается агенту",
                ].map((p) => (
                  <StaggerItem key={p}>
                    <div className="flex items-start gap-3 text-sm text-foreground/85">
                      <span className="mt-1.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      </span>
                      {p}
                    </div>
                  </StaggerItem>
                ))}
              </Stagger>

              {/* openmemory quote */}
              <Reveal className="mt-7 w-full">
                <div className="surface relative overflow-hidden rounded-2xl p-5">
                  <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 glow-violet blur-2xl opacity-60" aria-hidden />
                  <div className="relative flex items-start gap-3">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/[0.06]">
                      <Boxes className="h-4 w-4 text-primary" />
                    </span>
                    <div>
                      <p className="text-sm leading-relaxed text-foreground/90">
                        Я лично установил{" "}
                        <a
                          href="https://github.com/CaviraOSS/OpenMemory"
                          target="_blank"
                          rel="noopener"
                          className="font-mono text-primary underline decoration-primary/40 underline-offset-2 transition-colors hover:decoration-primary"
                        >
                          openmemory
                        </a>{" "}
                        — чтобы разные ИИ знали всё о моих проектах.
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            </Reveal>

            {/* Diagram */}
            <Reveal delay={0.1}>
              <div className="surface relative mx-auto w-full max-w-md overflow-hidden rounded-3xl p-7 sm:p-9">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-40 glow-violet blur-3xl opacity-50" aria-hidden />
                <p className="relative mb-3 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground/70">
                  Ваш AI
                </p>
                <div className="relative grid grid-cols-3 gap-2.5">
                  {CLIENTS.map((c) => (
                    <div key={c.name} className="flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-white/[0.02] px-2 py-3">
                      <c.icon className="h-4 w-4 text-primary" />
                      <span className="text-[11px] font-medium text-foreground/85">{c.name}</span>
                    </div>
                  ))}
                </div>
                <Connector />
                <div className="relative mx-auto mt-1 flex max-w-[15rem] items-center justify-center gap-3 rounded-2xl border border-primary/35 bg-primary/[0.08] px-5 py-4 backdrop-blur-md">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15">
                    <Plug className="h-4 w-4 text-primary" />
                  </span>
                  <div className="text-left">
                    <p className="text-sm font-semibold tracking-tight">GPT‑Админ</p>
                    <p className="font-mono text-[11px] text-muted-foreground">MCP hub</p>
                  </div>
                </div>
                <Connector />
                <p className="relative mb-3 mt-1 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground/70">
                  Ваши серверы
                </p>
                <div className="relative flex flex-col gap-2">
                  {["server-01", "vps-prod", "home-lab"].map((s) => (
                    <div key={s} className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-white/[0.02] px-3 py-2">
                      <Server className="h-3.5 w-3.5 text-primary/70" />
                      <span className="font-mono text-xs text-foreground/80">{s}</span>
                      <span className="ml-auto inline-flex h-1.5 w-1.5 rounded-full bg-primary/70 shadow-[0_0_8px_1px] shadow-primary/40" />
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Step-by-step + config */}
      <section className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <Reveal className="mb-12 text-center">
            <h2 className="display text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Подключение за{" "}
              <span className="text-gradient-violet">4 шага</span>
            </h2>
          </Reveal>

          <Stagger className="flex flex-col gap-7" stagger={0.1}>
            <StaggerItem>
              <Step n={1} title="Установите hub и shellmcp">
                Ставите hub‑proxy и shellmcp на главный ПК/VPS, только shellmcp — на
                остальные машины. После установки выдадут Hub URL и CTL_TOKEN.
                <div className="mt-3">
                  <InstallCommand variant="compact" />
                </div>
              </Step>
            </StaggerItem>
            <StaggerItem>
              <Step n={2} title="Добавьте MCP‑сервер в клиент">
                В настройках вашего клиента (Claude Desktop →{" "}
                <code className="font-mono text-[#c4a3f8]">claude_desktop_config.json</code>,
                Codex, OpenCode) добавьте GPT‑Админ как MCP remote SSE (Streamable HTTP):
                <ConfigBlock />
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Этот endpoint проходит через OAuth flow. Не подставляйте сюда{" "}
                  <code>CTL_TOKEN</code> вручную как bearer для <code>/mcp</code>.
                  Для подробностей смотрите раздел <code>#/docs</code>.
                </p>
                <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/[0.04] p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Terminal className="h-4 w-4 text-primary" />
                    Codex на macOS: добавить локальный MCP без переустановки
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Если GPT‑Админ уже установлен и hub работает на{" "}
                    <code>http://127.0.0.1:9001/mcp</code>, выполните одну команду ниже.
                    Она выпускает Codex‑токен из локального <code>gptadmin.env</code>, прописывает{" "}
                    <code>bearer_token_env_var</code> и заменяет старый no‑auth MCP entry.
                  </p>
                  <CommandBlock label="macOS · Codex CLI/Desktop" command={CODEX_LOCAL_MCP_COMMAND} />
                </div>
              </Step>
            </StaggerItem>
            <StaggerItem>
              <Step n={3} title="Перезапустите клиент">
                Claude Desktop / Codex / OpenCode подхватит новый MCP‑сервер при
                следующем запуске. Проверьте, что в списке tools появились команды.
              </Step>
            </StaggerItem>
            <StaggerItem>
              <Step n={4} title="Пишите простыми словами">
                «Поставь WireGuard», «почини nginx». AI сам вызывает нужные tools,
                выполняет команды через hub и возвращает отчёт.
              </Step>
            </StaggerItem>
          </Stagger>
        </div>
      </section>

      {/* Cross-link */}
      <section className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="surface relative overflow-hidden rounded-2xl p-7 sm:p-9">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 glow-violet blur-3xl opacity-50" aria-hidden />
            <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-semibold tracking-tight">Нет платного AI? Подойдёт расширение</h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  Браузерное расширение превращает бесплатные веб‑ИИ (Qwen, GigaChat,
                  Алису) в GPT‑Админ — без API и подписок.
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => navigate("mcp-extension")}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
                >
                  Расширение <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate("chatgpt")}
                  className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-white/[0.02] px-4 py-2.5 text-sm font-medium transition-colors hover:border-primary/40"
                >
                  Custom GPT <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function Connector() {
  return (
    <div className="relative mx-auto my-2 h-7 w-px bg-gradient-to-b from-primary/50 to-primary/10" aria-hidden>
      <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_10px_2px] shadow-primary/50" />
    </div>
  );
}

function CommandBlock({ label, command }: { label: string; command: string }) {
  const { copied, copy } = useCopy();
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-border/60 bg-[oklch(0.12_0.006_290)]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3.5 py-2">
        <span className="font-mono text-[11px] text-muted-foreground">{label}</span>
        <button
          type="button"
          onClick={() => copy(command)}
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-primary"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "скопировано" : "копировать"}
        </button>
      </div>
      <pre className="nice-scroll max-h-[28rem] overflow-x-auto px-3.5 py-3 font-mono text-[12px] leading-relaxed text-foreground/85">
{command}
      </pre>
    </div>
  );
}

function ConfigBlock() {
  const { copied, copy } = useCopy();
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-border/60 bg-[oklch(0.12_0.006_290)]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3.5 py-2">
        <span className="font-mono text-[11px] text-muted-foreground">claude_desktop_config.json</span>
        <button
          type="button"
          onClick={() => copy(MCP_CONFIG)}
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-primary"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "скопировано" : "копировать"}
        </button>
      </div>
      <pre className="nice-scroll overflow-x-auto px-3.5 py-3 font-mono text-[12px] leading-relaxed text-foreground/85">
{MCP_CONFIG}
      </pre>
    </div>
  );
}
