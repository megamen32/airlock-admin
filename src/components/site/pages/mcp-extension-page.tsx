"use client";

import { ArrowRight, Bot, Chrome, Apple, Smartphone, KeyRound, Zap, MousePointerClick, Sparkles, Cpu, ClipboardCheck } from "lucide-react";
import { motion } from "framer-motion";
import { PageHero, Step } from "../page-hero";
import { Reveal, Stagger, StaggerItem } from "../reveal";
import { useHashRoute } from "@/hooks/use-hash-route";

const EASE = [0.16, 1, 0.3, 1] as const;

const FREE_AIS = [
  { name: "ChatGPT", note: "free tier" },
  { name: "DeepSeek", note: "бесплатно" },
  { name: "Qwen", note: "бесплатно" },
  { name: "Алиса", note: "Яндекс" },
  { name: "GigaChat", note: "Сбер" },
  { name: "Claude", note: "free tier" },
];

const STEPS_HOW = [
  { icon: Sparkles, title: "MCP All", body: "Вставляет в поле ввода компактное описание всех ваших MCP‑агентов и их инструментов. Промпт копируется в буфер — Alt+M." },
  { icon: MousePointerClick, title: "MCP — точечный выбор", body: "Открывает панель выбора конкретного агента с подробным описанием каждого инструмента." },
  { icon: Zap, title: "Авто‑выполнение", body: "Если ИИ отвечает блоком ```mcp с JSON‑командой — скрипт сам вызывает hub и вставляет результат обратно в чат." },
];

const PLATFORMS = [
  { icon: Chrome, title: "macOS · Windows · Linux", sub: "Chrome + Tampermonkey", body: "Tampermonkey из Chrome Web Store, затем установите MCP Bridge." },
  { icon: Apple, title: "iPhone", sub: "Safari + Userscripts", body: "Приложение Userscripts из App Store, включите в Расширениях Safari." },
  { icon: Smartphone, title: "Android", sub: "Firefox + Tampermonkey", body: "Firefox из Google Play + Tampermonkey, затем MCP Bridge. Работает с телефона." },
];

const SUPPORTED = [
  { site: "chatgpt.com", status: "Полная поддержка" },
  { site: "chat.deepseek.com", status: "Полная поддержка" },
  { site: "chat.qwen.ai", status: "Полная поддержка" },
  { site: "ya.ru / chat.yandex.ru", status: "Полная поддержка" },
];

export function McpExtensionPage() {
  const { navigate } = useHashRoute();

  return (
    <>
      <PageHero
        eyebrow="Адаптер 3 · Браузерное расширение"
        title={
          <>
            Любой бесплатный ИИ —{" "}
            <span className="text-gradient-violet">становится GPT‑Админом</span>
          </>
        }
        lead="Userscript для Tampermonkey/Firefox добавляет кнопки MCP прямо в интерфейсы ChatGPT, DeepSeek, Qwen, Алисы и Сбера. Не нужен платный API — только бесплатный веб‑чат."
      >
        <a
          href="https://became.bezrabotnyi.com/mcp-bridge.user.js"
          className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
        >
          <KeyRound className="h-4 w-4" />
          Установить MCP Bridge
        </a>
        <p className="text-xs text-muted-foreground">
          Бесплатно · open source ·{" "}
          <kbd className="rounded border border-border/60 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10px]">Alt+M</kbd>{" "}
          и{" "}
          <kbd className="rounded border border-border/60 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10px]">Alt+K</kbd>
        </p>
      </PageHero>

      {/* Free AI badges */}
      <section className="relative py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="text-center">
            <p className="mb-5 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground/60">
              Работает в интерфейсах
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {FREE_AIS.map((ai, i) => (
                <motion.span
                  key={ai.name}
                  initial={{ opacity: 0, y: 6 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, ease: EASE, delay: i * 0.05 }}
                  className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-white/[0.02] py-1.5 pl-2.5 pr-3 text-sm"
                >
                  <Bot className="h-3.5 w-3.5 text-primary" />
                  <span className="font-medium text-foreground/90">{ai.name}</span>
                  <span className="text-[11px] text-muted-foreground/70">{ai.note}</span>
                </motion.span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Browser mock */}
      <section className="relative py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <Reveal>
            <div className="surface relative overflow-hidden rounded-2xl">
              <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-2/3 -translate-x-1/2 glow-violet blur-2xl opacity-50" aria-hidden />
              <div className="relative flex items-center gap-2 border-b border-border/60 bg-white/[0.02] px-4 py-3">
                <div className="flex gap-1.5" aria-hidden>
                  <span className="h-3 w-3 rounded-full bg-[oklch(0.66_0.2_25_/_0.6)]" />
                  <span className="h-3 w-3 rounded-full bg-[oklch(0.8_0.12_95_/_0.5)]" />
                  <span className="h-3 w-3 rounded-full bg-[oklch(0.78_0.16_295_/_0.7)]" />
                </div>
                <div className="ml-2 flex-1">
                  <div className="flex items-center gap-1.5 rounded-md border border-border/50 bg-[oklch(0.12_0.006_290)] px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
                    <span className="text-primary/60">🔒</span>
                    chat.qwen.ai
                  </div>
                </div>
              </div>
              <div className="relative flex flex-col gap-3 p-4 sm:p-5">
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-tr-sm border border-border/60 bg-white/[0.03] px-3.5 py-2.5 text-sm text-foreground/90">
                    покажи статус nginx на сервере
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[88%]">
                    <div className="rounded-2xl rounded-tl-sm border border-border/60 bg-white/[0.02] px-3.5 py-2.5">
                      <p className="mb-2 text-sm text-muted-foreground">Вызываю shellmcp на сервере:</p>
                      <div className="rounded-lg border border-primary/30 bg-primary/[0.05] p-3">
                        <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                          <Cpu className="h-3 w-3" /> mcp · auto-executed
                        </div>
                        <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed text-foreground/85">
{`{ "target": "shell:server-01",
  "tool": "shell_exec",
  "args": { "cmd": "systemctl status nginx" } }`}
                        </pre>
                      </div>
                      <p className="mt-2.5 text-sm text-foreground/90">
                        <span className="text-primary">●</span> nginx active, слушает :80 и :443. Ошибок нет.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-1 flex items-center gap-2 rounded-xl border border-border/60 bg-[oklch(0.12_0.006_290)] p-2">
                  <span className="flex-1 px-2 text-sm text-muted-foreground">Спросите что-нибудь…</span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/15 px-2.5 py-1.5 font-mono text-[11px] font-medium text-primary">
                    <ClipboardCheck className="h-3 w-3" /> MCP All
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-white/[0.02] px-2.5 py-1.5 font-mono text-[11px] text-muted-foreground">
                    MCP
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* How it works */}
      <section className="relative py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="mb-12 text-center">
            <h2 className="display text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Как это работает
            </h2>
          </Reveal>
          <Stagger className="grid gap-5 lg:grid-cols-3" stagger={0.08}>
            {STEPS_HOW.map((s) => (
              <StaggerItem key={s.title}>
                <div className="surface surface-hover flex h-full flex-col rounded-2xl p-6">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/[0.06]">
                    <s.icon className="h-5 w-5 text-primary" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold tracking-tight">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Platforms + install steps */}
      <section className="relative py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Platforms */}
            <Reveal>
              <h2 className="display text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
                Установка на любой устройство
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Userscript работает везде, где есть менеджер скриптов.
              </p>
              <div className="mt-6 flex flex-col gap-2.5">
                {PLATFORMS.map((p) => (
                  <div key={p.title} className="surface surface-hover flex items-start gap-3 rounded-xl p-4">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-white/[0.02]">
                      <p.icon className="h-4 w-4 text-primary" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <p className="text-sm font-semibold tracking-tight text-foreground">{p.title}</p>
                        <p className="font-mono text-[11px] text-primary/80">{p.sub}</p>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{p.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            {/* Steps */}
            <Reveal delay={0.1}>
              <h2 className="display text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
                Шаги
              </h2>
              <div className="mt-6 flex flex-col gap-6">
                <Step n={1} title="Поставьте менеджер скриптов">
                  Tampermonkey (Chrome), Userscripts (iPhone Safari) или Firefox + Tampermonkey (Android).
                </Step>
                <Step n={2} title="Установите MCP Bridge">
                  Нажмите кнопку установки — менеджер перехватит <code className="font-mono text-[#c4a3f8]">.user.js</code> и предложит установить.
                </Step>
                <Step n={3} title="Введите Bridge Key">
                  Нажмите <kbd className="rounded border border-border/60 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10px]">Alt+K</kbd> и вставьте ключ от вашего hub.
                </Step>
                <Step n={4} title="Откройте любой чат и нажмите MCP All">
                  <kbd className="rounded border border-border/60 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10px]">Alt+M</kbd> — промпт вставится в поле ввода. ИИ выполнит команды через ваш hub.
                </Step>
              </div>
              <a
                href="https://became.bezrabotnyi.com/mcp-bridge.user.js"
                className="group mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
              >
                <KeyRound className="h-4 w-4" />
                Установить MCP Bridge
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Supported sites */}
      <section className="relative py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <Reveal className="surface overflow-hidden rounded-2xl">
            <div className="border-b border-border/60 bg-white/[0.02] px-5 py-3">
              <p className="text-sm font-semibold tracking-tight">Поддерживаемые сайты</p>
            </div>
            <div className="divide-y divide-border/40">
              {SUPPORTED.map((s) => (
                <div key={s.site} className="flex items-center justify-between px-5 py-3">
                  <span className="font-mono text-sm text-foreground/85">{s.site}</span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-primary">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Cross-link */}
      <section className="relative py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="surface relative overflow-hidden rounded-2xl p-7 sm:p-9">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 glow-violet blur-3xl opacity-50" aria-hidden />
            <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-semibold tracking-tight">Хотите нативные tool calls?</h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  Для Claude, Codex и OpenCode есть MCP‑сервер, а для ChatGPT — Custom GPT
                  без лимитов Codex.
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => navigate("mcp-server")}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
                >
                  MCP сервер <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate("chatgpt")}
                  className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-white/[0.02] px-4 py-2.5 text-sm font-medium transition-colors hover:border-primary/40"
                >
                  Custom GPT <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
