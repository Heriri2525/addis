# WALKTHROUGH.md — the 8-minute presentation

Present from the **deployed URL**, not localhost. Have these open before you start: the deployed app, DevTools on the Network tab, a private window signed in as Kidist (staff), `AUTH.md` and `PERF.md`, and a chat with a dish link ready to paste.

| Minutes | Do this | Say this |
|---|---|---|
| 0–1 | Open the deployed app. Sign in as Selam. Add Tibs to the cart, check out, place one order. | "Accounts, a session in an `HttpOnly` cookie, and an order saved against the session's id, not a field in the form." |
| 1–3 | Show the table at the top of `AUTH.md`. Run the three attacks live: (1) the copied action while signed out → `Not signed in`; (2) the same call with Abebe's order id → `Not yours`; (3) `/signin?next=https://example.com` → lands on `/`. | "For each one I can name the line that refused it: `orderForUser` in `lib/orders.js`, and `safeNext`. Middleware only proves a cookie exists; the action is the real check." |
| 3–5 | `/menu`, Network tab, type `kitfo` once: **one** request. Then `/orders`: show a request to `/api/orders` every 5 s. In the private window, Kidist presses **Mark ready**: Selam's status flips and the requests stop. Hard reload `/orders` and View source: the orders are in the HTML. | "Server first, then the client keeps it fresh. The seed means no spinner on arrival. Polling stops when nothing can change." |
| 5–7 | Open `PERF.md`. Read the Before and After columns. Name the single change that moved LCP most. If a target was missed, say which and why. | "A number before, a number after, and the cause. Not 'it feels faster'." |
| 7–8 | Paste a dish link into the chat: a card with the photo, name and price appears. Open `/sitemap.xml` (real dishes) and `/robots.txt` (private routes disallowed). Take questions. | "The rendering strategy did more for discovery than any tag." |

## If something goes wrong live
- **An attack does not refuse.** Stop and say so; find the line. A real finding, explained, beats a rehearsed pass.
- **The deployed app forgot your session** (serverless memory, see the README). Sign in again and say why; do not hide it.
- **The preview card is missing its image.** View source: is `og:image` absolute and not `localhost`? Then `NEXT_PUBLIC_SITE_URL` was not set for that build.

## Questions you should be able to answer
1. For `/orders`, what does each of the three layers prove?
2. Which query runs on the client, and why can it not run on the server?
3. What were your LCP numbers, and which change did most of it?
4. Show the line that refuses an action called with another account's id.
5. Why is the performance baseline taken after the features are finished?
6. What is still missing from your capstone, and when will it be done?

(Answers for 1–5 are in `AUTH.md`, `DATA.md` and `PERF.md`; 6 is yours.)
