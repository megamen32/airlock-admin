"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Boxes,
  BrainCircuit,
  Cpu,
  Puzzle,
  Server,
  Sparkles,
  Terminal,
  type LucideIcon,
} from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "./reveal";
import { Eyebrow } from "./section-heading";

const EASE = [0.16, 1, 0.3, 1] as const;

// MCP-клиенты (способ 1) — для диаграммы подключения.
const MCP_CLIENTS = [
  { name: "Claude", icon: BrainCircuit },
  { name: "Codex", icon: Terminal },
  { name: "OpenCode", icon: Cpu },
];

// Нейтральные имена серверов (без реальных хостов).
const SERVERS = ["server-01", "vps-prod", "home-lab"];

type Way = {
  n: string;
  icon: LucideIcon;
  title: string;
  clients: string;
  body: string;
  href: string;
  cta: string;
};

// Три способа подключения.
const WAYS: Way[] = [
  {
    n: "01",
    icon: BrainCircuit,
    title: "MCP‑клиенты",
    clients: "Claude · Codex · OpenCode",
    body: "GPT‑Админ работает как MCP‑сервер. Подключите его в настройках вашего клиента — и AI получает единый доступ ко всем машинам. Поддерживаются любые MCP.",
    href: "#browser-bridge",
    cta: "Как подключить",
  },
  {
    n: "02",
    icon: Bot,
    title: "Веб‑чаты",
    clients: "Qwen · GigaChat · Алиса",
    body: "Браузерное расширение добавляет кнопки MCP прямо в интерфейсы бесплатных ИИ. Не нужен платный API — достаточно бесплатного веб‑чата.",
    href: "#browser-bridge",
    cta: "Установить расширение",
  },
  {
    n: "03",
    icon: Puzzle,
    title: "Custom GPT",
    clients: "chatgpt.com · Open WebUI",
    body: "Создайте кастомное действие (Custom GPT) или добавьте endpoint в Open WebUI — импортируйте OpenAPI, подставьте Hub URL и Bearer‑ключ.",
    href: "#how",
    cta: "Инструкция",
  },
];

export function McpBridge() {
  return (
    <section id="mcp" className="relative scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Heading */}
        <Reveal className="flex flex-col items-start gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Eyebrow>Три способа подключения</Eyebrow>
            <h2 className="display mt-5 text-balance text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
              Любой AI —{" "}
              <span className="text-gradient-violet">доступ ко всем вашим компьютерам</span>
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              GPT‑Админ встаёт между вашим любимым ИИ и серверами. Выбирайте способ
              подключения под себя — MCP‑клиент, бесплатный веб‑чат или Custom GPT.
            </p>
          </div>
        </Reveal>

        {/* 3 ways */}
        <Stagger className="mt-12 grid gap-5 lg:grid-cols-3" stagger={0.1}>
          {WAYS.map((w) => (
            <StaggerItem key={w.n}>
              <WayCard way={w} />
            </StaggerItem>
          ))}
        </Stagger>

        {/* Diagram + openmemory */}
        <div className="mt-16 grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          {/* LEFT — openmemory quote + points */}
          <Reveal className="flex flex-col items-start">
            <Stagger className="flex w-full flex-col gap-3" stagger={0.08}>
              {[
                "Один мост — все сервера: Linux, macOS и Windows",
                "Любой MCP подключается один раз — доступен всем агентам",
                "Команды выполняются локально, результат возвращается ИИ",
              ].map((point) => (
                <StaggerItem key={point}>
                  <div className="flex items-start gap-3 text-sm text-foreground/85">
                    <span className="mt-1.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </span>
                    {point}
                  </div>
                </StaggerItem>
              ))}
            </Stagger>

            {/* openmemory quote — now a real link */}
            <Reveal className="mt-7 w-full">
              <div className="surface relative overflow-hidden rounded-2xl p-5">
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 glow-violet blur-2xl opacity-60" aria-hidden />
                <div className="relative flex items-start gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/[0.06]">
                    <Boxes className="h-4.5 w-4.5 text-primary" />
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
                      — чтобы разные ИИ могли работать и знать всё о моих проектах.
                    </p>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Любой MCP ставится так же: один раз подключил — доступен всем агентам.
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          </Reveal>

          {/* RIGHT — connection diagram */}
          <Reveal delay={0.1}>
            <div className="surface relative mx-auto w-full max-w-md overflow-hidden rounded-3xl p-7 sm:p-9">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-40 glow-violet blur-3xl opacity-50" aria-hidden />

              {/* Agents row */}
              <p className="relative mb-3 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground/70">
                Ваш AI
              </p>
              <div className="relative grid grid-cols-3 gap-2.5">
                {MCP_CLIENTS.map((a, i) => (
                  <AgentPill key={a.name} name={a.name} icon={a.icon} delay={i * 0.1} />
                ))}
              </div>

              {/* Connectors down */}
              <Connector />

              {/* Hub */}
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}
                className="relative mx-auto mt-1 flex max-w-[15rem] items-center justify-center gap-3 rounded-2xl border border-primary/35 bg-primary/[0.08] px-5 py-4 text-center backdrop-blur-md"
              >
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                  <Sparkles className="h-4.5 w-4.5 text-primary" />
                </span>
                <div className="text-left">
                  <p className="text-sm font-semibold tracking-tight">GPT‑Админ</p>
                  <p className="font-mono text-[11px] text-muted-foreground">MCP hub</p>
                </div>
              </motion.div>

              {/* Connectors down */}
              <Connector />

              {/* Servers row */}
              <p className="relative mb-3 mt-1 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground/70">
                Ваши серверы
              </p>
              <div className="relative flex flex-col gap-2">
                {SERVERS.map((s, i) => (
                  <motion.div
                    key={s}
                    initial={{ opacity: 0, x: 8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: EASE, delay: 0.35 + i * 0.08 }}
                    className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-white/[0.02] px-3 py-2"
                  >
                    <Server className="h-3.5 w-3.5 text-primary/70" />
                    <span className="font-mono text-xs text-foreground/80">{s}</span>
                    <span className="ml-auto inline-flex h-1.5 w-1.5 rounded-full bg-primary/70 shadow-[0_0_8px_1px] shadow-primary/40" />
                  </motion.div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function WayCard({ way }: { way: Way }) {
  const { icon: Icon } = way;
  return (
    <div className="surface surface-hover ring-conic group relative flex h-full flex-col rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/[0.06] transition-colors group-hover:border-primary/40">
          <Icon className="h-5 w-5 text-primary" />
        </span>
        <span className="font-mono text-sm text-primary/70">{way.n}</span>
      </div>

      <h3 className="mt-5 text-lg font-semibold tracking-tight">{way.title}</h3>
      <p className="mt-1 font-mono text-xs text-primary/80">{way.clients}</p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{way.body}</p>

      <a
        href={way.href}
        className="group/cta mt-auto inline-flex items-center gap-2 pt-6 text-sm font-medium text-primary transition-colors hover:text-primary/80"
      >
        {way.cta}
        <ArrowRight className="h-4 w-4 transition-transform group-hover/cta:translate-x-0.5" />
      </a>
    </div>
  );
}

function AgentPill({
  name,
  icon: Icon,
  delay,
}: {
  name: string;
  icon: React.ElementType;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: EASE, delay }}
      className="flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-white/[0.02] px-2 py-3"
    >
      <Icon className="h-4.5 w-4.5 text-primary" />
      <span className="text-[11px] font-medium text-foreground/85">{name}</span>
    </motion.div>
  );
}

function Connector() {
  return (
    <div className="relative mx-auto my-2 h-7 w-px bg-gradient-to-b from-primary/50 to-primary/10" aria-hidden>
      <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_10px_2px] shadow-primary/50" />
    </div>
  );
}
