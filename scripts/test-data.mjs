// Day 46 checks for DATA REPRESENTATION against a RUNNING app:  npm run dev  (or npm run perf), then in a second terminal:
//   npm run test:data        (optionally: node scripts/test-data.mjs https://your-preview.vercel.app)
// Proves: the dashboard is staff-only; the tables are REAL tables (caption, th scope, aria-sort);
// sorting and paging come from the URL and are validated; the empty state exists.
// It cannot judge a chart: the by-hand checks are printed at the end.
// SIDE EFFECT: it places 6 orders as Selam, so that she has more than one page to click through.
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
      return { status: res.status, text, headers: res.headers };
    },
  };
}
const signIn = (c, phone, password) => c.call("POST", "/api/auth/signin", { phone, password });
const totalsIn = (html) => [...html.matchAll(/class="num">ETB[\s\u00a0]+([\d,]+)</g)].map((m) => Number(m[1].replace(/,/g, "")));

try {
  // ---------------- the dashboard is private, and staff only ----------------
  const anon = client();
  let r = await anon.call("GET", "/dashboard");
  check("GET /dashboard signed out -> redirect to /signin", [307, 308].includes(r.status) && (r.headers.get("location") ?? "").includes("/signin"), `${r.status}`);

  const selam = client();
  await signIn(selam, "0911000002", "Selam-pass-42");
  r = await selam.call("GET", "/dashboard");
  check("GET /dashboard as a customer -> 404, no dashboard content", r.status === 404 && !/Revenue by neighbourhood/.test(r.text), `${r.status}`);

  const kidist = client();
  await signIn(kidist, "0911000003", "Kitchen-pass-42");
  r = await kidist.call("GET", "/dashboard");
  const dash = r.text;
  check("GET /dashboard as staff -> 200", r.status === 200, `${r.status}`);
  check("a chart heading names the range and the unit", /Revenue by neighbourhood, [^<]*\(ETB\)/.test(dash) && /Orders per day, [^<]*\(number of orders\)/.test(dash));
  check("every chart has its numbers in a real table (caption + th scope)", (dash.match(/<caption>/g) ?? []).length >= 2 && /<th[^>]*scope="col"/.test(dash) && /<th[^>]*scope="row"/.test(dash));
  check("all five neighbourhoods appear (empty ones are not dropped)", ["Bole", "Kazanchis", "Piassa", "Megenagna", "CMC"].every((a) => dash.includes(a)));
  check("money is formatted as ETB, not a bare number", /ETB[\s\u00a0]+[\d,]{3,}/.test(dash));
  check("the daily table has 30 rows (no day skipped)", (dash.match(/<th scope="row">\d{1,2} [A-Z][a-z]{2}<\/th>/g) ?? []).length === 30, String((dash.match(/<th scope="row">\d{1,2} [A-Z][a-z]{2}<\/th>/g) ?? []).length));
  check("each chart is exposed as an image with a text summary (role=img + aria-label)", (dash.match(/role="img"/g) ?? []).length >= 2);
  check("the page carries no phone number or user id", !/"phone"|"userId"|0911\d{6}/.test(dash));

  // ---------------- the orders table ----------------
  for (let i = 0; i < 6; i++) {
    await selam.call("POST", "/api/orders", { name: "Selam Test", phone: "0911000002", area: ["Bole", "CMC", "Piassa"][i % 3], items: [{ id: 1 + (i % 4), qty: 1 + (i % 3) }] });
  }
  r = await selam.call("GET", "/orders?sort=total&dir=desc");
  const page1 = r.text;
  check("/orders is a real <table> with a caption and th scope", r.status === 200 && /<table/.test(page1) && /<caption>/.test(page1) && /<th[^>]*scope="col"/.test(page1), `${r.status}`);
  check("the sorted column announces itself: aria-sort=\"descending\"", /aria-sort="descending"/.test(page1));
  const t = totalsIn(page1);
  check("totals really are sorted high to low (server-side sort)", t.length > 1 && t.every((v, i) => i === 0 || t[i - 1] >= v), t.join(","));
  check("page 1 holds at most 5 rows", (page1.match(/data-testid="status-ord_/g) ?? []).length <= 5 && (page1.match(/data-testid="status-ord_/g) ?? []).length > 0);
  check("the pager is made of real links that keep the sort", /href="\/orders\?sort=total&(amp;)?dir=desc&(amp;)?page=2"/.test(page1), "no link to page 2 with the sort kept");
  check("the pager marks the current page (aria-current)", /aria-current="page"/.test(page1));

  r = await selam.call("GET", "/orders?sort=total&dir=desc&page=2");
  check("page 2 is reachable by URL and shows different rows", r.status === 200 && r.text.includes('aria-current="page"') && !totalsIn(r.text).every((v, i) => v === t[i]), `${r.status}`);

  r = await selam.call("GET", "/orders?sort=total&dir=asc&page=999");
  check("?page=999 redirects to the last real page (not an empty screen)", [307, 308].includes(r.status) && /page=\d+/.test(r.headers.get("location") ?? ""), `${r.status} ${r.headers.get("location")}`);

  r = await selam.call("GET", "/orders?sort=password&dir=sideways&page=abc");
  check("a hostile sort / dir / page falls back to the default instead of failing", r.status === 200 && /aria-sort="descending"/.test(r.text), `${r.status}`);
  check("/orders shows only Selam's orders and no phone or user id", !r.text.includes("ord_1001") && !/"phone"|"userId"|0911\d{6}/.test(r.text));

  // ---------------- the empty state ----------------
  r = await kidist.call("GET", "/orders");
  check("a brand-new customer (Kidist has no orders) sees the empty state with a next step", r.status === 200 && /No orders yet/.test(r.text) && /href="\/menu"/.test(r.text) && !/<table/.test(r.text), `${r.status}`);

  // ---------------- the forced states (development only) ----------------
  r = await selam.call("GET", "/orders?demo=empty");
  if (/No orders yet/.test(r.text)) {
    check("?demo=empty forces the empty state (development)", true);
    r = await selam.call("GET", "/orders?demo=error");
    check("?demo=error forces the error state (development)", r.status >= 500 || /couldn’t load|couldn&#x27;t load|could not load/.test(r.text), `${r.status}`);
  } else {
    console.log("SKIP  ?demo=... switches are off in a production build (on purpose). Use npm run dev to demonstrate the states.");
  }

  console.log(`
By hand, in the browser (a script cannot judge these):
  1. Sign in as Kidist (0911000003 / Kitchen-pass-42), open /dashboard. Does every bar start at the 0 line?
     Can you still tell the bars apart and read their values if you set the page to grayscale?
  2. DevTools -> Network -> reload /dashboard. Chart code arrives as its own JavaScript chunk;
     the table and headings are already in the HTML (View source).
  3. Shrink the window to phone width. The chart shrinks with it; the table scrolls sideways inside its own box.
  4. Sign in as Selam, /orders: click "Total" twice, go to page 2, press Back. The URL, not memory, remembers.
  5. /orders?demo=slow shows the skeleton (5 rows). /orders?demo=error shows the error with "Try again". (npm run dev only)
  6. Turn on a screen reader (or VoiceOver / NVDA): the table is read as a table, with "sorted descending" announced.`);
} catch (err) {
  console.error("\nCould not finish. Is the app running at " + BASE + "?\n", err);
  failed++;
}

console.log(failed === 0 ? "\nAll data-representation checks passed." : `\n${failed} check(s) failed.`);
process.exit(failed === 0 ? 0 : 1);
