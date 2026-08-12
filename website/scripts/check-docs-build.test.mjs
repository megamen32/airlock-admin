import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { CANONICAL_GPTADMIN_URL, checkDocsBuild, LOCALES } from "./check-docs-build.mjs";

function makeFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "gptadmin-docs-build-"));
  const repoRoot = path.join(root, "repo");
  const websiteRoot = path.join(repoRoot, "website");
  const manifest = ["Home.md", "API_REFERENCE.md"];

  fs.mkdirSync(path.join(repoRoot, "scripts"), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, "scripts", "docs-manifest.json"), JSON.stringify(manifest));
  fs.mkdirSync(path.join(websiteRoot, "src", "components", "site"), { recursive: true });
  fs.writeFileSync(path.join(websiteRoot, "src", "components", "site", "footer.tsx"), `<a href="${CANONICAL_GPTADMIN_URL}" /><a href="${CANONICAL_GPTADMIN_URL}" />`);
  for (const locale of LOCALES) {
    const docsRoot = path.join(websiteRoot, ".next", "standalone", "public", "docs", locale);
    fs.mkdirSync(docsRoot, { recursive: true });
    for (const filename of manifest) fs.writeFileSync(path.join(docsRoot, filename), `${locale}/${filename}\n`);
  }
  return { root, repoRoot, websiteRoot };
}

function expectsFailure(action, expected) {
  assert.throws(action, new RegExp(expected));
}

const fixture = makeFixture();
try {
  checkDocsBuild(fixture);
  fs.rmSync(path.join(fixture.websiteRoot, ".next", "standalone", "public", "docs", "ru", "Home.md"));
  expectsFailure(() => checkDocsBuild(fixture), "Missing standalone documentation asset for ru");
  fs.writeFileSync(path.join(fixture.websiteRoot, "src", "components", "site", "footer.tsx"), '<a href="https://bezrabotnyi.com" />');
  expectsFailure(() => checkDocsBuild(fixture), "Footer documentation links must target");
  console.log("[docs-build:test] red fixtures rejected; valid fixture accepted");
} finally {
  fs.rmSync(fixture.root, { recursive: true, force: true });
}
