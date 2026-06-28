"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Check, ChevronDown } from "lucide-react";
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
          lead="Это настоящие разговоры с GPT‑Админом в ChatGPT. Агент сам читает состояние серверов, чинит, валидирует и отчитывается. Секреты вычищены, формулировки слегка tightened для ясности."
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

        {/* ChatGPT-faithful window */}
        <Reveal key={active.id} className="mx-auto mt-10 max-w-3xl">
          <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-[#1f1f23] shadow-2xl shadow-black/50">
            {/* Browser-style chrome */}
            <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#171719] px-4 py-2.5">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5" aria-hidden>
                  <span className="h-3 w-3 rounded-full bg-[#ff5f57]/70" />
                  <span className="h-3 w-3 rounded-full bg-[#febc2e]/70" />
                  <span className="h-3 w-3 rounded-full bg-[#28c840]/70" />
                </div>
                <span className="ml-2 flex items-center gap-1.5 text-xs text-zinc-400">
                  <OpenAiMark className="h-3.5 w-3.5" />
                  <span className="font-medium text-zinc-300">ChatGPT</span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-zinc-500">GPT‑Админ</span>
                </span>
              </div>
              <a
                href={active.shareUrl}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
              >
                оригинал <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>

            {/* Messages — ChatGPT layout */}
            <div className="nice-scroll max-h-[640px] overflow-y-auto px-3 py-5 sm:px-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="flex flex-col gap-7"
                >
                  {active.messages.map((msg, i) => (
                    <ChatMessageRow key={i} msg={msg} />
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Fake input bar */}
            <div className="border-t border-white/[0.06] bg-[#171719] px-4 py-3">
              <div className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-[#2a2a2e] px-3.5 py-2.5">
                <span className="text-zinc-500">
                  <PlusIcon />
                </span>
                <span className="flex-1 text-sm text-zinc-600">Спросите что-нибудь…</span>
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#e0e0e2] text-zinc-800">
                  <SendIcon />
                </span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** One ChatGPT-style message row. */
function ChatMessageRow({ msg }: { msg: ChatMessage }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[78%] rounded-3xl bg-[#2f2f33] px-4 py-2.5 text-[15px] leading-relaxed text-zinc-100">
          {msg.body.map((p, i) => (
            <RichText key={i} text={p} />
          ))}
        </div>
      </div>
    );
  }

  // assistant
  return (
    <div className="flex gap-3 sm:gap-4">
      {/* OpenAI avatar */}
      <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white text-zinc-900">
        <OpenAiMark className="h-4 w-4" />
      </span>

      <div className="min-w-0 flex-1 pt-0.5">
        {/* small "thinking"-style meta line, like ChatGPT shows */}
        <button
          type="button"
          className="mb-1.5 inline-flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
          tabIndex={-1}
        >
          <ChevronDown className="h-3 w-3" />
          {msg.headline ? msg.headline : "Thought for a few seconds"}
        </button>

        <div className="flex flex-col gap-2.5 text-[15px] leading-relaxed text-zinc-100">
          {msg.body.map((p, i) => (
            <RichText key={i} text={p} />
          ))}
        </div>

        {/* checks — rendered as a ChatGPT-style "Готово" result block */}
        {msg.checks && msg.checks.length > 0 && (
          <div className="mt-3 overflow-hidden rounded-xl border border-white/[0.08]">
            <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.02] px-3.5 py-2">
              <Check className="h-3.5 w-3.5 text-[#28c840]" strokeWidth={3} />
              <span className="text-xs font-semibold text-zinc-200">
                {msg.status ?? "Готово"}
              </span>
            </div>
            <div className="bg-[#262629] px-3.5 py-2.5">
              <ul className="flex flex-col gap-1.5">
                {msg.checks.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px]">
                    <span
                      className={cn(
                        "mt-0.5 inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full",
                        c.ok
                          ? "bg-[#28c840]/20 text-[#28c840]"
                          : "bg-red-500/20 text-red-400"
                      )}
                    >
                      {c.ok ? (
                        <Check className="h-2 w-2" strokeWidth={4} />
                      ) : (
                        <span className="text-[10px]">×</span>
                      )}
                    </span>
                    <span className="font-mono text-zinc-300">{c.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* status pill (when there are no checks) */}
        {!msg.checks && msg.status && (
          <div className="mt-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-0.5 text-[11px] font-medium text-zinc-400">
              <Check className="h-3 w-3 text-[#28c840]" strokeWidth={3} />
              {msg.status}
            </span>
          </div>
        )}
      </div>
    </div>
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
              className="mx-0.5 rounded border border-white/[0.08] bg-[#2a2a2e] px-1.5 py-0.5 font-mono text-[13px] text-[#c4a3f8]"
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

/** OpenAI-style knot mark for the assistant avatar + header. */
function OpenAiMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v3l-2.597 1.5-2.607-1.5z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M12 3l8.5 8.5a.6.6 0 0 1-.85.85L12.6 5.3V20a.6.6 0 0 1-1.2 0V5.3L4.35 12.35a.6.6 0 1 1-.85-.85L12 3z" />
    </svg>
  );
}
