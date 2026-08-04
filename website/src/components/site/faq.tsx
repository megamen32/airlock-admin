"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const FAQ_ITEMS = [
  {
    q: "Насколько безопасно давать GPT доступ к серверам?",
    a: "Доступ ограничен вашим хабом и списком разрешённых endpoint’ов. Все действия логируются, секреты маскируются, можно включить approve‑режим. По умолчанию установка идёт без sudo — в домашнюю папку пользователя.",
  },
  {
    q: "Будет ли GPT что‑то делать без моего ведома?",
    a: "Нет. Команды запускаются только по вашему запросу в чате, а для критичных операций (удаление, изменения сети) доступен ручной approve.",
  },
  {
    q: "Что если команда упадёт с ошибкой?",
    a: "Агент пришлёт логи и выполнит авто‑диагностику: предложит исправления и повторит запуск после вашего подтверждения. Вы всегда видите реальный stdout/stderr.",
  },
  {
    q: "Можно ли развернуть всё в изолированной сети?",
    a: "Да. Хаб и агенты могут работать в локальной или частной оверлейной сети. Можно подключаться к серверам как будто вы в одной сети из любой точки мира; внешний доступ не требуется, если используете локальный ChatGPT‑шлюз.",
  },
  {
    q: "Нужен ли свой домен или статичный IP?",
    a: "Нет. При установке можно выбрать авто‑туннель через FRP — вы получите готовый публичный URL без настройки DNS и портов на роутере.",
  },
  {
    q: "Какие ОС поддерживаются?",
    a: "Linux (systemd), macOS (LaunchAgents/LaunchDaemons) и Windows (Scheduled Task). На всех трёх доступна установка без прав администратора.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="relative scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="FAQ"
          title={
            <>
              Частые <span className="text-gradient-violet">вопросы</span>
            </>
          }
        />

        <Reveal className="mt-12">
          <Accordion type="single" collapsible className="flex flex-col gap-3">
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="surface rounded-xl border-border/60 px-5 data-[state=open]:border-primary/30"
              >
                <AccordionTrigger className="py-5 text-left text-base font-medium hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
