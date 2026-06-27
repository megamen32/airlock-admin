"use client";

import { motion } from "framer-motion";
import { ArrowRight, Terminal } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "./reveal";
import { SectionHeading } from "./section-heading";
import { CopyCommand } from "./copy-command";

const STEPS = [
  {
    n: "01",
    title: "Установка",
    body: "Ставите hub‑proxy и shellmcp на главный ПК/VPS и только shellmcp на остальные машины (Linux/macOS/Windows). Без sudo — в домашнюю папку, через systemctl --user.",
    command: "curl -s https://became.bezrabotnyi.com/install.sh | bash",
    note: "После установки вам напишет Hub URL и API‑ключ (Bearer) — запомните их.",
  },
  {
    n: "02",
    title: "Подключение к ChatGPT",
    body: "Создаёте новое действие в ChatGPT и импортируете OpenAPI-описание. Подставляете свой Hub URL и Bearer-ключ CTL_TOKEN.",
    steps: [
      "Откройте chatgpt.com/gpts/editor",
      "Нажмите «Создать новое действие»",
      "Импорт по URL: became.bezrabotnyi.com/api.json",
      "Замените url в «servers» на свой Hub URL",
      "Auth → API ключ, Bearer → CTL_TOKEN",
    ],
  },
  {
    n: "03",
    title: "Работа",
    body: "Вы пишете: «Поставь WireGuard», «Почини nginx». GPT‑Админ запускает команды, читает логи, исправляет ошибки и возвращает отчёт.",
    cta: true,
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Как это работает"
          title={
            <>
              Две части: <span className="text-gradient-violet">hub‑proxy</span> и{" "}
              <span className="text-gradient-violet">shellmcp</span>
            </>
          }
          lead="Hub проксирует команды, shellmcp исполняет их локально и безопасно возвращает результат. От установки до первой команды — пара минут."
        />

        <Stagger className="mt-16 grid gap-6 lg:grid-cols-3" stagger={0.12}>
          {STEPS.map((step) => (
            <StaggerItem key={step.n}>
              <StepCard step={step} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

type Step = (typeof STEPS)[number];

function StepCard({ step }: { step: Step }) {
  return (
    <div className="surface surface-hover ring-conic group relative flex h-full flex-col rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm text-primary/70">{step.n}</span>
        <span className="h-px w-12 bg-gradient-to-r from-primary/40 to-transparent" />
      </div>

      <h3 className="mt-5 text-xl font-semibold tracking-tight">{step.title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.body}</p>

      {"command" in step && step.command && (
        <div className="mt-5">
          <CopyCommand command={step.command} label="$" />
          {"note" in step && step.note && (
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground/80">{step.note}</p>
          )}
        </div>
      )}

      {"steps" in step && step.steps && (
        <ol className="mt-5 flex flex-col gap-2.5">
          {step.steps.map((s, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-border/70 bg-white/[0.02] font-mono text-[11px] text-primary/80">
                {i + 1}
              </span>
              <span className="text-foreground/80">{s}</span>
            </li>
          ))}
        </ol>
      )}

      {"cta" in step && step.cta && (
        <div className="mt-auto pt-6">
          <div className="rounded-xl border border-border/60 bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <Terminal className="h-3.5 w-3.5 text-primary" />
              вы → поставь WireGuard
            </div>
            <div className="mt-2 flex items-center gap-2 font-mono text-xs text-primary/80">
              <ArrowRight className="h-3.5 w-3.5" />
              gpt-админ → выполняю, логи и отчёт через 12 секунд
            </div>
          </div>
          <a
            href="#install"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            Попробовать <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      )}
    </div>
  );
}
