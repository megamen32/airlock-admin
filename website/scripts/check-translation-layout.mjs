import fs from "node:fs";
import path from "node:path";

const websiteRoot = path.resolve(import.meta.dirname, "..");
const repoRoot = path.resolve(websiteRoot, "..");
const docsRoot = path.join(repoRoot, "docs");
const websiteDocsRoot = path.join(websiteRoot, "src", "content", "docs");
const publicDocsRoot = path.join(websiteRoot, "public", "docs");
const config = fs.readFileSync(path.join(websiteRoot, ".gittranslate"), "utf8").trim();
const expectedConfig = "ru cn\ndocs/*.md";

function markdownFiles(dir) {
  return fs.readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .sort();
}

function fail(message) {
  console.error(`[translation-layout] ${message}`);
  process.exitCode = 1;
}

if (config !== expectedConfig) {
  fail(".gittranslate must translate only docs/*.md into ru and cn locale directories");
}

const published = markdownFiles(path.join(websiteDocsRoot, "en"));
const publishedSet = new Set(published);

function assertSourceSubset(sourceDir, label, exact = false) {
  const files = markdownFiles(sourceDir);
  const missing = published.filter((file) => !files.includes(file));
  const stale = exact ? files.filter((file) => !publishedSet.has(file)) : [];
  if (missing.length > 0) fail(`${label} is missing: ${missing.join(", ")}`);
  if (stale.length > 0) fail(`${label} has no published source: ${stale.join(", ")}`);
}

function assertMirror(mirrorRoot) {
  for (const locale of ["en", "ru", "cn"]) {
    const files = markdownFiles(path.join(mirrorRoot, locale));
    const missing = published.filter((file) => !files.includes(file));
    const stale = files.filter((file) => !publishedSet.has(file));
    if (missing.length > 0) fail(`${path.relative(repoRoot, path.join(mirrorRoot, locale))} is missing: ${missing.join(", ")}`);
    if (stale.length > 0) fail(`${path.relative(repoRoot, path.join(mirrorRoot, locale))} has no published source: ${stale.join(", ")}`);
  }
}

assertSourceSubset(docsRoot, "root docs/");
assertSourceSubset(path.join(docsRoot, "ru"), "root docs/ru", true);
assertSourceSubset(path.join(docsRoot, "cn"), "root docs/cn", true);
assertMirror(websiteDocsRoot);
assertMirror(publicDocsRoot);

if (process.exitCode) process.exit(process.exitCode);
console.log(`[translation-layout] ${published.length} published docs mirror root/docs and both website trees`);
