"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Stagger, StaggerItem } from "./reveal";
import { SectionHeading } from "./section-heading";
import { cn } from "@/lib/utils";

type Shot = { src: string; alt: string; caption: string; span?: "wide" | "tall" };

const SHOTS: Shot[] = [
  {
    src: "/screenshots/shot-1.png",
    alt: "Журнал событий systemd и диагностика",
    caption: "Журнал событий systemd",
    span: "wide",
  },
  {
    src: "/screenshots/shot-2.png",
    alt: "Консоль и диагностика сервера",
    caption: "Консоль и диагностика",
  },
  {
    src: "/screenshots/shot-3.png",
    alt: "Мониторинг ресурсов сервера",
    caption: "Мониторинг ресурсов",
  },
  {
    src: "/screenshots/install-diagram.png",
    alt: "Схема установки и сети GPT‑Админ",
    caption: "Схема установки",
    span: "wide",
  },
];

export function Screenshots() {
  const [active, setActive] = useState<Shot | null>(null);

  // Close the lightbox on Escape and lock body scroll while open.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [active]);

  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="В деле"
          title={
            <>
              Так выглядит работа —{" "}
              <span className="text-gradient-violet">реальные скриншоты</span>
            </>
          }
          lead="Без постановочных картинок. Это рабочий вывод GPT‑Админа на реальных серверах."
        />

        <Stagger className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" stagger={0.08}>
          {SHOTS.map((shot) => (
            <StaggerItem
              key={shot.src}
              className={cn(
                shot.span === "wide" && "sm:col-span-2",
                shot.span === "tall" && "lg:row-span-2"
              )}
            >
              <button
                type="button"
                onClick={() => setActive(shot)}
                className="surface surface-hover group relative block w-full overflow-hidden rounded-2xl text-left"
              >
                <div className={cn("relative w-full", shot.span === "tall" ? "aspect-[3/4]" : "aspect-[16/10]")}>
                  <Image
                    src={shot.src}
                    alt={shot.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover object-top opacity-90 transition-all duration-700 group-hover:scale-[1.04] group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-4">
                    <span className="text-sm font-medium text-foreground/90">{shot.caption}</span>
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-background/60 text-muted-foreground opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100">
                      <ExpandIcon />
                    </span>
                  </div>
                </div>
              </button>
            </StaggerItem>
          ))}
        </Stagger>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 p-4 backdrop-blur-md sm:p-10"
            onClick={() => setActive(null)}
            role="dialog"
            aria-modal="true"
            aria-label={active.alt}
          >
            <button
              type="button"
              onClick={() => setActive(null)}
              className="absolute right-5 top-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-background/60 text-foreground backdrop-blur-md transition-colors hover:border-primary/40 hover:text-primary"
              aria-label="Закрыть"
            >
              <X className="h-5 w-5" />
            </button>
            <motion.figure
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="relative max-h-full max-w-6xl overflow-hidden rounded-2xl border border-border/70 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={active.src}
                alt={active.alt}
                width={1920}
                height={1080}
                className="max-h-[85vh] w-auto object-contain"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 to-transparent p-5 text-sm text-foreground/90">
                {active.caption}
              </figcaption>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function ExpandIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
    </svg>
  );
}
