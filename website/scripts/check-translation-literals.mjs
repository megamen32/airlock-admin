import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const docsRoot = path.join(root, "src", "content", "docs");

function markdownFiles(locale) {
  return fs.readdirSync(path.join(docsRoot, locale)).filter((file) => file.endsWith(".md")).sort();
}

function protectedLiterals(markdown) {
  const fenced = markdown.match(/^```[^\n]*\n[\s\S]*?^```$/gm) ?? [];
  const withoutFences = markdown.replace(/^```[^\n]*\n[\s\S]*?^```$/gm, "");
  const inline = withoutFences.match(/`[^`\n]+`/g) ?? [];
  const links = [...withoutFences.matchAll(/\]\(([^\s)]+)(?:\s+[^)]*)?\)/g)].map((match) => `](${match[1]})`);
  return [...new Set([...fenced, ...inline, ...links])];
}

let failures = 0;
for (const file of markdownFiles("en")) {
  const english = fs.readFileSync(path.join(docsRoot, "en", file), "utf8");
  for (const locale of ["ru", "cn"]) {
    const translated = fs.readFileSync(path.join(docsRoot, locale, file), "utf8");
    const missing = protectedLiterals(english).filter((literal) => !translated.includes(literal));
    if (missing.length > 0) {
      console.error(`[translation-literals] ${locale}/${file} changed ${missing.length} protected literal(s)`);
      failures += 1;
    }
  }
}

if (failures > 0) process.exit(1);
console.log("[translation-literals] executable Markdown literals are preserved in every locale");
