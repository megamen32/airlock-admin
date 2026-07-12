"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { Locale } from "./use-locale";
import { useLocale } from "./use-locale";
import ru from "@/i18n/ru.json";
import en from "@/i18n/en.json";
import cn from "@/i18n/cn.json";

/** Tiny dictionary tree — strings live at leaves, arrays allowed too. */
export type TBundle = { [key: string]: string | string[] | TBundle | TBundle[] };

/** Pre-populated synchronously from local JSON so SSR + first-paint both
 *  have real values without a fetch round-trip. */
const STATIC: Record<Locale, TBundle> = {
  ru: ru as TBundle,
  en: en as TBundle,
  cn: cn as TBundle,
};

function resolvePath(bundle: TBundle | undefined, path: string): unknown {
  if (!bundle) return undefined;
  const parts = path.split(".");
  let cur: unknown = bundle;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return cur;
}

/**
 * Single combined hook. Subscribes to the same locale store as useLocale
 * so any locale change automatically re-renders components that call this.
 */
export function useT(): {
  t: (path: string, fallback?: string) => string;
  get: <T = unknown>(path: string, fallback?: T) => T;
  ready: boolean;
} {
  const { locale } = useLocale();
  const bundle = useMemo(() => STATIC[locale] || STATIC.ru, [locale]);

  const get = <T = unknown>(path: string, fb?: T): T => {
    const v = resolvePath(bundle, path);
    if (v !== undefined) return v as T;
    const f = resolvePath(STATIC.ru, path);
    if (f !== undefined) return f as T;
    return fb as T;
  };

  const t = (path: string, fb?: string): string => {
    const v = get(path, fb);
    return typeof v === "string" ? v : (fb ?? path);
  };

  return { t, get, ready: Boolean(bundle) };
}