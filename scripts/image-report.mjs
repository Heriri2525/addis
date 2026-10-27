// Lists every image under public/ with its size, biggest first, and flags the heavy ones.
// "Getting images right at the source" (Day 43): next/image cannot make a bad original small.
// Usage: npm run images
import fs from "node:fs";
import path from "node:path";

const LIMIT_KB = 500; // a source photograph over this is probably a camera original
const rows = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (/\.(jpe?g|png|webp|avif|gif|svg)$/i.test(e.name)) rows.push([full, fs.statSync(full).size]);
  }
})("public");

rows.sort((a, b) => b[1] - a[1]);
console.log("");
for (const [file, size] of rows) {
  const kb = size / 1024;
  const flag = kb > LIMIT_KB ? "  <- resize or re-export" : "";
  const note = /\.png$/i.test(file) && kb > 100 ? "  <- PNG for a photograph? use JPEG/WebP" : "";
  console.log(`${kb.toFixed(0).padStart(6)} kB  ${file}${flag}${note}`);
}
console.log(`\nTOTAL ${(rows.reduce((s, r) => s + r[1], 0) / 1024 / 1024).toFixed(2)} MB across ${rows.length} files\n`);
