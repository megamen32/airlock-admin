import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const docsRoot = path.join(root, "src", "content", "docs");
const config = fs.readFileSync(path.join(root, ".gittranslate"), "utf8").trim();
const expectedConfig = "ru cn\nsrc/content/docs/en/*.md";

function markdownFiles(locale) {
  return fs.readdirSync(path.join(docsRoot, locale))
    .filter((file) => file.endsWith(".md"))
    .sort();
}

function fail(message) {
  console.error(`[translation-layout] ${message}`);
  process.exitCode = 1;
}

if (config !== expectedConfig) {
  fail(".gittranslate must translate only en/*.md into ru and cn locale directories");
}

const english = markdownFiles("en");
for (const locale of ["ru", "cn"]) {
  const translated = markdownFiles(locale);
  const missing = english.filter((file) => !translated.includes(file));
  const stale = translated.filter((file) => !english.includes(file));
  if (missing.length > 0) fail(`${locale}/ is missing: ${missing.join(", ")}`);
  if (stale.length > 0) fail(`${locale}/ has no en/ source: ${stale.join(", ")}`);
}

const adjacentTranslations = english.filter((file) => {
  const stem = file.slice(0, -3);
  return ["ru", "cn"].some((locale) => fs.existsSync(path.join(docsRoot, "en", `${stem}.${locale}.md`)));
});
if (adjacentTranslations.length > 0) {
  fail(`generated translations must not be stored beside en/: ${adjacentTranslations.join(", ")}`);
}

if (process.exitCode) process.exit(process.exitCode);
console.log(`[translation-layout] ${english.length} English documents match ru/ and cn/`);
