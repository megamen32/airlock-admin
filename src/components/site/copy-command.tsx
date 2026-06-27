"use client";

import { Check, Copy } from "lucide-react";
import { useCopy } from "@/hooks/use-copy";
import { cn } from "@/lib/utils";

type Props = {
  command: string;
  label?: string;
  className?: string;
  variant?: "default" | "solid";
};

/** A monospace install command in a glass pill with copy-to-clipboard. */
export function CopyCommand({ command, label, className, variant = "default" }: Props) {
  const { copied, copy } = useCopy();

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 rounded-xl border border-border/80 bg-card/60 pr-2 pl-4 font-mono text-sm backdrop-blur-md transition-colors",
        "hover:border-primary/30",
        variant === "solid" && "border-border bg-background/80",
        className
      )}
    >
      {label && (
        <span className="select-none text-primary/70" aria-hidden>
          {label}
        </span>
      )}
      <code className="flex-1 truncate py-3 text-foreground/90">{command}</code>
      <button
        type="button"
        onClick={() => copy(command)}
        aria-label="Скопировать команду"
        className={cn(
          "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/70 text-muted-foreground transition-all",
          "hover:border-primary/40 hover:text-primary",
          copied && "border-primary/40 text-primary"
        )}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}
