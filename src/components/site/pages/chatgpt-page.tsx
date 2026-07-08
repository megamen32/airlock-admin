"use client";

import { ArrowRight, Zap, Infinity as InfinityIcon, ShieldCheck, KeyRound, FileJson, Check, MousePointerClick, Eye } from "lucide-react";
import { PageHero, Step } from "../page-hero";
import { Reveal, Stagger, StaggerItem } from "../reveal";
import { InstallCommand } from "../install-command";
import { InstallCastPlayer } from "../install-cast-player";
import { useHashRoute } from "@/hooks/use-hash-route";

const BENEFITS = [
  {
    icon: InfinityIcon,
    title: "Без лимитов Codex",
    body: "Custom GPT выполняет команды через ваш hub — без почасовых и дневных квот на tool calls. Платный Codex не нужен.",
  },
  {
    icon: Zap,
    title: "Реальное выполнение",
    body: "Не «вот команда, скопируйте», а сам запускает, читает логи, валидирует и отчитывается реальным выводом.",
  },
  {
    icon: ShieldCheck,
    title: "Под вашим контролем",
    body: "Команды идут только через ваш hub и Bearer‑ключ. Свой домен не нужен — авто‑туннель через FRP.",
  },
];

export function ChatGptPage() {
  const { navigate } = useHashRoute();

  return (
    <>
      <PageHero
        eyebrow="Адаптер 1 · OpenAI Action"
        title={
          <>
            Превратите ChatGPT в{" "}
            <span className="text-gradient-violet">Codex без лимитов</span>
          </>
        }
        lead="Создайте Custom GPT с действием (action): импортируйте OpenAPI всего hub или одного MCP‑сервера, подставьте Hub URL и Bearer‑ключ — и ChatGPT вызывает только разрешённые tools. Без API‑лимитов и платного Codex."
      >
        <div className="w-full max-w-xl">
          <InstallCommand variant="compact" />
        </div>
      </PageHero>

      {/* Benefits */}
      <section className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Stagger className="grid gap-5 lg:grid-cols-3" stagger={0.1}>
            {BENEFITS.map((b) => (
              <StaggerItem key={b.title}>
                <div className="surface surface-hover flex h-full flex-col rounded-2xl p-6">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/[0.06]">
                    <b.icon className="h-5 w-5 text-primary" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold tracking-tight">{b.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.body}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Step-by-step instruction */}
      <section className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <Reveal className="mb-12 text-center">
            <h2 className="display text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Подключение за{" "}
              <span className="text-gradient-violet">5 шагов</span>
            </h2>
          </Reveal>

          <Stagger className="flex flex-col gap-7" stagger={0.1}>
            <StaggerItem>
              <Step n={1} title="Установите GPT‑Админ">
                Одна команда — ставит hub‑proxy и shellmcp. Установщик сам определит
                режим (user/system). После установки вам выдадут{" "}
                <code className="rounded border border-border/50 bg-[oklch(0.12_0.006_290)] px-1.5 py-0.5 font-mono text-[13px] text-[#c4a3f8]">Hub URL</code>{" "}
                и <code className="rounded border border-border/50 bg-[oklch(0.12_0.006_290)] px-1.5 py-0.5 font-mono text-[13px] text-[#c4a3f8]">CTL_TOKEN</code> (Bearer) — запомните их.
                <div className="mt-3">
                  <InstallCommand variant="compact" />
                </div>
                <div className="mt-4 overflow-hidden rounded-2xl border border-border/80 bg-card/60 p-4">
                  <p className="mb-3 text-xs text-muted-foreground">
                    Ниже — реальная запись полной установки: старое состояние удаляется, затем ставятся hub, ShellMCP и FRP.
                  </p>
                  <InstallCastPlayer
                    src="/examples/mac-gptadmin-install-demo-short.cast"
                    title="macOS full hub + ShellMCP + FRP install.cast"
                    className="shadow-none"
                  />
                </div>
              </Step>
            </StaggerItem>

            <StaggerItem>
              <Step n={2} title="Откройте редактор Custom GPT">
                Перейдите на{" "}
                <a
                  href="https://chatgpt.com/gpts/editor"
                  target="_blank"
                  rel="noopener"
                  className="font-mono text-primary underline decoration-primary/40 underline-offset-2 transition-colors hover:decoration-primary"
                >
                  chatgpt.com/gpts/editor
                </a>{" "}
                и создайте новый GPT (или откройте существующий).
              </Step>
            </StaggerItem>

            <StaggerItem>
              <Step n={3} title="Создайте новое действие (Action)">
                В разделе «Configure» → «Actions» → «Create new action». Выберите
                импорт по URL и вставьте OpenAPI endpoint всего hub или одного MCP‑сервера:
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-border/60 bg-[oklch(0.12_0.006_290)] px-3.5 py-2.5 font-mono text-[13px]">
                  <FileJson className="h-4 w-4 shrink-0 text-primary/70" />
                  <span className="truncate text-foreground/90">your-hub/server/openmemory/actions/openapi.yaml</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Для полного GPTAdmin используйте общий <code className="font-mono text-[#c4a3f8]">/actions/openapi.yaml</code>. Для одного MCP — <code className="font-mono text-[#c4a3f8]">/server/{"{slug}"}/actions/openapi.yaml</code>, например OpenMemory.
                </p>
              </Step>
            </StaggerItem>

            <StaggerItem>
              <Step n={4} title="Настройте аутентификацию">
                В разделе «Authentication» выберите тип{" "}
                <span className="font-medium text-foreground">API key</span>, scheme{" "}
                <span className="font-medium text-foreground">Bearer</span> и вставьте ваш{" "}
                <code className="rounded border border-border/50 bg-[oklch(0.12_0.006_290)] px-1.5 py-0.5 font-mono text-[13px] text-[#c4a3f8]">CTL_TOKEN</code>.
              </Step>
            </StaggerItem>

            <StaggerItem>
              <Step n={5} title="Готово — пишите простыми словами">
                «Поставь nginx», «почини сайт», «покажи память». ChatGPT сам вызывает
                защищённый GPTAdmin gateway и получает ответ от выбранного MCP server — без раскрытия всего relay, если выбран per‑server Action.
              </Step>
            </StaggerItem>
          </Stagger>
        </div>
      </section>

      {/* Apps SDK + auto-confirm */}
      <section className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <Reveal className="mb-10 text-center">
            <h2 className="display text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Ещё мощнее:{" "}
              <span className="text-gradient-violet">OpenAI Apps SDK</span>
            </h2>
          </Reveal>

          <Stagger className="flex flex-col gap-5" stagger={0.1}>
            <StaggerItem>
              <div className="surface surface-hover rounded-2xl p-6">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/[0.06]">
                    <MousePointerClick className="h-5 w-5 text-primary" />
                  </span>
                  <h3 className="text-lg font-semibold tracking-tight">Widget прямо в чате</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  GPT‑Админ отдаёт{" "}
                  <a
                    href="https://developers.openai.com/docs/apps"
                    target="_blank"
                    rel="noopener"
                    className="text-primary underline decoration-primary/40 underline-offset-2"
                  >
                    Apps SDK widget
                  </a>{" "}
                  — прямо в любом чате ChatGPT. ChatGPT сам понимает, когда
                  нужно прочитать ваш код, выполнить команду или проверить
                  логи. Виджет показывает input, result и background job
                  polling — в реальном времени, внутри диалога.
                </p>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="surface surface-hover rounded-2xl p-6">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/[0.06]">
                    <Eye className="h-5 w-5 text-primary" />
                  </span>
                  <h3 className="text-lg font-semibold tracking-tight">Auto‑confirm extension</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  По умолчанию ChatGPT спрашивает ваше одобрение перед каждой
                  командой. Хотите автопилот? Установите{" "}
                  <a
                    href="https://github.com/megamen32/auto-confirm-extension"
                    target="_blank"
                    rel="noopener"
                    className="text-primary underline decoration-primary/40 underline-offset-2"
                  >
                    auto-confirm-extension
                  </a>{" "}
                  — расширение для браузера, которое автоматически одобряет
                  tool calls. Полностью отключаемо: если выключить — ChatGPT
                  снова будет спрашивать подтверждение на каждую команду.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href="https://github.com/megamen32/auto-confirm-extension"
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-white/[0.02] px-4 py-2 text-sm font-medium transition-colors hover:border-primary/40"
                  >
                    <ArrowRight className="h-4 w-4 text-primary" />
                    GitHub · auto-confirm-extension
                  </a>
                </div>
              </div>
            </StaggerItem>
          </Stagger>
        </div>
      </section>

      {/* CTA cross-link */}
      <section className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="surface relative overflow-hidden rounded-2xl p-7 sm:p-9">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 glow-violet blur-3xl opacity-50" aria-hidden />
            <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-semibold tracking-tight">Нужен MCP для Claude или бесплатных ИИ?</h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  GPT‑Админ работает ещё двумя способами: как MCP‑сервер для Claude/Codex/OpenCode
                  и как браузерное расширение для бесплатных веб‑ИИ.
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => navigate("mcp-server")}
                  className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-white/[0.02] px-4 py-2.5 text-sm font-medium transition-colors hover:border-primary/40"
                >
                  MCP сервер <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate("mcp-extension")}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
                >
                  Расширение <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
