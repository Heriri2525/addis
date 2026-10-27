# SEO.md — Addis Eats, Day 44

## What every route says

| Route | Title (rendered) | Where it comes from | Extras |
|---|---|---|---|
| `/` | Addis Eats — food delivery in Addis Ababa | root layout `default` (template not applied) | `Restaurant` JSON-LD, canonical `/`, sitemap priority 1 |
| `/menu` | Menu · Addis Eats | `metadata` object + template | canonical `/menu`, section card `app/menu/opengraph-image.jpg` |
| `/menu/[id]` | e.g. Kitfo · Addis Eats | `generateMetadata` from the dish | `MenuItem` JSON-LD, generated card, canonical `/menu/[id]` |
| `/cart` | Cart · Addis Eats | `metadata` object | `noindex`, disallowed, not in sitemap |
| `/checkout` | Checkout · Addis Eats | `metadata` object | `noindex`, disallowed, not in sitemap |
| `/orders`, `/kitchen`, `/signin` | My orders / Kitchen / Sign in · Addis Eats | `metadata` object | `noindex`, disallowed, not in sitemap |
| `/sitemap.xml`, `/robots.txt` | n/a | `app/sitemap.js`, `app/robots.js` | generated |

## Where each thing is set (inheritance)

| Set in | What lives there |
|---|---|
| Root layout | `metadataBase`, title template, default title and description, `og:site_name`, `og:locale` |
| Section layout (`app/menu/layout.js`) | a description for anything under `/menu` that sets none |
| Static page | that page's own title, description, canonical |
| `generateMetadata` | anything from the data: dish name, price, description |
| File conventions | `opengraph-image.*`, `icon.png`, `apple-icon.png` |

## View source: what to look for (Ctrl+U on `/menu/2`)
```
<title>Kitfo · Addis Eats</title>
<meta name="description" content="Kitfo — 380 ETB. Minced beef ...">
<link rel="canonical" href="https://YOUR-SITE/menu/2">
<meta property="og:title" ...>  <meta property="og:description" ...>  <meta property="og:url" ...>
<meta property="og:image" content="https://YOUR-SITE/menu/2/opengraph-image?...">   <- must be ABSOLUTE
<meta property="og:image:width" content="1200">  <meta property="og:image:height" content="630">
<script type="application/ld+json">{"@type":"MenuItem", ... "price":380,"priceCurrency":"ETB"}</script>
```

## My results (fill in after `npm run perf` and `npm run check:seo`)

| Check | Result | Notes |
|---|---|---|
| `npm run check:seo` passes locally | ☐ | |
| `og:image` is absolute on every page | ☐ | |
| Two dish pages have two different descriptions | ☐ | |
| Sitemap contains no route that needs a sign-in | ☐ | |
| JSON-LD price equals the price on the page, in ETB | ☐ | |
| Exactly one `<h1>` per page | ☐ | |
| `NEXT_PUBLIC_SITE_URL` set to the real address and rebuilt | ☐ | |
| Deployed link pasted into Telegram / a preview debugger | ☐ | screenshot |
| Would the link look worth opening in a group chat? | ☐ | |

## Review questions (answer before you leave)
1. **Why can a page marked `"use client"` not export metadata?** Metadata is resolved on the server before the page renders, so it can only be exported from server components. Keep the page on the server and push the interactive part into a leaf (Day 38).
2. **What does a title template save you, and where is it defined?** Each page supplies only its own part and the brand is added once, so renaming the site is one edit. It is `title.template` in the root `app/layout.js`; the home page uses `default` instead.
3. **A shared link shows no picture. First thing to check?** `metadataBase` (and so `NEXT_PUBLIC_SITE_URL`): is it set, and is it the production address rather than localhost? View source and look at the `og:image` URL.
4. **Why does `generateMetadata` calling `getDish` not double the load?** Within one render the lookup is shared: `fetch` is deduped by Next.js, and for non-fetch data (our JSON, a database) `getDish` is wrapped in React's `cache()`, so metadata and page cost one lookup.
5. **`/menu` and `/menu?category=vegan`: what problem, what fixes it?** A crawler treats them as separate pages that compete. `alternates: { canonical: "/menu" }` says which one counts and folds the others into it.
6. **Two things from earlier that helped SEO more than any tag today?** Day 37's rendering strategy (static / ISR pages a crawler can read as full HTML) and Day 43's LCP work (a fast page on a phone). Server components (Day 38) and semantic HTML (Module 2) also count.

## Honest limits
- Metadata makes a page look right in results; it does not make it rank. Content that answers the query, fast server-rendered HTML and working links matter more.
- `Disallow` stops crawling and `noindex` stops indexing, but a crawler that may not fetch a page never sees its `noindex`. We use both here as the course asks; a real site chooses the one that matches its goal.
- The `Restaurant` data has no address or hours because the site shows none. Rich results for restaurants usually want them: add them to the page and the JSON-LD together.
