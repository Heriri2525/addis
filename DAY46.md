# Day 46: Data Representation (Addis Eats)

Builds on the Day 45 project. Week 9 behaviour is unchanged: sessions, the three layers, SEO, performance.

## Commands, in order

```
npm install            # first time only: adds recharts (and updates package-lock.json)
npm run test:unit      # pure logic (sorting, paging, aggregation). No server needed.
npm run dev            # http://localhost:3000
```

Leave `npm run dev` running and open a SECOND terminal:

```
npm run test:data      # dashboard, tables, paging, empty state (places 6 orders as Selam)
npm run test:auth      # Day 42 checks, still green
npm run test:live      # Day 45 checks, still green
npm run test           # everything above in one go (the app must be running)
```

Before you commit or deploy:

```
npm run lint
npm run build          # must finish with no errors
npm run check:secrets  # run AFTER the build
npm run perf           # production build + start, the honest way to look at it
```

Accounts: `0911000003` / `Kitchen-pass-42` (staff, sees /dashboard) and `0911000002` / `Selam-pass-42` (customer, sees /orders).

## What was added

| What | File |
|---|---|
| Staff dashboard: server page, aggregates, renders tables | `app/dashboard/page.js` |
| Bar chart (client leaf, fixed height, ETB, starts at zero) | `app/dashboard/RevenueChart.jsx` |
| Line chart (client leaf, range and unit in heading) | `app/dashboard/OrdersChart.jsx` |
| The same numbers as a real table, under each chart | `app/dashboard/DataTable.jsx` |
| Order table: caption, `th scope`, right-aligned totals, `aria-sort` | `app/orders/OrderTable.jsx`, `SortHeader.jsx` |
| Paging with real `Link`s that keep the sort | `app/orders/Pager.jsx` |
| Sort and page from the URL, validated | `lib/table-query.mjs`, `app/orders/page.js` |
| Aggregation (server side, 5 + 30 rows cross to the browser) | `lib/aggregate.mjs`, `lib/analytics.js` |
| ETB formatter shared by axis, tooltip, labels, tables | `lib/format.js` |
| Four states | loading: `loading.js` in both routes. Empty: `app/EmptyState.jsx`. Error: `error.js` in both routes. Loaded: the pages. |
| Force each state on demand (development only) | `lib/demo.js` |
| Live status kept, without SWR | `app/orders/LiveRefresh.jsx` (calls `router.refresh()` while any order is `placed`) |
| Tests | `scripts/unit.test.mjs`, `scripts/test-data.mjs` |

Changed: `proxy.js` (matcher includes `/dashboard`), `lib/site.js` (`/dashboard` is a private route), `lib/orders.js` (`listOrderFacts`), `lib/constants.js` (`ORDERS_PAGE_SIZE = 5`), `app/kitchen/page.js` (link), `app/layout.js` (footer), `globals.css`, and the two `/orders` URLs in `test-auth.mjs` and `test-live.mjs` (now `?sort=id&dir=asc`, because the list is paged). Removed: `app/orders/LiveOrders.jsx`.

## Demonstrate the four states (use `npm run dev`)

| State | URL |
|---|---|
| Loading | `/orders?demo=slow`, `/dashboard?demo=slow` |
| Empty | `/orders?demo=empty`, `/dashboard?demo=empty`, or sign in as Kidist and open `/orders` |
| Error | `/orders?demo=error`, `/dashboard?demo=error` (then press **Try again**) |
| Loaded | `/orders`, `/dashboard` |

The `demo` switches are turned off in a production build on purpose.

## Decisions worth being able to explain

- **Why is the dashboard staff-only?** It totals everyone's orders. Same rule as `/kitchen`: the session decides, a customer gets a 404.
- **Why is some data "demonstration data"?** Four seeded orders cannot draw a trend. `lib/analytics.js` adds 29 days of seeded-random history that never enters the orders store, so the kitchen and every earlier test are unaffected. Module 4 replaces it with a database query.
- **Why is the page size 5?** A real history would use 20. With 5, four seeded orders plus a few of your own already make a second page.
- **Why `await searchParams`?** In Next 16 it is a Promise. The slide code reads it synchronously; that would give `undefined` values here.
- **Why `.mjs` for two files in `lib/`?** So `node --test` can import them with no build step.
- **Why was `LiveOrders` (SWR) removed from `/orders`?** The page is now a server-rendered table with sort and page in the URL. A client list seeded from the server would fight the URL. `router.refresh()` re-runs the same server page, same sort and page. SWR is still used by menu search.
