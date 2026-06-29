"use client";

import { motion } from "framer-motion";
import {
  Bot,
  Boxes,
  BrainCircuit,
  GitBranch,
  Globe,
  Lock,
  Radio,
  Server,
  Sparkles,
  Terminal,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

type Column = {
  ai: { icon: LucideIcon; label: string; sub: string; detail: string; href: string };
  tunnel: { label: string; sub: string };
  transport: { label: string; sub: string };
  server: { icon: LucideIcon; label: string; sub: string; mcp: { icon: LucideIcon; label: string }; detail: string };
};

const COLUMNS: Column[] = [
  {
    ai: {
      icon: BrainCircuit,
      label: "Claude · Codex",
      sub: "MCP-клиент",
      detail: "Подключается как MCP Streamable HTTP. Нативные tool calls — агент вызывает команды напрямую.",
      href: "#/mcp-server",
    },
    tunnel: { label: "Streamable HTTP", sub: "через туннель" },
    transport: { label: "long-poll", sub: "пробивает любой NAT" },
    server: {
      icon: Server,
      label: "server-01",
      sub: "Linux",
      mcp: { icon: Boxes, label: "openmemory" },
      detail: "Память проектов. Все ИИ знают контекст — что и где лежит, какие правки были.",
    },
  },
  {
    ai: {
      icon: Bot,
      label: "DeepSeek · Qwen",
      sub: "расширение",
      detail: "Userscript для Tampermonkey/Firefox. Любой бесплатный веб‑чат получает MCP‑доступ.",
      href: "#/mcp-extension",
    },
    tunnel: { label: "HTTPS", sub: "через туннель" },
    transport: { label: "webhook", sub: "нулевая задержка" },
    server: {
      icon: Server,
      label: "server-02",
      sub: "macOS",
      mcp: { icon: Globe, label: "chrome-devtools" },
      detail: "Управление браузером. ИИ сам открывает страницы, ищет в интернете, читает документацию.",
    },
  },
  {
    ai: {
      icon: Terminal,
      label: "ChatGPT · OpenUI",
      sub: "OpenAI Action",
      detail: "Custom GPT или OpenAPI endpoint. Без лимитов платного Codex.",
      href: "#/chatgpt",
    },
    tunnel: { label: "REST", sub: "через туннель" },
    transport: { label: "queue", sub: "надёжная доставка" },
    server: {
      icon: Server,
      label: "server-03",
      sub: "Windows",
      mcp: { icon: GitBranch, label: "git" },
      detail: "Git-операции. Чистка PR, ребейз, force-push — агент работает с репозиториями напрямую.",
    },
  },
];

export function ArchitectureDiagram({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="surface relative overflow-hidden rounded-3xl p-4 sm:p-7">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 glow-violet blur-3xl opacity-40" aria-hidden />

        <div className="relative">
          {/* LAYER 1 — label */}
          <LayerLabel>ваш AI</LayerLabel>

          {/* LAYER 2 — 3 AI nodes (top row) */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
            {COLUMNS.map((col, i) => (
              <FlowNode key={`ai-${i}`} node={col.ai} index={i} variant="ai" />
            ))}
          </div>

          {/* LAYER 3 — fork connectors: AI → hub ( \|/ shape) */}
          <ForkLayer columns={COLUMNS.map(c => ({ label: c.tunnel.label, sub: c.tunnel.sub }))} direction="down" delay={0.3} />

          {/* LAYER 4 — Hub (center) */}
          <div className="flex justify-center py-1">
            <HubNode />
          </div>

          {/* LAYER 5 — fork connectors: hub → servers ( /|\ shape) */}
          <ForkLayer columns={COLUMNS.map(c => ({ label: c.transport.label, sub: c.transport.sub }))} direction="down" delay={0.6} icon={Lock} />

          {/* LAYER 6 — label */}
          <LayerLabel>ваши серверы</LayerLabel>

          {/* LAYER 7 — 3 server nodes with MCP */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
            {COLUMNS.map((col, i) => (
              <ServerNode key={`srv-${i}`} col={col} index={i} />
            ))}
          </div>

          {/* caption */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 1 }}
            className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/70"
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
    <p className="mb-2 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground/50">
      {children}
    </p>
  );
}

function FlowNode({
  node,
  index,
  variant,
}: {
  node: { icon: LucideIcon; label: string; sub: string; detail: string; href: string };
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
      <a
        href={node.href}
        className={cn(
          "flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-center transition-all sm:flex-row sm:gap-2 sm:px-2.5 sm:text-left",
          hover ? "border-primary/40 bg-primary/[0.06]" : "border-border/60 bg-white/[0.02]"
        )}
      >
        <span className={cn(
          "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg sm:h-8 sm:w-8",
          isAi ? "bg-primary/10" : "border border-border/50 bg-white/[0.02]"
        )}>
          <Icon className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" />
        </span>
        <div className="min-w-0">
          <p className="hidden truncate font-mono text-[11px] font-medium leading-tight text-foreground/90 sm:block">{node.label}</p>
          <p className="hidden truncate text-[10px] leading-tight text-muted-foreground/70 sm:block">{node.sub}</p>
        </div>
      </a>

      {hover && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute left-1/2 top-full z-20 mt-2 w-52 -translate-x-1/2 rounded-xl border border-border/60 bg-[oklch(0.16_0.006_290)] p-3 shadow-xl shadow-black/40"
        >
          <p className="text-[11px] leading-relaxed text-muted-foreground">{node.detail}</p>
          <span className="mt-2 inline-block text-[11px] font-medium text-primary">подробнее →</span>
        </motion.div>
      )}
    </motion.div>
  );
}

function ServerNode({ col, index }: { col: Column; index: number }) {
  const [hover, setHover] = useState(false);
  const Icon = col.server.icon;
  const McpIcon = col.server.mcp.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: EASE, delay: 0.8 + index * 0.08 }}
      className="relative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        className={cn(
          "flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-center transition-all sm:px-2.5",
          hover ? "border-primary/40 bg-primary/[0.06]" : "border-border/60 bg-white/[0.02]"
        )}
      >
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-white/[0.02] sm:h-8 sm:w-8">
          <Icon className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" />
        </span>
        <p className="hidden truncate font-mono text-[11px] font-medium leading-tight text-foreground/90 sm:block">{col.server.label}</p>
        <p className="hidden truncate text-[10px] leading-tight text-muted-foreground/70 sm:block">{col.server.sub}</p>
        <span className="mt-0.5 hidden items-center gap-0.5 rounded-md border border-primary/20 bg-primary/[0.06] px-1 py-0.5 sm:inline-flex">
          <McpIcon className="h-2.5 w-2.5 text-primary" />
          <span className="font-mono text-[9px] text-primary/90">{col.server.mcp.label}</span>
        </span>
      </div>

      {hover && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute left-1/2 top-full z-20 mt-2 w-52 -translate-x-1/2 rounded-xl border border-border/60 bg-[oklch(0.16_0.006_290)] p-3 shadow-xl shadow-black/40"
        >
          <p className="text-[11px] leading-relaxed text-muted-foreground">{col.server.detail}</p>
        </motion.div>
      )}
    </motion.div>
  );
}

function HubNode() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: EASE }}
      className="relative"
    >
      <div className="pointer-events-none absolute -inset-4 glow-violet blur-2xl opacity-60" aria-hidden />
      <div className="relative flex items-center gap-2 rounded-2xl border border-primary/40 bg-primary/[0.08] px-5 py-3 backdrop-blur-md sm:px-6 sm:py-4">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 sm:h-10 sm:w-10">
          <Sparkles className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
        </span>
        <div className="text-left">
          <p className="text-sm font-semibold tracking-tight">GPT‑Админ</p>
          <p className="font-mono text-[10px] text-muted-foreground">MCP hub</p>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Fork layer: 3 nodes at top converge to center ( \|/ ), or center diverges to 3 ( /|\ ).
 * Draws an SVG with 3 diagonal lines + animated packets travelling along each.
 */
function ForkLayer({
  columns,
  direction,
  delay,
  icon: Icon,
}: {
  columns: { label: string; sub: string }[];
  direction: "down";
  delay: number;
  icon?: LucideIcon;
}) {
  // SVG viewBox: 300 wide, 60 tall. Top has 3 points at x=50,150,250. Bottom converges at x=150.
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="flex flex-col items-center"
    >
      {/* labels row (desktop only) */}
      <div className="hidden w-full max-w-md grid-cols-3 gap-1 sm:grid">
        {columns.map((c, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="flex items-center gap-1 rounded-full border border-border/50 bg-white/[0.02] px-1.5 py-0.5">
              {Icon && <Icon className="h-2.5 w-2.5 text-primary/70" />}
              <span className="text-[10px] font-medium text-muted-foreground/80">{c.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* SVG fork — 3 lines converging to center bottom */}
      <svg
        viewBox="0 0 300 60"
        className="h-10 w-full max-w-md sm:h-12" preserveAspectRatio="xMidYMid meet"
        
        aria-hidden
      >
        <defs>
          <linearGradient id="forkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.62 0.24 295 / 0.35)" />
            <stop offset="100%" stopColor="oklch(0.62 0.24 295 / 0.1)" />
          </linearGradient>
        </defs>
        {/* left line: (50,0) → (150,60) */}
        <line x1="50" y1="2" x2="150" y2="58" stroke="url(#forkGrad)" strokeWidth="1.5" />
        {/* center line: (150,0) → (150,60) */}
        <line x1="150" y1="2" x2="150" y2="58" stroke="url(#forkGrad)" strokeWidth="1.5" />
        {/* right line: (250,0) → (150,60) */}
        <line x1="250" y1="2" x2="150" y2="58" stroke="url(#forkGrad)" strokeWidth="1.5" />

        {/* animated packets — each travels along its line */}
        <PacketFollower x1="50" y1="2" x2="150" y2="58" delay={0} />
        <PacketFollower x1="150" y1="2" x2="150" y2="58" delay={0.6} />
        <PacketFollower x1="250" y1="2" x2="150" y2="58" delay={1.2} />
      </svg>

      {/* sub-labels (desktop only) */}
      <div className="hidden w-full max-w-md grid-cols-3 gap-1 sm:grid">
        {columns.map((c, i) => (
          <p key={i} className="text-center text-[9px] leading-tight text-muted-foreground/50">{c.sub}</p>
        ))}
      </div>
    </motion.div>
  );
}

/** Animated circle following a line path via SMIL animateMotion. */
function PacketFollower({
  x1, y1, x2, y2, delay,
}: {
  x1: number; y1: number; x2: number; y2: number; delay: number;
}) {
  const path = `M${x1},${y1} L${x2},${y2}`;
  return (
    <circle r="2.5" fill="oklch(0.78 0.16 295)" style={{ filter: "drop-shadow(0 0 4px oklch(0.62 0.24 295 / 0.8))" }}>
      <animateMotion
        dur="1.8s"
        repeatCount="indefinite"
        begin={`${delay}s`}
        path={path}
        keyPoints="0;1"
        keyTimes="0;1"
      />
      <animate
        attributeName="opacity"
        values="0;1;1;0"
        dur="1.8s"
        begin={`${delay}s`}
        repeatCount="indefinite"
      />
    </circle>
  );
}
