// Proves nothing private ended up in JavaScript the browser downloads.
// Usage: npm run build && npm run check:secrets
// It looks for: every value in .env.local (except NEXT_PUBLIC_ ones, which are public by design),
// the password-hash prefix, and the demo passwords from README.md.
import fs from "node:fs";
import path from "node:path";

const staticDir = path.join(".next", "static");
if (!fs.existsSync(staticDir)) {
  console.error('No .next/static folder. Run "npm run build" first.');
  process.exit(1);
}

const needles = [
  { label: "password hash prefix", value: "scrypt$" },
  { label: "demo password (Abebe)", value: "Abebe-pass-42" },
  { label: "demo password (Selam)", value: "Selam-pass-42" },
  { label: "demo password (staff)", value: "Kitchen-pass-42" },
];
if (fs.existsSync(".env.local")) {
  for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m || m[1].startsWith("NEXT_PUBLIC_")) continue;
    const value = m[2].replace(/^["']|["']$/g, "");
    if (value.length >= 8) needles.push({ label: `${m[1]} from .env.local`, value });
  }
}

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

let scanned = 0;
const leaks = [];
for (const file of walk(staticDir)) {
  scanned++;
  const text = fs.readFileSync(file, "utf8");
  for (const { label, value } of needles) if (text.includes(value)) leaks.push(`${label} found in ${file}`);
}

if (leaks.length > 0) {
  console.error("LEAK:\n" + leaks.join("\n"));
  process.exit(1);
}
console.log(`OK: ${needles.length} private value(s) checked across ${scanned} client files. None found.`);
