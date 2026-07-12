#!/usr/bin/env node
/**
 * Mirror two content trees into public/ so the Next.js static server
 * can serve them without App-Router rewrite:
 *
 *   1. src/content/docs/{en,ru,cn}/*.md  → public/docs/{en,ru,cn}/*.md
 *   2. src/content/i18n/{en,ru,cn}.json  → public/i18n/{en,ru,cn}.json
 *
 * Why: the docs browser fetches /docs/<locale>/<slug>.md at runtime, and
 * the i18n hook fetches /i18n/<locale>.json for chrome / home-page copy.
 * Both are static lookups — keeping the editable source-of-truth under
 * src/content/ and mirroring to public/ at prebuild keeps the runtime
 * code path trivial (a single fetch() per locale).
 *
 * Idempotent. Safe to run repeatedly.
 */
import { copyFileSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";

const LOCALES = ["en", "ru", "cn"];
const ROOT = resolve(process.cwd());

const SOURCES = [
  { src: join(ROOT, "src/content/docs"), dest: join(ROOT, "public/docs"), ext: ".md" },
  { src: join(ROOT, "src/content/i18n"), dest: join(ROOT, "public/i18n"), ext: ".json" },
];

function log(level, msg) {
  const tag = { info: "·", warn: "!", err: "✗" }[level] ?? "·";
  console.log(`[sync-docs] ${tag} ${msg}`);
}

function syncLocaleTree(src, dest, ext, locale) {
  // Tree layout A: src/<locale>/*.ext  →  dest/<locale>/*.ext   (docs)
  const srcDir = join(src, locale);
  const destDir = join(dest, locale);
  let srcFiles;
  try {
    srcFiles = readdirSync(srcDir).filter((f) => f.endsWith(ext));
  } catch (err) {
    if (err.code === "ENOENT") {
      log("warn", `${srcDir} missing`);
      return { copied: 0, removed: 0 };
    }
    throw err;
  }

  mkdirSync(destDir, { recursive: true });

  const srcSet = new Set(srcFiles);
  const destFiles = readdirSync(destDir).filter((f) => f.endsWith(ext));

  let copied = 0;
  for (const f of srcFiles) {
    copyFileSync(join(srcDir, f), join(destDir, f));
    copied++;
  }

  let removed = 0;
  for (const f of destFiles) {
    if (!srcSet.has(f)) {
      rmSync(join(destDir, f));
      removed++;
    }
  }

  return { copied, removed };
}

function syncFlatTree(src, dest, ext, locale) {
  // Tree layout B: src/<locale>.ext  →  dest/<locale>.ext   (i18n JSON)
  const srcFile = join(src, `${locale}${ext}`);
  const destFile = join(dest, `${locale}${ext}`);
  try {
    copyFileSync(srcFile, destFile);
    return { copied: 1, removed: 0 };
  } catch (err) {
    if (err.code === "ENOENT") {
      log("warn", `${srcFile} missing`);
      return { copied: 0, removed: 0 };
    }
    throw err;
  }
}

function main() {
  const t0 = Date.now();
  let totalCopied = 0;
  let totalRemoved = 0;

  for (const { src, dest, ext } of SOURCES) {
    log("info", `syncing ${src} (${ext}) → ${dest}`);
    mkdirSync(dest, { recursive: true });
    for (const locale of LOCALES) {
      // Detect layout by existence of the locale-named directory.
      const isTree = (() => {
        try {
          return readdirSync(join(src, locale)).some((f) => f.endsWith(ext));
        } catch {
          return false;
        }
      })();
      const r = isTree
        ? syncLocaleTree(src, dest, ext, locale)
        : syncFlatTree(src, dest, ext, locale);
      log("info", `  ${locale}: copied=${r.copied} removed=${r.removed}`);
      totalCopied += r.copied;
      totalRemoved += r.removed;
    }
  }

  log("info", `done in ${Date.now() - t0}ms (copied=${totalCopied}, pruned=${totalRemoved})`);
}

main();
