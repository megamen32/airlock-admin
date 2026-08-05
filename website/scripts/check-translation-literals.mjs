import fs from "node:fs";
import path from "node:path";

const websiteRoot = path.resolve(import.meta.dirname, "..");
const repoRoot = path.resolve(websiteRoot, "..");
const docsRoot = path.join(repoRoot, "docs");
const publishedDocsRoot = path.join(websiteRoot, "src", "content", "docs", "en");

function markdownFiles(dir) {
  return fs.readdirSync(dir).filter((file) => file.endsWith(".md")).sort();
}

function protectedLiterals(markdown) {
  const fenced = markdown.match(/^```[^\n]*\n[\s\S]*?^```$/gm) ?? [];
  const withoutFences = markdown.replace(/^```[^\n]*\n[\s\S]*?^```$/gm, "");
  const inline = withoutFences.match(/`[^`\n]+`/g) ?? [];
  const links = [...withoutFences.matchAll(/\]\(([^\s)]+)(?:\s+[^)]*)?\)/g)].map((match) => `](${match[1]})`);
  return [...new Set([...fenced, ...inline, ...links])];
}

const published = markdownFiles(publishedDocsRoot);

let failures = 0;
for (const file of published) {
  const english = fs.readFileSync(path.join(docsRoot, file), "utf8");
  for (const locale of ["ru", "cn"]) {
    const translatedPath = path.join(docsRoot, locale, file);
    const translated = fs.readFileSync(translatedPath, "utf8");
    const missing = protectedLiterals(english).filter((literal) => !translated.includes(literal));
    if (missing.length > 0) {
      console.error(`[translation-literals] ${locale}/${file} changed ${missing.length} protected literal(s)`);
      failures += 1;
    }
  }
}

if (failures > 0) process.exit(1);
console.log("[translation-literals] executable Markdown literals are preserved in every derived locale");
