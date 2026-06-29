"use client";

import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";
import { Download, Terminal } from "lucide-react";
import { InstallCastPlayer } from "./install-cast-player";
import { InstallCommand } from "./install-command";

export function Install() {
  return (
    <section id="install" className="relative scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Установка"
          title={
            <>
              Одна команда —{" "}
              <span className="text-gradient-violet">и серверы под управлением</span>
            </>
          }
          lead="Команда определяется автоматически под вашу ОС. После установки откройте ChatGPT → Actions → добавьте выданный API‑URL и ключ. Готово."
        />

        <Reveal className="mx-auto mt-14 max-w-3xl">
          <InstallCommand variant="full" />

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Быстрый запуск: отвечайте «1» (gptadmin_hub + shellmcp), затем «1» (авто‑туннель через FRP).
            Свой домен или статичный IP не нужны.
          </p>

          <div className="mt-8 overflow-hidden rounded-2xl border border-border/80 bg-card/60 text-left shadow-lg shadow-black/10">
            <div className="flex items-center gap-3 border-b border-border/70 bg-muted/30 px-5 py-4">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/[0.08]">
                <Terminal className="h-5 w-5 text-primary" />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold tracking-tight text-foreground">Пример реальной установки</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Полный прогон macOS: удаление старого состояния, hub + ShellMCP + FRP, health-checks.
                </p>
              </div>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
              <code className="overflow-x-auto rounded-xl border border-border/70 bg-[oklch(0.12_0.006_290)] px-4 py-3 font-mono text-xs text-primary/90">
                asciinema play /examples/mac-gptadmin-full-reinstall.cast
              </code>

              <a
                href="/examples/mac-gptadmin-full-reinstall.cast"
                download
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/25 bg-primary/[0.08] px-3.5 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/[0.12]"
              >
                <Download className="h-4 w-4" />
                Скачать cast
              </a>
            </div>

            <div className="px-5 pb-5">
              <InstallCastPlayer src="/examples/mac-gptadmin-full-reinstall.cast" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
