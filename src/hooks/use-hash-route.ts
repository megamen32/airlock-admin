"use client";

import { useSyncExternalStore, useCallback } from "react";

export type PageId = "home" | "chatgpt" | "mcp-server" | "mcp-extension" | "docs";

const PAGES: PageId[] = ["home", "chatgpt", "mcp-server", "mcp-extension", "docs"];

/** Parse the current hash into a PageId. */
function parseHash(): PageId {
  if (typeof window === "undefined") return "home";
  const h = window.location.hash.replace(/^#\/?/, "").trim();
  if (PAGES.includes(h as PageId)) return h as PageId;
  // Doc sub-routes like `#/docs/GETTING_STARTED` belong to the "docs" tab.
  if (h.startsWith("docs/")) return "docs";
  return "home";
}

const subscribe = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};
const getSnapshot = () => parseHash();
const getServerSnapshot = (): PageId => "home";

/** Hash-based router: returns the current page + a navigate function. */
export function useHashRoute() {
  const page = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const navigate = useCallback((to: PageId) => {
    if (to === "home") {
      history.replaceState(null, "", "#/");
    } else {
      history.replaceState(null, "", `#/${to}`);
    }
    // hashchange won't fire for replaceState in all cases, so dispatch manually
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    // scroll to top on page change
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  return { page, navigate };
}

export function pageHref(p: PageId): string {
  return p === "home" ? "#/" : `#/${p}`;
}

export const PAGE_META: Record<PageId, { label: string; short: string }> = {
  home: { label: "Главная", short: "Главная" },
  chatgpt: { label: "ChatGPT плагин", short: "ChatGPT" },
  "mcp-server": { label: "MCP сервер", short: "MCP сервер" },
  "mcp-extension": { label: "MCP расширение", short: "Расширение" },
  docs: { label: "Документация", short: "Доки" },
};
