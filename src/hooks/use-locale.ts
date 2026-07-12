"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

export const LOCALES = ["en", "ru", "cn"] as const;
export type Locale = (typeof LOCALES)[number];

const STORAGE_KEY = "gptadmin.locale";
const ATTR = "lang";
const DEFAULT_LOCALE: Locale = "ru";

function readStored(): Locale | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v && (LOCALES as readonly string[]).includes(v)) return v as Locale;
  } catch {}
  return null;
}

function detect(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = readStored();
  if (stored) return stored;
  const nav = navigator.language?.toLowerCase() ?? "";
  if (nav.startsWith("zh")) return "cn";
  if (nav.startsWith("en")) return "en";
  return DEFAULT_LOCALE;
}

function getSnapshot(): Locale {
  return detect();
}

function getServerSnapshot(): Locale {
  return DEFAULT_LOCALE;
}

function subscribe(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
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

export const LOCALE_META: Record<Locale, { label: string; short: string; htmlLang: string }> = {
  en: { label: "English", short: "EN", htmlLang: "en" },
  ru: { label: "Русский", short: "RU", htmlLang: "ru" },
  cn: { label: "简体中文", short: "CN", htmlLang: "zh-CN" },
};
