# AUTH.md — <your project>

## Decision one: who may see what, and what each layer PROVES
| Route / action | Who | Layer 1: proxy | Layer 2: page | Layer 3: query / action | What that proves |
|---|---|---|---|---|---|
| `/` | everyone | none | none | none | public, indexable |
| `/…` | | | | | |

Rule for the last column: say exactly what the layer establishes. The proxy only proves a cookie of the right shape exists; the gap is almost always an action that trusts an id it was handed.

## The session
- Where it is stored, what the cookie holds, its flags (`HttpOnly`, `Secure`, `SameSite`), its lifetime:
- The one helper every page and action calls:

## The three attacks
| # | Attack | Expected | Line that stops it | My result |
|---|---|---|---|---|
| 1 | Call a write while signed out | refused, not a crash | | |
| 2 | Call it with another account's id | refused on ownership, not on session | | |
| 3 | `/signin?next=https://example.com` | lands on `/` | | |

If you cannot point at a line, the request was refused by luck or by the interface, and neither counts.

## Known limits
