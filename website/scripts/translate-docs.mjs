import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const websiteRoot = path.resolve(import.meta.dirname, "..");
const repoRoot = path.resolve(websiteRoot, "..");
const docsRoot = path.join(repoRoot, "docs");
const publishedDocsRoot = path.join(websiteRoot, "src", "content", "docs", "en");
const locales = ["ru", "cn"];
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const providerIndex = args.indexOf("--provider");
const provider = providerIndex >= 0 ? args[providerIndex + 1] : process.env.TRANSLATE_PROVIDER || "google";
const fileIndex = args.indexOf("--file");
const requestedFile = fileIndex >= 0 ? args[fileIndex + 1] : null;
const localTranslatorCli = process.env.TRANSLATE_CLI || path.join(os.homedir(), "agents-projects", "translate", "bin", "translate.js");

if (!provider || provider.startsWith("-")) {
  throw new Error("--provider requires a provider name");
}

function englishFiles() {
  const files = fs.readdirSync(publishedDocsRoot)
    .filter((file) => file.endsWith(".md"))
    .sort();
  if (!requestedFile) return files;
  if (!files.includes(requestedFile)) throw new Error(`unknown English document: ${requestedFile}`);
  return [requestedFile];
}

function literalToken(index) {
  let n = index;
  let suffix = "";
  do {
    suffix = String.fromCharCode(65 + (n % 26)) + suffix;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return `__GPTADMIN_DOC_LITERAL_${suffix}__`;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function protectMarkdown(markdown) {
  const literals = [];
  const placeholderLiteral = (literal) => {
    const token = literalToken(literals.length);
    literals.push({ token, literal });
    return token;
  };
  const placeholderLink = (literal) => {
    const token = literalToken(literals.length);
    const placeholderUrl = `https://gptadmin.invalid/literal/${literals.length}`;
    const placeholder = `](${placeholderUrl})`;
    literals.push({ token, placeholder, placeholderUrl, literal });
    return placeholder;
  };

  let protectedMarkdown = markdown.replace(/^```[^\n]*\n[\s\S]*?^```$/gm, placeholderLiteral);
  protectedMarkdown = protectedMarkdown.replace(/`[^`\n]+`/g, placeholderLiteral);
  protectedMarkdown = protectedMarkdown.replace(/\]\(([^\n)]+)\)/g, (match) => placeholderLink(match));
  return { protectedMarkdown, literals };
}

function restoreMarkdown(markdown, literals) {
  let restored = markdown;
  for (const { token, placeholder, placeholderUrl, literal } of literals) {
    if (restored.includes(placeholder)) {
      restored = restored.replaceAll(placeholder, literal);
      continue;
    }
    if (restored.includes(token)) {
      restored = restored.replaceAll(token, literal);
      continue;
    }
    const tokenCore = token.slice(2, -2);
    const tokenPattern = new RegExp(`(?<![A-Z0-9])${escapeRegExp(tokenCore)}(?![A-Z0-9])`, "g");
    if (tokenPattern.test(restored)) {
      restored = restored.replace(tokenPattern, literal);
      continue;
    }
    if (placeholderUrl) {
      const urlPattern = new RegExp(`\\]\\(${escapeRegExp(placeholderUrl)}\\)`, "g");
      if (urlPattern.test(restored)) {
        restored = restored.replace(urlPattern, literal);
        continue;
      }
      if (restored.includes(placeholderUrl)) {
        restored = restored.replaceAll(placeholderUrl, literal);
        continue;
      }
    }
    if (restored.includes(literal)) {
      continue;
    }
    throw new Error(`translator changed protected literal ${token}`);
  }
  // Google can insert whitespace before a protected link suffix. Markdown does
  // not allow that space, so normalize it after the exact suffix is restored.
  restored = restored.replace(/\]\s+\(/g, "](");
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
      const source = fs.readFileSync(path.join(docsRoot, file), "utf8");
      const protectedSource = protectMarkdown(source);
      protectedFiles.set(file, protectedSource.literals);
      fs.writeFileSync(path.join(temporaryDocs, file), protectedSource.protectedMarkdown);
    }
    fs.writeFileSync(path.join(temporaryRoot, ".gittranslate"), "ru cn\ndocs/*.md\n");

    const commandArgs = ["--yes", "github:megamen32/translate", "--docs", "--provider", provider];
    if (dryRun) commandArgs.push("--dry-run");
    if (fs.existsSync(localTranslatorCli)) {
      execFileSync("node", [localTranslatorCli, "--docs", "--provider", provider, ...(dryRun ? ["--dry-run"] : [])], {
        cwd: temporaryRoot,
        stdio: "inherit",
      });
    } else {
      execFileSync("npx", commandArgs, { cwd: temporaryRoot, stdio: "inherit" });
    }
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
          fs.mkdirSync(path.join(docsRoot, locale), { recursive: true });
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
