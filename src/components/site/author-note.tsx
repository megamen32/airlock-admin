"use client";

import { motion } from "framer-motion";
import { Send, Heart } from "lucide-react";
import { Reveal } from "./reveal";
import { useT } from "@/hooks/use-t";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Personal note from the author — "I'm a real person, not a corporation." */
export function AuthorNote() {
  const { t } = useT();
  return (
    <section className="relative py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <Reveal>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: EASE }}
            className="surface relative overflow-hidden rounded-2xl p-6 sm:p-8"
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 glow-violet blur-3xl opacity-40" aria-hidden />

            <div className="relative flex items-start gap-4">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/[0.06]">
                <Heart className="h-5 w-5 text-primary" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground/60">
                  {t("author.eyebrow")}
                </p>
                <div className="mt-2 space-y-3 text-sm leading-relaxed text-foreground/90">
                  <p>{t("author.body1")}</p>
                  <p className="text-muted-foreground">{t("author.body2")}</p>
                </div>
                <a
                  href="https://t.me/careviolan"
                  target="_blank"
                  rel="noopener"
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/[0.06] px-4 py-2 text-sm font-medium text-primary transition-colors hover:border-primary/50 hover:bg-primary/[0.1]"
                >
                  <Send className="h-4 w-4" />
                  t.me/careviolan
                </a>
              </div>
            </div>
          </motion.div>
        </Reveal>
      </div>
    </section>
  );
}