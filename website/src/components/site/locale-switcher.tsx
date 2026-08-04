"use client";

import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale, LOCALES, LOCALE_META, type Locale } from "@/hooks/use-locale";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Compact dropdown language switcher with current locale highlighted. */
export function LocaleSwitcher() {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-full border border-border/70 bg-white/[0.02] px-3 text-xs font-medium text-foreground transition-colors hover:border-primary/40",
          open && "border-primary/40"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Switch language"
      >
        <Languages className="h-3.5 w-3.5 text-primary" />
        <span>{LOCALE_META[locale].short}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: EASE }}
            className="absolute right-0 top-full z-50 mt-2 min-w-[140px] overflow-hidden rounded-xl border border-border/60 bg-background/95 shadow-lg backdrop-blur-xl"
          >
            {LOCALES.map((l: Locale) => {
              const active = l === locale;
              return (
                <li key={l}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      setLocale(l);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-white/[0.05]",
                      active ? "bg-primary/10 text-primary" : "text-foreground/90"
                    )}
                  >
                    <span>{LOCALE_META[l].label}</span>
                    <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                      {LOCALE_META[l].short}
                    </span>
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
