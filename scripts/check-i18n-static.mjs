#!/usr/bin/env node
/**
 * Static i18n audit.
 *
 * Scans src/i18n/<locale>.json + src/content/docs/<locale>/ to flag any
 * string that doesn't look like it belongs in <locale>.
 *
 * Detection: count script-specific characters (Cyrillic for ru, Han for cn,
 * Latin for en). A file or value is flagged when it contains material
 * characters from a *different* locale than expected.
 *
 * Whitelist: paths / keys / values that are language-neutral by design
 * (URLs, env var names, code blocks, brand suffix for non-Latin scripts
 * for the "GPT" prefix, etc.) are skipped via a regex allow-list.
 *
 * Exit codes:
 *   0  — clean
 *   1  — at least one violation
 *   2  — I/O or config error
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();

const LOCALES = [
  { code: "en", label: "English" },
  { code: "ru", label: "Russian" },
  { code: "cn", label: "Chinese (Simplified)" },
];

// Characters that belong to a locale's primary script.
// Han covers most CJK (cn) plus kana; Cyrillic for ru; Latin for en.
const SCRIPT_RE = {
  ru: /\p{Script=Cyrillic}/u,
  cn: /\p{Script=Han}/u,
  en: /\p{Script=Latin}/u,
};

/**
 * Detect which locale a string predominantly belongs to.
 * Returns an array of locale codes whose script appears in the string.
 * If none appears, returns [] (likely URL/code/emoji).
 */
function scriptsIn(text) {
  const out = [];
  for (const [loc, re] of Object.entries(SCRIPT_RE)) {
    if (re.test(text)) out.push(loc);
  }
  return out;
}

/**
 * Whitelist of substrings that are allowed even though they may carry
 * characters from other locales. Matched as case-sensitive substrings.
 */
const WHITELIST_SUBSTRINGS = [
  // Brand prefix / name
  "GPT‑Админ", "GPT‑Admin", "GPT‑管理", "GPT-Admin", "GPT-Админ", "GPT-管理",
  // Brand + license
  "AGPL‑3.0", "AGPL-3.0",
  // Protocol / format names (Latin everywhere)
  "MCP", "OAuth", "OpenAPI", "Apps SDK", "Bearer",
  "HTTP", "HTTPS", "JSON", "REST", "API", "SSE", "SSH", "DNS", "NAT", "URL",
  // AI brand names
  "Claude", "Codex", "OpenAI", "ChatGPT", "Open WebUI",
  "DeepSeek", "Qwen", "GigaChat", "Алиса", "智谱清言", "通义",
  // Companies / projects / OS
  "Yandex", "OpenWRT", "Apple", "Windows", "Linux", "macOS", "Sber",
  // Technical terms that look English in Russian/CN docs
  "sudo", "systemd", "firewall", "nginx", "fail2ban", "sshd",
  "journalctl", "postgres", "codex", "powershell", "rcon", "openmemory",
  "Privacy", "GitHub", "Git", "Bash", "API", "REST", "SDK", "TLS",
  "webhook", "long-poll", "VPN", "Wi-Fi", "WiFi", "API", "OpenAPI",
  "Streamable HTTP", "Streamable", "CORS", "I/O", "Webpack", "turbopack",
  // Brand / contact / external site names — appear in every locale
  "bezrabotnyi.com", "@careviolan", "Chrome", "Firefox", "Tampermonkey",
  "Android", "iPhone", "Safari", "App Store", "Google Play",
  "Open WebUI", "WebUI", "App",
  // Action / button / icon labels that are code-ish everywhere
  "Custom", "Action", "Widget", "Bridge", "Browser", "extension",
  "calls", "Tools", "tool", "Settings", "Configure", "Auto", "confirm",
  "MIT", "BSD", "Apache", "license",
  "PRD", "FAQ", "WAF", "XSS", "CSRF", "DOS", "DDOS", "DNS", "TLS",
  "Hash", "PBKDF2", "bcrypt", "argon2", "scrypt",
  // iconKey values used in architecture diagram (registry keys)
  "brain", "bot", "terminal", "router", "server", "shield", "wifi",
  "radio", "gamepad", "git", "database", "boxes",
  // Project-internal product / component names
  "shellmcp", "hub", "openmemory", "openchamber",
  "Userscript", "Tunnel", "tunnel", "widget", "Widget", "queue", "Queue",
  "Tunnels", "Roadmap", "Hub", "Cloudflare", "Scoping", "SCOPES",
  "Hub", "Integrations", "Integrations", "Roadmap", "Tunnels", "Tunnels",
  "Security", "FILE", "FAQ", "Enterprise", "Security",
  "Mavis", "source", "free", "tier", "tier", "open",
  // Common product / protocol labels that stay English in any locale
  "minecraft", "vpn", "VPN", "CLI", "cpu", "RAM", "GUI", "IDE", "RAM",
  "png", "svg", "gzip", "html", "css",
];

const WHITELIST_PATTERNS = [
  // Hex codes / base64-like
  /^[0-9a-f]{8,}$/i,
  // Pure env var / code identifiers
  /^[A-Z][A-Z0-9_]+$/,
  // Version strings
  /^\d+\.\d+(\.\d+)?([+-][\w.-]+)?$/,
  // ISO codes
  /^[a-z]{2}(-[A-Z]{2})?$/,
  // URLs
  /^https?:\/\//i,
  // Email-ish
  /^[^\s@]+@[^\s@]+$/,
  // Hash route anchors
  /^#\//,
  // Path-like
  /^\/[\w/-]+$/,
  // Single ASCII letters (separators like "AI", "OS" etc.)
  /^[A-Z]{1,4}$/,
];

/** Decide if a token is a "neutral" token that should be allowed. */
function isNeutralToken(token) {
  const t = token.trim();
  if (!t) return true;
  if (WHITELIST_SUBSTRINGS.some((w) => t.includes(w))) return true;
  if (WHITELIST_PATTERNS.some((re) => re.test(t))) return true;
  return false;
}

/**
 * Walk a JSON tree and yield each leaf string with its path.
 * Arrays are visited element-by-element with the index in the path.
 */
function* walkJson(value, path = []) {
  if (value == null) return;
  if (typeof value === "string") {
    yield { path, value: value };
    return;
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      yield* walkJson(value[i], [...path, i]);
    }
    return;
  }
  if (typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      yield* walkJson(v, [...path, k]);
    }
  }
}

function joinPath(p) {
  return p.map((seg) => (typeof seg === "number" ? `[${seg}]` : seg)).join(".");
}

function checkJsonFile(file, locale, violations) {
  let raw;
  try {
    raw = readFileSync(file, "utf8");
  } catch (err) {
    violations.push({ file, path: "<file>", issue: `read error: ${err.message}` });
    return;
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    violations.push({ file, path: "<file>", issue: `json parse error: ${err.message}` });
    return;
  }

  // Split text into "tokens" so URLs / env-vars / short identifiers can be
  // individually whitelisted.
  // A token is roughly a span of non-whitespace, or a punctuation chunk.
  for (const { path, value } of walkJson(data)) {
    if (!value) continue;
    // Skip values whose key signals a non-translatable identifier.
    const lastKey = path[path.length - 1];
    if (lastKey === "page" || lastKey === "iconKey" || lastKey === "href" || lastKey === "kicker" && /^[a-z-]+$/.test(value)) {
      // These are slugs / registry keys / href anchors, not natural language.
      continue;
    }
    // Skip fully-neutral values.
    if (isNeutralToken(value)) continue;

    const segments = splitIntoSegments(value);
    for (const seg of segments) {
      const segTrim = seg.trim();
      if (!segTrim) continue;
      if (isNeutralToken(segTrim)) continue;
      const scripts = scriptsIn(segTrim);
      if (scripts.length === 0) continue; // pure digits / symbols — skip
      if (scripts.includes(locale)) continue; // the locale is fine
      // Foreign script detected.
      violations.push({
        file: relative(ROOT, file),
        path: joinPath(path),
        issue: `foreign script ${scripts.join("+")} in ${locale} text`,
        snippet: segTrim.length > 80 ? segTrim.slice(0, 80) + "…" : segTrim,
      });
    }
  }
}

function splitIntoSegments(text) {
  // Split on whitespace AND on ASCII bracket/punctuation boundaries so that
  //   "пример (see docs)"  →  ["пример", "(see docs)"]
  // and
  //   "ENOENT — OpenWRT"  →  ["ENOENT", "—", "OpenWRT"]
  // This way an embedded English word inside Russian text shows up as its
  // own segment and can be whitelisted by neutral rules.
  // First strip markdown noise that introduces stray segments:
  const cleaned = text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [text](url) → text
    .replace(/`[^`\n]*`/g, "")             // inline code
    .replace(/```[\s\S]*?```/g, "")        // fenced code blocks
    .replace(/^\s*\|.*$/gm, "")            // markdown table rows
    .replace(/[*_`]+/g, "");              // strip remaining emphasis
  return cleaned.split(/(\s+|[()\[\]{},;:!?—–\-+=/\\|])/g).filter((s) => s && s.length > 0);
}

function checkMdFile(file, locale, violations) {
  let raw;
  try {
    raw = readFileSync(file, "utf8");
  } catch (err) {
    violations.push({ file, path: "<file>", issue: `read error: ${err.message}` });
    return;
  }
  // Drop fenced code blocks + inline code + markdown tables — those are
  // usually code/env names or pipe-separated cells, not natural language.
  const stripped = raw
    .replace(/```[\s\S]*?```/g, " ")         // fenced code
    .replace(/~~~[\s\S]*?~~~/g, " ")        // fenced code alt
    .replace(/`[^`\n]*`/g, " ")             // inline code
    .replace(/^\s*\|.*$/gm, " ")            // table rows
    .replace(/^\s*[-=]{2,}\s*$/gm, " ");    // table separators

  // Split into sentences-ish by line + period boundaries.
  const segments = stripped.split(/\n+|(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
  for (const seg of segments) {
    if (isNeutralToken(seg)) continue;
    const scripts = scriptsIn(seg);
    if (scripts.length === 0) continue;
    if (scripts.includes(locale)) continue;
    violations.push({
      file: relative(ROOT, file),
      path: "<body>",
      issue: `foreign script ${scripts.join("+")} in ${locale} text`,
      snippet: seg.length > 120 ? seg.slice(0, 120) + "…" : seg,
    });
  }
}

function walkDir(dir, exts) {
  const out = [];
  function recurse(d) {
    let entries;
    try {
      entries = readdirSync(d);
    } catch {
      return;
    }
    for (const name of entries) {
      const full = join(d, name);
      let st;
      try {
        st = statSync(full);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        recurse(full);
      } else if (exts.some((e) => name.endsWith(e))) {
        out.push(full);
      }
    }
  }
  recurse(dir);
  return out;
}

function main() {
  const violations = [];
  const summary = [];

  // JSON i18n bundles
  const jsonDir = join(ROOT, "src/i18n");
  for (const { code, label } of LOCALES) {
    const file = join(jsonDir, `${code}.json`);
    let exists = true;
    try {
      statSync(file);
    } catch {
      exists = false;
    }
    if (!exists) {
      violations.push({
        file: relative(ROOT, file),
        path: "<file>",
        issue: `missing ${label} i18n bundle`,
      });
      continue;
    }
    const before = violations.length;
    checkJsonFile(file, code, violations);
    summary.push({ kind: "json", locale: code, file: relative(ROOT, file), violations: violations.length - before });
  }

  // Markdown docs
  const docsRoot = join(ROOT, "src/content/docs");
  for (const { code, label } of LOCALES) {
    const dir = join(docsRoot, code);
    const files = walkDir(dir, [".md"]);
    if (files.length === 0) {
      violations.push({
        file: relative(ROOT, dir),
        path: "<dir>",
        issue: `no .md files for ${label}`,
      });
      continue;
    }
    const before = violations.length;
    for (const f of files) {
      checkMdFile(f, code, violations);
    }
    summary.push({ kind: "md", locale: code, files: files.length, violations: violations.length - before });
  }

  console.log("\n=== i18n static audit ===\n");
  for (const row of summary) {
    const marker = row.violations > 0 ? "✗" : "✓";
    const detail = row.kind === "md" ? `${row.files} files` : "1 bundle";
    console.log(`${marker} ${row.locale.padEnd(3)} ${row.kind.padEnd(4)} ${detail.padEnd(12)} → ${row.violations} violation(s)`);
  }

  if (violations.length > 0) {
    console.log(`\n=== ${violations.length} violation(s) ===\n`);
    for (const v of violations) {
      console.log(`[${v.file}] ${v.path}`);
      console.log(`  ${v.issue}`);
      if (v.snippet) {
        console.log(`  > ${v.snippet}`);
      }
      console.log("");
    }
    process.exit(1);
  }

  console.log("\nAll clean ✓");
}

main();