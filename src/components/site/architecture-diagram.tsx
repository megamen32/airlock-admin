"use client";

import { motion } from "framer-motion";
import {
  Bot,
  BrainCircuit,
  Lock,
  Radio,
  Server,
  ShieldCheck,
  Sparkles,
  Terminal,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

// Top row — 3 AI adapters (inputs flowing INTO hub)
const AI_NODES: {
  icon: LucideIcon;
  label: string;
  sub: string;
  detail: string;
  href: string;
}[] = [
  {
    icon: BrainCircuit,
    label: "Claude · Codex",
    sub: "MCP-клиент",
    detail: "Подключается как MCP remote SSE. Нативные tool calls — агент вызывает команды напрямую.",
    href: "#/mcp-server",
  },
  {
    icon: Bot,
    label: "DeepSeek · Qwen · Алиса",
    sub: "расширение браузера",
    detail: "Userscript для Tampermonkey/Firefox. Любой бесплатный веб‑чат получает MCP‑доступ.",
    href: "#/mcp-extension",
  },
  {
    icon: Terminal,
    label: "ChatGPT · Open WebUI",
    sub: "OpenAI Action",
    detail: "Custom GPT или OpenAPI endpoint. Без лимитов платного Codex.",
    href: "#/chatgpt",
  },
];

// Bottom row — 3 servers with shellmcp (outputs FROM hub)
const SERVER_NODES: {
  icon: LucideIcon;
  label: string;
  sub: string;
  detail: string;
}[] = [
  { icon: Server, label: "server-01", sub: "Linux · shellmcp", detail: "Агент на целевой машине. Выполняет команды, читает файлы, управляет systemd." },
  { icon: Server, label: "server-02", sub: "macOS · shellmcp", detail: "Тот же shellmcp, та же функциональность. Работает от обычного пользователя." },
  { icon: Server, label: "server-03", sub: "Windows · shellmcp", detail: "PowerShell/cmd, Scheduled Task. Без Administrator по умолчанию." },
];

export function ArchitectureDiagram({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="surface relative overflow-hidden rounded-3xl p-4 sm:p-7">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 glow-violet blur-3xl opacity-40" aria-hidden />

        <div className="relative flex flex-col items-center gap-1">
          {/* LAYER 1 — AI inputs (top) */}
          <LayerLabel>Ваш AI</LayerLabel>
          <div className="grid w-full grid-cols-1 gap-2.5 sm:grid-cols-3">
            {AI_NODES.map((n, i) => (
              <FlowNode key={n.label} node={n} index={i} variant="ai" />
            ))}
          </div>

          {/* Connectors AI → Hub (with animated packets going DOWN) */}
          <ConnectorLayer
            label="tool calls"
            subLabel="MCP / OpenAPI / userscript"
            direction="down"
            delay={0.4}
          />

          {/* LAYER 2 — Hub (center) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: EASE }}
            className="relative z-10 mt-1"
          >
            <div className="pointer-events-none absolute -inset-4 glow-violet blur-2xl opacity-60" aria-hidden />
            <div className="relative flex flex-col items-center gap-1.5 rounded-2xl border border-primary/40 bg-primary/[0.08] px-6 py-4 text-center backdrop-blur-md">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
                <Sparkles className="h-5 w-5 text-primary" />
              </span>
              <p className="text-sm font-semibold tracking-tight">GPT‑Админ</p>
              <p className="font-mono text-[10px] text-muted-foreground">MCP hub</p>
            </div>
          </motion.div>

          {/* Connectors Hub → Servers (reliable transport, encrypted) */}
          <ConnectorLayer
            label="надёжный транспорт"
            subLabel="очереди · long-poll · webhook · TLS"
            direction="down"
            delay={0.6}
            icon={Lock}
          />

          {/* LAYER 3 — Servers with shellmcp (bottom) */}
          <LayerLabel>ваши серверы</LayerLabel>
          <div className="grid w-full grid-cols-1 gap-2.5 sm:grid-cols-3">
            {SERVER_NODES.map((n, i) => (
              <FlowNode key={n.label} node={n} index={i} variant="server" />
            ))}
          </div>

          {/* ShellMCP caption */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground/70"
          >
            <Radio className="h-3 w-3 text-primary/60" />
            shellmcp поднимает MCP и передаёт в хаб
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/* ---------- components ---------- */

function LayerLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground/50">
      {children}
    </p>
  );
}

function FlowNode({
  node,
  index,
  variant,
}: {
  node: { icon: LucideIcon; label: string; sub: string; detail: string; href?: string };
  index: number;
  variant: "ai" | "server";
}) {
  const [hover, setHover] = useState(false);
  const Icon = node.icon;
  const isAi = variant === "ai";

  return (
    <motion.div
      initial={{ opacity: 0, y: isAi ? -10 : 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: EASE, delay: 0.1 + index * 0.08 }}
      className="relative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {node.href ? (
        <a
          href={node.href}
          className={cn(
            "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-all",
            hover
              ? "border-primary/40 bg-primary/[0.06]"
              : "border-border/60 bg-white/[0.02]"
          )}
        >
          <span className={cn(
            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            isAi ? "bg-primary/10" : "border border-border/50 bg-white/[0.02]"
          )}>
            <Icon className="h-4 w-4 text-primary" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-mono text-[11px] font-medium text-foreground/90">{node.label}</p>
            <p className="truncate text-[10px] text-muted-foreground/70">{node.sub}</p>
          </div>
        </a>
      ) : (
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-all",
            hover
              ? "border-primary/40 bg-primary/[0.06]"
              : "border-border/60 bg-white/[0.02]"
          )}
        >
          <span className={cn(
            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            isAi ? "bg-primary/10" : "border border-border/50 bg-white/[0.02]"
          )}>
            <Icon className="h-4 w-4 text-primary" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-mono text-[11px] font-medium text-foreground/90">{node.label}</p>
            <p className="truncate text-[10px] text-muted-foreground/70">{node.sub}</p>
          </div>
        </div>
      )}

      {/* Hover detail popover */}
      {hover && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute left-1/2 top-full z-20 mt-2 w-56 -translate-x-1/2 rounded-xl border border-border/60 bg-[oklch(0.16_0.006_290)] p-3 shadow-xl shadow-black/40"
        >
          <p className="text-[11px] leading-relaxed text-muted-foreground">{node.detail}</p>
          {node.href && (
            <a
              href={node.href}
              className="mt-2 inline-block text-[11px] font-medium text-primary hover:underline"
            >
              подробнее →
            </a>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

function ConnectorLayer({
  label,
  subLabel,
  direction,
  delay,
  icon: Icon,
}: {
  label: string;
  subLabel: string;
  direction: "down";
  delay: number;
  icon?: LucideIcon;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="flex flex-col items-center py-1"
    >
      {/* label */}
      <div className="flex items-center gap-1.5 rounded-full border border-border/50 bg-white/[0.02] px-2.5 py-0.5">
        {Icon && <Icon className="h-2.5 w-2.5 text-primary/70" />}
        <span className="text-[10px] font-medium text-muted-foreground/80">{label}</span>
      </div>

      {/* vertical line with animated packets */}
      <div className="relative h-10 w-px bg-gradient-to-b from-primary/30 to-primary/10">
        {/* packet 1 */}
        <motion.span
          className="absolute left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_8px_2px] shadow-primary/50"
          animate={{ top: ["0%", "100%"], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeIn", delay: 0 }}
        />
        {/* packet 2 */}
        <motion.span
          className="absolute left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_8px_2px] shadow-primary/50"
          animate={{ top: ["0%", "100%"], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeIn", delay: 0.6 }}
        />
        {/* packet 3 */}
        <motion.span
          className="absolute left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_8px_2px] shadow-primary/50"
          animate={{ top: ["0%", "100%"], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeIn", delay: 1.2 }}
        />
      </div>

      {/* sub-label */}
      <p className="text-[9px] text-muted-foreground/50">{subLabel}</p>
    </motion.div>
  );
}
