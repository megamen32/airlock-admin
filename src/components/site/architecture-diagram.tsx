"use client";

import { motion } from "framer-motion";
import {
  Boxes,
  BrainCircuit,
  Bot,
  Chrome,
  Globe,
  Puzzle,
  Server,
  Sparkles,
  Terminal,
  type LucideIcon,
} from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

// Things that plug INTO the hub (left side) — MCP servers / tools.
const PLUGS: { icon: LucideIcon; label: string; sub: string }[] = [
  { icon: Server, label: "shellmcp", sub: "ваши сервера" },
  { icon: Chrome, label: "chrome-devtools", sub: "поиск в браузере" },
  { icon: Boxes, label: "openmemory", sub: "память проектов" },
  { icon: Puzzle, label: "любой MCP", sub: "ставится за минуту" },
];

// AIs that connect OUT of the hub (right side) — 3 adapters.
const ADAPTERS: { icon: LucideIcon; label: string; sub: string }[] = [
  { icon: BrainCircuit, label: "Claude · Codex", sub: "MCP-клиент" },
  { icon: Bot, label: "DeepSeek · Qwen · Алиса", sub: "расширение" },
  { icon: Terminal, label: "ChatGPT · Open WebUI", sub: "OpenAI Action" },
];

/** Hub-and-spoke architecture: MCP tools plug IN (left), AIs connect OUT (right). */
export function ArchitectureDiagram({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="surface relative overflow-hidden rounded-3xl p-5 sm:p-7">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 glow-violet blur-3xl opacity-50" aria-hidden />

        {/* mobile: column; desktop: 3 columns [plugs | hub | adapters] */}
        <div className="relative grid items-center gap-5 sm:grid-cols-[1fr_auto_1fr] sm:gap-3">
          {/* LEFT — plugs in */}
          <div className="order-2 sm:order-1">
            <p className="mb-2.5 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/60 sm:text-left">
              подключается к хабу
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
              {PLUGS.map((p, i) => (
                <motion.div
                  key={p.label}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, ease: EASE, delay: 0.15 + i * 0.07 }}
                  className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-white/[0.02] px-2.5 py-2"
                >
                  <p.icon className="h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="truncate font-mono text-[11px] font-medium text-foreground/90">{p.label}</p>
                    <p className="truncate text-[10px] text-muted-foreground/70">{p.sub}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* connectors (desktop) */}
          <div className="order-3 hidden flex-col items-center sm:order-2 sm:flex">
            <ConnectorRow />
          </div>

          {/* CENTER — hub */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: EASE }}
            className="order-1 sm:order-2"
          >
            <div className="relative mx-auto flex max-w-[14rem] flex-col items-center gap-2 rounded-2xl border border-primary/40 bg-primary/[0.08] px-5 py-5 text-center backdrop-blur-md">
              <div className="pointer-events-none absolute -inset-3 glow-violet blur-2xl opacity-60" aria-hidden />
              <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
                <Sparkles className="h-6 w-6 text-primary" />
              </span>
              <div className="relative">
                <p className="text-base font-semibold tracking-tight">GPT‑Админ</p>
                <p className="font-mono text-[11px] text-muted-foreground">MCP hub</p>
              </div>
            </div>
          </motion.div>

          {/* RIGHT — adapters out */}
          <div className="order-4">
            <p className="mb-2.5 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/60 sm:text-right">
              подключают AI
            </p>
            <div className="grid grid-cols-1 gap-2">
              {ADAPTERS.map((a, i) => (
                <motion.div
                  key={a.label}
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, ease: EASE, delay: 0.25 + i * 0.07 }}
                  className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-white/[0.02] px-2.5 py-2"
                >
                  <a.icon className="h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="truncate font-mono text-[11px] font-medium text-foreground/90">{a.label}</p>
                    <p className="truncate text-[10px] text-muted-foreground/70">{a.sub}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* caption */}
        <p className="relative mt-5 text-center text-xs text-muted-foreground">
          <Globe className="mr-1.5 inline h-3 w-3 text-primary/60" />
          Один хаб — любой AI управляет любой инфраструктурой
        </p>
      </div>
    </div>
  );
}

function ConnectorRow() {
  return (
    <div className="flex flex-col items-center gap-1 py-2" aria-hidden>
      <span className="h-px w-8 bg-gradient-to-r from-transparent to-primary/40" />
      <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_1px] shadow-primary/50" />
      <span className="h-px w-8 bg-gradient-to-l from-transparent to-primary/40" />
    </div>
  );
}
