#!/usr/bin/env node
/**
 * Verify the documentation links and assets that the standalone website serves.
 *
 * Inputs: repository and website roots. Output: throws when the footer target or
 * generated docs assets do not match the documentation manifest.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const CANONICAL_GPTADMIN_URL = "https://gptadmin.bezrabotnyi.com";
export const LOCALES = ["en", "ru", "cn"];

function requireFile(file, message) {
  if (!fs.existsSync(file)) throw new Error(`${message}: ${file}`);
}

function readManifest(repoRoot) {
  const manifestPath = path.join(repoRoot, "scripts", "docs-manifest.json");
  requireFile(manifestPath, "Documentation manifest is missing");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  if (!Array.isArray(manifest) || manifest.length === 0 || manifest.some((file) => typeof file !== "string" || path.basename(file) !== file || !file.endsWith(".md"))) {
    throw new Error(`Documentation manifest must contain non-empty Markdown filenames: ${manifestPath}`);
  }
  return manifest;
}

function checkFooter(websiteRoot) {
  const footerPath = path.join(websiteRoot, "src", "components", "site", "footer.tsx");
  requireFile(footerPath, "Website footer is missing");
  const footer = fs.readFileSync(footerPath, "utf8");
  const canonicalLinks = footer.match(new RegExp(`href=\\"${CANONICAL_GPTADMIN_URL}\\"`, "g")) ?? [];

  if (canonicalLinks.length < 2 || footer.includes('href="https://bezrabotnyi.com"')) {
    throw new Error(`Footer documentation links must target ${CANONICAL_GPTADMIN_URL}: ${footerPath}`);
  }
}

/** Validate the canonical footer URL and every manifest docs asset in build output. */
export function checkDocsBuild({ websiteRoot, repoRoot }) {
  checkFooter(websiteRoot);
  const manifest = readManifest(repoRoot);
  const publicDocsRoot = path.join(websiteRoot, ".next", "standalone", "public", "docs");

  for (const locale of LOCALES) {
    for (const filename of manifest) {
      requireFile(path.join(publicDocsRoot, locale, filename), `Missing standalone documentation asset for ${locale}`);
    }
  }

  console.log(`[docs-build] verified ${manifest.length} docs across ${LOCALES.length} locales and canonical footer links`);
}

const scriptPath = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const websiteRoot = path.resolve(path.dirname(scriptPath), "..");
  checkDocsBuild({ websiteRoot, repoRoot: path.resolve(websiteRoot, "..") });
}
