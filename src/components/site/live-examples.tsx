"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Check, Cpu, User, X } from "lucide-react";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";
import { CHAT_DEMOS, type ChatMessage } from "./chat-data";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

export function LiveExamples() {
  const [activeId, setActiveId] = useState(CHAT_DEMOS[0].id);
  const active = CHAT_DEMOS.find((d) => d.id === activeId) ?? CHAT_DEMOS[0];

  return (
    <section id="examples" className="relative scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Живые примеры"
          title={
            <>
              Не маркетинг —{" "}
              <span className="text-gradient-violet">реальные диалоги</span>
            </>
          }
          lead="Это настоящие разговоры с GPT‑Админом. Агент сам читает состояние серверов, чинит, валидирует и отчитывается. Секреты вычищены, формулировки слегка tightened для ясности."
        />

        {/* Demo switcher */}
        <Reveal className="mt-12 flex flex-wrap justify-center gap-2">
          {CHAT_DEMOS.map((demo) => {
            const selected = demo.id === activeId;
            return (
              <button
                key={demo.id}
                type="button"
                onClick={() => setActiveId(demo.id)}
                aria-pressed={selected}
                className={cn(
                  "group inline-flex items-center gap-2.5 rounded-full border px-4 py-2.5 text-sm font-medium transition-all",
                  selected
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border/60 bg-white/[0.02] text-muted-foreground hover:border-primary/30 hover:text-foreground"
                )}
              >
                <demo.icon className="h-4 w-4" />
                {demo.title}
              </button>
            );
          })}
        </Reveal>

        {/* Active demo summary */}
        <Reveal key={`${active.id}-summary`} className="mx-auto mt-8 max-w-3xl text-center">
          <p className="text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            {active.summary}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {active.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-border/60 bg-white/[0.02] px-2.5 py-1 font-mono text-[11px] text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </Reveal>

        {/* Chat window */}
        <Reveal key={active.id} className="mx-auto mt-10 max-w-3xl">
          <div className="surface relative overflow-hidden rounded-2xl">
            {/* window chrome */}
            <div className="flex items-center justify-between border-b border-border/60 bg-white/[0.02] px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5" aria-hidden>
                  <span className="h-3 w-3 rounded-full bg-[oklch(0.66_0.2_25_/_0.6)]" />
                  <span className="h-3 w-3 rounded-full bg-[oklch(0.8_0.12_95_/_0.5)]" />
                  <span className="h-3 w-3 rounded-full bg-[oklch(0.78_0.16_295_/_0.7)]" />
                </div>
                <span className="ml-2 inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                  <Cpu className="h-3.5 w-3.5 text-primary/70" />
                  chatgpt · gpt-admin
                </span>
              </div>
              <a
                href={active.shareUrl}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
              >
                оригинал <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>

            {/* messages */}
            <div className="nice-scroll max-h-[600px] overflow-y-auto px-4 py-5 sm:px-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="flex flex-col gap-5"
                >
                  {active.messages.map((msg, i) => (
                    <MessageBubble key={i} msg={msg} />
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="flex max-w-[85%] items-start gap-2.5">
          <div className="surface rounded-2xl rounded-tr-sm px-4 py-3">
            <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              <User className="h-3 w-3" /> вы
            </div>
            <div className="mt-1 text-sm leading-relaxed text-foreground/90">
              {msg.body.map((p, i) => (
                <RichText key={i} text={p} />
              ))}
            </div>
          </div>
          <Avatar isUser />
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="flex max-w-[88%] items-start gap-2.5">
        <Avatar />
        <div className="flex-1">
          <div className="surface rounded-2xl rounded-tl-sm px-4 py-3">
            <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-primary/80">
              <Cpu className="h-3 w-3" /> gpt‑админ
            </div>
            {msg.headline && (
              <p className="mt-1.5 text-sm font-semibold tracking-tight text-foreground">
                {msg.headline}
              </p>
            )}
            <div className="mt-1.5 flex flex-col gap-2 text-sm leading-relaxed text-muted-foreground">
              {msg.body.map((p, i) => (
                <RichText key={i} text={p} />
              ))}
            </div>
            {msg.checks && msg.checks.length > 0 && (
              <div className="mt-3 rounded-xl border border-border/50 bg-[oklch(0.12_0.006_290)] p-3">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
                  Проверки
                </p>
                <ul className="flex flex-col gap-1.5">
                  {msg.checks.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <span
                        className={cn(
                          "mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                          c.ok
                            ? "bg-primary/15 text-primary"
                            : "bg-destructive/15 text-destructive"
                        )}
                      >
                        {c.ok ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : <X className="h-2.5 w-2.5" strokeWidth={3} />}
                      </span>
                      <span className="font-mono text-foreground/80">{c.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {msg.status && (
            <div className="mt-2 ml-1 inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/[0.06] px-2.5 py-0.5 text-[11px] font-medium text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {msg.status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Avatar({ isUser = false }: { isUser?: boolean }) {
  return (
    <span
      className={cn(
        "mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border",
        isUser
          ? "border-border/60 bg-white/[0.03] text-muted-foreground"
          : "border-primary/30 bg-primary/[0.08] text-primary"
      )}
    >
      {isUser ? <User className="h-4 w-4" /> : <Cpu className="h-4 w-4" />}
    </span>
  );
}

/** Render a paragraph with {{code}}...{{/code}} spans as <code>. */
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\{\{code\}\}[\s\S]*?\{\{\/code\}\})/g);
  return (
    <p>
      {parts.map((part, i) => {
        const m = part.match(/^\{\{code\}\}([\s\S]*?)\{\{\/code\}\}$/);
        if (m) {
          return (
            <code
              key={i}
              className="mx-0.5 rounded-md border border-border/50 bg-[oklch(0.12_0.006_290)] px-1.5 py-0.5 font-mono text-[12px] text-primary"
            >
              {m[1]}
            </code>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}
