"use client";

import {
  Bug,
  FileCode2,
  GitPullRequest,
  Globe,
  ScrollText,
  ServerCog,
  type LucideIcon,
} from "lucide-react";
import { Stagger, StaggerItem, Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";
import { useT } from "@/hooks/use-t";

type UseCase = {
  icon: LucideIcon;
  title: string;
  body: string;
  tag?: string;
};

/** Tag chips are technical — same across locales. */
const ICONS: LucideIcon[] = [ServerCog, FileCode2, GitPullRequest, ScrollText, Globe, Bug];
const TAGS = [
  "systemd · nginx · ufw",
  "subagents",
  "git · force-with-lease",
  "journalctl · grep",
  "chrome-devtools mcp",
  "auto-diagnose",
];

/** Capabilities of the hub — independent of which AI adapter you use. */
export function UseCases() {
  const { t, get } = useT();
  const items = get<Array<{ title: string; body: string }>>("useCases.items") ?? [];

  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow={t("useCases.eyebrow")}
          title={
            <>
              {t("useCases.titleLead")}{" "}
              <span className="text-gradient-violet">{t("useCases.titleAccent")}</span>
            </>
          }
          lead={t("useCases.body")}
        />

        <Stagger className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={0.07}>
          {(Array.isArray(items) ? items : []).map((c, i) => (
            <StaggerItem key={`${c.title}-${i}`}>
              <div className="surface surface-hover group relative flex h-full flex-col overflow-hidden rounded-2xl p-6">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/[0.06] transition-colors group-hover:border-primary/40">
                    {(() => {
                      const Icon = ICONS[i] ?? ServerCog;
                      return <Icon className="h-5 w-5 text-primary" />;
                    })()}
                  </span>
                  <h3 className="text-base font-semibold tracking-tight">{c.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
                {TAGS[i] && (
                  <div className="mt-auto pt-5">
                    <span className="rounded-md border border-border/60 bg-white/[0.02] px-2 py-1 font-mono text-[11px] text-muted-foreground">
                      {TAGS[i]}
                    </span>
                  </div>
                )}
                <span className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full glow-violet opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}