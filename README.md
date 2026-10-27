# Addis Eats — Day 46 (data representation, on top of the week 9 project)

> **Day 46: start with [`DAY46.md`](DAY46.md)** for the commands, the new files and how to demonstrate each state. The rest of this file is the Day 45 README and still applies.


Four days of week 9 in one application: **signed in** (Day 42), **live where it needs to be** (Day 41), **measurably faster** (Day 43) and **findable** (Day 44). Everything from weeks 8 and 9 still works unchanged; Day 45 adds the two live queries, finishes the documents, and gives you the checks to prove each area.

## Run it
```
npm install              # Day 46: installs recharts (added to package.json; the lockfile updates itself)
npm run dev              # http://localhost:3000
npm run perf             # production build + start: the honest way to measure and to check metadata
```
No `.env.local` is needed. `.env.example` lists every variable.

| Phone | Password | Role |
|---|---|---|
| `0911000001` | `Abebe-pass-42` | customer (Abebe) |
| `0911000002` | `Selam-pass-42` | customer (Selam) |
| `0911000003` | `Kitchen-pass-42` | **staff** (Kidist) |

## The six areas of the brief, and where each lives
| Area | Requirement | Where | Proven by |
|---|---|---|---|
| Accounts | Sign in, sign out, a session in a flagged cookie | `lib/session.js`, `app/signin/*` | DevTools → Application → Cookies: `HttpOnly`, `Secure`, `SameSite=Lax` |
| Protection | Middleware, a page check, a check in every action | `proxy.js`, each private `page.js`, `app/actions.js` | The three attacks (`AUTH.md`) and `npm run test:auth` |
| Ownership | Every query scoped to the session, never to a sent id | `listOrdersFor(user.id)` in `lib/orders.js` | Attack 2, and `npm run test:live` |
| Live data | One polled query and one debounced search, both seeded | `app/orders/LiveOrders.jsx`, `app/menu/MenuSearch.jsx` | The Network tab (`DATA.md`) and `npm run test:live` |
| Performance | A measured improvement, documented | `next/image`, `next/font`, `lazyOnload` | `PERF.md`, before and after |
| Discovery | Metadata, previews, sitemap, structured data | `app/layout.js`, `lib/site.js`, `app/sitemap.js`, `app/robots.js` | The deployed page source, `npm run check:seo` |

## What changed from Day 44
| Change | File |
|---|---|
| **Polled order status**: the server renders the list and seeds a client query that refreshes every 5 s while any order is `placed`, then stops | `app/orders/LiveOrders.jsx`, `app/orders/page.js` |
| **Debounced search** (300 ms, 2+ letters, `keepPreviousData`); the server-rendered menu is the seed shown while the box is empty | `app/menu/MenuSearch.jsx`, `app/menu/page.js` |
| `GET /api/dishes?q=` (case-insensitive over name, category and description; max 50 characters; combines with `category`) | `app/api/dishes/route.js`, `searchDishes()` in `app/menu/dishes.js` |
| Fetch wrapper that turns 4xx/5xx into errors with a status, and a retry rule that does not retry a 401 | `lib/fetcher.js` |
| Debounce hook | `lib/use-debounced-value.js` |
| `Cache-Control: no-store` on the two order GET handlers | `app/api/orders/route.js`, `app/api/orders/[id]/route.js` |
| `CancelButton` refreshes the live list straight away (`onDone`) | `app/orders/CancelButton.jsx` |
| New dependency: `swr` | `package.json` |
| Live-data checks against a running app | `scripts/test-live.mjs` (`npm run test:live`) |
| Decision tables, filled | top of `AUTH.md` (who may see what), `DATA.md` (where data is fetched), `PERF.md` (the budget) |
| `AUTH.md` now says `proxy.js` (it said `middleware.js`), lists the polled endpoint, and adds a fourth attack for the new door | `AUTH.md` |
| Walkthrough script, 8 minutes | `WALKTHROUGH.md` |
| Capstone templates (the same six rows, three documents) | `capstone/` |

## Do it in this order (the brief's order, security first)
1. Read the three decision tables (`AUTH.md`, `DATA.md`, `PERF.md`) and change anything you disagree with **before** touching code.
2. `npm install`, `npm run dev`. Sign in, sign out. Check the cookie flags.
3. `npm run test:auth` (the three layers), then the three attacks from `AUTH.md`. Write which line stopped each in the last column.
4. Live data: the Network-tab checks in `DATA.md`, then `npm run test:live`.
5. **Deploy now** (see below), not on Friday afternoon.
6. `npm run perf`, take the BEFORE column of `PERF.md` (instructions inside), then the AFTER.
7. Set `NEXT_PUBLIC_SITE_URL` to your real address, rebuild, then `npm run check:seo -- https://your-site`.
8. Open `WALKTHROUGH.md` and rehearse it once from the deployed URL.

## Deploy (Vercel)
1. Push to GitHub, import the repository in Vercel.
2. In **Project → Settings → Environment Variables** set `NEXT_PUBLIC_SITE_URL` to the production address (for example `https://addis-eats.vercel.app`). It is inlined at **build** time, so redeploy after changing it.
3. Leave `COOKIE_SECURE` unset (the default is `true`; Vercel serves HTTPS).
4. Open the preview URL and run: `npm run test:live -- https://your-site`, `npm run test:auth -- https://your-site`, `npm run check:seo -- https://your-site`.
5. Put the URL at the top of this README.

**Known deployment limit:** sessions and orders live in server memory. On a serverless host each function instance has its own memory, so a sign-in can appear to vanish and the order list can differ between requests. That is a property of the in-memory store, not a bug in the checks; Module 4 moves both to a database. For the presentation, run `npm run perf` locally **and** show the deployed link preview, or deploy to a host that runs one long-lived Node process.

## Verify with tools
```
npm run check:env        # env files hold no secret, .env.example is complete
npm run build && npm run check:secrets   # no hash, password or .env.local value in the browser JavaScript
npm run test:api         # Day 39 contract
npm run test:auth        # cookie flags, three layers, ownership, roles, sign-out, ?next=
npm run test:live        # search endpoint, polled endpoint (scoped, no-store, reflects changes), seeded /orders
npm run check:seo        # view-source checks for /, /menu and every dish; sitemap; robots
npm run measure          # First Load JS for /menu
npm run images           # image weights
```
Each of these takes an optional base URL as its first argument, so the same command checks localhost and the deployment.

## Definition of done (from the brief)
| Not done | Done | Where to show it |
|---|---|---|
| Signed-in pages look right | Three attacks all fail | `AUTH.md`, last column |
| "It feels faster" | A recorded before and after | `PERF.md` |
| A spinner on every arrival | Server data seeds the client query | View source on `/orders` |
| A title on the home page | A distinct description on every route | `npm run check:seo` |
| The link shares as blue text | A card with an image and a price | Paste a dish link into Telegram |
| Works on your laptop | Works on a deployed preview | The URL at the top of this file |

## Things to know
- **I could not run this project where it was written.** The Day 45 code was syntax-checked and its server-side logic (search, ownership, `safeNext`) was tested, but `next build`, the browser behaviour of SWR and Lighthouse need your machine. Run the checks above and treat a FAIL as real.
- **`package-lock.json` does not list `swr` yet.** `npm install` adds it. Commit the updated lock file; do not use `npm ci` until you have.
- **Next.js 16.4 specifics:** `params` and `searchParams` are Promises; the file convention is `proxy.js`, not `middleware.js`; `AGENTS.md` says to read `node_modules/next/dist/docs/` before changing framework code.
- **Photos and preview cards are placeholders.** Replace `app/opengraph-image.jpg` and `app/menu/opengraph-image.jpg` (1200 × 630) and **rename** them: chat apps cache previews for days.
- **Sessions and orders are in memory.** Restarting the server signs everyone out and resets the orders.
- **No rate limiting** on sign-in or search; see "Known limits" in `AUTH.md`.
- **Search covers the whole menu**, ignoring the selected category chip; the chip filters with CSS, the search replaces the list.
- Older notes still apply: `openGraph` replaces rather than merges (`openGraphFor()` repeats `siteName` and `locale`); `/menu/01` and `/menu/1` share the canonical `/menu/1`; `ImageResponse` fails silently, so open `/menu/1/opengraph-image` after any change.

## Endpoints
Errors always look like `{ "error": "..." }`, plus `fieldErrors` for validation.

| Method | Path | Success | Errors |
|---|---|---|---|
| GET | `/api/dishes` | 200 the whole menu | none |
| GET | `/api/dishes?category=X` | 200 one category | 400 unknown category |
| GET | `/api/dishes?q=text` | **200 matches (may be `[]`)** | **400 over 50 characters** |
| GET | `/api/dishes/[id]` | 200 | 400 · 404 |
| POST | `/api/auth/signin` `{ phone, password }` | 200 `{ id, name, role }` + `Set-Cookie` | 400 · 422 · 401 |
| POST | `/api/auth/signout` | 200 `{ ok: true }` | none |
| GET | `/api/orders` | 200 the **signed-in user's** orders (`no-store`; **this is the polled query**) | 401 |
| POST | `/api/orders` | 201 `{ id, total, currency, status }` | 401 · 400 · 422 · 500 |
| GET | `/api/orders/[id]` | 200 the order (`no-store`) | 401 · 404 · 403 |
| DELETE | `/api/orders/[id]` | 200 `{ ok: true }` | 401 · 404 · 403 · 409 |

Server actions: `placeOrder`, `cancelOrder`, `markReady` (staff) in `app/actions.js`; `signIn`, `signOut` in `app/signin/actions.js`.
