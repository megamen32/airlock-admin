"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { Locale } from "./use-locale";
import { useLocale } from "./use-locale";

/** Tiny dictionary tree — strings live at leaves, arrays allowed too. */
export type TBundle = { [key: string]: string | string[] | TBundle | TBundle[] };

const cache: Partial<Record<Locale, TBundle>> = {};
const inflight: Partial<Record<Locale, Promise<TBundle>>> = {};
const subscribers = new Set<() => void>();

function notify() {
  for (const cb of subscribers) cb();
}

async function loadBundle(locale: Locale): Promise<TBundle> {
  if (cache[locale]) return cache[locale]!;
  if (inflight[locale]) return inflight[locale]!;
  inflight[locale] = (async () => {
    try {
      const res = await fetch(`/i18n/${locale}.json`, { cache: "force-cache" });
      if (!res.ok) throw new Error(`i18n ${locale} ${res.status}`);
      const data = (await res.json()) as TBundle;
      cache[locale] = data;
      notify();
      return data;
    } catch (err) {
      console.warn(`[i18n] failed to load ${locale}, falling back to ru`, err);
      const fallback = locale === "ru" ? {} : await loadBundle("ru");
      cache[locale] = fallback;
      notify();
      return fallback;
    } finally {
      delete inflight[locale];
    }
  })();
  return inflight[locale]!;
}

/** Eagerly preload all locale bundles (called once at app mount). */
export function preloadT() {
  void loadBundle("ru");
  void loadBundle("en");
  void loadBundle("cn");
}

/** Walk a dotted path ("hero.title") through a TBundle. */
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

function subscribe(cb: () => void) {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

/**
 * Hook: returns a `t(path, fallback?)` for strings + a `get(path)` for
 * arbitrary values (arrays, nested objects). Falls back to the ru bundle,
 * then to the supplied fallback string, then to the path itself.
 *
 * Re-renders when the locale changes or when a previously-missing bundle
 * finishes loading.
 */
export function useT(): {
  t: (path: string, fallback?: string) => string;
  get: <T = unknown>(path: string, fallback?: T) => T;
  ready: boolean;
} {
  const { locale } = useLocale();
  const [, setVersion] = useState(0);

  useSyncExternalStore(
    subscribe,
    () => 0,
    () => 0
  );

  useEffect(() => {
    if (!cache[locale]) {
      void loadBundle(locale).then(() => setVersion((v) => v + 1));
    }
  }, [locale]);

  const active = cache[locale];
  const fallback = cache.ru;
  const ready = Boolean(active && (locale === "ru" || active !== fallback));

  const get = <T = unknown>(path: string, fb?: T): T => {
    const v = resolvePath(active, path);
    if (v !== undefined) return v as T;
    const f = resolvePath(fallback, path);
    if (f !== undefined) return f as T;
    return fb as T;
  };

  const t = (path: string, fb?: string): string => {
    const v = get(path, fb);
    return typeof v === "string" ? v : (fb ?? path);
  };

  return { t, get, ready };
}