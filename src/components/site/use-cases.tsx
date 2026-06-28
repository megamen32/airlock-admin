"use client";

import {
  Bug,
  FileCode2,
  GitPullRequest,
  Globe,
  ScrollText,
  ServerCog,
  type LucideIcon,
} from "lucide-react";
import { Stagger, StaggerItem, Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

type UseCase = {
  icon: LucideIcon;
  title: string;
  body: string;
  tag?: string;
};

const CASES: UseCase[] = [
  {
    icon: ServerCog,
    title: "Администрирование серверов",
    body: "Перезапуск systemd, firewall, nginx, fail2ban, sshd. Ставит софт, правит конфиги, открывает порты — и валидирует результат.",
    tag: "systemd · nginx · ufw",
  },
  {
    icon: FileCode2,
    title: "Написание и запуск кода",
    body: "Правит код, прогоняет проверки и может запустить сабагента — «запусти codex для фикса этого бага», пока вы занимаетесь другим.",
    tag: "subagents",
  },
  {
    icon: GitPullRequest,
    title: "Фикс и чистка PR",
    body: "Находит форк в памяти, оставляет один feature-коммит, прогоняет type-check/lint/build и делает force-push через SSH.",
    tag: "git · force-with-lease",
  },
  {
    icon: ScrollText,
    title: "Проверка логов",
    body: "Парсит journalctl, nginx, postgres-логи, находит аномалии, предлагает фиксы и применяет их после подтверждения.",
    tag: "journalctl · grep",
  },
  {
    icon: Globe,
    title: "Поиск в интернете",
    body: "Через chrome-devtools MCP — агент сам открывает страницы, читает докумен­тацию и ищет решение, не выходя из чата.",
    tag: "chrome-devtools mcp",
  },
  {
    icon: Bug,
    title: "Диагностика инцидентов",
    body: "Сам находит упавший сервис, читает логи, понимает причину (ECONNREFUSED, 503, OOM) и чинит — с отчётом и проверками.",
    tag: "auto-diagnose",
  },
];

/** Capabilities of the hub — independent of which AI adapter you use. */
export function UseCases() {
  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Что можно делать через хаб"
          title={
            <>
              Любой AI —{" "}
              <span className="text-gradient-violet">любыми способами</span>
            </>
          }
          lead="Возможности даёт сам хаб, а не конкретный адаптер. Какой бы AI вы ни подключили — Claude, DeepSeek или ChatGPT — он получит доступ ко всему этому."
        />

        <Stagger className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={0.07}>
          {CASES.map((c) => (
            <StaggerItem key={c.title}>
              <div className="surface surface-hover group relative flex h-full flex-col overflow-hidden rounded-2xl p-6">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/[0.06] transition-colors group-hover:border-primary/40">
                    <c.icon className="h-5 w-5 text-primary" />
                  </span>
                  <h3 className="text-base font-semibold tracking-tight">{c.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
                {c.tag && (
                  <div className="mt-auto pt-5">
                    <span className="rounded-md border border-border/60 bg-white/[0.02] px-2 py-1 font-mono text-[11px] text-muted-foreground">
                      {c.tag}
                    </span>
                  </div>
                )}
                <span className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full glow-violet opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
