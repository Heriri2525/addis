// Estimates the JavaScript a browser downloads for one route, from the BUILT output.
// Next 16's `next build` no longer prints a "First Load JS" column, so this reads the
// route's prerendered HTML, collects every /_next/static/chunks/*.js it references
// (script tags AND the preload list inside the flight data), and adds up the file sizes.
//
// Usage:  npm run build && node scripts/first-load-js.mjs /menu
// Cross-check: DevTools -> Network -> JS, "Disable cache", hard reload, read the totals.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const route = process.argv[2] ?? "/menu";
const name = route === "/" ? "index" : route.replace(/^\//, "");
const htmlPath = path.join(".next", "server", "app", `${name}.html`);

if (!fs.existsSync(htmlPath)) {
  console.error(`Cannot find ${htmlPath}. Run "npm run build" first, and use a prerendered route (/menu, /cart, /).`);
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, "utf8");
const refs = new Set();
for (const m of html.matchAll(/static\/chunks\/[^"'\\\s<>]+\.js/g)) {
  try { refs.add(decodeURIComponent(m[0])); } catch { refs.add(m[0]); }
}

let raw = 0;
let gz = 0;
const rows = [];
for (const ref of refs) {
  const file = path.join(".next", ref);
  if (!fs.existsSync(file)) continue;
  const buf = fs.readFileSync(file);
  const g = zlib.gzipSync(buf).length;
  raw += buf.length;
  gz += g;
  rows.push([ref, buf.length, g]);
}

rows.sort((a, b) => b[1] - a[1]);
const kb = (n) => (n / 1024).toFixed(1).padStart(7) + " kB";
console.log(`\nJS referenced by ${route}  (${rows.length} files)\n`);
for (const [ref, r, g] of rows) console.log(`${kb(r)} raw  ${kb(g)} gzip  ${ref}`);
console.log(`\nTOTAL  ${kb(raw)} raw   ${kb(gz)} gzip\n`);
