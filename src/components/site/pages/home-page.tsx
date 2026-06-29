"use client";

import { motion } from "framer-motion";
import { ArrowRight, Bot, BrainCircuit, Github, Puzzle, Rocket, ShieldCheck, Sparkles, Star, Terminal } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "../reveal";
import { Eyebrow } from "../section-heading";
import { InstallCommand } from "../install-command";
import { ArchitectureDiagram } from "../architecture-diagram";
import { UseCases } from "../use-cases";
import { useHashRoute, type PageId } from "@/hooks/use-hash-route";

const EASE = [0.16, 1, 0.3, 1] as const;

const ADAPTERS: {
  page: PageId;
  icon: React.ElementType;
  kicker: string;
  title: string;
  body: string;
  cta: string;
}[] = [
  {
    page: "chatgpt",
    icon: Terminal,
    kicker: "OpenAI Action",
    title: "ChatGPT · Open WebUI",
    body: "Создайте Custom GPT или добавьте endpoint в Open WebUI: импорт OpenAPI, Bearer‑ключ — и ChatGPT выполняет команды. Без лимитов платного Codex.",
    cta: "Как подключить",
  },
  {
    page: "mcp-server",
    icon: BrainCircuit,
    kicker: "MCP-клиент",
    title: "Claude · Codex · OpenCode",
    body: "GPT‑Админ работает как MCP remote SSE. Подключите его в настройках клиента — и AI получает нативные tool calls ко всей инфраструктуре.",
    cta: "Инструкция",
  },
  {
    page: "mcp-extension",
    icon: Bot,
    kicker: "Браузерное расширение",
    title: "DeepSeek · Qwen · Алиса",
    body: "Userscript для Tampermonkey/Firefox добавляет кнопки MCP в бесплатные веб‑ИИ. Не нужен платный API — только бесплатный веб‑чат.",
    cta: "Установить расширение",
  },
];

export function HomePage() {
  const { navigate } = useHashRoute();

  return (
    <>
      {/* Hero — copy + architecture diagram (no terminal) */}
      <section id="top" className="relative overflow-hidden pt-28 sm:pt-32">
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
          <div className="absolute left-1/2 top-[-10%] h-[520px] w-[820px] -translate-x-1/2 glow-violet blur-3xl animate-aurora" />
          <div className="absolute right-[-10%] top-[20%] h-[360px] w-[360px] rounded-full bg-primary/[0.08] blur-3xl animate-aurora" style={{ animationDelay: "-6s" }} />
          <div className="absolute left-[-8%] bottom-[0%] h-[320px] w-[420px] glow-violet blur-3xl opacity-50 animate-aurora" style={{ animationDelay: "-12s" }} />
          <GridFade />
        </div>

        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
            {/* LEFT — copy */}
            <div className="flex min-w-0 flex-col items-start">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE }}
                className="flex flex-wrap items-center gap-2"
              >
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/[0.06] px-3 py-1.5 text-xs font-medium text-primary">
                  <Sparkles className="h-3 w-3" /> Open Source · AGPL‑3.0
                </span>
                <a
                  href="https://github.com/megamen32/gptadmin_opensource"
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-white/[0.02] px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40"
                >
                  <Github className="h-3 w-3 text-primary" /> GitHub
                </a>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.06, ease: EASE }}
                className="display mt-5 max-w-xl text-balance text-[2rem] font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.4rem]"
              >
                Один хаб — любой AI управляет{" "}
                <span className="text-gradient-violet">любой инфраструктурой</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.14, ease: EASE }}
                className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
              >
                GPT‑Админ — это MCP‑хаб. Подключайте к нему сервера и любые MCP
                (chrome‑devtools, openmemory), а ваш любимый AI цепляется к хабу
                одним из трёх способов. Управляйте всем — от поиска в интернете
                до запуска сабагентов.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.22, ease: EASE }}
                className="mt-7 flex flex-wrap items-center gap-3"
              >
                <button
                  type="button"
                  onClick={() => navigate("mcp-server")}
                  className="group inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
                >
                  <Rocket className="h-4 w-4" />
                  Как подключить AI
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
                className="mt-5 w-full max-w-xl"
              >
                <InstallCommand variant="compact" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.38, ease: EASE }}
                className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground"
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

            {/* RIGHT — architecture diagram */}
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
              className="relative"
            >
              <div className="absolute -inset-4 -z-10 glow-violet blur-3xl opacity-30" aria-hidden />
              <ArchitectureDiagram />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Use cases — capabilities of the hub */}
      <UseCases />

      {/* 3 adapters */}
      <section className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="flex flex-col items-center gap-4 text-center">
            <Eyebrow>Три адаптера к хабу</Eyebrow>
            <h2 className="display max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
              Один хаб —{" "}
              <span className="text-gradient-violet">три способа подключить AI</span>
            </h2>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Это не три разных продукта, а три адаптера к одному хабу. Выбирайте
              под свой AI — возможности одинаковы.
            </p>
          </Reveal>

          <Stagger className="mt-14 grid gap-5 lg:grid-cols-3" stagger={0.1}>
            {ADAPTERS.map((w) => (
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
