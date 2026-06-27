"use client";

import {
  FilePen,
  GitBranch,
  Microchip,
  ScrollText,
  Settings2,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { Stagger, StaggerItem } from "./reveal";
import { SectionHeading } from "./section-heading";
import { cn } from "@/lib/utils";

type Feature = {
  icon: LucideIcon;
  title: string;
  body: string;
  tags?: string[];
  span?: "wide" | "normal";
};

const FEATURES: Feature[] = [
  {
    icon: Settings2,
    title: "Администрирование",
    body: "Перезапуск и статус systemd, включение автозапуска, управление firewall, конфигурирование sshd, fail2ban и уведомления.",
    tags: ["systemctl", "ufw", "fail2ban", "sshd"],
    span: "wide",
  },
  {
    icon: FilePen,
    title: "Файлы и конфиги",
    body: "Читает и редактирует конфиги с валидацией синтаксиса, делает резервные копии и дифф‑патчи.",
    span: "normal",
  },
  {
    icon: GitBranch,
    title: "Софт и обновления",
    body: "Ставит пакеты, добавляет репозитории, обновляет версии с миграциями данных.",
    span: "normal",
  },
  {
    icon: ScrollText,
    title: "Логи и отладка",
    body: "Парсит journalctl / nginx / postgres‑логи, находит аномалии, предлагает фиксы и применяет их.",
    tags: ["journalctl", "tail -f", "grep", "anomaly"],
    span: "wide",
  },
  {
    icon: Microchip,
    title: "Ресурсы",
    body: "Мониторит CPU/RAM/IO/NET, настраивает алерты, ротацию логов и service healthchecks.",
    tags: ["top", "iostat", "iftop", "alerts"],
    span: "wide",
  },
  {
    icon: Workflow,
    title: "Интеграции",
    body: "Docker, Nginx, WireGuard, PostgreSQL, Redis, Fail2Ban, ufw, iptables, Certbot и др.",
    span: "normal",
  },
];

export function Features() {
  return (
    <section id="features" className="relative scroll-mt-20 py-24 sm:py-32">
      {/* subtle top divider glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-border to-transparent" aria-hidden />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Возможности"
          title={
            <>
              Полноценный админ —{" "}
              <span className="text-gradient-emerald">в одном агенте</span>
            </>
          }
          lead="GPT‑Админ не просто подсказывает команды. Он читает состояние, вносит изменения, валидирует их и отчитывается реальным выводом."
        />

        <Stagger className="mt-16 grid gap-5 lg:grid-cols-3" stagger={0.07}>
          {FEATURES.map((f) => (
            <StaggerItem key={f.title} className={cn(f.span === "wide" && "lg:col-span-2")}>
              <FeatureCard feature={f} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

function FeatureCard({ feature }: { feature: Feature }) {
  const { icon: Icon } = feature;
  return (
    <div className="surface surface-hover group relative flex h-full flex-col overflow-hidden rounded-2xl p-6">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/[0.06] transition-colors group-hover:border-primary/40">
          <Icon className="h-5 w-5 text-primary" />
        </span>
        <h3 className="text-lg font-semibold tracking-tight">{feature.title}</h3>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>

      {feature.tags && (
        <div className="mt-auto flex flex-wrap gap-2 pt-6">
          {feature.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-border/60 bg-white/[0.02] px-2 py-1 font-mono text-[11px] text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <span className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full glow-emerald opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
    </div>
  );
}
