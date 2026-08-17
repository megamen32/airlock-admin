"use client";

import { Globe, Github, Send } from "lucide-react";
import { useT } from "@/hooks/use-t";
import { useLocale } from "@/hooks/use-locale";
import { BRAND } from "@/lib/brand";

/** Split a brand like "GPT‑Админ" / "GPT‑Admin" / "GPT‑管理" so the
 *  middle dash can be rendered greyed-out. */
function splitBrand(brand: string): { head: string; sep: string; tail: string } {
  const idx = brand.indexOf("‑");
  if (idx === -1) return { head: brand, sep: "", tail: "" };
  return {
    head: brand.slice(0, idx),
    sep: "‑",
    tail: brand.slice(idx + 1),
  };
}

export function Footer() {
  const { t } = useT();
  const { locale } = useLocale();
  const { head, sep, tail } = splitBrand(BRAND[locale]);

  return (
    <footer className="mt-auto border-t border-border/60 bg-background/60 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <a href="#top" className="flex items-center gap-2.5" aria-label={BRAND[locale]}>
            <span className="relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-primary/30 bg-[oklch(0.12_0.006_290)]">
              <span className="pointer-events-none absolute inset-0 glow-violet opacity-60" aria-hidden />
              <svg viewBox="0 0 24 24" className="relative h-5 w-5" fill="none" aria-hidden>
                <path d="M6 8 L11 12 L6 16" stroke="oklch(0.78 0.16 295)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="13" y1="16" x2="18" y2="16" stroke="oklch(0.78 0.16 295)" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            <span className="text-[15px] font-semibold tracking-tight">
              {head}
              {sep && <span className="text-muted-foreground">{sep}</span>}
              {tail}
            </span>
          </a>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground" aria-label={t("footer.ariaLabel")}>
            <a href="#/docs" className="transition-colors hover:text-foreground">{t("footer.links.docs")}</a>
            <a
              href="https://github.com/megamen32/gptadmin_opensource"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <Github className="h-3.5 w-3.5" /> {t("footer.links.github")}
            </a>
            <a
              href="https://gptadmin.bezrabotnyi.com"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <Globe className="h-3.5 w-3.5" /> {t("footer.links.website")}
            </a>
            <a
              href="https://t.me/careviolan"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <Send className="h-3.5 w-3.5" /> {t("footer.links.telegram")}
            </a>
          </nav>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border/40 pt-6 text-xs text-muted-foreground/70 sm:flex-row">
          <p>{t("footer.copyright")}</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <a
              href="https://gptadmin.bezrabotnyi.com"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"
            >
              <Globe className="h-3 w-3" />
              {t("footer.projects")}
            </a>
            <span className="hidden sm:inline text-muted-foreground/40">·</span>
            <p className="flex items-center gap-1.5">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-primary/70 shadow-[0_0_8px_1px] shadow-primary/50" />
              {t("footer.tagline")}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
