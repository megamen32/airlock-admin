"use client";

import { Lock, Monitor, Terminal } from "lucide-react";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";
import { CopyCommand } from "./copy-command";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TABS = [
  {
    value: "linux",
    icon: Terminal,
    label: "Linux / macOS",
    title: "Без sudo",
    command: "curl -s https://became.bezrabotnyi.com/install.sh | bash",
    note: "Ставит в ~/.local/share/gptadmin, конфиг в ~/.config/gptadmin, сервисы пользователя через systemctl --user или LaunchAgents.",
  },
  {
    value: "system",
    icon: Lock,
    label: "System mode",
    title: "Когда нужен root",
    command: "curl -s https://became.bezrabotnyi.com/install.sh | sudo bash",
    note: "Системная установка в /opt/gptadmin и /etc/gptadmin с systemd/LaunchDaemons. Используйте только если нужны системные права.",
  },
  {
    value: "windows",
    icon: Monitor,
    label: "Windows",
    title: "Без Administrator",
    command: "iwr -UseBasicParsing https://became.bezrabotnyi.com/install_win.ps1 | iex",
    note: "Без админки ставится в %LOCALAPPDATA%\\gptadmin и создаёт Scheduled Task на вход текущего пользователя. Administrator нужен только для system‑mode.",
  },
];

export function Install() {
  return (
    <section id="install" className="relative scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Установка"
          title={
            <>
              Одна команда —{" "}
              <span className="text-gradient-emerald">и серверы под управлением</span>
            </>
          }
          lead="После установки откройте ChatGPT → Actions → добавьте выданный API‑URL и ключ. Готово."
        />

        <Reveal className="mx-auto mt-14 max-w-3xl">
          <Tabs defaultValue="linux" className="w-full">
            <TabsList className="grid w-full grid-cols-3 rounded-xl border border-border/60 bg-card/40 p-1.5 backdrop-blur-md">
              {TABS.map((t) => (
                <TabsTrigger
                  key={t.value}
                  value={t.value}
                  className="flex items-center gap-2 rounded-lg text-xs font-medium data-[state=active]:bg-primary/10 data-[state=active]:text-primary sm:text-sm"
                >
                  <t.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{t.label}</span>
                  <span className="sm:hidden">{t.label.split(" ")[0]}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {TABS.map((t) => (
              <TabsContent key={t.value} value={t.value} className="mt-5">
                <div className="surface rounded-2xl p-6 sm:p-8">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <t.icon className="h-4 w-4 text-primary" />
                    <span className="font-mono">{t.label}</span>
                    <span className="text-muted-foreground/50">·</span>
                    <span>{t.title}</span>
                  </div>

                  <div className="mt-5">
                    <CopyCommand command={t.command} label="$" />
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{t.note}</p>
                </div>
              </TabsContent>
            ))}
          </Tabs>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Быстрый запуск: отвечайте «1» (hub_proxy + rootd), затем «1» (авто‑туннель через FRP).
            Свой домен или статичный IP не нужны.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
