import fs from "node:fs";
import path from "node:path";

const server = path.resolve(import.meta.dirname, "..", ".next", "standalone", "server.js");

if (!fs.existsSync(server)) {
  throw new Error(`Next standalone server is missing: ${server}`);
}

console.log(`[standalone-output] verified ${server}`);
