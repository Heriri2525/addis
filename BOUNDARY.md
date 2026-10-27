# BOUNDARY.md — Addis Eats (Day 38, updated through Day 45)

Rule: every component is a **server** component unless it needs state, an effect, a ref, context, an
event handler or a browser API. A directive sits only on a file imported from a server component.

| Component | Runs on | Why |
|---|---|---|
| `proxy.js` | Edge (before rendering) | Redirects signed-out visitors from `/checkout` and `/orders`. Reads one cookie, imports nothing Node-only. |
| `app/layout.js` | Server | Static header and footer. Passes `{children}` into `<Providers>`. |
| `app/providers.jsx` | **Client** | Cart context + `useSyncExternalStore`. |
| `app/cart-store.js` | Client (by import) | `localStorage` helpers, imported only by `providers.jsx`. |
| `app/page.js`, `app/not-found.js` | Server | Static markup. |
| `app/SignOutButton.jsx` | Server | A plain form whose action is the `signOut` server action. No client JavaScript. |
| `app/menu/layout.js`, `loading.js`, `DishSkeleton.jsx` | Server | Structure and placeholders. |
| `app/menu/page.js` | Server (async) | `Dishes` awaits `getDishes()`; passes `DishList` into `FilterShell` as `children`. |
| `app/menu/DishList.jsx` | Server | Pure markup from data. |
| `app/menu/FilterShell.jsx` | **Client** | `useSearchParams`; wraps server content through `children`. |
| `app/menu/Sidebar.jsx`, `MenuCounter.jsx` | **Client** | URL-aware links; `useState` + click. |
| `app/menu/error.js` | **Client** | Error boundaries must be client components. |
| `app/menu/[id]/page.js` | Server (async) | Awaits one dish. |
| `app/menu/[id]/AddToCart.jsx` | **Client** | `onClick` + cart context. |
| `app/cart/page.js` | Server | Shell. |
| `app/cart/CartPanel.jsx` | **Client** | Cart state and clear button. |
| `app/cart/CheckoutButton.jsx` | Client (by import) | `useRouter().push`, imported only by `CartPanel`. |
| `app/checkout/page.js` | Server (dynamic) | Layer 2: `getSession()`, redirect if signed out. |
| `app/checkout/OrderForm.jsx` | **Client** | `useActionState` and the cart context. Imports only `lib/constants` (never zod, users or session). |
| `app/orders/page.js` | Server (dynamic) | Layer 2: `getSession()`, then `listOrdersFor(user.id)`, passed to `<LiveOrders>` as the seed. |
| `app/orders/LiveOrders.jsx` | **Client** | `useSWR` polling. Receives the server-built orders as `initialOrders` (the seed). Imports no `lib/` server code, only `lib/fetcher`. |
| `app/menu/MenuSearch.jsx` | **Client** | Text state, debounce, `useSWR`. The server-rendered `DishList` arrives as `children`: the seed shown while the box is empty. |
| `lib/fetcher.js`, `lib/use-debounced-value.js` | Client (by import) | Plain `fetch` wrapper and a timer hook. No secrets, no server imports. |
| `app/orders/CancelButton.jsx` | **Client** | `useTransition` + click; calls the `cancelOrder` action. |
| `app/kitchen/page.js` | Server (dynamic) | Layer 2: session, then `role === "staff"` or 404. |
| `app/kitchen/ReadyButton.jsx` | **Client** | Click + pending; the role check is inside `markReady`, not here. |
| `app/signin/page.js` | Server (dynamic) | Reads `?next=`, sanitises it with `safeNext`, renders the form or the signed-in panel. |
| `app/signin/SignInForm.jsx` | **Client** | `useActionState` for errors and the pending flag. |
| `app/actions.js`, `app/signin/actions.js` | Server (`"use server"`) | Layer 3: every action re-checks the session, ownership or role itself. |
| `app/api/**/route.js` | Server | Route handlers; same `getSession()` and the same rules as the actions. |
| `lib/session.js`, `lib/users.js`, `lib/password.js`, `lib/orders.js`, `lib/schema.js`, `lib/safe-next.js` | Server only | Sessions, password hashes, orders, zod. **No client file imports any of them** (checked with grep). |
| `lib/constants.js`, `lib/http.js` | Shared | Plain data and a tiny helper; no secrets. |

## Files that contain the directive

`"use client"` (13): `providers.jsx`, `menu/FilterShell.jsx`, `menu/Sidebar.jsx`, `menu/MenuCounter.jsx`,
`menu/error.js`, `menu/[id]/AddToCart.jsx`, `cart/CartPanel.jsx`, `checkout/OrderForm.jsx`,
`orders/CancelButton.jsx`, `kitchen/ReadyButton.jsx`, `signin/SignInForm.jsx`, and the two added on Day 45: `orders/LiveOrders.jsx`, `menu/MenuSearch.jsx`. Each is a form, a button or
a piece of browser state; none of them decides who may do anything.

`"use server"` (2): `app/actions.js`, `app/signin/actions.js`.

## Answers to the "check yourself" questions

- **Does `layout.js` import anything that carries the directive?** Only `Providers`; pages reach it as `children`.
- **Is `DishList` shipped to the browser?** No: no directive, and no client component imports it.
- **Why does `error.js` need the directive?** Error boundaries catch render errors in the browser and expose
  `reset()`, which needs state.
- **Can a client file reach a secret or a password hash?** No. Those live in `lib/users.js` and `lib/session.js`,
  which no client file imports; `npm run check:secrets` scans the built browser JavaScript to prove it.
