# DATA.md — Addis Eats (Day 45)

## Decision two: where is each piece of data fetched?

The rule: **server unless the person triggers it.** That one sentence decides four of the five rows below. The exceptions are data a person types into, or data that must keep refreshing on its own, and even those start from a server answer where one exists.

| Data | Where, and why |
|---|---|
| Menu and dishes | **Server.** Public, indexable, cacheable (ISR). |
| Order history | **Server.** Private, scoped to the session id. |
| Order status | **Server first, then polled on the client.** The page renders it; `SWR` keeps it fresh. |
| Menu search | **Client.** Triggered by typing, debounced. The server cannot know what will be typed. |
| Cart | **Client store.** It never leaves the browser (`localStorage` through `useSyncExternalStore`). |

## Every query, one line each

| # | Query | Runs on | Key | Refresh rule | Reasoning |
|---|---|---|---|---|---|
| 1 | `getDishes()` in `app/menu/page.js` | Server | none (React `cache()`) | ISR, `revalidate = 3600` | Same for everyone, changes a few times a day. Speed and indexing matter most. |
| 2 | `getDish(id)` in `menu/[id]/page.js`, its `generateMetadata`, its OG image | Server | the dish id | Static, built by `generateStaticParams` | One lookup shared by page, metadata and sitemap through `cache()`. |
| 3 | `getDishes()` in `app/sitemap.js` | Server | none | At build | The sitemap lists the real dishes, so a new dish appears without anyone editing a file. |
| 4 | `listOrdersFor(user.id)` in `app/orders/page.js` | Server | the **session's** id, never a URL value | Every request (dynamic) | Private. This is also the **seed** for query 5. |
| 5 | ~~`useSWR("/api/orders")` in `LiveOrders.jsx`~~ **Day 46: replaced.** `/orders` is now a server table; `LiveRefresh.jsx` calls `router.refresh()` every 5 s while a `placed` order is on the page. `GET /api/orders` still exists and is still tested. Was: **`useSWR("/api/orders")`** in `LiveOrders.jsx` | **Client** | `"/api/orders"` (no id: the server picks whose) | `refreshInterval` 5 s **while any order is `placed`**, then it stops. Paused while the tab is hidden. `fallbackData` = query 4's result; no request on mount. | A status changes without the person asking (the kitchen marks it ready). It needs a timer, and a timer lives in the browser. |
| 6 | **`useSWR("/api/dishes?q=…")`** in `MenuSearch.jsx` | **Client** | the debounced, URL-encoded text; `null` (no request) when under 2 characters | Debounced 300 ms. `keepPreviousData`. No refocus or interval refresh. | The person triggers it by typing. Debounce turns five keystrokes into one request. While the box is empty, the server-rendered `DishList` (the seed) is shown instead. |
| 7 | `listAllOrders()` in `app/kitchen/page.js` | Server | none (staff only) | Every request; `placeOrder` and `markReady` call `revalidatePath("/kitchen")` | **Not polled, on purpose.** The brief asks for one polled query. Staff act on this page, and each action refreshes it. A candidate for the next iteration. |
| 8 | Delivery price in `checkout/page.js` (`LivePricing`) | Server, streamed | none | Every request, behind `<Suspense>` | The page shell appears at once; the slow part streams in. |
| 9 | The cart | Client store | `localStorage` key in `app/cart-store.js` | On change | Private to the browser and needed instantly. |

## The seed, in this code
- **Orders.** `app/orders/page.js` reads the session, runs query 4, and passes the array to `<LiveOrders initialOrders={orders} />`. In `LiveOrders`, `fallbackData: initialOrders` makes SWR return it immediately, **also during server rendering**, so View source on `/orders` already contains the orders and no spinner ever shows. `revalidateOnMount: false` stops an immediate second request for data the server built a moment ago.
- **Search.** The seed is `{children}`: the full menu, rendered on the server and passed through `MenuSearch`. A search that has nothing to say yet shows what we already had, never a spinner.

## Details worth being able to explain
- **Why is the poll's key `"/api/orders"` and not `"/api/orders/ord_1002"`?** One request for the whole list, scoped by the server to the session. N per-order polls would be N requests, and each would carry an id someone could change.
- **Why does polling stop?** An order is only ever `placed → ready` or `placed → cancelled`. When none is `placed`, nothing can change, so the interval function returns `0`. Reloading, or navigating back to `/orders` (for example after placing a new order), mounts the component again and re-arms it. **Cancel** calls `mutate()` so the screen updates at once instead of waiting for the next tick.
- **Why `keepPreviousData` in the search?** Without it every pause empties the list for a moment and the screen flickers.
- **Why a minimum of 2 characters?** One letter matches almost everything and is a wasted request. The box says so instead of staying silent.
- **A failed request.** `lib/fetcher.js` turns every non-2xx answer into an error carrying the status. 401 shows "Sign in again" and does not retry; a 5xx retries three times with growing waits (`retryOnlyServerErrors`).
- **Search covers the whole menu**, not only the selected category chip. The chip filter hides cards with CSS (`FilterShell`); search replaces the list while it has text.

## How to verify (tools, not opinions)
| Area | How | You want to see |
|---|---|---|
| Debounce | `/menu`, DevTools → Network → Fetch/XHR, type `kitfo` at normal speed | **One** request, about 300 ms after the last letter |
| Poll | Sign in as Selam, open `/orders`, watch Network | A request to `/api/orders` about every 5 s |
| Poll reacts | Kidist (private window) presses **Mark ready** on `ord_1002` | Selam's status flips within one tick, and the requests stop |
| Seed | Hard reload `/orders`; then Ctrl+U and search for `ord_1002` | Data on first paint, in the HTML, no spinner |
| Endpoint | `npm run test:live` | All PASS |

My results (fill in on your own run):

| Check | Result | Notes |
|---|---|---|
| One search request per pause | ☐ | screenshot of the Network tab |
| Poll every 5 s, stops when nothing is `placed` | ☐ | |
| `/orders` HTML contains the orders | ☐ | |
| `npm run test:live` passes | ☐ | |

## Day 46: what crosses to the browser

| Screen | Query | Runs on | Crosses the boundary | Why |
|---|---|---|---|---|
| `/dashboard` revenue | `revenueByArea()` over all orders | Server | 5 rows `{ area, orders, revenue }` | Charts are client code, so the data must be small and plain. |
| `/dashboard` orders per day | `ordersPerDay()` | Server | 30 rows `{ day, label, orders }` | Every day appears, including empty ones. |
| `/orders` table | `listOrdersFor(user.id)`, then `sortRows`, `paginate` | Server | **Nothing as data.** The HTML table is the output; only `CancelButton` and `LiveRefresh` ship JavaScript. | Sorting in the browser would ship every row plus the sorting code. |
| `/orders` URL | `sort`, `dir`, `page` | Server | n/a | Whitelisted in `parseOrderQuery`; unknown values fall back. The URL never carries an id. |
