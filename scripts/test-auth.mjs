// Day 42 checks against a RUNNING app:  npm run dev  (or build + start), then in a second terminal:
//   npm run test:auth        (optionally: node scripts/test-auth.mjs http://localhost:3001)
// Covers: cookie flags, the three layers, ownership, roles, server-side sign-out, and ?next= handling.
// It cannot press the browser buttons for you: the three attacks against the server ACTIONS are
// in AUTH.md. These are the same checks aimed at the route handlers and pages.
const BASE = process.argv[2] ?? process.env.BASE_URL ?? "http://localhost:3000";
const API_ONLY = process.env.API_ONLY === "1"; // skips the page-level checks (used by my own harness)
let failed = 0;

function check(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `   -> ${detail}`}`);
  if (!ok) failed++;
}

// A tiny client that keeps one cookie, like a browser tab.
function client() {
  let cookie = "";
  return {
    get cookie() { return cookie; },
    set cookie(v) { cookie = v; },
    async call(method, path, body, opts = {}) {
      const headers = {};
      if (cookie) headers.Cookie = cookie;
      if (body !== undefined) headers["Content-Type"] = "application/json";
      const res = await fetch(BASE + path, {
        method, headers, redirect: "manual",
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const setCookies = res.headers.getSetCookie?.() ?? [];
      const fresh = setCookies.find((c) => c.startsWith("session="));
      if (fresh) cookie = fresh.split(";")[0];
      const text = await res.text();
      let json = null;
      try { json = JSON.parse(text); } catch {}
      return { status: res.status, json, text, headers: res.headers, setCookies, fresh };
    },
  };
}

const isError = (r, message) => typeof r.json?.error === "string" && (!message || r.json.error === message);
const signIn = (c, phone, password) => c.call("POST", "/api/auth/signin", { phone, password });
const ACCOUNTS = {
  abebe: ["0911000001", "Abebe-pass-42"],
  selam: ["0911000002", "Selam-pass-42"],
  kidist: ["0911000003", "Kitchen-pass-42"],
};

try {
  const anon = client();

  // ---------------- signed out ----------------
  let r = await anon.call("POST", "/api/auth/signin", { phone: "0911000001", password: "wrong" });
  const wrongPw = r;
  check("wrong password -> 401 { error }", r.status === 401 && isError(r), `${r.status} ${r.text.slice(0, 80)}`);
  r = await anon.call("POST", "/api/auth/signin", { phone: "0900000000", password: "whatever" });
  check("unknown phone gets the SAME 401 message (no account enumeration)", r.status === 401 && r.json?.error === wrongPw.json?.error, `${r.status} ${r.text.slice(0, 80)}`);
  r = await anon.call("POST", "/api/auth/signin", { phone: "0911000001" });
  check("missing password -> 422 with fieldErrors.password", r.status === 422 && Array.isArray(r.json?.fieldErrors?.password), `${r.status}`);

  r = await anon.call("GET", "/api/orders");
  check("GET /api/orders signed out -> 401", r.status === 401 && isError(r, "Not signed in"), `${r.status}`);
  r = await anon.call("POST", "/api/orders", { name: "X Y", phone: "0911223344", area: "Bole", items: [{ id: 1, qty: 1 }] });
  check("POST /api/orders signed out -> 401", r.status === 401 && isError(r, "Not signed in"), `${r.status}`);
  r = await anon.call("GET", "/api/orders/ord_1001");
  check("GET /api/orders/ord_1001 signed out -> 401", r.status === 401, `${r.status}`);
  r = await anon.call("DELETE", "/api/orders/ord_1001");
  check("DELETE /api/orders/ord_1001 signed out -> 401 (attack 1, handler version)", r.status === 401 && isError(r, "Not signed in"), `${r.status}`);

  const forged = client();
  forged.cookie = "session=" + "A".repeat(43); // right shape, never issued
  r = await forged.call("GET", "/api/orders");
  check("a made-up cookie of the right shape gets past middleware's shape check but is still 401 here", r.status === 401, `${r.status}`);

  // ---------------- Selam: cookie flags, scoping ----------------
  const selam = client();
  r = await signIn(selam, ...ACCOUNTS.selam);
  check("sign in as Selam -> 200 { id, name, role }", r.status === 200 && r.json?.id === "selam" && r.json?.role === "customer", `${r.status} ${r.text.slice(0, 80)}`);
  const header = r.fresh ?? "";
  check("cookie is HttpOnly", /;\s*HttpOnly/i.test(header), header);
  check("cookie is Secure", /;\s*Secure/i.test(header), header + "   (is COOKIE_SECURE=false set?)");
  check("cookie is SameSite=Lax", /;\s*SameSite=Lax/i.test(header), header);
  check("cookie has a Max-Age", /;\s*Max-Age=\d+/i.test(header), header);
  check("cookie value is an opaque random id (not a user id or a JSON claim)", /^session=[A-Za-z0-9_-]{43}$/.test(selam.cookie), selam.cookie);

  r = await selam.call("GET", "/api/orders");
  const mine = Array.isArray(r.json) ? r.json.map((o) => o.id) : [];
  check("GET /api/orders returns ONLY Selam's orders", r.status === 200 && mine.length > 0 && r.json.every((o) => o.owner === "Selam") && !mine.includes("ord_1001"), JSON.stringify(mine));

  r = await selam.call("GET", "/api/orders/ord_1001");
  check("GET /api/orders/ord_1001 (Abebe's) as Selam -> 403 Not yours", r.status === 403 && isError(r, "Not yours"), `${r.status} ${r.text.slice(0, 80)}`);
  r = await selam.call("DELETE", "/api/orders/ord_1001");
  check("DELETE /api/orders/ord_1001 (Abebe's) as Selam -> 403 Not yours (attack 2, handler version)", r.status === 403 && isError(r, "Not yours"), `${r.status} ${r.text.slice(0, 80)}`);
  r = await selam.call("DELETE", "/api/orders/ord_9999");
  check("DELETE an order that does not exist -> 404", r.status === 404 && isError(r), `${r.status}`);

  r = await selam.call("POST", "/api/orders", { name: "Selam T", phone: "0911000002", area: "Bole", items: [{ id: 2, qty: 1 }], userId: "abebe" });
  const newId = r.json?.id;
  check("POST /api/orders as Selam -> 201", r.status === 201 && typeof newId === "string", `${r.status} ${r.text.slice(0, 100)}`);
  r = await selam.call("GET", `/api/orders/${newId}`);
  check("the order belongs to Selam even though the body claimed userId: abebe", r.status === 200 && r.json?.owner === "Selam", `${r.status} ${r.text.slice(0, 100)}`);

  // ---------------- Abebe: untouched ----------------
  const abebe = client();
  await signIn(abebe, ...ACCOUNTS.abebe);
  r = await abebe.call("GET", "/api/orders/ord_1001");
  check("Abebe's order ord_1001 is still 'placed' after the attacks", r.status === 200 && r.json?.status === "placed", `${r.status} ${r.text.slice(0, 80)}`);
  r = await abebe.call("GET", "/api/orders");
  check("Abebe's list does not contain Selam's new order", r.status === 200 && !r.json.some((o) => o.id === newId), JSON.stringify(r.json?.map?.((o) => o.id)));

  // ---------------- cancel own order, then conflict ----------------
  r = await selam.call("DELETE", `/api/orders/${newId}`);
  check("Selam can cancel her own order -> 200", r.status === 200 && r.json?.ok === true, `${r.status} ${r.text.slice(0, 80)}`);
  r = await selam.call("DELETE", `/api/orders/${newId}`);
  check("cancelling it again -> 409", r.status === 409 && isError(r), `${r.status}`);

  // ---------------- sign-out really invalidates ----------------
  const stolen = selam.cookie;
  r = await selam.call("POST", "/api/auth/signout");
  check("sign out -> 200", r.status === 200, `${r.status}`);
  const thief = client();
  thief.cookie = stolen;
  r = await thief.call("GET", "/api/orders");
  check("replaying Selam's OLD cookie after sign-out -> 401 (the session is invalid on the server)", r.status === 401, `${r.status}`);

  // ---------------- pages (need the real Next.js app) ----------------
  if (!API_ONLY) {
    for (const path of ["/orders", "/checkout"]) {
      r = await anon.call("GET", path);
      const loc = r.headers.get("location") ?? "";
      check(`GET ${path} signed out -> redirect to /signin?next=${path}`, [307, 308].includes(r.status) && loc.includes("/signin") && decodeURIComponent(loc).includes(`next=${path}`), `${r.status} ${loc}`);
      check(`   ...and it was MIDDLEWARE that redirected (x-auth-layer header)`, r.headers.get("x-auth-layer") === "middleware", `header was ${r.headers.get("x-auth-layer")}. If Next.js asked you to rename the file, use: git mv middleware.js proxy.js`);
    }
    r = await anon.call("GET", "/menu");
    check("GET /menu stays public (not matched by the middleware)", r.status === 200 && r.headers.get("x-auth-layer") === null, `${r.status}`);
    r = await anon.call("GET", "/kitchen");
    check("GET /kitchen signed out -> redirected (by the PAGE, since middleware does not cover it)", [307, 308].includes(r.status) && (r.headers.get("location") ?? "").includes("/signin"), `${r.status}`);

    const sel2 = client(); await signIn(sel2, ...ACCOUNTS.selam);
    r = await sel2.call("GET", "/kitchen");
    check("GET /kitchen as a customer -> 404, no kitchen content", r.status === 404 && !/Mark ready/.test(r.text), `${r.status}`);
    r = await sel2.call("GET", "/orders?sort=id&dir=asc"); // Day 46: the table is paged; oldest first keeps the seeded order on page 1
    check("GET /orders as Selam -> 200 and only her orders in the HTML", r.status === 200 && r.text.includes("ord_1002") && !r.text.includes("ord_1001"), `${r.status}`);

    const kid = client(); await signIn(kid, ...ACCOUNTS.kidist);
    r = await kid.call("GET", "/kitchen");
    check("GET /kitchen as staff -> 200 with everyone's orders", r.status === 200 && r.text.includes("ord_1001") && r.text.includes("ord_1002"), `${r.status}`);

    const nextValue = async (q) => {
      const page = await anon.call("GET", `/signin?next=${encodeURIComponent(q)}`);
      const m = page.text.match(/name="next"[^>]*value="([^"]*)"|value="([^"]*)"[^>]*name="next"/);
      return m ? (m[1] ?? m[2]).replaceAll("&amp;", "&") : null;
    };
    check("crafted next=https://evil.example is replaced by /", (await nextValue("https://evil.example/x")) === "/", String(await nextValue("https://evil.example/x")));
    check("crafted next=//evil.example is replaced by /", (await nextValue("//evil.example")) === "/", String(await nextValue("//evil.example")));
    check("crafted next=/\\evil.example is replaced by /", (await nextValue("/\\evil.example")) === "/", String(await nextValue("/\\evil.example")));
    check("honest next=/orders is kept", (await nextValue("/orders")) === "/orders", String(await nextValue("/orders")));
  }
} catch (err) {
  console.error(`\nCould not reach ${BASE}. Is the app running? (${err.cause?.code ?? err.message})`);
  process.exit(1);
}

console.log(failed === 0 ? "\nAll checks passed." : `\n${failed} check(s) failed.`);
process.exit(failed === 0 ? 0 : 1);
