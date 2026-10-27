// Contract test for the Day 39 endpoints (Day 42: signs in as Abebe first, because orders need a session). Start the app first (npm run dev, or build + start),
// then in a second terminal:  npm run test:api   (optionally: node scripts/test-api.mjs http://localhost:3001)
const BASE = process.argv[2] ?? process.env.BASE_URL ?? "http://localhost:3000";
let failed = 0;

function check(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `   -> ${detail}`}`);
  if (!ok) failed++;
}

// Day 42: orders need a session, so this script signs in over the API first and keeps the cookie.
let cookie = "";

async function call(method, path, body, rawBody) {
  const init = { method, headers: {} };
  if (cookie) init.headers.Cookie = cookie;
  if (rawBody !== undefined) {
    init.body = rawBody;
    init.headers["Content-Type"] = "application/json";
  } else if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers["Content-Type"] = "application/json";
  }
  const res = await fetch(BASE + path, init);
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const fresh = setCookie.find((c) => c.startsWith("session="));
  if (fresh) cookie = fresh.split(";")[0]; // "session=<token>"
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, text };
}

const hasErrorShape = (r) => r.json && typeof r.json.error === "string";
const valid = { name: "Test Student", phone: "0911223344", area: "Bole", items: [{ id: 1, qty: 2 }] };

try {
  let r = await call("GET", "/api/dishes");
  check("GET /api/dishes -> 200 with a list of dishes",
    r.status === 200 && Array.isArray(r.json) && r.json.length > 0 && "price" in r.json[0], `${r.status} ${r.text.slice(0, 80)}`);

  r = await call("GET", "/api/dishes?category=Vegetarian");
  check("GET /api/dishes?category=Vegetarian -> only vegetarian dishes",
    r.status === 200 && r.json.length > 0 && r.json.every((d) => d.category === "Vegetarian"), `${r.status}`);

  r = await call("GET", "/api/dishes?category=Pizza");
  check("GET /api/dishes?category=Pizza -> 400 with { error }", r.status === 400 && hasErrorShape(r), `${r.status} ${r.text.slice(0, 80)}`);

  r = await call("GET", "/api/dishes/1");
  check("GET /api/dishes/1 -> 200 with that dish", r.status === 200 && r.json?.id === 1, `${r.status}`);

  r = await call("GET", "/api/dishes/999");
  check("GET /api/dishes/999 -> 404 with { error } (not an empty 200)", r.status === 404 && hasErrorShape(r), `${r.status} ${r.text.slice(0, 80)}`);

  r = await call("GET", "/api/dishes/abc");
  check("GET /api/dishes/abc -> 400 with { error }", r.status === 400 && hasErrorShape(r), `${r.status}`);

  r = await call("POST", "/api/orders", valid);
  check("POST /api/orders while signed out -> 401 with { error } (before any validation)", r.status === 401 && hasErrorShape(r), `${r.status} ${r.text.slice(0, 80)}`);

  r = await call("POST", "/api/auth/signin", { phone: "0911000001", password: "Abebe-pass-42" });
  check("POST /api/auth/signin as Abebe -> 200", r.status === 200 && r.json?.id === "abebe" && cookie.startsWith("session="), `${r.status} ${r.text.slice(0, 80)}`);

  r = await call("POST", "/api/orders", { ...valid, phone: "12345" });
  check("POST invalid phone -> 422 with fieldErrors.phone",
    r.status === 422 && hasErrorShape(r) && Array.isArray(r.json.fieldErrors?.phone), `${r.status} ${r.text.slice(0, 120)}`);

  r = await call("POST", "/api/orders", { ...valid, area: "Mars" });
  check("POST unknown area -> 422 with fieldErrors.area", r.status === 422 && Array.isArray(r.json?.fieldErrors?.area), `${r.status}`);

  r = await call("POST", "/api/orders", { ...valid, items: [] });
  check("POST empty cart -> 422 with fieldErrors.items", r.status === 422 && Array.isArray(r.json?.fieldErrors?.items), `${r.status}`);

  r = await call("POST", "/api/orders", { ...valid, items: [{ id: 999, qty: 1 }] });
  check("POST unknown dish id -> 422 with fieldErrors.items", r.status === 422 && Array.isArray(r.json?.fieldErrors?.items), `${r.status}`);

  r = await call("POST", "/api/orders", undefined, "{ not json");
  check("POST malformed JSON -> 400 with { error }", r.status === 400 && hasErrorShape(r), `${r.status}`);

  r = await call("POST", "/api/orders", { ...valid, price: 1, total: 1 });
  check("POST valid order -> 201 with { id, total, currency }",
    r.status === 201 && typeof r.json?.id === "string" && r.json.currency === "ETB", `${r.status} ${r.text.slice(0, 120)}`);
  check("   the server priced it (2 x 320 = 640), ignoring the price the client sent", r.json?.total === 640, `total was ${r.json?.total}`);
} catch (err) {
  console.error(`\nCould not reach ${BASE}. Is the app running? (${err.cause?.code ?? err.message})`);
  process.exit(1);
}

console.log(failed === 0 ? "\nAll checks passed." : `\n${failed} check(s) failed.`);
process.exit(failed === 0 ? 0 : 1);
