# PERF.md — Addis Eats (Day 45)

## Decision three: the performance budget
Fill the **Before** column first, on the finished application, before you change anything. Fill **After** once, at the end. A budget with only the final number proves nothing: the improvement is the evidence, not the score.

| Measure | Target | Before | After | What caused the change |
|---|---|---|---|---|
| LCP, throttled (Lighthouse mobile, `/menu`) | under 2.5 s | ___ s | ___ s | |
| CLS | under 0.1 | ___ | ___ | |
| First Load JS, `/menu` (`npm run measure`) | under 120 kB | ___ kB | ___ kB | |
| Largest image on `/menu` (Network tab, transferred) | under 150 kB | ___ kB | ___ kB | |
| Lighthouse performance (mobile, median of 3) | 90 or better | ___ | ___ | |

Facts already measurable from this repository, so you do not have to guess the starting line:
- The source files are **~395 kB** (`public/hero.jpg`) and **~300 kB each** (`public/dishes/*.jpg`, twelve of them). A plain `<img>` serves exactly those bytes, so the **Largest image — Before** is the hero file. `npm run images` prints every weight.
- Your **After** is the *transferred* size of the biggest image on the page in the Network tab, which `next/image` has resized and converted to AVIF or WebP.

If a number will not come down, write why. A documented failure you understand is worth more than a number you cannot explain.

## Day 45 added a script and a query: did that cost anything?
Day 45 adds one dependency, `swr` (about 4 kB gzipped), loaded by two client components, `app/menu/MenuSearch.jsx` and `app/orders/LiveOrders.jsx`. `/menu` now ships SWR; `/orders` ships SWR too. That is why **First Load JS should be measured after the features are finished, never before** (step 5 of the build order).

| Question | Answer |
|---|---|
| Did `/menu`'s First Load JS grow? | ___ kB (compare `npm run measure` on Day 44's build and today's) |
| Is it still under the 120 kB budget? | ☐ yes ☐ no, because ___ |
| Does the polling request add to LCP? | No: it starts after the page has rendered. Confirm in the waterfall. |

## How to measure (every time, the same way)
1. `npm run perf` (= `next build && next start`). **Never** measure `npm run dev`: it is unminified and compiles on demand.
2. Better still, measure the **deployed** build: Lighthouse on the preview URL. A localhost run hides the network.
3. Chrome Incognito (extensions skew results) → DevTools → Lighthouse → **Mobile**, **Performance**. Or Network *Slow 4G* + Performance *CPU 4x slowdown*.
4. Run it **3 times** and record the median.
5. `npm run measure` prints the JavaScript a route downloads. `npm run images` lists image weights.

## How to capture the BEFORE honestly
Take the baseline when every feature works (step 5), then undo the Day 43 work in a throwaway branch (`git stash` or a scratch copy):
1. In `app/menu/DishCard.jsx`, swap `<Image … />` for a plain `<img src={`/dishes/${dish.slug}.jpg`} alt={dish.name} />`.
2. Remove `priority` from `app/page.js` and `app/menu/[id]/page.js`.
3. Replace the `next/font` import in `app/layout.js` with a `<link>` to a hosted font.
4. Rebuild, measure `/menu`, write the numbers in the **Before** column, then discard the branch.

## Results by step (`/menu`, Slow 4G, 4x CPU, median of 3)
| Step | LCP | CLS | Page weight | What caused the change |
|---|---|---|---|---|
| 0. Before (plain `<img>`, `<link>` font) | ___ | ___ | ___ | |
| 1. `<img>` → `<Image>` with `width`/`height`/`sizes` | ___ | ___ | ___ | resized + AVIF/WebP + lazy-load |
| 2. `priority` on the one hero | ___ | ___ | ___ | hero preloaded |
| 3. `next/font` instead of a link tag | ___ | ___ | ___ | no third-party request, metric-matched fallback |
| 4. Analytics script `lazyOnload` (only if you set one) | ___ | ___ | ___ | |
| **After** | ___ | ___ | ___ | |

| Page | LCP before | LCP after |
|---|---|---|
| `/` | ___ | ___ |
| `/menu` | ___ | ___ |
| `/menu/1` | ___ | ___ |

## Waterfall: what was the biggest bar?
> _write here: which single request cost the most before, and after?_

## One thing I would fix next
> _write here_

## Reference: the worked example from the Day 43 slides (not your numbers)
| Change | LCP | Page weight |
|---|---|---|
| Starting point | 6.1 s | 3.4 MB |
| img → Image with sizes | 2.9 s | 480 kB |
| priority on the hero | 2.2 s | 480 kB |
| next/font instead of a link tag | 2.0 s | 460 kB |
| Menu as a server component | 1.7 s | 390 kB |

The first change did most of the work. Measure first, then fix the biggest thing.

## Review questions (answer before you leave)
1. **Why must the baseline be taken after the features are finished?** Otherwise it measures a different application. Today's search and poll add a dependency, so a baseline from Monday would hide their cost.
2. **Why does `next/image` require `width` and `height` when CSS controls the display size?** They are the aspect ratio. The browser reserves the space before the file arrives, so nothing jumps (CLS).
3. **What does `sizes` change, and what happens without it?** It tells the browser how wide the image will really be, so it picks a smaller file from the `srcset`. Without it the browser assumes full width and downloads the largest version.
4. **Which single image gets `priority`, and why not more?** The largest one visible without scrolling (the LCP element). It disables lazy loading and preloads the file, so several of them compete for bandwidth.
5. **How does `next/font` avoid invisible text and a jumping layout?** `display: "swap"` shows text at once in a fallback face, and `next/font` generates that fallback with matching metrics.
6. **95 on `npm run dev`: why meaningless?** The dev build is unminified and compiles on demand. Only `build` + `start` (or a deployment) represents what users get.
7. **`NEXT_PUBLIC_TELEBIRR_KEY` holding the payment secret?** They published it. `NEXT_PUBLIC_` values are inlined into the JavaScript at build time and readable by anyone; rotate it, rename it without the prefix, rebuild.
