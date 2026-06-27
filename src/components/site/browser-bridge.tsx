"use client";

import { motion } from "framer-motion";
import {
  Apple,
  Bot,
  Chrome,
  ClipboardCheck,
  Cpu,
  KeyRound,
  MousePointerClick,
  Smartphone,
  Sparkles,
  Zap,
} from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "./reveal";
import { Eyebrow } from "./section-heading";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

// Бесплатные браузерные ИИ, которые MCP Bridge превращает в GPTAdmin.
const FREE_AIS = [
  { name: "ChatGPT", note: "free tier" },
  { name: "DeepSeek", note: "бесплатно" },
  { name: "Qwen", note: "бесплатно" },
  { name: "Алиса", note: "Яндекс" },
  { name: "GigaChat", note: "Сбер" },
  { name: "Claude", note: "free tier" },
];

const STEPS = [
  {
    icon: Sparkles,
    title: "MCP All",
    body: "Вставляет в поле ввода компактное описание всех ваших MCP‑агентов и их инструментов. Промпт всегда копируется в буфер — Alt+M.",
  },
  {
    icon: MousePointerClick,
    title: "MCP — точечный выбор",
    body: "Открывает панель выбора конкретного агента с подробным описанием каждого инструмента. Удобно, когда агентов много.",
  },
  {
    icon: Zap,
    title: "Авто‑выполнение",
    body: "Если ИИ отвечает блоком ```mcp с JSON‑командой — скрипт сам подсвечивает его, вызывает ваш hub и вставляет результат обратно в чат.",
  },
];

const PLATFORMS = [
  {
    icon: Chrome,
    title: "macOS · Windows · Linux",
    sub: "Chrome + Tampermonkey",
    body: "Установите Tampermonkey из Chrome Web Store, затем нажмите «Установить MCP Bridge».",
  },
  {
    icon: Apple,
    title: "iPhone",
    sub: "Safari + Userscripts",
    body: "Поставьте приложение Userscripts из App Store, включите в Расширениях Safari — и установите скрипт.",
  },
  {
    icon: Smartphone,
    title: "Android",
    sub: "Kiwi Browser",
    body: "Kiwi поддерживает расширения Chrome: ставите Tampermonkey, затем MCP Bridge — и готово.",
  },
];

export function BrowserBridge() {
  return (
    <section id="browser-bridge" className="relative scroll-mt-20 py-24 sm:py-32">
      {/* ambient divider glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-border to-transparent" aria-hidden />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16">
          {/* LEFT — copy */}
          <Reveal className="flex flex-col items-start">
            <Eyebrow>Браузерное расширение · MCP Bridge</Eyebrow>
            <h2 className="display mt-5 text-balance text-3xl font-semibold tracking-tight sm:text-4xl md:text-[2.9rem]">
              Любой бесплатный ИИ —{" "}
              <span className="text-gradient-violet">превращается в GPT‑Админ</span>
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Userscript для браузера добавляет кнопки MCP прямо в интерфейсы ChatGPT,
              DeepSeek, Qwen, Алисы и Сбера. Не нужен платный API — достаточно
              бесплатного веб‑чата. Ваш hub получает команды, ИИ их выполняет.
            </p>

            {/* Free-AI badges */}
            <Reveal className="mt-7 w-full">
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground/60">
                Работает в интерфейсах
              </p>
              <div className="flex flex-wrap gap-2">
                {FREE_AIS.map((ai, i) => (
                  <motion.span
                    key={ai.name}
                    initial={{ opacity: 0, y: 6 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, ease: EASE, delay: i * 0.05 }}
                    className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-white/[0.02] py-1.5 pl-2.5 pr-3 text-sm"
                  >
                    <Bot className="h-3.5 w-3.5 text-primary" />
                    <span className="font-medium text-foreground/90">{ai.name}</span>
                    <span className="text-[11px] text-muted-foreground/70">{ai.note}</span>
                  </motion.span>
                ))}
              </div>
            </Reveal>

            {/* How it works — 3 steps */}
            <Stagger className="mt-8 flex w-full flex-col gap-3" stagger={0.08}>
              {STEPS.map((s) => (
                <StaggerItem key={s.title}>
                  <div className="surface surface-hover flex items-start gap-3.5 rounded-xl p-4">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/[0.06]">
                      <s.icon className="h-4.5 w-4.5 text-primary" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold tracking-tight text-foreground">
                        {s.title}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {s.body}
                      </p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>

            {/* Install CTA */}
            <Reveal className="mt-8 w-full">
              <a
                href="https://became.bezrabotnyi.com/mcp-bridge.user.js"
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
              >
                <KeyRound className="h-4 w-4" />
                Установить MCP Bridge
              </a>
              <p className="mt-2.5 text-xs text-muted-foreground">
                Бесплатно · open source · горячие клавиши{" "}
                <kbd className="rounded border border-border/60 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10px]">Alt+M</kbd>{" "}
                и{" "}
                <kbd className="rounded border border-border/60 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10px]">Alt+K</kbd>
              </p>
            </Reveal>
          </Reveal>

          {/* RIGHT — browser chat mock + platforms */}
          <Reveal delay={0.1} className="flex flex-col gap-5">
            <BrowserMock />

            {/* Platform install cards */}
            <div className="grid gap-2.5">
              {PLATFORMS.map((p, i) => (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, ease: EASE, delay: 0.2 + i * 0.08 }}
                  className="surface surface-hover flex items-start gap-3 rounded-xl p-4"
                >
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-white/[0.02]">
                    <p.icon className="h-4.5 w-4.5 text-primary" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <p className="text-sm font-semibold tracking-tight text-foreground">
                        {p.title}
                      </p>
                      <p className="font-mono text-[11px] text-primary/80">{p.sub}</p>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {p.body}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/** A mock of a browser chat window showing the MCP Bridge buttons + an auto-executed block. */
function BrowserMock() {
  return (
    <div className="surface relative overflow-hidden rounded-2xl">
      <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-2/3 -translate-x-1/2 glow-violet blur-2xl opacity-50" aria-hidden />

      {/* browser chrome */}
      <div className="relative flex items-center gap-2 border-b border-border/60 bg-white/[0.02] px-4 py-3">
        <div className="flex gap-1.5" aria-hidden>
          <span className="h-3 w-3 rounded-full bg-[oklch(0.66_0.2_25_/_0.6)]" />
          <span className="h-3 w-3 rounded-full bg-[oklch(0.8_0.12_95_/_0.5)]" />
          <span className="h-3 w-3 rounded-full bg-[oklch(0.78_0.16_295_/_0.7)]" />
        </div>
        <div className="ml-2 flex-1">
          <div className="flex items-center gap-1.5 rounded-md border border-border/50 bg-[oklch(0.12_0.006_290)] px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
            <span className="text-primary/60">🔒</span>
            chat.qwen.ai
          </div>
        </div>
      </div>

      {/* chat body */}
      <div className="relative flex flex-col gap-3 p-4 sm:p-5">
        {/* user message */}
        <div className="flex justify-end">
          <div className="max-w-[80%] rounded-2xl rounded-tr-sm border border-border/60 bg-white/[0.03] px-3.5 py-2.5 text-sm text-foreground/90">
            покажи статус nginx на сотом
          </div>
        </div>

        {/* assistant message with mcp block */}
        <div className="flex justify-start">
          <div className="max-w-[88%]">
            <div className="rounded-2xl rounded-tl-sm border border-border/60 bg-white/[0.02] px-3.5 py-2.5">
              <p className="mb-2 text-sm text-muted-foreground">
                Вызываю shellmcp на сотом:
              </p>
              {/* highlighted mcp block */}
              <div className="rounded-lg border border-primary/30 bg-primary/[0.05] p-3">
                <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                  <Cpu className="h-3 w-3" /> mcp · auto-executed
                </div>
                <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed text-foreground/85">
{`{ "target": "shell:roomhacker-100",
  "tool": "shell_exec",
  "args": { "cmd": "systemctl status nginx" } }`}
                </pre>
              </div>
              <p className="mt-2.5 text-sm text-foreground/90">
                <span className="text-primary">●</span> nginx active, PID 3026528,
                слушает :80 и :443. Ошибок в journalctl нет.
              </p>
            </div>
          </div>
        </div>

        {/* input row with MCP buttons */}
        <div className="mt-1 flex items-center gap-2 rounded-xl border border-border/60 bg-[oklch(0.12_0.006_290)] p-2">
          <input
            disabled
            placeholder="Спросите что-нибудь…"
            className="flex-1 bg-transparent px-2 text-sm text-muted-foreground outline-none placeholder:text-muted-foreground/50"
          />
          <McpButton label="MCP All" hint="Alt+M" primary />
          <McpButton label="MCP" hint="" />
        </div>
      </div>
    </div>
  );
}

function McpButton({
  label,
  hint,
  primary,
}: {
  label: string;
  hint: string;
  primary?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-mono text-[11px] font-medium",
        primary
          ? "bg-primary/15 text-primary"
          : "border border-border/60 bg-white/[0.02] text-muted-foreground"
      )}
    >
      {primary && <ClipboardCheck className="h-3 w-3" />}
      {label}
      {hint && <span className="text-[9px] text-primary/60">{hint}</span>}
    </span>
  );
}
