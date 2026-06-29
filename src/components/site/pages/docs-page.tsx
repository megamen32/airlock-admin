"use client";

import {
  Check,
  Copy,
  type LucideIcon,
  ShieldAlert,
} from "lucide-react";
import { motion } from "framer-motion";
import { PageHero } from "../page-hero";
import { Eyebrow } from "../section-heading";
import { Reveal } from "../reveal";
import { useCopy } from "@/hooks/use-copy";
import {
  AUTH_VARIABLES,
  ENDPOINT_ROWS,
  HUB_ENV_GROUPS,
  HUB_DETAIL_ROWS,
  HUB_FUNCTION_ROWS,
  HUB_PATH_ROWS,
  QUICK_SNIPPETS,
  RELAY_DETAIL_ROWS,
  RELAY_FLOW_ROWS,
  SHELL_ENV_GROUPS,
  SHELL_DETAIL_ROWS,
  SHELL_FUNCTION_ROWS,
  SHELL_PATH_ROWS,
  TUNNEL_BACKENDS,
  TUNNEL_DETAIL_ROWS,
  type DetailRow,
  type EnvGroup,
} from "../docs-reference";

const EASE = [0.16, 1, 0.3, 1] as const;

export function DocsPage() {
  return (
    <>
      <PageHero
        eyebrow="Документация"
        title={
          <>
            Не лендинг, а{" "}
            <span className="text-gradient-violet">справка по auth, endpoint и env</span>
          </>
        }
        lead="Ниже перечислены реальные переменные окружения и реальные правила auth из кода hub_proxy.py и go-shellmcp."
      />

      <DocSection
        id="truth"
        icon={ShieldAlert}
        title="Аутентификация: что и где используется"
        kicker="важно"
        lead="CTL_TOKEN и OAuth — это разные механизмы. Ниже правильная схема."
      >
        <Callout tone="warn">
          <p>
            <code>/mcp</code> не принимает прямой <code>CTL_TOKEN</code>. Этот endpoint
            требует OAuth bearer token, который hub подписывает через{" "}
            <code>OAUTH_CLIENT_SECRET</code>.
          </p>
          <p className="mt-2">
            <code>CTL_TOKEN</code> нужен для <code>/admin</code>,{" "}
            <code>/admin/api/*</code>, <code>/mcp-relay/*</code>, <code>/servers</code>,
            <code>/tasks/*</code> и artifact endpoints.
          </p>
          <p className="mt-2">
            <code>ADMIN_PASSWORD</code> нужен только для HTML-формы на{" "}
            <code>/authorize</code> внутри OAuth flow.
          </p>
        </Callout>
      </DocSection>

      <DocSection
        id="auth-split"
        icon={ShieldAlert}
        title="Разделение токенов"
        kicker="auth"
        lead="Человеческий смысл каждой переменной и где она реально участвует."
      >
        <DenseTable
          columns={["ENV", "Человеческое имя", "Кто использует", "Куда применяется", "Комментарий"]}
          rows={AUTH_VARIABLES.map((row) => [
            row.env,
            row.label,
            row.usedBy,
            row.appliesTo,
            row.notes,
          ])}
        />
        <CodeBlock
          label="Простой продовый набор"
          code={QUICK_SNIPPETS.envExample}
        />
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Если нужен максимально быстрый onboarding без лишних объяснений, можно дать
          одинаковое значение в <code>CTL_TOKEN</code> и <code>ADMIN_PASSWORD</code>.
          Это две разные роли, но для маленькой установки так проще.
        </p>
      </DocSection>

      <DocSection
        id="endpoints"
        icon={ShieldAlert}
        title="Endpoint и auth-матрица"
        kicker="routes"
        lead="Что чем защищается. Это основной справочный блок, если надо понять почему запрос получает 401."
      >
        <DenseTable
          columns={["Path", "Auth", "Назначение", "Комментарий"]}
          rows={ENDPOINT_ROWS.map((row) => [row.path, row.auth, row.usedFor, row.notes])}
        />
      </DocSection>

      <DocSection
        id="quick-use"
        icon={ShieldAlert}
        title="Быстрые примеры"
        kicker="snippets"
        lead="Минимальные рабочие примеры для admin API, relay API и remote MCP."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <CodeBlock label="Admin API через CTL_TOKEN" code={QUICK_SNIPPETS.adminCurl} />
          <CodeBlock label="Relay API через CTL_TOKEN" code={QUICK_SNIPPETS.relayCurl} />
          <CodeBlock label="MCP клиент на /mcp" code={QUICK_SNIPPETS.mcpConfig} />
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          В конфиге MCP клиента на <code>/mcp</code> не надо вручную писать{" "}
          <code>Authorization: Bearer CTL_TOKEN</code>. Клиент должен пройти OAuth flow
          и получить bearer token через <code>/authorize</code> + <code>/token</code>.
        </p>
      </DocSection>

      <DocSection
        id="hub-env"
        icon={ShieldAlert}
        title="Все ENV для hub"
        kicker="hub_proxy.py"
        lead="Полный список переменных окружения, которые читаются hub_proxy.py напрямую."
      >
        <SubSection
          title="Hub: что это такое"
          lead="Кратко про роль, код, основные пути и функции hub."
        >
          <DetailTable rows={HUB_DETAIL_ROWS} />
        </SubSection>
        <SubSection
          title="Hub: функции"
          lead="Какие обязанности на hub, а какие не на нём."
        >
          <DetailTable rows={HUB_FUNCTION_ROWS} />
        </SubSection>
        <SubSection
          title="Hub: пути и runtime файлы"
          lead="Что лежит где по умолчанию."
        >
          <DetailTable rows={HUB_PATH_ROWS} />
        </SubSection>
        {HUB_ENV_GROUPS.map((group) => (
          <EnvGroupCard key={group.title} group={group} />
        ))}
      </DocSection>

      <DocSection
        id="shell-env"
        icon={ShieldAlert}
        title="Все ENV для shellmcp"
        kicker="go-shellmcp"
        lead="Переменные из go-shellmcp/internal/server/server.go. Здесь перечислены обе формы: новые SHELL_* и совместимые SHELLMCP_*."
      >
        <SubSection
          title="ShellMCP: что это такое"
          lead="Роль агента на хосте и его главные endpoint'ы."
        >
          <DetailTable rows={SHELL_DETAIL_ROWS} />
        </SubSection>
        <SubSection
          title="ShellMCP: функции"
          lead="Что именно делает transport layer на машине."
        >
          <DetailTable rows={SHELL_FUNCTION_ROWS} />
        </SubSection>
        <SubSection
          title="ShellMCP: пути"
          lead="Где identity, spool и outbox."
        >
          <DetailTable rows={SHELL_PATH_ROWS} />
        </SubSection>
        {SHELL_ENV_GROUPS.map((group) => (
          <EnvGroupCard key={group.title} group={group} />
        ))}
      </DocSection>

      <DocSection
        id="tunnel"
        icon={ShieldAlert}
        title="Туннель: Cloudflare и FRP"
        kicker="ingress"
        lead="Tunnel нужен только чтобы открыть hub наружу. Он не заменяет hub и не заменяет shellmcp."
      >
        <SubSection
          title="Tunnel: роль"
          lead="Что делает tunnel layer."
        >
          <DetailTable rows={TUNNEL_DETAIL_ROWS} />
        </SubSection>
        <SubSection
          title="Tunnel backends"
          lead="Краткая сводка по backend'ам из текущих доков."
        >
          <DenseTable
            columns={["Backend", "Для чего", "ENV", "URL", "Комментарий"]}
            rows={TUNNEL_BACKENDS.map((row) => [
              row.backend,
              row.purpose,
              row.env,
              row.urlShape,
              row.notes,
            ])}
          />
        </SubSection>
        <CodeBlock
          label="Cloudflare quick tunnel"
          code={"TUNNEL_TYPE=cloudflare uv run python -m gptadmin.hub"}
        />
        <CodeBlock
          label="FRP"
          code={`TUNNEL_TYPE=frp \\
FRP_SERVER_ADDR=frp.example.com \\
FRP_SERVER_PORT=7000 \\
FRP_TOKEN=your-secret-token \\
FRP_SUBDOMAIN=myhub \\
FRP_DOMAIN=example.com \\
uv run python -m gptadmin.hub`}
        />
      </DocSection>

      <DocSection
        id="relay-transport"
        icon={ShieldAlert}
        title="MCP relay и transport"
        kicker="mcp-relay"
        lead="Как admin API, virtual agents и real relay agents связаны между собой."
      >
        <SubSection
          title="Relay: что это такое"
          lead="Не путать с /mcp remote endpoint."
        >
          <DetailTable rows={RELAY_DETAIL_ROWS} />
        </SubSection>
        <SubSection
          title="Relay transport flow"
          lead="Последовательность прохождения вызова через relay."
        >
          <DetailTable rows={RELAY_FLOW_ROWS} />
        </SubSection>
      </DocSection>

      <DocSection
        id="naming"
        icon={ShieldAlert}
        title="Про название CTL_TOKEN"
        kicker="naming"
        lead="Название историческое и действительно неочевидное."
      >
        <Callout tone="info">
          <p>
            <code>CTL_TOKEN</code> по смыслу это <strong>hub admin bearer</strong> или{" "}
            <strong>control-plane API token</strong>.
          </p>
          <p className="mt-2">
            Пока переменная в коде называется <code>CTL_TOKEN</code>, потому что на неё
            уже завязаны панель, тесты, install scripts и runtime. В документации я везде
            подписал её человеческим именем, чтобы не путать с OAuth password.
          </p>
        </Callout>
      </DocSection>
    </>
  );
}

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
    <section id={id} className="relative scroll-mt-24 py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
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
          <p className="max-w-4xl text-sm leading-relaxed text-muted-foreground sm:text-base">{lead}</p>
        </Reveal>
        <Reveal delay={0.08} className="mt-6">
          {children}
        </Reveal>
      </div>
    </section>
  );
}

function Callout({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "warn" | "info";
}) {
  const classes =
    tone === "warn"
      ? "border-amber-500/30 bg-amber-500/[0.08] text-amber-100"
      : "border-primary/25 bg-primary/[0.06] text-foreground/90";

  return (
    <div className={`rounded-2xl border p-4 text-sm leading-relaxed ${classes}`}>
      {children}
    </div>
  );
}

function DenseTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border/60 bg-[oklch(0.12_0.006_290)]">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-white/[0.08] bg-white/[0.03]">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-3 py-2.5 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-white/[0.05] last:border-b-0">
              {row.map((cell, cellIndex) => (
                <td
                  key={`${rowIndex}-${cellIndex}`}
                  className={`px-3 py-2.5 align-top leading-relaxed text-foreground/88 ${
                    cellIndex === 0 ? "font-mono text-[12px] text-primary" : ""
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DetailTable({ rows }: { rows: DetailRow[] }) {
  return (
    <DenseTable
      columns={["Элемент", "Значение", "Комментарий"]}
      rows={rows.map((row) => [row.name, row.value, row.notes])}
    />
  );
}

function SubSection({
  title,
  lead,
  children,
}: {
  title: string;
  lead: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="mb-3">
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{lead}</p>
      </div>
      {children}
    </div>
  );
}

function EnvGroupCard({ group }: { group: EnvGroup }) {
  const Icon = group.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, ease: EASE }}
      className="mb-5 rounded-2xl border border-border/60 bg-[oklch(0.12_0.006_290)]"
    >
      <div className="flex items-center gap-3 border-b border-white/[0.08] px-4 py-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-primary/20 bg-primary/[0.06]">
          <Icon className="h-4 w-4 text-primary" />
        </span>
        <div>
          <div className="text-sm font-semibold tracking-tight">{group.title}</div>
          <div className="text-xs text-muted-foreground">{group.scope}</div>
        </div>
      </div>
      <DenseTable
        columns={["ENV", "Default", "Назначение"]}
        rows={group.rows.map((row) => [row.env, row.defaultValue, row.purpose])}
      />
    </motion.div>
  );
}

function CodeBlock({ label, code }: { label: string; code: string }) {
  const { copied, copy } = useCopy();

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-[oklch(0.12_0.006_290)]">
      <div className="flex items-center justify-between border-b border-white/[0.08] px-3.5 py-2">
        <span className="font-mono text-[11px] text-muted-foreground">{label}</span>
        <button
          type="button"
          onClick={() => copy(code)}
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-primary"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "скопировано" : "копировать"}
        </button>
      </div>
      <pre className="nice-scroll overflow-x-auto px-3.5 py-3 font-mono text-[12px] leading-relaxed text-foreground/88">
{code}
      </pre>
    </div>
  );
}
