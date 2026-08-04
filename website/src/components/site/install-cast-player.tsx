"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

type CastEvent = [number, "o" | "i", string];

type CastPlayerProps = {
  src: string;
  title?: string;
  className?: string;
};

const MAX_VISIBLE_LINES = 34;

export function InstallCastPlayer({ src, title = "macOS full install.cast", className }: CastPlayerProps) {
  const [events, setEvents] = useState<CastEvent[]>([]);
  const [output, setOutput] = useState("");
  const [runId, setRunId] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timers = useRef<number[]>([]);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(src)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((text) => {
        if (cancelled) return;
        const lines = text.trimEnd().split("\n");
        const parsed = lines
          .slice(1)
          .map((line) => JSON.parse(line) as CastEvent)
          .filter((event) => event[1] === "o");
        setEvents(parsed);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [src]);

  const duration = useMemo(() => (events.length ? events[events.length - 1][0] : 0), [events]);

  useEffect(() => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];

    const resetTimer = window.setTimeout(() => {
      setOutput("");
      setDone(false);
    }, 0);
    timers.current.push(resetTimer);

    if (events.length === 0) return;

    const speed = 1.0; // play demo timing as authored; readable install pace.
    events.forEach(([time, , chunk]) => {
      const id = window.setTimeout(() => {
        setOutput((current) => current + chunk);
      }, Math.max(25, time * 1000 * speed));
      timers.current.push(id);
    });

    const doneTimer = window.setTimeout(() => setDone(true), Math.max(0, duration * 1000 * speed + 500));
    timers.current.push(doneTimer);

    return () => {
      timers.current.forEach(window.clearTimeout);
      timers.current = [];
    };
  }, [duration, events, runId]);

  useEffect(() => {
    const el = viewportRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [output]);

  const lines = useMemo(() => {
    const clean = stripAnsi(output).replace(/\r/g, "");
    const all = clean.split("\n");
    return all.slice(Math.max(0, all.length - MAX_VISIBLE_LINES));
  }, [output]);

  function restart() {
    setRunId((value) => value + 1);
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/80 bg-[oklch(0.12_0.006_290)] shadow-2xl shadow-black/30",
        className
      )}
    >
      <div className="flex items-center gap-3 border-b border-white/[0.08] bg-white/[0.03] px-4 py-3">
        <div className="flex gap-1.5" aria-hidden>
          <span className="h-3 w-3 rounded-full bg-[oklch(0.66_0.2_25_/_0.75)]" />
          <span className="h-3 w-3 rounded-full bg-[oklch(0.8_0.12_95_/_0.65)]" />
          <span className="h-3 w-3 rounded-full bg-[oklch(0.78_0.16_295_/_0.75)]" />
        </div>
        <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <Terminal className="h-3.5 w-3.5 text-primary/80" />
          <span className="truncate font-mono">{title}</span>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={restart}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-zinc-300 transition-colors hover:border-primary/40 hover:text-primary"
            aria-label="Сначала"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div ref={viewportRef} className="nice-scroll h-[440px] overflow-y-auto px-4 py-4 font-mono text-[12px] leading-relaxed text-zinc-200 sm:text-[13px]">
        {error ? (
          <span className="text-red-300">Не удалось загрузить cast: {error}</span>
        ) : lines.length ? (
          lines.map((line, i) => <TerminalLine key={`${i}-${line}`} line={line} />)
        ) : (
          <span className="text-zinc-500">Загрузка записи установки…</span>
        )}
        {!done && <span className="inline-block h-4 w-2 translate-y-0.5 bg-primary cursor-blink" aria-hidden />}
      </div>
    </div>
  );
}

function TerminalLine({ line }: { line: string }) {
  const highlighted = line.includes("===== ") || line.includes("=== ");
  const ok = line.includes("HTTP/1.1 200") || line.includes("http_code=200") || line.includes("alive");
  const warn = line.includes("rm -rf") || line.includes("bootout") || line.includes("DELETE OLD");

  return (
    <div className={cn("min-h-[1.45em] whitespace-pre-wrap break-words", highlighted && "text-primary", ok && "text-emerald-300", warn && "text-amber-300")}>
      {line || " "}
    </div>
  );
}

function stripAnsi(input: string) {
  return input.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, "");
}
