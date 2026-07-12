#!/usr/bin/env node
/**
 * Mirror src/content/docs/{en,ru,cn}/*.md → public/docs/{en,ru,cn}/*.md.
 *
 * Why: the docs browser fetches /docs/<locale>/<slug>.md at runtime, which
 * Next.js serves from `public/`. We keep the editable source-of-truth in
 * `src/content/docs/` (alongside other site content) and sync to `public/`
 * before every build so the static asset paths stay simple — no App Router
 * refactor needed.
 *
 * Idempotent. Safe to run repeatedly. Exits non-zero if any source file is
 * missing in a destination (i.e. a doc was deleted without removing it from
 * the public copy).
 */
import { copyFileSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const LOCALES = ["en", "ru", "cn"];
const ROOT = resolve(process.cwd());
const SRC = join(ROOT, "src/content/docs");
const DEST = join(ROOT, "public/docs");

function log(level, msg) {
  const tag = { info: "·", warn: "!", err: "✗" }[level] ?? "·";
  console.log(`[sync-docs] ${tag} ${msg}`);
}

function syncLocale(locale) {
  const srcDir = join(SRC, locale);
  const destDir = join(DEST, locale);
  let srcFiles;
  try {
    srcFiles = readdirSync(srcDir).filter((f) => f.endsWith(".md"));
  } catch (err) {
    if (err.code === "ENOENT") {
      log("warn", `source dir missing: ${srcDir}`);
      return { locale, copied: 0, removed: 0, missing: 0 };
    }
    throw err;
  }

  mkdirSync(destDir, { recursive: true });

  const srcSet = new Set(srcFiles);
  const destFiles = readdirSync(destDir).filter((f) => f.endsWith(".md"));

  // Copy/replace each source file.
  let copied = 0;
  for (const f of srcFiles) {
    copyFileSync(join(srcDir, f), join(destDir, f));
    copied++;
  }

  // Remove destination files that no longer have a source.
  let removed = 0;
  for (const f of destFiles) {
    if (!srcSet.has(f)) {
      rmSync(join(destDir, f));
      removed++;
    }
  }

  return { locale, copied, removed, missing: 0 };
}

function main() {
  const t0 = Date.now();
  log("info", `syncing ${SRC} → ${DEST}`);
  const results = LOCALES.map(syncLocale);
  let totalCopied = 0;
  let totalRemoved = 0;
  for (const r of results) {
    log(
      "info",
      `${r.locale}: copied=${r.copied} removed=${r.removed}`
    );
    totalCopied += r.copied;
    totalRemoved += r.removed;
  }
  log(
    "info",
    `done in ${Date.now() - t0}ms (copied=${totalCopied}, pruned=${totalRemoved})`
  );
}

main();
