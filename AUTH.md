# AUTH.md — Addis Eats (Day 42, finished on Day 45)

## Decision one (Day 45): who may see what, and what each layer PROVES
Written before the code, as the brief asks. The last column is the one that matters: "protected by middleware" is not an answer, because middleware only proves a cookie of the right shape exists.

| Route | Who | Protected by | What that proves |
|---|---|---|---|
| `/menu`, `/menu/[id]` | Everyone | Nothing | It is public, and stays indexable (sitemap, canonical, JSON-LD). |
| `/orders` | The owner | `proxy.js` + page `getSession()` + `listOrdersFor(user.id)` | Signed in, and the list can only hold their own records. |
| `GET /api/orders` (**the polled query**) | The owner | `getSession()` in the handler, then `listOrdersFor(user.id)` | Same as the page. Not in the proxy matcher, so the handler is the only layer, and it is enough. No id in the URL. |
| `/checkout` | Any signed-in user | `proxy.js` + page `getSession()` | Signed in. The write (`placeOrder`) checks the rest. |
| `/kitchen` | Staff only | page `getSession()` + `role === "staff"` (404 otherwise) + `markReady` re-checks the role | Signed in and permitted, from the session record, not the browser. |
| `/api/dishes?q=` (**the search**) | Everyone | Input validation only (50 characters, known category) | Public data; the only risk is a hostile query string, so it is length-limited and never reaches a query language. |

## The design in five lines
- **Session:** a *database-style* session. The cookie holds a random 256-bit id and nothing else; the server holds who it belongs to and when it expires (`lib/session.js`). Signing out deletes it on the server, so a copied cookie stops working at once.
- **Passwords:** never stored. Only a salted `scrypt` hash is kept (`lib/password.js`), compared in constant time. An unknown phone number costs the same time as a wrong password and gets the same message.
- **Cookie:** `session`, with `httpOnly`, `secure`, `sameSite=lax`, `path=/` and a 7-day `maxAge`.
- **One helper:** `getSession()` returns `{ id, name, role }` or `null`, and is the only way pages, actions and route handlers learn who is asking.
- **No signing secret exists in this design** (the id is random, not signed), so there is nothing like `SESSION_SECRET` to leak. `npm run check:secrets` instead proves that no password hash, no demo password and no `.env.local` value appears in the browser's JavaScript.

## The six steps, in this code
| # | Step | Where |
|---|---|---|
| 1 | The person posts phone and password | `app/signin/SignInForm.jsx` → `signIn` in `app/signin/actions.js` (or `POST /api/auth/signin`) |
| 2 | The server checks them against the stored hash | `authenticate()` in `lib/users.js` → `verifyPassword()` in `lib/password.js` |
| 3 | The server creates a session and sets the cookie | `startSession()` in `lib/session.js` (also replaces any old id: no session fixation) |
| 4 | The browser sends the cookie with every request | automatic: `httpOnly` cookies are attached by the browser |
| 5 | The server reads the cookie and knows who is asking | `getSession()` in `lib/session.js` |
| 6 | Signing out clears the cookie and invalidates the session | `endSession()` via `signOut` / `POST /api/auth/signout` |

## Protected routes and what each layer proves
| Route / action | Layer 1: middleware | Layer 2: page | Layer 3: write | What the strongest layer proves |
|---|---|---|---|---|
| `/menu`, `/menu/[id]` | none | none | none | Public on purpose. |
| `/checkout` | `proxy.js` | `getSession()` → redirect | `placeOrder` | A real session exists, and the order is saved for *that* user. |
| `/orders` | `proxy.js` | `getSession()` → redirect, then `listOrdersFor(user.id)` | `cancelOrder` | The list can only contain the session's own orders. |
| `/kitchen` | (not matched) | `getSession()` → redirect; `role !== "staff"` → 404 | `markReady` | The caller is staff, from the session record, not from the browser. |
| `placeOrder` action | n/a | n/a | `getSession()` first | Authentication. The owner is `user.id`, never a field of the form. |
| `cancelOrder` action | n/a | n/a | `cancelOrderFor()` in `lib/orders.js` | Authentication **and** authorisation: 401 → 404 → 403. |
| `markReady` action | n/a | n/a | `user.role !== "staff"` | Role, checked where the effect happens. |
| `POST /api/orders`, `GET /api/orders` | n/a | n/a | `getSession()` first, then validation | 401 before the body is even read. |
| `GET /api/orders` (polled every 5 s by `app/orders/LiveOrders.jsx`) | n/a | n/a | `getSession()` first, `listOrdersFor(user.id)` | 401 when signed out (the screen says "sign in again" and stops retrying); never an id from the request. Sent `Cache-Control: no-store`. |
| `GET` / `DELETE /api/orders/[id]` | n/a | n/a | `orderForUser()` / `cancelOrderFor()` | Same 401 → 404 → 403 rules as the action. |

What each layer actually proves:
- **Middleware** proves only that a cookie *of the right shape* exists. Anyone can type one. It saves the work of rendering a page nobody may see, nothing more. It is deliberately tiny: no database, no Node APIs.
- **The page** proves the session is real (it exists on the server and has not expired), so the screen matches the person.
- **The action or handler** is the real security: it cannot be skipped by anyone who calls it directly.

The matcher is `["/checkout/:path*", "/orders/:path*"]` (file `proxy.js`; it was `middleware.js` until Next.js 16.4). It does **not** run on `/menu`, images, `_next/static`, the API, or `/kitchen` (which the page and action guard on their own).

## The three attacks
Run each one, then write what you saw in the last column. Automated versions of the same checks against the route handlers: `npm run test:auth`.

| # | Attack | How | Expected | Line that stops it | My result |
|---|---|---|---|---|---|
| 1 | Call an action while **signed out** | Sign in as Selam, open `/orders`, press F12 → Network, press **Cancel** on `ord_1004`. Right-click the new `orders` request (it has a `Next-Action` header) → Copy → *Copy as fetch*. Sign out. On `/signin`, paste it into the Console and add `.then(r => r.text()).then(console.log)`. | The response text contains `"error":"Not signed in"`. | `lib/orders.js` → `orderForUser`: `if (!user) return { status: 401, error: "Not signed in" };` | |
| 2 | Call an action with **another account's order id** | Sign in as Selam again, capture a request the same way (Cancel `ord_1002`). In the copied fetch, change the body `["ord_1002"]` to `["ord_1001"]` (Abebe's order) and run it. Then sign in as Abebe: `ord_1001` must still be `placed`. | `"error":"Not yours"`, and Abebe's order is untouched. | `lib/orders.js` → `orderForUser`: `if (order.userId !== user.id) return { status: 403, error: "Not yours" };` | |
| 3 | **Open redirect** through `next` | Open `http://localhost:3000/signin?next=https://evil.example`, sign in as Abebe. Repeat with `?next=//evil.example` and `?next=/\evil.example`. Finally try `?next=/orders`. | You land on `/` of *this* site each time, except `?next=/orders`, which returns to `/orders`. | `lib/safe-next.js`: `if (!value.startsWith("/")) return fallback;` plus the `//` and `\` checks | |

| 4 | **Poll** the live endpoint without a session, and read the page source | Signed out: `fetch("/api/orders").then(r => r.status)` in the Console. Then sign in as Selam, View source on `/orders`, and search the HTML for `ord_1001` (Abebe's). | `401`, and Abebe's orders appear nowhere in Selam's HTML. | `app/api/orders/route.js` → `if (!user) return jsonError("Not signed in", 401);` and `lib/orders.js` → `listOrdersFor`: `.filter((o) => o.userId === userId)` | |

Attack 4 is not one of the brief's three; it is added because Day 45 introduced a second way to read orders (the poll). Every new door needs its own attack. `npm run test:live` automates it.

Note on attack 3: the lecture's one-liner, `next.startsWith("/")`, is **not enough**. `//evil.example` starts with a slash, and browsers read it as "another site". `safeNext` also rejects `//`, backslashes, control characters, and anything that normalises to `//` (for example `/..//evil.example`). It runs three times: when the sign-in page renders the hidden field, when the form is submitted, and in the action just before `redirect()`.

## Roles
`role` lives on the user record (`customer` or `staff`) and is returned by `getSession()`.
- **What to show:** the *Kitchen* link on `/orders` appears only for staff. That is interface.
- **What to allow:** `/kitchen` returns 404 to customers, and `markReady` refuses them with `Not allowed`, even if the button is never rendered. That is the protection.

## The six mistakes, audited
| Mistake | Status here |
|---|---|
| Only middleware protects it | No. Every private page re-checks `getSession()`, every write re-checks inside the action/handler. |
| Trusting an id from the client | No. `listOrdersFor(user.id)` uses the session id; new orders use `user.id`, and a `userId` sent in the body is ignored (tested). |
| Checking auth in a client component | No. No client component decides anything; they only call actions. |
| A token in `localStorage` | No. Nothing is stored in the browser except the `httpOnly` cookie. |
| Redirecting to an unchecked URL | No. `safeNext` guards every `next` value. |
| `NEXT_PUBLIC` on a secret | No. There are no `NEXT_PUBLIC_` variables; `npm run check:secrets` scans the built client JavaScript. |

## Also checked on Day 45
- **The seed leaks nothing.** `/orders` passes `listOrdersFor(user.id)` to `<LiveOrders initialOrders>`. That array is serialised into the page, so it is built from `toPublic()`: no phone number, no user id. `npm run test:live` checks both.
- **A polled endpoint is an open door too.** `/api/orders` is not covered by the proxy, so its handler is layer 3 on its own. Polling an expired session returns 401 and the screen stops asking.
- **No shared caching.** Both order GET handlers send `Cache-Control: no-store`, so a CDN or the browser cannot hand one person's list to another.

## Known limits (and what a library would add)
- Sessions and orders live in memory: restarting the server signs everyone out. Module 4 moves both to a database.
- No rate limiting or lockout on sign-in, no password reset, no sign-up. Auth.js, Clerk or Lucia provide these; hand-rolling them for real users is a poor idea.
- Sessions do not rotate during their 7-day life, and there is no "sign out everywhere".
- `secure: true` cookies need HTTPS. Browsers allow them on `http://localhost`, so development works; set `COOKIE_SECURE=false` only for LAN-IP testing.

## Check yourself
- **Can any script on the page read the session cookie?** No: `httpOnly`. `document.cookie` does not list it.
- **Does the orders page work if you change an id in the URL?** There is no id in the URL. The query uses the session's id.
- **Does middleware run on image files?** No: the matcher names only `/checkout` and `/orders`.
- **Is the staff link merely hidden?** No: `/kitchen` and `markReady` refuse customers on the server (try it with `npm run test:auth`).
- **Is the signing secret absent from the browser's JavaScript?** There is no signing secret; `npm run check:secrets` confirms no hash, password or `.env.local` value is in `.next/static`.

## Day 46: the dashboard door

| Door | Layer 1 (`proxy.js`) | Layer 2 (the page) | Layer 3 |
|---|---|---|---|
| `/dashboard` | cookie shape exists, else redirect to `/signin?next=/dashboard` | `getSession()`, then `role === "staff"`, else `notFound()` | `listOrderFacts()` returns area, total, status and time only: no name, phone or user id |
| `/orders?sort=&dir=&page=` | as before | as before | The URL picks **order and page only**. Whose orders is still `listOrdersFor(session.id)`. `sort` is whitelisted, so `?sort=password` just falls back. |

Attack 5: sign in as Selam and open `/dashboard`. Expected: 404, and nothing from the dashboard in the HTML (`npm run test:data` checks this).
