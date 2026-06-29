"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHashRoute, pageHref, type PageId } from "@/hooks/use-hash-route";

const PAGE_TABS: { id: PageId; label: string }[] = [
  { id: "chatgpt", label: "ChatGPT плагин" },
  { id: "mcp-server", label: "MCP сервер" },
  { id: "mcp-extension", label: "MCP расширение" },
  { id: "docs", label: "Документация" },
];

export function Header() {
  const { page, navigate } = useHashRoute();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled
          ? "border-b border-border/60 bg-background/70 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        {/* Logo → home */}
        <a
          href={pageHref("home")}
          onClick={(e) => {
            e.preventDefault();
            navigate("home");
          }}
          className="group flex items-center gap-2.5"
          aria-label="GPT‑Админ — на главную"
        >
          <Logo />
          <span className="text-[15px] font-semibold tracking-tight">
            GPT<span className="text-muted-foreground">‑</span>Админ
          </span>
        </a>

        {/* Page tabs — desktop */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Разделы">
          {PAGE_TABS.map((tab) => {
            const active = page === tab.id;
            return (
              <a
                key={tab.id}
                href={pageHref(tab.id)}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(tab.id);
                }}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm transition-colors",
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                )}
                aria-current={active ? "page" : undefined}
              >
                {tab.label}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={pageHref("chatgpt")}
            onClick={(e) => {
              e.preventDefault();
              navigate("chatgpt");
            }}
            className="hidden rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02] sm:inline-flex"
          >
            Установить
          </a>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border/70 text-foreground lg:hidden"
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-b border-border/60 bg-background/95 backdrop-blur-xl lg:hidden"
            aria-label="Мобильное меню"
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-1 px-5 py-4">
              <a
                href={pageHref("home")}
                onClick={(e) => {
                  e.preventDefault();
                  navigate("home");
                  setOpen(false);
                }}
                className={cn(
                  "rounded-lg px-3 py-3 text-base transition-colors hover:bg-white/[0.04]",
                  page === "home" ? "bg-primary/10 text-primary" : "text-muted-foreground"
                )}
              >
                Главная
              </a>
              {PAGE_TABS.map((tab) => (
                <a
                  key={tab.id}
                  href={pageHref(tab.id)}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(tab.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "rounded-lg px-3 py-3 text-base transition-colors hover:bg-white/[0.04]",
                    page === tab.id ? "bg-primary/10 text-primary" : "text-muted-foreground"
                  )}
                >
                  {tab.label}
                </a>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

function Logo() {
  return (
    <span className="relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-primary/30 bg-[oklch(0.12_0.006_290)]">
      <span className="pointer-events-none absolute inset-0 glow-violet opacity-60" aria-hidden />
      <svg viewBox="0 0 24 24" className="relative h-5 w-5" fill="none" aria-hidden>
        <path d="M6 8 L11 12 L6 16" stroke="oklch(0.78 0.16 295)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="13" y1="16" x2="18" y2="16" stroke="oklch(0.78 0.16 295)" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </span>
  );
}
