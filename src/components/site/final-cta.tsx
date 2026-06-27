"use client";

import { ArrowRight, Github, Rocket, Star } from "lucide-react";
import { Reveal } from "./reveal";
import { CopyCommand } from "./copy-command";

export function FinalCTA() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/40 px-6 py-16 backdrop-blur-md sm:px-16 sm:py-20">
          {/* ambient glow */}
          <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
            <div className="absolute left-1/2 top-[-30%] h-[400px] w-[700px] -translate-x-1/2 glow-emerald blur-3xl opacity-70" />
            <div className="absolute inset-0 opacity-[0.4]" style={{
              backgroundImage:
                "linear-gradient(to right, oklch(0.78 0.16 162 / 0.05) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.78 0.16 162 / 0.05) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
              maskImage: "radial-gradient(ellipse 60% 60% at 50% 50%, #000 30%, transparent 70%)",
              WebkitMaskImage: "radial-gradient(ellipse 60% 60% at 50% 50%, #000 30%, transparent 70%)",
            }} />
          </div>

          <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.06] px-3 py-1 text-xs font-medium text-primary">
              <Star className="h-3.5 w-3.5" /> Готовы попробовать?
            </span>

            <h2 className="display mt-6 text-balance text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
              Установка занимает минуту.
              <br />
              <span className="font-[family-name:var(--font-instrument-serif)] italic text-gradient-emerald">
                Вернуться к рутине
              </span>{" "}
              — всегда успеете.
            </h2>

            <div className="mt-9 w-full max-w-xl">
              <CopyCommand command="curl -s https://became.bezrabotnyi.com/install.sh | bash" label="$" />
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#install"
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
              >
                <Rocket className="h-4 w-4" />
                Установить
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <a
                href="https://github.com/megamen32/gptadmin_opensource"
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-white/[0.02] px-6 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-white/[0.04]"
              >
                <Github className="h-4 w-4" />
                Открытый исходный код
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
