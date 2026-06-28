"use client";

import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Stagger, StaggerItem } from "./reveal";
import { SectionHeading } from "./section-heading";
import { cn } from "@/lib/utils";

type Plan = {
  name: string;
  price: React.ReactNode;
  blurb?: string;
  features: string[];
  cta: { label: string; href: string };
  featured?: boolean;
};

const PLANS: Plan[] = [
  {
    name: "Starter",
    price: "₽0",
    blurb: "Для одного сервера и пет‑проектов",
    features: [
      "1 хаб + 1 агент",
      "Базовые команды и логи",
      "Установка в 1 клик",
    ],
    cta: { label: "Начать", href: "#install" },
  },
  {
    name: "Pro",
    price: (
      <>
        <span className="text-muted-foreground line-through decoration-muted-foreground/60">199₽</span>{" "}
        <span className="text-gradient-violet">Бесплатно</span>
      </>
    ),
    blurb: "Для энтузиастов и небольших команд — сейчас без ограничений",
    features: [
      "До 3 агентов",
      "Расширенные интеграции",
      "Алерты в Telegram",
      "Неограниченные команды",
      "Приоритетная поддержка",
    ],
    cta: { label: "Подключить бесплатно", href: "#install" },
    featured: true,
  },
  {
    name: "Enterprise",
    price: "По запросу",
    blurb: "Для команд и продакшн‑инфраструктуры",
    features: [
      "SSO и частный сетевой доступ",
      "Аудит и политика команд",
      "Частный хостинг",
      "SLA и поддержка",
    ],
    cta: { label: "Связаться", href: "https://t.me/careviolan" },
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Тарифы"
          title={
            <>
              Начать бесплатно,{" "}
              <span className="text-gradient-violet">расти без сюрпризов</span>
            </>
          }
          lead={
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.06] px-3 py-1 text-sm font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Все функции бесплатно до конца лета
            </span>
          }
        />

        <Stagger className="mt-16 grid items-stretch gap-6 lg:grid-cols-3" stagger={0.1}>
          {PLANS.map((plan) => (
            <StaggerItem key={plan.name} className="flex">
              <PlanCard plan={plan} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <div
      className={cn(
        "surface relative flex w-full flex-col rounded-2xl p-7",
        plan.featured
          ? "border-primary/40 shadow-[0_0_0_1px_oklch(0.78_0.16_295_/_0.25),0_30px_80px_-30px_oklch(0.78_0.16_295_/_0.4)]"
          : "surface-hover"
      )}
    >
      {plan.featured && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-primary/40 bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground shadow-lg">
          Популярный
        </span>
      )}

      <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        {plan.name}
      </h3>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-4xl font-semibold tracking-tight">{plan.price}</span>
      </div>
      {plan.blurb && <p className="mt-2 text-sm text-muted-foreground">{plan.blurb}</p>}

      <ul className="mt-7 flex flex-1 flex-col gap-3">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-3 text-sm">
            <span
              className={cn(
                "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                plan.featured ? "bg-primary/15 text-primary" : "bg-primary/10 text-primary"
              )}
            >
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
            <span className="text-foreground/85">{f}</span>
          </li>
        ))}
      </ul>

      <a
        href={plan.cta.href}
        className={cn(
          "group mt-8 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition-all",
          plan.featured
            ? "bg-primary text-primary-foreground hover:scale-[1.02]"
            : "border border-border/80 bg-white/[0.02] text-foreground hover:border-primary/40 hover:bg-white/[0.04]"
        )}
      >
        {plan.cta.label}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </a>
    </div>
  );
}
