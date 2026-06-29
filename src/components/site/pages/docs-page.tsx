"use client";

import {
  Activity,
  Apple,
  KeyRound,
  LayoutDashboard,
  Lock,
  Monitor,
  Radio,
  Server,
  Terminal,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { PageHero } from "../page-hero";
import { Reveal, Stagger, StaggerItem } from "../reveal";
import { Eyebrow } from "../section-heading";
import { useCopy } from "@/hooks/use-copy";
import { Check, Copy } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

/** What the /admin web panel shows. */
const PANEL_FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Activity, title: "Очередь заданий", body: "Активные и завершённые задачи каждого агента — статус, время, результат." },
  { icon: Server, title: "Здоровье агентов и MCP", body: "Список shellmcp-агентов и подключённых MCP (openmemory, chrome-devtools…) с live-статусом online/offline." },
  { icon: LayoutDashboard, title: "Логи", body: "Журнал команд и выводов — читайте прямо с сайта, без SSH и терминала." },
];

/** Install paths per OS. */
const INSTALL_PATHS: { icon: LucideIcon; os: string; userMode: string; systemMode: string; note: string }[] = [
  {
    icon: Terminal,
    os: "Linux",
    userMode: "~/.local/share/gptadmin",
    systemMode: "/opt/gptadmin",
    note: "user-service через systemctl --user. System: systemd unit, конфиг в /etc/gptadmin.",
  },
  {
    icon: Apple,
    os: "macOS",
    userMode: "~/.local/share/gptadmin",
    systemMode: "/opt/gptadmin",
    note: "user-mode через LaunchAgents. System: LaunchDaemons, конфиг в /etc/gptadmin.",
  },
  {
    icon: Monitor,
    os: "Windows",
    userMode: "%LOCALAPPDATA%\\gptadmin",
    systemMode: "C:\\Program Files\\gptadmin",
    note: "user-mode: Scheduled Task на вход пользователя. Administrator нужен только для system-mode.",
  },
];

export function DocsPage() {
  return (
    <>
      <PageHero
        eyebrow="Документация"
        title={
          <>
            Веб‑панель, MCP endpoint,{" "}
            <span className="text-gradient-violet">OAuth и пути установки</span>
          </>
        }
        lead="Куда идти, что настраивать и где что лежит — короткие рецепты для каждого случая."
      />

      {/* Web panel /admin */}
      <DocSection
        id="admin"
        icon={LayoutDashboard}
        title="Веб‑панель"
        kicker="/admin"
        lead="Управление хабом из браузера — без терминала."
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          Откройте{" "}
          <Endpoint href="https://your-hub.bezrabotnyi.com/admin">/admin</Endpoint>{" "}
          на вашем хабе. Здесь видна вся картина в одном окне:
        </p>
        <Stagger className="mt-5 grid gap-3 sm:grid-cols-3" stagger={0.08}>
          {PANEL_FEATURES.map((f) => (
            <StaggerItem key={f.title}>
              <div className="surface surface-hover h-full rounded-xl p-4">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-primary/20 bg-primary/[0.06]">
                  <f.icon className="h-4 w-4 text-primary" />
                </span>
                <h4 className="mt-3 text-sm font-semibold tracking-tight">{f.title}</h4>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </DocSection>

      {/* MCP endpoint /mcp */}
      <DocSection
        id="mcp"
        icon={Radio}
        title="MCP endpoint"
        kicker="/mcp"
        lead="Сюда направляйте клиентов, которые работают через MCP remote SSE."
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          Хаб отдаёт MCP remote SSE (Streamable HTTP) на пути{" "}
          <Endpoint href="https://your-hub.bezrabotnyi.com/mcp">/mcp</Endpoint>.
          Это точка подключения для Claude Desktop, Codex, OpenCode и любого
          другого MCP‑клиента. Конфиг для клиента:
        </p>
        <ConfigBlock
          label="claude_desktop_config.json"
          config={`{
  "mcpServers": {
    "gptadmin": {
      "type": "http",
      "url": "https://your-hub.bezrabotnyi.com/mcp",
      "headers": {
        "Authorization": "Bearer  YOUR_CTL_TOKEN"
      }
    }
  }
}`}
        />
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          Подробнее — на странице{" "}
          <a href="#/mcp-server" className="text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary">
            MCP сервер
          </a>
          .
        </p>
      </DocSection>

      {/* OAuth */}
      <DocSection
        id="oauth"
        icon={Lock}
        title="OAuth для OpenAI SDK"
        kicker="OpenAI SDK OAuth"
        lead="Поддерживается OAuth-флоу для OpenAI SDK — клиенты могут подключаться через OAuth, а не по статичному Bearer-ключу."
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          Хаб реализует OAuth-эндпоинты, совместимые с OpenAI SDK OAuth. Это
          позволяет агентам получать токен через стандартный OAuth-флоу вместо
          ручной вставки Bearer-ключа.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="surface rounded-xl p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
              где задать пароль
            </p>
            <p className="mt-2 text-sm text-foreground/90">
              В веб‑панели{" "}
              <Endpoint href="https://your-hub.bezrabotnyi.com/admin">/admin</Endpoint>{" "}
              → раздел «Security» → задайте пароль для OAuth-клиентов. Хаб сгенерирует
              client_id/client_secret и endpoints.
            </p>
          </div>
          <div className="surface rounded-xl p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
              endpoints
            </p>
            <div className="mt-2 flex flex-col gap-1.5 font-mono text-[12px] text-foreground/85">
              <span><span className="text-primary/70">POST</span> /oauth/authorize</span>
              <span><span className="text-primary/70">POST</span> /oauth/token</span>
              <span><span className="text-primary/70">GET</span>  /.well-known/oauth-authorization-server</span>
            </div>
          </div>
        </div>
      </DocSection>

      {/* Install paths by OS */}
      <DocSection
        id="paths"
        icon={Server}
        title="Куда ставится GPT‑Админ"
        kicker="пути установки"
        lead="User-mode (без sudo) и system-mode (с sudo) — на каждой ОС свои пути."
      >
        <Stagger className="grid gap-4 lg:grid-cols-3" stagger={0.1}>
          {INSTALL_PATHS.map((p) => (
            <StaggerItem key={p.os}>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: EASE }}
                className="surface surface-hover flex h-full flex-col rounded-2xl p-5"
              >
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-primary/20 bg-primary/[0.06]">
                    <p.icon className="h-4 w-4 text-primary" />
                  </span>
                  <h4 className="text-base font-semibold tracking-tight">{p.os}</h4>
                </div>

                <div className="mt-4 flex flex-col gap-2.5">
                  <PathRow label="user-mode" path={p.userMode} />
                  <PathRow label="system-mode" path={p.systemMode} />
                </div>

                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{p.note}</p>
              </motion.div>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal className="mt-6">
          <div className="surface flex items-start gap-3 rounded-xl border-l-2 border-primary/40 p-4">
            <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">По умолчанию — user-mode.</span>{" "}
              Установщик сам определяет режим: без sudo — user-mode в домашней папке,
              с sudo — system-mode. Свой домен не нужен: авто‑туннель через FRP даёт
              публичный URL.
            </p>
          </div>
        </Reveal>
      </DocSection>
    </>
  );
}

/* ---------- helpers ---------- */

function DocSection({
  id,
  icon: Icon,
  title,
  kicker,
  lead,
  children,
}: {
  id: string;
  icon: LucideIcon;
  title: string;
  kicker: string;
  lead: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="relative scroll-mt-24 py-16 sm:py-20">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <Reveal className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/[0.06]">
              <Icon className="h-5 w-5 text-primary" />
            </span>
            <div>
              <Eyebrow>{kicker}</Eyebrow>
              <h2 className="display text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">{lead}</p>
        </Reveal>
        <Reveal delay={0.08} className="mt-6">
          {children}
        </Reveal>
      </div>
    </section>
  );
}

function Endpoint({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <code className="rounded border border-primary/30 bg-primary/[0.06] px-1.5 py-0.5 font-mono text-[13px] text-primary">
      {children}
    </code>
  );
}

function PathRow({ label, path }: { label: string; path: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/60">{label}</span>
      <code className="rounded border border-border/50 bg-[oklch(0.12_0.006_290)] px-2 py-1 font-mono text-[12px] text-foreground/85">
        {path}
      </code>
    </div>
  );
}

function ConfigBlock({ label, config }: { label: string; config: string }) {
  const { copied, copy } = useCopy();
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-border/60 bg-[oklch(0.12_0.006_290)]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3.5 py-2">
        <span className="font-mono text-[11px] text-muted-foreground">{label}</span>
        <button
          type="button"
          onClick={() => copy(config)}
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-primary"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "скопировано" : "копировать"}
        </button>
      </div>
      <pre className="nice-scroll overflow-x-auto px-3.5 py-3 font-mono text-[12px] leading-relaxed text-foreground/85">
{config}
      </pre>
    </div>
  );
}
