import type { Locale } from "@/hooks/use-locale";

/**
 * Per-locale brand string. Keep the en-dash (`‑`) so that line-wrap
 * never breaks between "GPT" and the suffix.
 *
 * - ru: Cyrillic ("Админ") — original
 * - en: Transliteration with hyphen
 * - cn: 管理 = "admin/manage" in Simplified Chinese
 */
export const BRAND: Record<Locale, string> = {
  ru: "GPT‑Админ",
  en: "GPT‑Admin",
  cn: "GPT‑管理",
};

export function brandFor(locale: Locale): string {
  return BRAND[locale] ?? BRAND.ru;
}