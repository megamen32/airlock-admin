"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

type Line =
  | { kind: "prompt"; text: string }
  | { kind: "user"; text: string }
  | { kind: "step"; text: string; ok?: string }
  | { kind: "out"; text: string }
  | { kind: "done"; text: string };

const SCRIPT: Line[] = [
  { kind: "prompt", text: "вы →" },
  { kind: "user", text: "поставь nginx и подними сайт bezrabotnyi.com" },
  { kind: "prompt", text: "gpt-админ →" },
  { kind: "step", text: "apt-get update", ok: "ok" },
  { kind: "step", text: "apt-get install -y nginx", ok: "ok" },
  { kind: "step", text: "write /etc/nginx/sites-available/bezrabotnyi", ok: "ok" },
  { kind: "step", text: "nginx -t", ok: "syntax ok" },
  { kind: "step", text: "systemctl restart nginx", ok: "ok" },
  { kind: "out", text: "curl -I https://bezrabotnyi.com → 200 OK" },
  { kind: "done", text: "Готово. Сайт поднят и доступен по HTTPS." },
];

export function TerminalDemo({ className }: { className?: string }) {
  const [count, setCount] = useState(0);
  const [running, setRunning] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Advance through the script lines.
  useEffect(() => {
    if (!running) return;
    if (count >= SCRIPT.length) {
      const reset = window.setTimeout(() => setCount(0), 4200);
      return () => window.clearTimeout(reset);
    }
    const isStep = SCRIPT[count]?.kind === "step";
    const delay = isStep ? 720 : SCRIPT[count]?.kind === "done" ? 520 : 560;
    const t = window.setTimeout(() => setCount((c) => c + 1), delay);
    return () => window.clearTimeout(t);
  }, [count, running]);

  // Auto-scroll to bottom as lines appear.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [count]);

  const visible = SCRIPT.slice(0, count);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/80 bg-[oklch(0.12_0.006_290)] shadow-2xl shadow-black/50",
        "hairline-top",
        className
      )}
      onMouseEnter={() => setRunning(false)}
      onMouseLeave={() => setRunning(true)}
    >
      {/* ambient violet glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-2/3 -translate-x-1/2 glow-violet blur-2xl" aria-hidden />

      {/* window chrome */}
      <div className="relative flex items-center gap-2 border-b border-border/60 bg-white/[0.02] px-4 py-3">
        <div className="flex gap-1.5" aria-hidden>
          <span className="h-3 w-3 rounded-full bg-[oklch(0.66_0.2_25_/_0.7)]" />
          <span className="h-3 w-3 rounded-full bg-[oklch(0.8_0.12_95_/_0.55)]" />
          <span className="h-3 w-3 rounded-full bg-[oklch(0.78_0.16_295_/_0.7)]" />
        </div>
        <div className="ml-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Terminal className="h-3.5 w-3.5 text-primary/70" />
          <span className="font-mono">gpt-admin · root@bezrabotnyi</span>
        </div>
        <span className="ml-auto hidden text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 sm:inline">
          live demo
        </span>
      </div>

      {/* terminal body */}
      <div
        ref={scrollRef}
        className="nice-scroll relative h-[320px] overflow-y-auto px-5 py-4 font-mono text-[13px] leading-relaxed sm:h-[360px]"
      >
        <AnimatePresence initial={false}>
          {visible.map((line, i) => (
            <LineRow key={i} line={line} active={i === count - 1} />
          ))}
        </AnimatePresence>

        {count < SCRIPT.length && (
          <span className="inline-block h-4 w-2 translate-y-0.5 bg-primary cursor-blink" aria-hidden />
        )}
      </div>
    </div>
  );
}

function LineRow({ line, active }: { line: Line; active: boolean }) {
  const base = "flex items-start gap-2 py-0.5";

  if (line.kind === "prompt") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(base, "mt-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70")}
      >
        {line.text}
      </motion.div>
    );
  }

  if (line.kind === "user") {
    return (
      <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className={cn(base, "text-foreground")}>
        <span className="text-primary">❯</span>
        <span>{line.text}</span>
      </motion.div>
    );
  }

  if (line.kind === "step") {
    return (
      <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className={cn(base, "text-muted-foreground")}>
        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        <span className="text-foreground/85">{line.text}</span>
        {line.ok && (
          <span className="ml-auto rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-primary">
            {line.ok}
          </span>
        )}
      </motion.div>
    );
  }

  if (line.kind === "out") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cn(base, "pl-5 text-primary/80")}>
        {line.text}
      </motion.div>
    );
  }

  // done
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(base, "mt-2 rounded-lg border border-primary/25 bg-primary/[0.06] px-3 py-2 text-foreground")}
    >
      <span className="text-primary">✦</span>
      <span>{line.text}</span>
    </motion.div>
  );
}
