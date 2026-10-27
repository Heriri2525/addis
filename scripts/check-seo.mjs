// "View source", automated. Day 44 says: verify on the RUNNING page, not by reading your own code.
// Usage: npm run perf   (build + start)   then, in a second terminal:   npm run check:seo
//        npm run check:seo -- https://your-deployed-site.example     (check a deployment)
// It fetches real pages and checks what a crawler or a chat app would actually see.
import fs from "node:fs";

const BASE = (process.argv[2] ?? process.env.BASE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
const PRIVATE = ["/cart", "/checkout", "/orders", "/kitchen", "/signin"];
const dishes = JSON.parse(fs.readFileSync("app/menu/dishes.json", "utf8"));

let failed = 0;
const ok = (cond, label, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}${!cond && detail ? `  -> ${detail}` : ""}`);
  if (!cond) failed++;
};
const warn = (label) => console.log(`WARN  ${label}`);

async function get(path) {
  const res = await fetch(BASE + path, { redirect: "manual" });
  return { res, text: await res.text().catch(() => "") };
}

// ---- tiny HTML readers (no dependencies) ----
const clean = (html) => html.replace(/<!--.*?-->/gs, ""); // React puts <!-- --> between text nodes
const attrs = (tag) => Object.fromEntries([...tag.matchAll(/([a-zA-Z:-]+)="([^"]*)"/g)].map((m) => [m[1], decode(m[2])]));
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const metas = (html) => [...html.matchAll(/<meta\s[^>]*>/g)].map((m) => attrs(m[0]));
const meta = (html, key) => metas(html).find((a) => a.name === key || a.property === key)?.content;
const metaAll = (html, key) => metas(html).filter((a) => a.name === key || a.property === key).map((a) => a.content);
const title = (html) => decode(html.match(/<title>(.*?)<\/title>/s)?.[1] ?? "");
const canonical = (html) => [...html.matchAll(/<link\s[^>]*>/g)].map((m) => attrs(m[0])).find((a) => a.rel === "canonical")?.href;
const h1Count = (html) => (html.match(/<h1[\s>]/g) ?? []).length;
const jsonLd = (html) =>
  [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1].replace(/\\u003c/g, "<")));
const isAbsolute = (u) => /^https?:\/\//.test(u ?? "");

function imageSize(buf) {
  if (buf[0] === 0x89 && buf[1] === 0x50) return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }; // PNG IHDR
  if (buf[0] === 0xff && buf[1] === 0xd8) { // JPEG: walk to a start-of-frame marker
    let i = 2;
    while (i < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const m = buf[i + 1];
      if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }
  return null;
}

async function checkPage(path, { expectTitle, expectCanonical, expectType, price, name }) {
  console.log(`\n${path}`);
  const { res, text } = await get(path);
  ok(res.status === 200, "responds 200", `got ${res.status}`);
  const html = clean(text);

  const t = title(html);
  ok(t === expectTitle, `title is "${expectTitle}"`, `got "${t}"`);
  ok(t.length <= 65, "title is short enough to show (<= 65 chars)", `${t.length} chars`);
  const d = meta(html, "description");
  ok(d && d.length >= 50 && d.length <= 170, "description written for a person (50-170 chars)", `${d?.length ?? 0} chars`);
  ok(canonical(html) === `${origin}${expectCanonical}`, `canonical is ${expectCanonical}`, canonical(html));
  ok(h1Count(html) === 1, "exactly one <h1>", `found ${h1Count(html)}`);

  const og = { title: meta(html, "og:title"), desc: meta(html, "og:description"), url: meta(html, "og:url"), image: meta(html, "og:image") };
  ok(og.title && og.desc && og.url && og.image, "og:title, og:description, og:url and og:image are all present", JSON.stringify(og));
  ok(isAbsolute(og.image) && isAbsolute(og.url), "og:image and og:url are ABSOLUTE URLs", `${og.image} | ${og.url}`);
  ok(meta(html, "og:site_name") === "Addis Eats" && meta(html, "og:locale") === "en_ET", "og:site_name and og:locale survived (openGraph is replaced, not merged)");
  ok(meta(html, "og:image:width") === "1200" && meta(html, "og:image:height") === "630", "og:image is declared 1200 x 630", `${meta(html, "og:image:width")}x${meta(html, "og:image:height")}`);

  if (isAbsolute(og.image)) {
    // fetch the card from THIS server (the URL itself points at the production domain)
    const u = new URL(og.image);
    const img = await fetch(BASE + u.pathname + u.search).catch(() => null);
    const buf = img ? Buffer.from(await img.arrayBuffer()) : Buffer.alloc(0);
    const sz = imageSize(buf);
    ok(img?.ok && (img.headers.get("content-type") ?? "").startsWith("image/"), "the og:image URL really serves an image", `status ${img?.status}`);
    ok(sz && sz.w === 1200 && sz.h === 630, "the image file is 1200 x 630", sz ? `${sz.w}x${sz.h}` : "unreadable");
  }

  const blocks = jsonLd(html);
  if (expectType) ok(blocks.length === 1 && blocks[0]["@type"] === expectType, `one JSON-LD block of type ${expectType}`, blocks.map((b) => b["@type"]).join(","));
  else ok(blocks.length === 0, "carries no JSON-LD (nothing on it needs it)", `found ${blocks.length}`);
  if (price !== undefined && blocks[0]) {
    const ld = blocks[0];
    ok(ld.name === name && html.includes(`<h1>${name}</h1>`), "JSON-LD name matches the <h1>");
    ok(ld.offers?.priceCurrency === "ETB" && Number(ld.offers?.price) === price && html.includes(`${price} ETB`), `JSON-LD price (${price} ETB) matches the price shown on the page`);
  }
  return { html, description: d };
}

console.log(`Checking ${BASE}`);
const home = await get("/");
const origin = new URL(canonical(clean(home.text)) ?? BASE).origin;
console.log(`Site origin used in canonical and og tags: ${origin}`);
if (/localhost|127\.0\.0\.1/.test(origin) && !/localhost|127\.0\.0\.1/.test(BASE)) {
  ok(false, "metadataBase is not a localhost URL on a deployed site", origin);
} else if (/localhost|127\.0\.0\.1/.test(origin)) {
  warn("metadataBase is localhost. Fine here. For a shareable preview set NEXT_PUBLIC_SITE_URL to the real address in .env.production and REBUILD.");
}

await checkPage("/", { expectTitle: "Addis Eats — food delivery in Addis Ababa", expectCanonical: "/", expectType: "Restaurant" });
await checkPage("/menu", { expectTitle: "Menu · Addis Eats", expectCanonical: "/menu" });

// ---- every dish: its own title, its own description ----
const descriptions = new Map();
for (const dish of dishes) {
  const { description } = await checkPage(`/menu/${dish.id}`, {
    expectTitle: `${dish.name} · Addis Eats`, expectCanonical: `/menu/${dish.id}`, expectType: "MenuItem", price: dish.price, name: dish.name,
  });
  descriptions.set(dish.id, description);
}
console.log("\nAcross all dish pages");
ok(new Set(descriptions.values()).size === dishes.length, "every dish page has a DIFFERENT description", `${new Set(descriptions.values()).size} distinct of ${dishes.length}`);

// ---- a dish that does not exist ----
console.log("\n/menu/9999");
{
  const { res, text } = await get("/menu/9999");
  ok(res.status === 404, "unknown dish answers 404", `got ${res.status}`);
  ok(/noindex/.test(text), "and is marked noindex");
}

// ---- sitemap ----
console.log("\n/sitemap.xml");
{
  const { res, text } = await get("/sitemap.xml");
  ok(res.status === 200, "responds 200", `got ${res.status}`);
  const locs = [...text.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  const paths = locs.map((l) => new URL(l).pathname);
  ok(locs.every(isAbsolute), "every <loc> is absolute");
  ok(paths.includes("/") && paths.includes("/menu"), "lists / and /menu");
  ok(dishes.every((d) => paths.includes(`/menu/${d.id}`)), `lists all ${dishes.length} dishes from the data`, `${paths.filter((p) => p.startsWith("/menu/")).length} found`);
  const leaked = paths.filter((p) => PRIVATE.some((r) => p === r || p.startsWith(r + "/")));
  ok(leaked.length === 0, "lists NO private route", leaked.join(", "));
}

// ---- robots ----
console.log("\n/robots.txt");
{
  const { res, text } = await get("/robots.txt");
  ok(res.status === 200, "responds 200", `got ${res.status}`);
  for (const r of PRIVATE) ok(new RegExp(`^Disallow:\\s*${r}\\s*$`, "mi").test(text), `disallows ${r}`);
  ok(/^Sitemap:\s*https?:\/\/\S+\/sitemap\.xml/mi.test(text), "points at the sitemap with an absolute URL");
}

// ---- private pages that render without a session ----
console.log("\nPrivate pages");
for (const p of ["/cart", "/signin"]) {
  const { res, text } = await get(p);
  ok(res.status === 200 && /<meta name="robots" content="noindex/.test(text), `${p} is marked noindex`);
}
for (const p of ["/checkout", "/orders"]) {
  const { res } = await get(p);
  ok(res.status >= 300 && res.status < 400, `${p} redirects when signed out (so there is nothing to index)`, `got ${res.status}`);
}

console.log(failed ? `\n${failed} check(s) FAILED.` : "\nAll checks passed. Now paste a deployed dish link into a preview debugger or a Telegram chat.");
process.exit(failed ? 1 : 0);
