// tools/build-search-index.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// adjust if your db files are elsewhere
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

function loadJSON(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function writeJSON(p, data) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf8");
}

function safeText(x) {
  if (x == null) return "";
  if (typeof x === "string") return x.trim();
  if (Array.isArray(x)) return x.map(safeText).filter(Boolean).join(", ");
  return "";
}

// NOTE: these paths must match your actual db file locations
const db = [
  { category: "verbs", level: "a1", file: "js/verbs-db-a1.js" },
  { category: "verbs", level: "a2", file: "js/verbs-db-a2.js" },
  { category: "verbs", level: "b1", file: "js/verbs-db-b1.js" },
  { category: "verbs", level: "b2", file: "js/verbs-db-b2.js" },
  { category: "verbs", level: "c1", file: "js/verbs-db-c1.js" },

  // If you have noun DBs as JS modules (not JSON), skip for now.
  // We’ll add nouns after you confirm how your noun DB files are stored.
];

const out = [];

for (const entry of db) {
  const fullPath = path.join(projectRoot, entry.file);

  // Your DB files are JS modules, not JSON — so this script only works
  // if you ALSO export a JSON version OR if we add a bundler-based build step.
  // If your DB is already JSON, change extension to .json and it will work.

  if (!fs.existsSync(fullPath)) {
    console.warn("Missing:", fullPath);
    continue;
  }

  console.warn("Found file but cannot parse JS modules as JSON:", fullPath);
}

writeJSON(path.join(projectRoot, "data/search-index.json"), out);
console.log("Wrote data/search-index.json with", out.length, "items");
