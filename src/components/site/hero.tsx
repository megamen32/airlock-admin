"use client";

import { motion } from "framer-motion";
import { ArrowRight, Puzzle, Rocket, ShieldCheck, Sparkles } from "lucide-react";
import { CopyCommand } from "./copy-command";
import { TerminalDemo } from "./terminal-demo";

const EASE = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-28 sm:pt-32">
      {/* Ambient background: layered emerald auroras + grid */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute left-1/2 top-[-10%] h-[520px] w-[820px] -translate-x-1/2 glow-emerald blur-3xl animate-aurora" />
        <div className="absolute right-[-10%] top-[20%] h-[360px] w-[360px] rounded-full bg-primary/[0.08] blur-3xl animate-aurora" style={{ animationDelay: "-6s" }} />
        <div className="absolute left-[-8%] bottom-[0%] h-[320px] w-[420px] glow-emerald blur-3xl opacity-50 animate-aurora" style={{ animationDelay: "-12s" }} />
        <GridFade />
      </div>

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          {/* LEFT — copy */}
          <div className="flex flex-col items-start">
            <motion.a
              href="#pricing"
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
              className="display mt-6 text-balance text-[2.6rem] font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-[4.1rem]"
            >
              Умный помощник для серверов, который{" "}
              <span className="relative whitespace-nowrap">
                <span className="font-[family-name:var(--font-instrument-serif)] italic text-gradient-emerald">делает</span>
                <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" preserveAspectRatio="none" aria-hidden>
                  <path d="M2 5 Q 50 1, 100 4 T 198 4" stroke="oklch(0.78 0.16 162 / 0.5)" strokeWidth="2" fill="none" strokeLinecap="round" />
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
              Подключите ChatGPT к своим машинам: GPT‑Админ ставит софт, правит конфиги,
              перезапускает сервисы, читает логи и возвращает отчёты. Никаких копипаст —
              всё автоматически.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.22, ease: EASE }}
              className="mt-8 flex w-full max-w-xl flex-col gap-3"
            >
              <CopyCommand command="curl -s https://became.bezrabotnyi.com/install.sh | bash" label="$" />
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="#install"
                  className="group inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
                >
                  <Rocket className="h-4 w-4" />
                  Быстрый старт
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </a>
                <a
                  href="#how"
                  className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-white/[0.02] px-5 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-white/[0.04]"
                >
                  <Puzzle className="h-4 w-4 text-primary" />
                  MCP Bridge
                </a>
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

          {/* RIGHT — terminal demo */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
            className="relative"
          >
            <div className="absolute -inset-4 -z-10 glow-emerald blur-3xl opacity-40" aria-hidden />
            <TerminalDemo className="animate-float-soft" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function GridFade() {
  return (
    <div
      className="absolute inset-0 opacity-[0.5]"
      style={{
        backgroundImage:
          "linear-gradient(to right, oklch(0.78 0.16 162 / 0.06) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.78 0.16 162 / 0.06) 1px, transparent 1px)",
        backgroundSize: "56px 56px",
        maskImage: "radial-gradient(ellipse 70% 55% at 50% 35%, #000 40%, transparent 75%)",
        WebkitMaskImage: "radial-gradient(ellipse 70% 55% at 50% 35%, #000 40%, transparent 75%)",
      }}
      aria-hidden
    />
  );
}
