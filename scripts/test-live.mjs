// Day 45 checks for LIVE DATA against a RUNNING app:  npm run perf  (or npm run dev), then in a second terminal:
//   npm run test:live        (optionally: node scripts/test-live.mjs https://your-preview.vercel.app)
// Proves: the search endpoint, that the polled endpoint is scoped and uncached, that a status change
// shows up in it, and that /orders arrives with data already in the HTML (the "seed").
// It cannot count requests per keystroke: that is a browser check, printed at the end.
const BASE = process.argv[2] ?? process.env.BASE_URL ?? "http://localhost:3000";
let failed = 0;
function check(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `   -> ${detail}`}`);
  if (!ok) failed++;
}

function client() {
  let cookie = "";
  return {
    async call(method, path, body) {
      const headers = {};
      if (cookie) headers.Cookie = cookie;
      if (body !== undefined) headers["Content-Type"] = "application/json";
      const res = await fetch(BASE + path, { method, headers, redirect: "manual", body: body === undefined ? undefined : JSON.stringify(body) });
      const fresh = (res.headers.getSetCookie?.() ?? []).find((c) => c.startsWith("session="));
      if (fresh) cookie = fresh.split(";")[0];
      const text = await res.text();
      let json = null;
      try { json = JSON.parse(text); } catch {}
      return { status: res.status, json, text, headers: res.headers };
    },
  };
}

try {
  const anon = client();

  // ---------------- search (public) ----------------
  let r = await anon.call("GET", "/api/dishes?q=kitfo");
  check("GET /api/dishes?q=kitfo -> 200 and Kitfo is in it", r.status === 200 && r.json?.some((d) => d.name === "Kitfo"), `${r.status} ${r.text.slice(0, 80)}`);
  r = await anon.call("GET", "/api/dishes?q=zzzzzz");
  check("a search with no match -> 200 and []", r.status === 200 && Array.isArray(r.json) && r.json.length === 0, `${r.status}`);
  r = await anon.call("GET", "/api/dishes?q=" + "a".repeat(51));
  check("a 51-character search -> 400 with { error }", r.status === 400 && typeof r.json?.error === "string", `${r.status}`);
  r = await anon.call("GET", "/api/dishes?category=Vegetarian&q=shiro");
  check("q and category combine", r.status === 200 && r.json.length > 0 && r.json.every((d) => d.category === "Vegetarian"), `${r.status} ${r.text.slice(0, 80)}`);

  // ---------------- the polled endpoint, signed out ----------------
  r = await anon.call("GET", "/api/orders");
  check("polled endpoint signed out -> 401, not data and not a crash", r.status === 401 && typeof r.json?.error === "string", `${r.status}`);

  // ---------------- the polled endpoint, signed in ----------------
  const selam = client();
  await selam.call("POST", "/api/auth/signin", { phone: "0911000002", password: "Selam-pass-42" });
  r = await selam.call("GET", "/api/orders");
  check("signed in: 200 and only Selam's orders", r.status === 200 && r.json.length > 0 && r.json.every((o) => o.owner === "Selam"), `${r.status} ${r.text.slice(0, 100)}`);
  check("polled answer is Cache-Control: no-store", /no-store/i.test(r.headers.get("cache-control") ?? ""), r.headers.get("cache-control"));
  check("polled answer carries no phone number or user id", !/"phone"|"userId"/.test(r.text), r.text.slice(0, 120));

  // ---------------- a status change appears in the next poll ----------------
  r = await selam.call("POST", "/api/orders", { name: "Selam Test", phone: "0911000002", area: "Bole", items: [{ id: 1, qty: 1 }] });
  check("placed a test order -> 201", r.status === 201 && /^ord_/.test(r.json?.id ?? ""), `${r.status} ${r.text.slice(0, 80)}`);
  const id = r.json?.id;
  r = await selam.call("GET", "/api/orders");
  check("next poll shows it as `placed`", r.json?.find((o) => o.id === id)?.status === "placed", r.text.slice(0, 120));
  await selam.call("DELETE", `/api/orders/${id}`);
  r = await selam.call("GET", "/api/orders");
  check("after cancelling, the next poll shows `cancelled`", r.json?.find((o) => o.id === id)?.status === "cancelled", r.text.slice(0, 120));

  // ---------------- the seed: data is already in the HTML ----------------
  r = await selam.call("GET", "/orders?sort=id&dir=asc"); // Day 46: oldest first, so the seeded orders are on page 1
  check("/orders HTML already contains Selam's orders (seeded, no spinner)", r.status === 200 && r.text.includes("ord_1002") && r.text.includes("ord_1004"), `${r.status}`);
  check("/orders HTML does not contain Abebe's order", !r.text.includes("ord_1001") && !r.text.includes("ord_1003"), "another account's order leaked into the page");

  // the browser-only part
  console.log(`
By hand, in the browser (these cannot be checked from a script):
  1. /menu, DevTools -> Network -> Fetch/XHR. Type "kitfo" at normal speed, stop.
     Expect ONE request to /api/dishes?q=kitfo, about 300 ms after the last letter. Not five.
  2. Sign in as Selam, open /orders, Network tab. Expect a request to /api/orders about every 5 s.
     Sign in as Kidist in a private window, press "Mark ready" on ord_1002: Selam's screen changes to "ready"
     within one tick, and the requests stop.
  3. Hard-reload /orders. Expect the list on first paint (View source shows the orders) and no spinner.`);
} catch (err) {
  console.error("\nCould not finish. Is the app running at " + BASE + "?\n", err);
  failed++;
}

console.log(failed === 0 ? "\nAll live-data checks passed." : `\n${failed} check(s) failed.`);
process.exit(failed === 0 ? 0 : 1);
