"use client";

import { useEffect } from "react";
import { preloadT } from "@/hooks/use-t";

/** Fire-and-forget preload of all locale bundles so the first locale
 *  switch doesn't have to wait for a network round-trip. */
export function I18nBootstrap() {
  useEffect(() => {
    preloadT();
  }, []);
  return null;
}