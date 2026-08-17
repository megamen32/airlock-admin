"use client";

import { useSyncExternalStore, useState } from "react";
import { Download, Monitor, Terminal } from "lucide-react";
import { CopyCommand } from "./copy-command";
import { cn } from "@/lib/utils";

type OsId = "unix" | "windows";

type Option = {
  id: OsId;
  label: string;
  short: string;
  icon: React.ElementType;
  command: string;
  note: string;
};

const OPTIONS: Option[] = [
  {
    id: "unix",
    label: "macOS / Linux",
    short: "Mac/Linux",
    icon: Terminal,
    command: "curl -s https://became.bezrabotnyi.com/install.sh | bash",
    note: "Одна команда и для macOS, и для Linux. Установщик сам определит режим: без sudo — user‑mode в ~/.local/share/gptadmin (systemctl --user / LaunchAgents); c sudo — system‑mode в /opt/gptadmin. Запустите без sudo, если не уверены.",
  },
  {
    id: "windows",
    label: "Windows",
    short: "Windows",
    icon: Monitor,
    command: "iwr -UseBasicParsing https://became.bezrabotnyi.com/install_win.ps1 | iex",
    note: "Без админки ставится в %LOCALAPPDATA%\\gptadmin и создаёт Scheduled Task на вход текущего пользователя. Administrator нужен только для system‑mode.",
  },
];

/** Detect the visitor's OS from the browser. Falls back to unix (mac/linux). */
function detectOs(): OsId {
  if (typeof navigator === "undefined") return "unix";
  const ua = navigator.userAgent || (navigator as Navigator).platform || "";
  if (/Win/i.test(ua)) return "windows";
  return "unix";
}

// useSyncExternalStore lets us read a client-only value (navigator) without a
// hydration mismatch: the server snapshot is the neutral "unix", the client
// snapshot is the actually detected OS.
const subscribe = () => () => {};
const serverSnapshot = (): OsId => "unix";

type Props = {
  variant?: "compact" | "full";
  className?: string;
  defaultOs?: OsId;
};

/**
 * Install command with an OS auto-detecting switcher (macOS·Linux / Windows).
 * `compact` = slim segmented control + copyable command (hero, CTA, step cards).
 * `full` = larger card with a per-OS note (dedicated install section).
 */
export function InstallCommand({ variant = "compact", className, defaultOs }: Props) {
  // Auto-detected OS (client-only, hydration-safe via useSyncExternalStore).
  const detected = useSyncExternalStore(
    subscribe,
    () => detectOs(),
    serverSnapshot
  );
  // `override` is set when the user manually picks an OS in the switcher.
  const [override, setOverride] = useState<OsId | null>(null);
  const active = override ?? defaultOs ?? detected;

  const current = OPTIONS.find((o) => o.id === active) ?? OPTIONS[0];

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Segmented OS switcher */}
      <div
        role="tablist"
        aria-label="Выберите операционную систему"
        className="inline-flex w-full items-center gap-1 rounded-xl border border-border/60 bg-card/40 p-1 backdrop-blur-md"
      >
        {OPTIONS.map((o) => {
          const selected = o.id === active;
          return (
            <button
              key={o.id}
              role="tab"
              type="button"
              aria-selected={selected}
              onClick={() => setOverride(o.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition-all sm:text-[13px]",
                selected
                  ? "bg-primary/10 text-primary shadow-[inset_0_0_0_1px_oklch(0.62_0.24_295_/_0.28)]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <o.icon className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">{o.label}</span>
              <span className="sm:hidden">{o.short}</span>
            </button>
          );
        })}
      </div>

      {/* Command + note */}
      {variant === "compact" ? (
        <>
          <CopyCommand command={current.command} label="$" />
          {active === "windows" && (
            <a
              href="/gptadmin-win.zip"
              className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              <Download className="h-4 w-4" />
              Скачать готовую Windows-сборку (.zip)
            </a>
          )}
        </>
      ) : (
        <div className="surface rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <current.icon className="h-4 w-4 text-primary" />
            <span className="font-mono">{current.label}</span>
            <span className="text-muted-foreground/50">·</span>
            <span>определено автоматически</span>
          </div>
          <div className="mt-5">
            <CopyCommand command={current.command} label="$" />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{current.note}</p>
          {active === "windows" && (
            <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
              <a
                href="/gptadmin-win.zip"
                className="inline-flex items-center gap-1.5 font-medium text-primary underline-offset-4 hover:underline"
              >
                <Download className="h-4 w-4" />
                Скачать готовую Windows-сборку (.zip)
              </a>
              <a
                href="/gptadmin-win.zip.sha256"
                className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                SHA-256
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
