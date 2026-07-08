"use client";

import { Activity, Clock, Scissors, ServerCrash, Waves, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Stagger, StaggerItem, Reveal } from "./reveal";
import { SectionHeading, Eyebrow } from "./section-heading";

type Card = {
  icon: LucideIcon;
  title: string;
  body: string;
  tags?: string[];
};

const ENGINEERING: Card[] = [
  {
    icon: Waves,
    title: "Надёжный транспорт",
    body: "Устойчивые соединения, авто‑переподключение и гарантированная доставка команд — даже через туннели и нестабильную сеть.",
    tags: ["reconnect", "retry", "queue"],
  },
  {
    icon: Clock,
    title: "Авто background‑задачи",
    body: "Долгие операции уходят в фон, агент получает job_id и опрашивает результат — чат не зависает, а команда дорабатывает до конца.",
    tags: ["job_id", "poll", "async"],
  },
  {
    icon: ServerCrash,
    title: "Fallback без чёрной дыры",
    body: "При падении primary fallback сохраняет доступ к урезанному hub. Часть свежего in-memory состояния может быть неполной, но очереди, spool, outbox и логи лежат на диске и помогают восстановиться.",
    tags: ["failover", "disk state", "recovery"],
  },

  {
    icon: Scissors,
    title: "Умная обрезка вывода",
    body: "Большой stdout/stderr режется на чанки по умолчанию — экономим токены, агент читает ровно столько, сколько нужно для ответа.",
    tags: ["chunk", "spill", "save tokens"],
  },
];

const EASE = [0.16, 1, 0.3, 1] as const;

export function UnderTheHood() {
  return (
    <section className="relative scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Под капотом"
          title={
            <>
              Инфраструктура, которой{" "}
              <span className="text-gradient-violet">можно доверять</span>
            </>
          }
          lead="GPT‑Админ спроектирован для реальной работы, а не для демо: транспорт не падает, долгие задачи не зависают, а токены не сгорают впустую."
        />

        <Stagger className="mt-16 grid gap-5 lg:grid-cols-3" stagger={0.08}>
          {ENGINEERING.map((c) => (
            <StaggerItem key={c.title}>
              <CardView card={c} />
            </StaggerItem>
          ))}
        </Stagger>

        {/* Coming soon — web panel */}
        <Reveal className="mt-5">
          <div className="surface surface-hover group relative flex flex-col gap-6 overflow-hidden rounded-2xl p-7 md:flex-row md:items-center md:justify-between md:p-9">
            <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 glow-violet blur-3xl opacity-50" aria-hidden />

            <div className="relative flex items-start gap-4">
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/[0.06]">
                <Activity className="h-5.5 w-5.5 text-primary" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-semibold tracking-tight">Веб‑панель</h3>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/[0.08] px-2.5 py-0.5 text-[11px] font-medium text-primary">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                    Скоро · следующее обновление
                  </span>
                </div>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  Смотрите очередь заданий, здоровье агентов и MCP и читайте логи — прямо
                  с сайта, без терминала. Полный контроль над фермой серверов в одном окне.
                </p>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.15 }}
              className="relative hidden shrink-0 overflow-hidden rounded-xl border border-border/60 bg-[oklch(0.12_0.006_290)] p-3 md:block"
              aria-hidden
            >
              <MiniDashboard />
            </motion.div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function CardView({ card }: { card: Card }) {
  const { icon: Icon } = card;
  return (
    <div className="surface surface-hover group relative flex h-full flex-col overflow-hidden rounded-2xl p-6">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/[0.06] transition-colors group-hover:border-primary/40">
          <Icon className="h-5 w-5 text-primary" />
        </span>
        <h3 className="text-lg font-semibold tracking-tight">{card.title}</h3>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{card.body}</p>
      {card.tags && (
        <div className="mt-auto flex flex-wrap gap-2 pt-6">
          {card.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-border/60 bg-white/[0.02] px-2 py-1 font-mono text-[11px] text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      <span className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full glow-violet opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
    </div>
  );
}

/** Decorative mini dashboard preview for the coming-soon web panel. */
function MiniDashboard() {
  const rows = [
    { name: "shellmcp:server-01", status: "online", w: "92%" },
    { name: "shellmcp:server-44", status: "online", w: "64%" },
    { name: "shellmcp:homeassistant", status: "online", w: "38%" },
  ];
  return (
    <div className="w-56">
      <div className="mb-2 flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="font-mono">agents · health</span>
        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
      </div>
      <div className="flex flex-col gap-1.5">
        {rows.map((r) => (
          <div key={r.name} className="rounded-md border border-border/50 bg-white/[0.02] px-2 py-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] text-foreground/70">{r.name}</span>
              <span className="text-[9px] text-primary">{r.status}</span>
            </div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/5">
              <div className="h-full rounded-full bg-primary/60" style={{ width: r.w }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
