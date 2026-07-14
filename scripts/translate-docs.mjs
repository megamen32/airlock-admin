import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const docsRoot = path.join(root, "src", "content", "docs");
const locales = ["ru", "cn"];
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const providerIndex = args.indexOf("--provider");
const provider = providerIndex >= 0 ? args[providerIndex + 1] : process.env.TRANSLATE_PROVIDER || "google";
const fileIndex = args.indexOf("--file");
const requestedFile = fileIndex >= 0 ? args[fileIndex + 1] : null;

if (!provider || provider.startsWith("-")) {
  throw new Error("--provider requires a provider name");
}

function englishFiles() {
  const files = fs.readdirSync(path.join(docsRoot, "en"))
    .filter((file) => file.endsWith(".md"))
    .sort();
  if (!requestedFile) return files;
  if (!files.includes(requestedFile)) throw new Error(`unknown English document: ${requestedFile}`);
  return [requestedFile];
}

function protectMarkdown(markdown) {
  const literals = [];
  const placeholder = (literal) => {
    // Digits are preserved by the free translation provider, unlike words such
    // as "literal" which can be translated in Chinese output.
    const token = `999999${String(literals.length).padStart(6, "0")}999999`;
    literals.push({ token, literal });
    return token;
  };

  let protectedMarkdown = markdown.replace(/^```[^\n]*\n[\s\S]*?^```$/gm, placeholder);
  protectedMarkdown = protectedMarkdown.replace(/`[^`\n]+`/g, placeholder);
  protectedMarkdown = protectedMarkdown.replace(/\]\(([^\n)]+)\)/g, (match) => placeholder(match));
  return { protectedMarkdown, literals };
}

function restoreMarkdown(markdown, literals) {
  let restored = markdown;
  for (const { token, literal } of literals) {
    if (!restored.includes(token)) {
      throw new Error(`translator changed protected literal ${token}`);
    }
    restored = restored.replaceAll(token, literal);
  }
  // Google can insert whitespace before a protected link suffix. Markdown does
  // not allow that space, so normalize it after the exact suffix is restored.
  restored = restored.replace(/\]\s+\(/g, "](");
  if (/999999\d{6}999999/.test(restored)) {
    throw new Error("translator introduced an unexpected protected literal");
  }
  return restored;
}

/** Translate isolated en/ copies and place outputs in the site's locale trees. */
function translateDocs() {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "gptadmin-docs-"));
  const temporaryDocs = path.join(temporaryRoot, "docs");

  try {
    fs.mkdirSync(temporaryDocs, { recursive: true });
    const protectedFiles = new Map();
    for (const file of englishFiles()) {
      const source = fs.readFileSync(path.join(docsRoot, "en", file), "utf8");
      const protectedSource = protectMarkdown(source);
      protectedFiles.set(file, protectedSource.literals);
      fs.writeFileSync(path.join(temporaryDocs, file), protectedSource.protectedMarkdown);
    }
    fs.writeFileSync(path.join(temporaryRoot, ".gittranslate"), "ru cn\ndocs/*.md\n");

    const commandArgs = ["--yes", "github:megamen32/translate", "--docs", "--provider", provider];
    if (dryRun) commandArgs.push("--dry-run");
    execFileSync("npx", commandArgs, { cwd: temporaryRoot, stdio: "inherit" });
    if (dryRun) return;

    for (const file of englishFiles()) {
      const stem = file.slice(0, -3);
      for (const locale of locales) {
        const generated = path.join(temporaryDocs, `${stem}.${locale}.md`);
        if (!fs.existsSync(generated)) {
          throw new Error(`translator did not create ${path.basename(generated)}`);
        }
        const translated = fs.readFileSync(generated, "utf8");
        try {
          fs.writeFileSync(path.join(docsRoot, locale, file), restoreMarkdown(translated, protectedFiles.get(file)));
        } catch (error) {
          throw new Error(`${locale}/${file}: ${error.message}`);
        }
      }
    }
    console.log(`[translate-docs] translated ${englishFiles().length} documents via ${provider}`);
  } finally {
    if (process.env.KEEP_TRANSLATION_TMP === "1") {
      console.error(`[translate-docs] retained ${temporaryRoot} for diagnostics`);
    } else {
      fs.rmSync(temporaryRoot, { recursive: true, force: true });
    }
  }
}

translateDocs();
