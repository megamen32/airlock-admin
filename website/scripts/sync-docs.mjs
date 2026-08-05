#!/usr/bin/env node
/**
 * Mirror the canonical root docs manifest into the website runtime trees so the
 * Next.js server can serve them without any app-router rewrite:
 *
 *   1. ../docs/*.md          → src/content/docs/en/*.md
 *   2. ../docs/ru/*.md       → src/content/docs/ru/*.md
 *   3. ../docs/cn/*.md       → src/content/docs/cn/*.md
 *   4. the same trees        → public/docs/{en,ru,cn}/*.md
 *   5. src/content/i18n/*.json / src/i18n/*.json → public/i18n/*.json
 *
 * The English source stays in the repo-root docs tree. The website content
 * and public trees are generated mirrors for the canonical doc URLs.
 *
 * Idempotent. Safe to run repeatedly.
 */
import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";

const LOCALES = ["en", "ru", "cn"];
const WEBSITE_ROOT = resolve(process.cwd());
const REPO_ROOT = resolve(WEBSITE_ROOT, "..");
const SOURCE_DOCS = join(REPO_ROOT, "docs");
const DOCS_MANIFEST = join(REPO_ROOT, "scripts", "docs-manifest.json");
const SOURCES = [
  { src: join(WEBSITE_ROOT, "src/content/i18n"), dest: join(WEBSITE_ROOT, "public/i18n"), ext: ".json" },
  { src: join(WEBSITE_ROOT, "src/i18n"), dest: join(WEBSITE_ROOT, "public/i18n"), ext: ".json" },
];

function log(level, msg) {
  const tag = { info: "·", warn: "!", err: "✗" }[level] ?? "·";
  console.log(`[sync-docs] ${tag} ${msg}`);
}

function markdownFiles(dir, ext) {
  try {
    return readdirSync(dir).filter((f) => f.endsWith(ext)).sort();
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
}

function syncFlatTree(srcDir, destDir, ext, allowlist = null) {
  let srcFiles;
  try {
    srcFiles = markdownFiles(srcDir, ext);
    if (srcFiles === null) {
      log("warn", `${srcDir} missing`);
      return { copied: 0, removed: 0 };
    }
  } catch (err) {
    throw err;
  }

  mkdirSync(destDir, { recursive: true });

  const wanted = allowlist ? new Set(allowlist) : null;
  const srcSet = new Set(wanted ? srcFiles.filter((file) => wanted.has(file)) : srcFiles);
  const destFiles = readdirSync(destDir).filter((f) => f.endsWith(ext));

  let copied = 0;
  for (const f of srcFiles) {
    if (wanted && !wanted.has(f)) continue;
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

function main() {
  const t0 = Date.now();
  let totalCopied = 0;
  let totalRemoved = 0;

  const publishedFiles = JSON.parse(readFileSync(DOCS_MANIFEST, "utf8")).sort();

  for (const locale of LOCALES) {
    const srcDir = locale === "en" ? SOURCE_DOCS : join(SOURCE_DOCS, locale);
    for (const mirrorRoot of [join(WEBSITE_ROOT, "src/content/docs"), join(WEBSITE_ROOT, "public/docs")]) {
      const destDir = join(mirrorRoot, locale);
      log("info", `syncing ${srcDir} → ${destDir}`);
      mkdirSync(destDir, { recursive: true });
      const r = syncFlatTree(srcDir, destDir, ".md", publishedFiles);
      log("info", `  ${locale}: copied=${r.copied} removed=${r.removed}`);
      totalCopied += r.copied;
      totalRemoved += r.removed;
    }
  }

  for (const { src, dest, ext } of SOURCES) {
    log("info", `syncing ${src} (${ext}) → ${dest}`);
    mkdirSync(dest, { recursive: true });
    for (const locale of LOCALES) {
      const r = syncFlatTree(join(src, locale), join(dest, locale), ext);
      log("info", `  ${locale}: copied=${r.copied} removed=${r.removed}`);
      totalCopied += r.copied;
      totalRemoved += r.removed;
    }
  }

  log("info", `done in ${Date.now() - t0}ms (copied=${totalCopied}, pruned=${totalRemoved})`);
}

main();
