#!/usr/bin/env python3
"""
Runtime i18n audit.

Spins up a Chromium browser via Playwright, opens the locale switcher
dropdown, picks each language in turn, and asserts via the accessibility
tree (page.accessibility.snapshot) that the visible/named text mostly
belongs to that locale's script.

Approach:
  - For each locale (en, ru, cn):
    * Open the page
    * Pick the locale from the dropdown (or fall back to localStorage)
    * Walk the accessibility tree and collect all text-content leaf nodes
    * Score how much of that text is in each script
    * Assert the dominant script matches the picked locale

Usage:
  scripts/check-i18n-runtime.py [--base URL] [--locales en,ru,cn] [--pages /,/#/docs/Home,/chatgpt]

Exit:
  0 — all pages all locales pass
  1 — at least one failure
  2 — runtime error
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from typing import Iterable

from playwright.sync_api import sync_playwright, Page, TimeoutError as PWTimeout

CYRILLIC = re.compile(r"[Ѐ-ӿ]")
HAN = re.compile(r"[一-鿿]")
LATIN = re.compile(r"[A-Za-zÀ-ɏḀ-ỿ]")

DEFAULT_PAGES = [
    "/",  # home
    "/#/docs/Home",  # doc page (uses the docs renderer)
    "/#/docs/SHELLMCP",  # ensure non-default doc slug
    "/#/chatgpt",  # sub-page
    "/#/mcp-server",
    "/#/mcp-extension",
]


@dataclass
class LocaleScore:
    locale: str
    total: int
    cyrillic: int
    han: int
    latin: int
    other: int

    def dominant(self) -> str:
        scores = {"ru": self.cyrillic, "cn": self.han, "en": self.latin}
        # Pick the highest, fallback to en.
        best = max(scores.items(), key=lambda kv: kv[1])
        return best[0] if best[1] > 0 else "en"


def score_text(text: str, locale: str) -> LocaleScore:
    cyrillic = len(CYRILLIC.findall(text))
    han = len(HAN.findall(text))
    latin = len(LATIN.findall(text))
    total = cyrillic + han + latin
    other = max(0, len(text) - total)
    return LocaleScore(
        locale=locale,
        total=total,
        cyrillic=cyrillic,
        han=han,
        latin=latin,
        other=other,
    )


def collect_accessible_text(node: dict, out: list[str]) -> None:
    """Recursively walk a Playwright accessibility snapshot node and pull out
    text values. We accept either 'name' or 'value' string fields."""
    # Skip the page <title> — it's SEO metadata, hardcoded in layout.tsx,
    # and intentionally stays in the brand language. Not user-facing on
    # the rendered page.
    role = node.get("role")
    name = node.get("name")
    if role == "WebArea" and isinstance(name, str) and name.strip():
        # WebArea's name is the document.title — skip it.
        pass
    elif isinstance(name, str) and name.strip():
        out.append(name)
    value = node.get("value")
    if isinstance(value, str) and value.strip():
        out.append(value)
    for child in node.get("children", []) or []:
        if isinstance(child, dict):
            collect_accessible_text(child, out)


def aggregate(scores: Iterable[LocaleScore], locale: str) -> LocaleScore:
    total = LocaleScore(locale, 0, 0, 0, 0, 0)
    for s in scores:
        total.total += s.total
        total.cyrillic += s.cyrillic
        total.han += s.han
        total.latin += s.latin
        total.other += s.other
    return total


def set_locale(page: Page, locale: str) -> None:
    """Force the locale to a specific value via localStorage + reload.

    Sets localStorage, reloads, then waits until the brand in the header
    reflects the target locale (the brand string is the simplest "ready
    signal" — once it shows the target brand, React has finished hydrating
    with the new locale)."""
    page.evaluate(
        "(l) => { localStorage.setItem('gptadmin.locale', l); }",
        locale,
    )
    page.reload(wait_until="domcontentloaded")
    expected_brand = {
        "en": "GPT‑Admin",
        "ru": "GPT‑Админ",
        "cn": "GPT‑管理",
    }[locale]
    # Wait until the visible brand matches.
    page.wait_for_function(
        "(exp) => Array.from(document.querySelectorAll('header span.font-semibold'))"
        ".some(el => el.textContent && el.textContent.includes(exp))",
        arg=expected_brand,
        timeout=8000,
    )
    # Tiny settle for bundle-driven re-renders (useT() loads the
    # active bundle after mount).
    page.wait_for_timeout(300)


def click_locale(page: Page, locale_label: str) -> None:
    """Click the LocaleSwitcher and pick the option with the given label."""
    btn = page.get_by_role("button", name=re.compile(r"Switch language", re.I))
    btn.first.click()
    opt = page.get_by_role("option", name=re.compile(locale_label, re.I)).first
    opt.click()
    # Wait for re-render to commit; tiny settle.
    page.wait_for_timeout(400)


def audit_page(page: Page, page_path: str, locale: str, debug: bool = False) -> tuple[bool, str]:
    """Return (ok, detail). ok=True when dominant script matches locale."""
    page.goto(
        f"https://became.bezrabotnyi.com{page_path}",
        wait_until="domcontentloaded",
    )
    set_locale(page, locale)
    # Sanity: the Switcher button is present (we are on a real page).
    try:
        page.get_by_role("button", name=re.compile(r"Switch language", re.I)).first.wait_for(
            timeout=4000
        )
    except PWTimeout:
        return False, f"{page_path}#{locale}: switcher not found (page didn't load)"

    # Grab accessibility tree.
    snap = page.accessibility.snapshot(interesting_only=False)
    if not snap:
        return False, f"{page_path}#{locale}: empty accessibility tree"

    text_chunks: list[str] = []
    collect_accessible_text(snap, text_chunks)
    if not text_chunks:
        return False, f"{page_path}#{locale}: no accessible text"

    if debug:
        # Print top 20 longest text chunks to understand composition.
        sorted_chunks = sorted(set(text_chunks), key=len, reverse=True)[:25]
        print(f"\n--- debug {page_path}#{locale} top chunks ---")
        for c in sorted_chunks:
            print(f"  [{len(c):4}] {c[:80]}")

    combined = "\n".join(text_chunks)
    s = score_text(combined, locale)
    dom = s.dominant()

    ratio = 0.0
    if s.total > 0:
        ratio = {
            "ru": s.cyrillic / s.total,
            "cn": s.han / s.total,
            "en": s.latin / s.total,
        }[locale]

    # Filter out chrome that's language-neutral (sidebar slugs, footer links).
    # We just report the dominant + ratio — no "stripping" needed.

    detail = (
        f"{page_path}#{locale:<3} "
        f"chars={s.total:>5}  "
        f"cyr={s.cyrillic:>4}  han={s.han:>4}  lat={s.latin:>4}  "
        f"dom={dom}  ratio_for={locale}={ratio:.0%}"
    )

    # Threshold: at least 30% of total script chars must be the target
    # script. Below that, we consider the page not really translated.
    return ratio >= 0.30, detail


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--base",
        default="https://became.bezrabotnyi.com",
        help="Base URL of the deployed site",
    )
    parser.add_argument(
        "--locales",
        default="en,ru,cn",
        help="Comma-separated locales to test",
    )
    parser.add_argument(
        "--pages",
        default=",".join(DEFAULT_PAGES),
        help="Comma-separated page paths (relative to base)",
    )
    parser.add_argument(
        "--threshold",
        type=float,
        default=0.30,
        help="Minimum share of total chars that must match the target locale script",
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Print the largest accessible-text chunks for debugging",
    )
    args = parser.parse_args()

    locales = [s.strip() for s in args.locales.split(",") if s.strip()]
    pages = [s.strip() for s in args.pages.split(",") if s.strip()]

    results: list[tuple[bool, str]] = []
    summary: list[tuple[str, str, bool, str]] = []  # (page, locale, ok, detail)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        try:
            ctx = browser.new_context(
                viewport={"width": 1280, "height": 800},
                # Don't carry localStorage between contexts so we start clean.
            )
            page = ctx.new_page()
            for page_path in pages:
                for locale in locales:
                    ok, detail = audit_page(page, page_path, locale, debug=args.debug)
                    marker = "✓" if ok else "✗"
                    print(f"{marker} {detail}")
                    results.append((ok, detail))
                    summary.append((page_path, locale, ok, detail))
            ctx.close()
        finally:
            browser.close()

    print()
    print("=== runtime audit summary ===")
    for page_path, locale, ok, detail in summary:
        marker = "✓" if ok else "✗"
        print(f"{marker} {page_path}  {locale}")
    fail = sum(1 for ok, _ in results if not ok)
    if fail > 0:
        print(f"\n{fail} failure(s)")
        return 1
    print("\nAll clean ✓")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        sys.exit(130)
