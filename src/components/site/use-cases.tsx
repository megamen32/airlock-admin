"use client";

import { Boxes, Database, Gamepad2, Globe, HardDrive, Network, Wrench } from "lucide-react";
import Image from "next/image";
import { Stagger, StaggerItem, Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

type UseCase = {
  icon: React.ElementType;
  kicker: string;
  title: string;
  body: string;
  image?: string;
};

const USE_CASES: UseCase[] = [
  {
    icon: Gamepad2,
    kicker: "Игровые сервера",
    title: "Minecraft «под ключ»",
    body: "Устанавливает Java, качает дистрибутив, создаёт systemd‑сервис, открывает порты и настраивает резервные копии.",
    image: "/screenshots/minecraft.webp",
  },
  {
    icon: Network,
    kicker: "Безопасность",
    title: "Доступ как в локальной сети",
    body: "Работайте с серверами как будто они рядом: частная оверлейная сеть, ключи, клиенты для iOS/Android, QR‑коды и ротация.",
  },
  {
    icon: Globe,
    kicker: "Веб‑инфраструктура",
    title: "Чиним сайт",
    body: "Валидирует конфиги nginx, проверяет Certbot, логи ошибок, перезапускает сервисы, правит firewall и HSTS.",
  },
  {
    icon: HardDrive,
    kicker: "Ресурсы",
    title: "Память / диски / сеть",
    body: "Находит утечки, чистит логи, анализирует iostat/iftop, даёт рекомендации по лимитам и троттлингу.",
  },
  {
    icon: Database,
    kicker: "Базы данных",
    title: "PostgreSQL / Redis",
    body: "Настройка конфигов, бэкапы, репликация, VACUUM‑план, диагностика долгих запросов и deadlock’ов.",
  },
  {
    icon: Boxes,
    kicker: "DevOps",
    title: "Docker / CI",
    body: "Собирает и пушит образы, настраивает docker‑compose, healthcheck’и, перезапуски и лог‑драйверы.",
  },
];

export function UseCases() {
  return (
    <section id="usecases" className="relative scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Use‑cases"
          title={
            <>
              Задачи, которые GPT‑Админ{" "}
              <span className="text-gradient-violet">закрывает целиком</span>
            </>
          }
          lead="От игрового сервера до продакшн‑инфраструктуры — пишете задачу простыми словами, получаете выполненную работу и отчёт."
        />

        <Stagger className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
          {USE_CASES.map((uc, i) => (
            <StaggerItem key={uc.title}>
              <UseCaseCard uc={uc} featured={i === 0} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

function UseCaseCard({ uc, featured }: { uc: UseCase; featured?: boolean }) {
  return (
    <article className="surface surface-hover group relative flex h-full flex-col overflow-hidden rounded-2xl">
      {uc.image ? (
        <div className="relative aspect-[16/9] overflow-hidden border-b border-border/60">
          <Image
            src={uc.image}
            alt={uc.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium backdrop-blur-md">
            <uc.icon className="h-3.5 w-3.5 text-primary" />
            {uc.kicker}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-6 pt-6">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border/70 bg-primary/[0.06]">
            <uc.icon className="h-5 w-5 text-primary" />
          </span>
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
            {uc.kicker}
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col p-6 pt-5">
        <h3 className="text-lg font-semibold tracking-tight">{uc.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{uc.body}</p>
      </div>

      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </article>
  );
}
