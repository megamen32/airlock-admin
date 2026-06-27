"use client";

import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";
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
            Быстрый запуск: отвечайте «1» (hub_proxy + shellmcp), затем «1» (авто‑туннель через FRP).
            Свой домен или статичный IP не нужны.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
