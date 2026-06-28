"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Reveal } from "./reveal";
import { Eyebrow } from "./section-heading";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Per-page hero with ambient violet glow. */
export function PageHero({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden pt-28 sm:pt-36">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute left-1/2 top-[-10%] h-[420px] w-[720px] -translate-x-1/2 glow-violet blur-3xl animate-aurora" />
        <div className="absolute right-[-8%] top-[15%] h-[300px] w-[300px] rounded-full bg-primary/[0.08] blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="flex justify-center"
          >
            <Eyebrow>{eyebrow}</Eyebrow>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.06, ease: EASE }}
            className="display mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl"
          >
            {title}
          </motion.h1>

          {lead && (
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.14, ease: EASE }}
              className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              {lead}
            </motion.p>
          )}

          {children && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.22, ease: EASE }}
              className="mt-8 flex flex-col items-center gap-3"
            >
              {children}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}

/** A numbered instruction step row. */
export function Step({
  n,
  title,
  children,
}: {
  n: string | number;
  title: string;
  children: ReactNode;
}) {
  return (
    <Reveal className="flex gap-4">
      <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/[0.06] font-mono text-sm text-primary">
        {n}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
        <div className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{children}</div>
      </div>
    </Reveal>
  );
}
