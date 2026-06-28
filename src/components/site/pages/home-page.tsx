"use client";

import { motion } from "framer-motion";
import { ArrowRight, Bot, BrainCircuit, Puzzle, Rocket, ShieldCheck, Sparkles, Terminal } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "../reveal";
import { Eyebrow } from "../section-heading";
import { InstallCommand } from "../install-command";
import { TerminalDemo } from "../terminal-demo";
import { useHashRoute, type PageId } from "@/hooks/use-hash-route";

const EASE = [0.16, 1, 0.3, 1] as const;

const WAYS: {
  page: PageId;
  icon: React.ElementType;
  kicker: string;
  title: string;
  body: string;
  cta: string;
}[] = [
  {
    page: "chatgpt",
    icon: BrainCircuit,
    kicker: "Custom GPT",
    title: "ChatGPT → Codex без лимитов",
    body: "Создайте Custom GPT с действием (action): импорт OpenAPI, Bearer‑ключ — и ChatGPT выполняет команды на серверах. Без API‑лимитов и платного Codex.",
    cta: "Как подключить",
  },
  {
    page: "mcp-server",
    icon: Terminal,
    kicker: "MCP сервер",
    title: "Claude · Codex · OpenCode",
    body: "GPT‑Админ работает как MCP‑сервер. Подключите его в настройках вашего клиента — и AI получает единый доступ ко всем машинам через нативные tool calls.",
    cta: "Инструкция",
  },
  {
    page: "mcp-extension",
    icon: Bot,
    kicker: "Браузерное расширение",
    title: "Любой бесплатный ИИ",
    body: "Userscript для Tampermonkey/Firefox добавляет кнопки MCP в интерфейсы Qwen, GigaChat, Алисы, DeepSeek, ChatGPT. Не нужен платный API — только бесплатный веб‑чат.",
    cta: "Установить расширение",
  },
];

export function HomePage() {
  const { navigate } = useHashRoute();

  return (
    <>
      {/* Hero */}
      <section id="top" className="relative overflow-hidden pt-28 sm:pt-32">
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
          <div className="absolute left-1/2 top-[-10%] h-[520px] w-[820px] -translate-x-1/2 glow-violet blur-3xl animate-aurora" />
          <div className="absolute right-[-10%] top-[20%] h-[360px] w-[360px] rounded-full bg-primary/[0.08] blur-3xl animate-aurora" style={{ animationDelay: "-6s" }} />
          <div className="absolute left-[-8%] bottom-[0%] h-[320px] w-[420px] glow-violet blur-3xl opacity-50 animate-aurora" style={{ animationDelay: "-12s" }} />
          <GridFade />
        </div>

        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
            <div className="flex min-w-0 flex-col items-start">
              <motion.a
                href="#/chatgpt"
                onClick={(e) => { e.preventDefault(); navigate("chatgpt"); }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE }}
                className="group inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.06] py-1.5 pl-2 pr-3.5 text-xs font-medium text-primary backdrop-blur-sm transition-colors hover:border-primary/40"
              >
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                  <Sparkles className="h-3 w-3" /> бесплатно
                </span>
                Все функции без ограничений до конца лета
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </motion.a>

              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.06, ease: EASE }}
                className="display mt-6 max-w-xl text-balance text-[2rem] font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:max-w-none lg:text-[4.1rem]"
              >
                Умный помощник для серверов, который{" "}
                <span className="relative inline-block pr-2 sm:whitespace-nowrap">
                  <span className="font-[family-name:var(--font-instrument-serif)] italic text-gradient-violet">делает</span>
                  <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" preserveAspectRatio="none" aria-hidden>
                    <path d="M2 5 Q 50 1, 100 4 T 198 4" stroke="oklch(0.78 0.16 295 / 0.5)" strokeWidth="2" fill="none" strokeLinecap="round" />
                  </svg>
                </span>
                ,<br className="hidden sm:block" /> а не советует
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.14, ease: EASE }}
                className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
              >
                Подключите ChatGPT, Claude или любой ИИ к своим машинам: GPT‑Админ
                ставит софт, правит конфиги, перезапускает сервисы, читает логи и
                возвращает отчёты. Три способа подключения — выберите свой.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.22, ease: EASE }}
                className="mt-8 flex w-full max-w-xl flex-col gap-3"
              >
                <InstallCommand variant="compact" />
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigate("chatgpt")}
                    className="group inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
                  >
                    <Rocket className="h-4 w-4" />
                    Быстрый старт
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("mcp-extension")}
                    className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-white/[0.02] px-5 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-white/[0.04]"
                  >
                    <Puzzle className="h-4 w-4 text-primary" />
                    MCP для любого ИИ
                  </button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.34, ease: EASE }}
                className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground"
              >
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Без sudo по умолчанию
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-primary/70" /> Linux · macOS · Windows
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-primary/70" /> Свой домен не нужен
                </span>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
              className="relative"
            >
              <div className="absolute -inset-4 -z-10 glow-violet blur-3xl opacity-40" aria-hidden />
              <TerminalDemo className="animate-float-soft" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3 ways hub */}
      <section className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="flex flex-col items-center gap-4 text-center">
            <Eyebrow>Три способа подключения</Eyebrow>
            <h2 className="display max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
              Выберите свой способ —{" "}
              <span className="text-gradient-violet">под любой AI</span>
            </h2>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              GPT‑Админ встаёт между вашим ИИ и серверами. У каждого способа своя
              инструкция и свой подход.
            </p>
          </Reveal>

          <Stagger className="mt-14 grid gap-5 lg:grid-cols-3" stagger={0.1}>
            {WAYS.map((w) => (
              <StaggerItem key={w.page}>
                <button
                  type="button"
                  onClick={() => navigate(w.page)}
                  className="surface surface-hover ring-conic group relative flex h-full w-full flex-col items-start rounded-2xl p-7 text-left"
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/[0.06] transition-colors group-hover:border-primary/40">
                      <w.icon className="h-5 w-5 text-primary" />
                    </span>
                    <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
                      {w.kicker}
                    </span>
                  </div>
                  <h3 className="mt-5 text-xl font-semibold tracking-tight">{w.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{w.body}</p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors group-hover:text-primary/80">
                    {w.cta}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </button>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>
    </>
  );
}

function GridFade() {
  return (
    <div
      className="absolute inset-0 opacity-[0.5]"
      style={{
        backgroundImage:
          "linear-gradient(to right, oklch(0.78 0.16 295 / 0.06) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.78 0.16 295 / 0.06) 1px, transparent 1px)",
        backgroundSize: "56px 56px",
        maskImage: "radial-gradient(ellipse 70% 55% at 50% 35%, #000 40%, transparent 75%)",
        WebkitMaskImage: "radial-gradient(ellipse 70% 55% at 50% 35%, #000 40%, transparent 75%)",
      }}
      aria-hidden
    />
  );
}
