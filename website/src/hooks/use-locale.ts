"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

export const LOCALES = ["en", "ru", "cn"] as const;
export type Locale = (typeof LOCALES)[number];

const STORAGE_KEY = "gptadmin.locale";
const ATTR = "lang";
const DEFAULT_LOCALE: Locale = "ru";

/** Sniff navigator.language → Locale. Used both at boot and by the inline
 *  pre-React script in <head> so we don't get a Russian-flash on first visit
 *  from an English browser. */
export function sniffLocale(): Locale {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  const nav = navigator.language?.toLowerCase() ?? "";
  if (nav.startsWith("zh")) return "cn";
  if (nav.startsWith("en")) return "en";
  return DEFAULT_LOCALE;
}

function readStored(): Locale | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v && (LOCALES as readonly string[]).includes(v)) return v as Locale;
  } catch {}
  return null;
}

/** Resolve locale for current render: stored > sniffed > default.
 *  Side-effect: on first call with no stored value, persist the detected
 *  locale so server-rendered HTML and client hydration agree. */
function detectAndPersist(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = readStored();
  if (stored) return stored;
  const detected = sniffLocale();
  try {
    window.localStorage.setItem(STORAGE_KEY, detected);
  } catch {}
  return detected;
}

function getSnapshot(): Locale {
  return detectAndPersist();
}

function getServerSnapshot(): Locale {
  // On the server we have no localStorage / navigator. Render the default.
  // The inline <head> script below will swap <html lang> before paint, so
  // first-paint chrome looks right even if the eventual locale differs.
  return DEFAULT_LOCALE;
}

function subscribe(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", cb);
  // Custom event used by setLocale() to nudge the same tab.
  window.addEventListener("gptadmin:locale", cb as EventListener);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("gptadmin:locale", cb as EventListener);
  };
}

/** Locale switcher state. Persists to localStorage, reads browser language as fallback. */
export function useLocale(): { locale: Locale; setLocale: (l: Locale) => void } {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Reflect on <html lang> so screen readers + CSS `:lang()` work.
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute(ATTR, locale);
    }
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {}
    document.documentElement.setAttribute(ATTR, next);
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY, newValue: next }));
    // StorageEvent doesn't dispatch in the originating tab, so nudge listeners manually
    window.dispatchEvent(new CustomEvent("gptadmin:locale", { detail: next }));
  }, []);

  return { locale, setLocale };
}

/** Inline JS to drop into <head> so the first paint already has the
 *  correct <html lang> and the persisted locale. Runs before React
 *  hydration — no FOUC. */
export const LOCALE_BOOTSTRAP_SCRIPT = `
(function(){try{
  var K="gptadmin.locale";
  var s=localStorage.getItem(K);
  function sniff(){var n=(navigator.language||"").toLowerCase();if(n.indexOf("zh")===0)return"cn";if(n.indexOf("en")===0)return"en";return"ru";}
  var l=s||sniff();
  try{localStorage.setItem(K,l);}catch(e){}
  document.documentElement.setAttribute("lang", l==="cn"?"zh-CN":l);
}catch(e){}})();
`.trim();

export const LOCALE_META: Record<Locale, { label: string; short: string; htmlLang: string }> = {
  en: { label: "English", short: "EN", htmlLang: "en" },
  ru: { label: "Русский", short: "RU", htmlLang: "ru" },
  cn: { label: "简体中文", short: "CN", htmlLang: "zh-CN" },
};