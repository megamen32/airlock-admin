"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ArrowLeft, ArrowRight, BookOpen, FileText } from "lucide-react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils";
import { useHashRoute, pageHref } from "@/hooks/use-hash-route";
import { useLocale, LOCALE_META, type Locale } from "@/hooks/use-locale";
import { Eyebrow } from "../section-heading";
import { Reveal } from "../reveal";
import { LocaleSwitcher } from "../locale-switcher";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Slugs we ship. The order here is the sidebar order. */
const SLUGS = [
  "Home",
  "GETTING_STARTED",
  "ARCHITECTURE",
  "ADAPTERS",
  "HUB",
  "SHELLMCP",
  "INSTALL_PATHS",
  "CONFIGURATION",
  "API_REFERENCE",
  "MCP_PROXY_RELAY",
  "INTEGRATIONS",
  "TUNNELS_DOCS",
  "FAILOVER",
  "SECURITY_DOCS",
  "FILE_BACKUPS",
  "ROADMAP",
  "FAQ",
] as const;

type Slug = (typeof SLUGS)[number];

function slugFromHash(): Slug {
  if (typeof window === "undefined") return "Home";
  const m = window.location.hash.match(/^#\/docs\/([A-Za-z0-9_-]+)/);
  if (m && (SLUGS as readonly string[]).includes(m[1])) return m[1] as Slug;
  return "Home";
}

function subscribeHash(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
}

const getHashSnapshot = (): Slug => slugFromHash();
const getServerHashSnapshot = (): Slug => "Home";

/** Sidebar title for each slug (kept client-facing, English is canonical). */
const SIDEBAR_TITLE: Record<Slug, string> = {
  Home: "Overview",
  GETTING_STARTED: "Getting Started",
  ARCHITECTURE: "Architecture",
  ADAPTERS: "Adapters",
  HUB: "Hub",
  SHELLMCP: "ShellMCP",
  INSTALL_PATHS: "Install Paths",
  CONFIGURATION: "Configuration",
  API_REFERENCE: "API Reference",
  MCP_PROXY_RELAY: "MCP Proxy Relay",
  INTEGRATIONS: "Integrations",
  TUNNELS_DOCS: "Tunnels",
  FAILOVER: "Failover",
  SECURITY_DOCS: "Security",
  FILE_BACKUPS: "File Backups",
  ROADMAP: "Roadmap",
  FAQ: "FAQ",
};

/** Per-locale hero copy. */
const HERO: Record<Locale, { eyebrow: string; title: React.ReactNode; lead: string }> = {
  en: {
    eyebrow: "Documentation",
    title: (
      <>
        Everything you need to{" "}
        <span className="text-gradient-violet">run GPT‑Админ</span>
      </>
    ),
    lead: "Pick a topic on the left. All docs are translated automatically; switch language at the top right.",
  },
  ru: {
    eyebrow: "Документация",
    title: (
      <>
        Всё, что нужно для работы с{" "}
        <span className="text-gradient-violet">GPT‑Админ</span>
      </>
    ),
    lead: "Выберите раздел слева. Все документы переведены автоматически; переключайте язык справа сверху.",
  },
  cn: {
    eyebrow: "文档",
    title: (
      <>
        使用{" "}
        <span className="text-gradient-violet">GPT‑Админ</span> 所需的全部资料
      </>
    ),
    lead: "从左侧选择主题。所有文档均已自动翻译；可使用右上角的语言切换器切换。",
  },
};

export function DocsPage() {
  const { navigate } = useHashRoute();
  const { locale } = useLocale();
  const slug = useExternalSlug();
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setMarkdown(null);
    fetch(`/docs/${locale}/${slug}.md`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load doc: ${r.status}`);
        return r.text();
      })
      .then((text) => {
        if (!cancelled) {
          setMarkdown(text);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMarkdown(
            locale === "en"
              ? `## Could not load this page\n\nTry refreshing or pick another topic on the left.`
              : locale === "cn"
              ? `## 无法加载此页面\n\n请尝试刷新，或从左侧选择其他主题。`
              : `## Не удалось загрузить страницу\n\nПопробуйте обновить или выберите другой раздел слева.`
          );
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slug, locale]);

  const index = SLUGS.indexOf(slug);
  const prev = index > 0 ? SLUGS[index - 1] : null;
  const next = index < SLUGS.length - 1 ? SLUGS[index + 1] : null;

  return (
    <>
      <PageHeader locale={locale} />

      <section className="relative pb-24 pt-6 sm:pt-10">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[260px_1fr]">
          <Sidebar active={slug} />
          <article className="min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${slug}-${locale}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="prose-doc"
              >
                {loading || markdown === null ? (
                  <DocSkeleton />
                ) : (
                  <DocBody markdown={markdown} />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Prev / Next */}
            <nav
              aria-label="Pagination"
              className="mt-16 flex flex-col gap-3 border-t border-border/60 pt-6 sm:flex-row sm:justify-between"
            >
              <DocNavButton
                direction="prev"
                slug={prev}
                onClick={() => prev && goToSlug(prev)}
              />
              <DocNavButton
                direction="next"
                slug={next}
                onClick={() => next && goToSlug(next)}
              />
            </nav>
          </article>
        </div>
      </section>
    </>
  );

  function goToSlug(next: Slug) {
    history.replaceState(null, "", `#/docs/${next}`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    window.scrollTo({ top: 0, behavior: "auto" });
  }
}

function useExternalSlug(): Slug {
  return useSyncExternalStore(subscribeHash, getHashSnapshot, getServerHashSnapshot);
}

function PageHeader({ locale }: { locale: Locale }) {
  const copy = HERO[locale];
  return (
    <section className="relative overflow-hidden pt-28 sm:pt-32">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute left-1/2 top-[-10%] h-[420px] w-[720px] -translate-x-1/2 glow-violet blur-3xl animate-aurora" />
      </div>
      <div className="mx-auto flex max-w-7xl items-end justify-between gap-6 px-5 sm:px-8">
        <Reveal className="max-w-2xl">
          <button
            type="button"
            onClick={() => {
              history.replaceState(null, "", "#/");
              window.dispatchEvent(new HashChangeEvent("hashchange"));
              window.scrollTo({ top: 0, behavior: "auto" });
            }}
            className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {locale === "en" ? "Back to home" : locale === "cn" ? "返回首页" : "На главную"}
          </button>
          <Eyebrow>{copy.eyebrow}</Eyebrow>
          <h1 className="display mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {copy.title}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {copy.lead}
          </p>
        </Reveal>
        <div className="hidden sm:block">
          <LocaleSwitcher />
        </div>
      </div>
    </section>
  );
}

function Sidebar({ active }: { active: Slug }) {
  const { locale } = useLocale();
  const sidebarTitle =
    locale === "en" ? "Browse docs" : locale === "cn" ? "文档目录" : "Содержание";

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="rounded-2xl border border-border/60 bg-[oklch(0.12_0.006_290)] p-4">
        <div className="flex items-center gap-2 px-2 pb-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {sidebarTitle}
          </span>
        </div>
        <ul className="mt-2 flex flex-col gap-0.5">
          {SLUGS.map((s) => {
            const isActive = s === active;
            return (
              <li key={s}>
                <a
                  href={`#/docs/${s}`}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <FileText className="h-3.5 w-3.5 shrink-0 opacity-60" />
                  <span className="truncate">{SIDEBAR_TITLE[s]}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}

function DocBody({ markdown }: { markdown: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={markdownComponents()}
    >
      {markdown}
    </ReactMarkdown>
  );
}

/**
 * Override react-markdown renderers so:
 *   - Relative doc links (`./FOO.md`, `../en/FOO.md`, `FOO.md`) become in-app anchors.
 *   - Headings get stable ids for deep linking.
 *   - Tables, code, blockquotes inherit site styling.
 */
function markdownComponents(): Components {
  const slugify = (s: string) =>
    s
      .toLowerCase()
      .trim()
      .replace(/[^\p{Letter}\p{Number}\s-]+/gu, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  const toInternalDocHref = (href: string): string | null => {
    // Already a fragment.
    if (href.startsWith("#")) return null;
    // Absolute URLs are left alone.
    if (/^https?:\/\//i.test(href)) return null;
    // Mail links.
    if (href.startsWith("mailto:")) return null;
    // Strip path prefix `../en/`, `./`, etc. to grab filename.
    const noQuery = href.split("#")[0];
    const base = noQuery.split("/").pop() ?? "";
    const name = base.replace(/\.md$/i, "").replace(/\.(ru|en|cn|zh-CN|uk|ja|ko)$/i, "");
    if (!name) return null;
    if (!(SLUGS as readonly string[]).includes(name)) return null;
    const frag = href.includes("#") ? `#${href.split("#").slice(1).join("#")}` : "";
    return `#/docs/${name}${frag}`;
  };

  return {
    h1: ({ children, id, ...rest }) => (
      <h1
        id={id ?? (typeof children === "string" ? slugify(children) : undefined)}
        className="display mt-2 mb-6 text-3xl font-semibold tracking-tight sm:text-4xl"
        {...rest}
      >
        {children}
      </h1>
    ),
    h2: ({ children, id, ...rest }) => (
      <h2
        id={id ?? (typeof children === "string" ? slugify(children) : undefined)}
        className="display mt-10 mb-4 text-2xl font-semibold tracking-tight sm:text-3xl"
        {...rest}
      >
        {children}
      </h2>
    ),
    h3: ({ children, id, ...rest }) => (
      <h3
        id={id ?? (typeof children === "string" ? slugify(children) : undefined)}
        className="mt-8 mb-3 text-xl font-semibold tracking-tight"
        {...rest}
      >
        {children}
      </h3>
    ),
    h4: ({ children, id, ...rest }) => (
      <h4
        id={id ?? (typeof children === "string" ? slugify(children) : undefined)}
        className="mt-6 mb-2 text-lg font-semibold tracking-tight"
        {...rest}
      >
        {children}
      </h4>
    ),
    p: ({ children, ...rest }) => (
      <p className="my-4 text-base leading-relaxed text-foreground/90" {...rest}>
        {children}
      </p>
    ),
    ul: ({ children, ...rest }) => (
      <ul className="my-4 list-disc space-y-2 pl-6 text-base leading-relaxed text-foreground/90" {...rest}>
        {children}
      </ul>
    ),
    ol: ({ children, ...rest }) => (
      <ol className="my-4 list-decimal space-y-2 pl-6 text-base leading-relaxed text-foreground/90" {...rest}>
        {children}
      </ol>
    ),
    li: ({ children, ...rest }) => (
      <li className="leading-relaxed" {...rest}>
        {children}
      </li>
    ),
    a: ({ href, children, ...rest }) => {
      const internal = typeof href === "string" ? toInternalDocHref(href) : null;
      const finalHref = internal ?? href ?? "#";
      const isExternal = typeof href === "string" && /^https?:\/\//i.test(href);
      return (
        <a
          href={finalHref}
          className="text-primary underline-offset-4 transition-colors hover:underline"
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noreferrer" : undefined}
          {...rest}
        >
          {children}
        </a>
      );
    },
    code: ({ className, children, ...rest }) => {
      const isBlock = (className ?? "").includes("language-");
      if (isBlock) {
        return (
          <code
            className={cn("font-mono text-[13px] text-foreground/95", className)}
            {...rest}
          >
            {children}
          </code>
        );
      }
      return (
        <code
          className="rounded border border-primary/30 bg-primary/[0.08] px-1.5 py-0.5 font-mono text-[0.85em] text-primary"
          {...rest}
        >
          {children}
        </code>
      );
    },
    pre: ({ children, ...rest }) => (
      <pre
        className="nice-scroll my-5 overflow-x-auto rounded-2xl border border-border/60 bg-[oklch(0.12_0.006_290)] px-4 py-3 font-mono text-[13px] leading-relaxed text-foreground/95"
        {...rest}
      >
        {children}
      </pre>
    ),
    blockquote: ({ children, ...rest }) => (
      <blockquote
        className="my-5 rounded-2xl border-l-2 border-primary/40 bg-primary/[0.06] px-4 py-3 text-sm leading-relaxed text-foreground/90"
        {...rest}
      >
        {children}
      </blockquote>
    ),
    table: ({ children, ...rest }) => (
      <div className="my-5 overflow-x-auto rounded-2xl border border-border/60 bg-[oklch(0.12_0.006_290)]">
        <table className="min-w-full text-left text-sm" {...rest}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...rest }) => (
      <thead className="border-b border-white/[0.08] bg-white/[0.03]" {...rest}>
        {children}
      </thead>
    ),
    th: ({ children, ...rest }) => (
      <th
        className="px-3 py-2.5 font-mono text-[11px] uppercase tracking-wide text-muted-foreground"
        {...rest}
      >
        {children}
      </th>
    ),
    td: ({ children, ...rest }) => (
      <td
        className="border-b border-white/[0.05] px-3 py-2.5 align-top leading-relaxed text-foreground/90"
        {...rest}
      >
        {children}
      </td>
    ),
    hr: () => <hr className="my-8 border-border/60" />,
    img: ({ src, alt, ...rest }) => (
      <img
        src={src}
        alt={alt ?? ""}
        className="my-4 max-w-full rounded-xl border border-border/40"
        {...rest}
      />
    ),
  };
}

function DocSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      <div className="h-7 w-2/3 animate-pulse rounded-md bg-white/[0.05]" />
      <div className="h-4 w-full animate-pulse rounded-md bg-white/[0.04]" />
      <div className="h-4 w-11/12 animate-pulse rounded-md bg-white/[0.04]" />
      <div className="h-4 w-10/12 animate-pulse rounded-md bg-white/[0.04]" />
      <div className="mt-8 h-6 w-1/3 animate-pulse rounded-md bg-white/[0.05]" />
      <div className="h-4 w-full animate-pulse rounded-md bg-white/[0.04]" />
      <div className="h-4 w-9/12 animate-pulse rounded-md bg-white/[0.04]" />
    </div>
  );
}

function DocNavButton({
  direction,
  slug,
  onClick,
}: {
  direction: "prev" | "next";
  slug: Slug | null;
  onClick: () => void;
}) {
  const { locale } = useLocale();
  if (!slug) return <span aria-hidden className="hidden sm:block" />;

  const label =
    direction === "prev"
      ? locale === "en"
        ? "Previous"
        : locale === "cn"
        ? "上一篇"
        : "Назад"
      : locale === "en"
      ? "Next"
      : locale === "cn"
      ? "下一篇"
      : "Вперёд";

  const Icon = direction === "prev" ? ArrowLeft : ArrowRight;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group inline-flex items-center gap-2 rounded-xl border border-border/60 bg-white/[0.02] px-4 py-2.5 text-sm transition-colors hover:border-primary/40 hover:bg-white/[0.05]",
        direction === "next" && "sm:ml-auto"
      )}
    >
      {direction === "prev" && <Icon className="h-4 w-4 text-primary" />}
      <span className="flex flex-col items-start">
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{SIDEBAR_TITLE[slug]}</span>
      </span>
      {direction === "next" && <Icon className="h-4 w-4 text-primary" />}
    </button>
  );
}