# Rendering strategy — Addis Eats (Day 37, extended on Days 39, 42, 43, 44 and 45)

Two questions per route: does it depend on who is asking, and how stale may it be?

| Route | Strategy | Build marker | Why |
|---|---|---|---|
| `/` | Static | ○ | Story and address never change between builds. |
| `/menu` | ISR, `revalidate = 3600` | ○ (Revalidate 1h) | Dishes change a few times a day; an hour-old menu misleads nobody and speed matters most. |
| `/menu/[id]` | Static via `generateStaticParams` | ● (12 pages) | Every dish id is known at build time. Unlisted ids render on first request, then cache. |
| `/cart` | Client | ○ shell + browser state | The cart is the person's own private state, kept in their browser. |
| `/checkout` | Dynamic | ƒ | `await cookies()` reads the session cookie (per-request); `force-dynamic` on the layout states it for the whole segment. |
| `/orders` | Dynamic | ƒ | Private and scoped to the session id, so it cannot be prerendered. (Day 39 cached it; Day 42 made it per-person.) |
| `/kitchen` | Dynamic | ƒ | Reads the session and the role. Staff only. |
| `/signin` | Dynamic | ƒ | Reads the session cookie and `?next=`. |
| `/api/dishes`, `/api/dishes/[id]` | Dynamic | ƒ | `/api/dishes` reads `request.url` (`?category=`, and since Day 45 `?q=` for the search); the `[id]` segment is not prebuilt. |
| `/api/orders`, `/api/orders/[id]`, `/api/auth/*` | Never cached | ƒ | They read the session, or they write. `/api/orders` is **polled** every 5 s from `/orders` (Day 45) and answers `Cache-Control: no-store`. |
| *Proxy / middleware* | Before rendering | ƒ | Runs only for `/checkout/:path*` and `/orders/:path*`. |

Streaming: `/menu` sends the layout + sidebar first and the dish list behind a `<Suspense>` skeleton; `/checkout` streams "live pricing" behind its own boundary.
Not built: `/orders/[id]` (in the lecture table, not in today's requirements).

Day 45 changes no rendering strategy either. `/menu` stays ISR: `MenuSearch` is a client leaf whose requests start only after the person types, and `/orders` stays dynamic: `LiveOrders` is a client leaf seeded with the server's answer, so the HTML is still complete on arrival.

Day 43 changes no rendering strategy. Images are optimised on demand by `/_next/image` and cached; `/menu` and `/menu/[id]` stay static/ISR, so their HTML, fonts and image URLs are fixed at build time.

## What a crawler sees (Day 44)

The rendering strategy decides what a crawler can read, before any tag does.

| Route | Rendered | Indexable? | In sitemap? | In robots.txt |
|---|---|---|---|---|
| `/` | Static | Yes, full HTML | Yes, priority 1 | allowed |
| `/menu` | ISR (1 h) | Yes, canonical `/menu` (folds `?category=`, `?ref=`) | Yes | allowed |
| `/menu/[id]` | Static via `generateStaticParams` | Yes, one page per dish | Yes, from the data | allowed |
| `/cart` | Static shell + browser state | No (`noindex`) | No | Disallow |
| `/checkout`, `/orders`, `/kitchen` | Dynamic, session-guarded | No (`noindex`, and a redirect when signed out) | No | Disallow |
| `/signin` | Dynamic | No (`noindex`) | No | Disallow |
| `/api/*` | Route handlers | Not pages | No | Disallow |
| `/sitemap.xml`, `/robots.txt` | Static, generated | n/a | n/a | n/a |
