"use client";

import { ArrowRight, Zap, Infinity as InfinityIcon, ShieldCheck, KeyRound, FileJson, Check, MousePointerClick, Eye } from "lucide-react";
import { PageHero, Step } from "../page-hero";
import { Reveal, Stagger, StaggerItem } from "../reveal";
import { InstallCommand } from "../install-command";
import { InstallCastPlayer } from "../install-cast-player";
import { useHashRoute } from "@/hooks/use-hash-route";
import { useT } from "@/hooks/use-t";

const BENEFIT_ICONS = [InfinityIcon, Zap, ShieldCheck];

export function ChatGptPage() {
  const { navigate } = useHashRoute();
  const { t, get } = useT();
  const benefits = get<Array<{ title: string; body: string }>>("pageChatgpt.benefits") ?? [];

  return (
    <>
      <PageHero
        eyebrow={t("pageChatgpt.eyebrow")}
        title={
          <>
            {t("pageChatgpt.titleLead")}{" "}
            <span className="text-gradient-violet">{t("pageChatgpt.titleAccent")}</span>
          </>
        }
        lead={t("pageChatgpt.lead")}
      >
        <div className="w-full max-w-xl">
          <InstallCommand variant="compact" />
        </div>
      </PageHero>

      {/* Benefits */}
      <section className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Stagger className="grid gap-5 lg:grid-cols-3" stagger={0.1}>
            {benefits.map((b, i) => {
              const Icon = BENEFIT_ICONS[i] ?? Zap;
              return (
                <StaggerItem key={`${b.title}-${i}`}>
                  <div className="surface surface-hover flex h-full flex-col rounded-2xl p-6">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/[0.06]">
                      <Icon className="h-5 w-5 text-primary" />
                    </span>
                    <h3 className="mt-4 text-lg font-semibold tracking-tight">{b.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.body}</p>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      </section>

      {/* Step-by-step instruction */}
      <section className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <Reveal className="mb-12 text-center">
            <h2 className="display text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("pageChatgpt.connectInStepsTitleLead")}{" "}
              <span className="text-gradient-violet">{t("pageChatgpt.connectInStepsTitleAccent")}</span>
            </h2>
          </Reveal>

          <Stagger className="flex flex-col gap-7" stagger={0.1}>
            <StaggerItem>
              <Step n={1} title={t("pageChatgpt.step1Title")}>
                {t("pageChatgpt.step1Body")}
                <div className="mt-3">
                  <InstallCommand variant="compact" />
                </div>
                <div className="mt-4 overflow-hidden rounded-2xl border border-border/80 bg-card/60 p-4">
                  <p className="mb-3 text-xs text-muted-foreground">
                    {t("pageChatgpt.step1CastCaption")}
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
              <Step n={2} title={t("pageChatgpt.step2Title")}>
                {t("pageChatgpt.step2Body")}
              </Step>
            </StaggerItem>

            <StaggerItem>
              <Step n={3} title={t("pageChatgpt.step3Title")}>
                {t("pageChatgpt.step3Body")}
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-border/60 bg-[oklch(0.12_0.006_290)] px-3.5 py-2.5 font-mono text-[13px]">
                  <FileJson className="h-4 w-4 shrink-0 text-primary/70" />
                  <span className="truncate text-foreground/90">your-hub/server/openmemory/actions/openapi.yaml</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t("pageChatgpt.step3Hint")}
                </p>
              </Step>
            </StaggerItem>

            <StaggerItem>
              <Step n={4} title={t("pageChatgpt.step4Title")}>
                {t("pageChatgpt.step4Body")}
              </Step>
            </StaggerItem>

            <StaggerItem>
              <Step n={5} title={t("pageChatgpt.step5Title")}>
                {t("pageChatgpt.step5Body")}
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
              {t("pageChatgpt.appsSdkTitleLead")}{" "}
              <span className="text-gradient-violet">{t("pageChatgpt.appsSdkTitleAccent")}</span>
            </h2>
          </Reveal>

          <Stagger className="flex flex-col gap-5" stagger={0.1}>
            <StaggerItem>
              <div className="surface surface-hover rounded-2xl p-6">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/[0.06]">
                    <MousePointerClick className="h-5 w-5 text-primary" />
                  </span>
                  <h3 className="text-lg font-semibold tracking-tight">{t("pageChatgpt.widgetTitle")}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {t("pageChatgpt.widgetBody")}
                </p>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="surface surface-hover rounded-2xl p-6">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/[0.06]">
                    <Eye className="h-5 w-5 text-primary" />
                  </span>
                  <h3 className="text-lg font-semibold tracking-tight">{t("pageChatgpt.autoConfirmTitle")}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {t("pageChatgpt.autoConfirmBody")}
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
                <h3 className="text-xl font-semibold tracking-tight">{t("pageChatgpt.ctaTitle")}</h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  {t("pageChatgpt.ctaBody")}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => navigate("mcp-server")}
                  className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-white/[0.02] px-4 py-2.5 text-sm font-medium transition-colors hover:border-primary/40"
                >
                  {t("pageChatgpt.ctaButtonMcp")} <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate("mcp-extension")}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
                >
                  {t("pageChatgpt.ctaButtonExtension")} <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}