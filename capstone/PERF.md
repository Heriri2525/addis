# PERF.md — <your project>

## Decision three: the budget
| Measure | Target | Before | After | What caused the change |
|---|---|---|---|---|
| LCP, throttled | under 2.5 s | | | |
| CLS | under 0.1 | | | |
| First Load JS, your heaviest route | under 120 kB | | | |
| Largest image | under 150 kB | | | |
| Lighthouse performance | 90 or better | | | |

Take **Before** after your features are complete and before you optimise anything. Measure `npm run build && npm start` (or the deployed build), mobile, Incognito, median of three.

If a number will not come down, write why. A documented failure you understand is worth more than a number you cannot explain.

## Biggest bar in the waterfall (before, after)

## One thing I would fix next
