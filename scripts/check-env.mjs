// The "before you deploy" checklist from Day 43, as a command.  Usage: npm run check:env
//   1. .env*.local is gitignored
//   2. no NEXT_PUBLIC_ variable has a secret-sounding name (it would be readable by anyone)
//   3. committed env files (.env, .env.development, .env.production, .env.example) hold no secret
//   4. .env.example lists every variable the code reads or the env files define
import fs from "node:fs";
import path from "node:path";

const problems = [];
const SECRETISH = /(SECRET|PASSWORD|PASSWD|PRIVATE|TOKEN|CREDENTIAL|DATABASE_URL)/i;
const COMMITTED = [".env", ".env.development", ".env.production", ".env.example"];
const IGNORED_BY_CODE_SCAN = new Set(["NODE_ENV", "NEXT_RUNTIME", "BASE_URL", "API_ONLY"]);

const read = (f) => (fs.existsSync(f) ? fs.readFileSync(f, "utf8") : null);

// parse KEY=value lines; `commented` also returns "# KEY=value" lines (documentation)
function parse(text, commented = false) {
  const out = [];
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(commented ? /^\s*#?\s*([A-Z][A-Z0-9_]*)=(.*)$/ : /^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) out.push([m[1], m[2].trim().replace(/^["']|["']$/g, "")]);
  }
  return out;
}

// 1. gitignore
const ignore = read(".gitignore") ?? "";
if (!ignore.split(/\r?\n/).some((l) => l.trim() === ".env*.local" || l.trim() === ".env.local")) {
  problems.push(".gitignore does not contain `.env*.local`.");
}

// 2 + 3. the committed files
const defined = new Set();
for (const file of COMMITTED) {
  const text = read(file);
  if (text === null) { problems.push(`${file} is missing.`); continue; }
  for (const [name, value] of parse(text)) {
    defined.add(name);
    if (name.startsWith("NEXT_PUBLIC_") && SECRETISH.test(name)) {
      problems.push(`${file}: ${name} is NEXT_PUBLIC_ but sounds secret. It would be readable by anyone.`);
    }
    if (file !== ".env.example" && !name.startsWith("NEXT_PUBLIC_") && SECRETISH.test(name) && value) {
      problems.push(`${file}: ${name} has a value in a COMMITTED file. Move it to .env.local or the platform settings.`);
    }
  }
}

// 4. .env.example must list everything
const listed = new Set(parse(read(".env.example") ?? "", true).map(([n]) => n));
function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === ".next") continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else if (/\.(js|jsx|mjs)$/.test(e.name) && !full.startsWith("scripts")) yield full;
  }
}
const used = new Set();
for (const dir of ["app", "lib"]) for (const f of walk(dir)) {
  for (const m of fs.readFileSync(f, "utf8").matchAll(/process\.env\.([A-Z][A-Z0-9_]*)/g)) used.add(m[1]);
}
for (const f of ["proxy.js", "middleware.js", "instrumentation.js", "next.config.mjs"]) {
  for (const m of (read(f) ?? "").matchAll(/process\.env\.([A-Z][A-Z0-9_]*)/g)) used.add(m[1]);
}
for (const name of [...used, ...defined]) {
  if (IGNORED_BY_CODE_SCAN.has(name)) continue;
  if (!listed.has(name)) problems.push(`.env.example does not list ${name}.`);
}

if (problems.length) {
  console.error("PROBLEMS:\n- " + problems.join("\n- "));
  process.exit(1);
}
console.log(`OK: .env*.local is gitignored; ${defined.size} variable(s) in committed files, none secret; .env.example lists all ${new Set([...used].filter((n) => !IGNORED_BY_CODE_SCAN.has(n))).size} the code reads.`);
