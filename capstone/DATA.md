# DATA.md — <your project>

## Decision two: where is each piece of data fetched?
Rule: server unless the person triggers it, or it must keep refreshing on its own. Where a client query is unavoidable, seed it with the server's first answer (`fallbackData`).

| Data | Where, and why |
|---|---|
| | |

## Every query
| # | Query | Server or client | Key | Refresh rule | One line of reasoning |
|---|---|---|---|---|---|
| 1 | | | | | |

## Seeds
Which client queries start from server data, and where is it passed in?

## Not used, on purpose
(If nothing in your application polls or searches, write that decision here. Knowing which tools you do not need is part of the assessment.)

## Verification
| Check | How | Result |
|---|---|---|
| One request per pause when typing | Network tab | |
| Data on arrival, no spinner | View source | |
