"use client";

import { ArrowRight, Boxes, BrainCircuit, Cpu, Plug, Server, Terminal, Check, Copy, Radio } from "lucide-react";
import { PageHero, Step } from "../page-hero";
import { Reveal, Stagger, StaggerItem } from "../reveal";
import { InstallCommand } from "../install-command";
import { useCopy } from "@/hooks/use-copy";
import { useHashRoute } from "@/hooks/use-hash-route";
import { useT } from "@/hooks/use-t";

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

const CODEX_LOCAL_MCP_COMMAND = "curl -fsSL https://became.bezrabotnyi.com/codex-mcp-mac.sh | bash";
const PER_SERVER_MCP = "https://your-hub.example/server/openmemory/mcp";
const SECTION_POINTS_FALLBACK = [
  "Native tool calls — no copy-paste",
  "Install any MCP once — available to every agent",
  "Commands run locally; results return to the agent",
];

export function McpServerPage() {
  const { navigate } = useHashRoute();
  const { t, get } = useT();
  const points = get<string[]>("pageMcpServer.sectionPoints") ?? SECTION_POINTS_FALLBACK;

  return (
    <>
      <PageHero
        eyebrow={t("pageMcpServer.eyebrow")}
        title={
          <>
            {t("pageMcpServer.titleLead")}{" "}
            <span className="text-gradient-violet">{t("pageMcpServer.titleAccent")}</span>
          </>
        }
        lead={t("pageMcpServer.lead")}
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.06] px-3 py-1.5 text-xs font-medium text-primary">
          <Radio className="h-3.5 w-3.5" />
          {t("pageMcpServer.protocolBadge")}
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
                {t("pageMcpServer.sectionTitleLead")}{" "}
                <span className="text-gradient-violet">{t("pageMcpServer.sectionTitleAccent")}</span>
              </h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
                {t("pageMcpServer.sectionBody")}
              </p>

              <Stagger className="mt-7 flex w-full flex-col gap-3" stagger={0.08}>
                {points.map((p, i) => (
                  <StaggerItem key={`${i}-${p}`}>
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
                        {t("pageMcpServer.openmemoryQuote")}{" "}
                        <a
                          href="https://github.com/CaviraOSS/OpenMemory"
                          target="_blank"
                          rel="noopener"
                          className="font-mono text-primary underline decoration-primary/40 underline-offset-2 transition-colors hover:decoration-primary"
                        >
                          openmemory
                        </a>
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
                  {t("pageMcpServer.yourAi")}
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
                  {t("pageMcpServer.yourServers")}
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
              {t("pageMcpServer.connectInStepsTitleLead")}{" "}
              <span className="text-gradient-violet">{t("pageMcpServer.connectInStepsTitleAccent")}</span>
            </h2>
          </Reveal>

          <Stagger className="flex flex-col gap-7" stagger={0.1}>
            <StaggerItem>
              <Step n={1} title={t("pageMcpServer.step1Title")}>
                {t("pageMcpServer.step1Body")}
                <div className="mt-3">
                  <InstallCommand variant="compact" />
                </div>
              </Step>
            </StaggerItem>
            <StaggerItem>
              <Step n={2} title={t("pageMcpServer.step2Title")}>
                {t("pageMcpServer.step2Body")}
                <ConfigBlock />
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {t("pageMcpServer.step2Note")}
                </p>
                <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/[0.04] p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Terminal className="h-4 w-4 text-primary" />
                    {t("pageMcpServer.codexLocalTitle")}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t("pageMcpServer.codexLocalBody")}
                  </p>
                  <CommandBlock label="macOS · Codex CLI/Desktop" command={CODEX_LOCAL_MCP_COMMAND} />
                  <CommandBlock label="Per-server MCP endpoint" command={PER_SERVER_MCP} />
                </div>
              </Step>
            </StaggerItem>
            <StaggerItem>
              <Step n={3} title={t("pageMcpServer.step3Title")}>
                {t("pageMcpServer.step3Body")}
              </Step>
            </StaggerItem>
            <StaggerItem>
              <Step n={4} title={t("pageMcpServer.step4Title")}>
                {t("pageMcpServer.step4Body")}
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
                <h3 className="text-xl font-semibold tracking-tight">{t("pageMcpServer.ctaTitle")}</h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  {t("pageMcpServer.ctaBody")}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => navigate("mcp-extension")}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
                >
                  {t("pageMcpServer.ctaButtonExtension")} <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate("chatgpt")}
                  className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-white/[0.02] px-4 py-2.5 text-sm font-medium transition-colors hover:border-primary/40"
                >
                  {t("pageMcpServer.ctaButtonChatgpt")} <ArrowRight className="h-4 w-4" />
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
      <pre className="nice-scroll overflow-x-auto px-3.5 py-3 font-mono text-[12px] leading-relaxed text-foreground/85">
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