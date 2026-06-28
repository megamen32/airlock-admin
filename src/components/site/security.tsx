"use client";

import { Eye, KeyRound, Lock, ShieldCheck } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "./reveal";
import { Eyebrow } from "./section-heading";

const ITEMS = [
  {
    icon: Lock,
    title: "Минимально необходимые права",
    body: "Root/Administrator не нужен для обычной установки. По умолчанию user‑mode; системный режим через sudo включаете только там, где он нужен. Поддержка ограниченных списков команд, polkit/ACL и audit‑логов.",
  },
  {
    icon: KeyRound,
    title: "Токены и IP‑allowlist",
    body: "Каждый агент имеет уникальный токен. Доступ можно ограничить по IP и подсетям, а также по времени — никаких общих ключей.",
  },
  {
    icon: Eye,
    title: "Логи без секретов",
    body: "Секреты маскируются в журналах. Для команд с чувствительными данными поддерживается режим «только локально».",
  },
];

export function Security() {
  return (
    <section id="security" className="relative scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          {/* Left — statement */}
          <Reveal className="flex flex-col justify-center">
            <Eyebrow>Безопасность и приватность</Eyebrow>
            <h2 className="display mt-5 text-balance text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
              Вы даёте доступ{" "}
              <span className="text-gradient-violet">только тому, чему нужно</span>
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
              GPT‑Админ спроектирован по принципу минимальных привилегий. Команды
              запускаются только по вашему запросу, всё логируется, секреты
              маскируются, критичные операции можно проводить в режиме approve.
            </p>

            <div className="mt-8 flex items-center gap-3 rounded-xl border border-border/60 bg-white/[0.02] p-4">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/[0.06]">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </span>
              <div className="text-sm">
                <p className="font-medium text-foreground">Nothing runs without you</p>
                <p className="text-muted-foreground">Команды — только из вашего чата. Фоновых действий нет.</p>
              </div>
            </div>
          </Reveal>

          {/* Right — cards */}
          <Stagger className="flex flex-col gap-4" stagger={0.1}>
            {ITEMS.map((item) => (
              <StaggerItem key={item.title}>
                <div className="surface surface-hover group flex gap-4 rounded-2xl p-5">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/[0.06]">
                    <item.icon className="h-5 w-5 text-primary" />
                  </span>
                  <div>
                    <h3 className="text-base font-semibold tracking-tight">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}
