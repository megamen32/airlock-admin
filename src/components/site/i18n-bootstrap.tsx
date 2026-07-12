"use client";

import { useEffect } from "react";

/**
 * No-op now that bundles are imported statically. Kept as a small
 * mount-side effect target in case future code wants to do per-locale
 * setup (e.g. prefetching images referenced by copy). Kept as a
 * separate component so it's easy to extend without touching page.tsx.
 */
export function I18nBootstrap() {
  useEffect(() => {
    // intentional: bundles are statically imported, see useT.
  }, []);
  return null;
}