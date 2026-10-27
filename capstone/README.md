# Capstone: bring it to the week 9 standard

Copy this folder's files into your **own** repository. The brief assumes routing, layouts, rendering strategy and the server/client boundary from week 8; breaking them to satisfy something new is not allowed.

## The six rows that must be true tonight
| By the end of today | Status | Evidence (file, screenshot, command) |
|---|---|---|
| Every route reachable on Next.js | ☐ | |
| Layouts and rendering strategy chosen | ☐ | |
| Server and client boundary documented | ☐ | |
| Sign-in and protected routes | ☐ | |
| One measured optimisation pass | ☐ | |
| Metadata on every route | ☐ | |

A route that renders a heading is progress; an empty route map on Day 46 is not. If a row is not true, write which one and when it will be.

## What your capstone needs, by day
| From day | Needs | If it does not apply |
|---|---|---|
| 41 | Any screen that polls or searches, done with a library | Write down why nothing polls. Do not invent something. |
| 42 | Sign-in, and the three layers on every private route | **Authentication is not optional.** If nothing is private, talk to the instructor today. |
| 43 | A measured pass over images, fonts and scripts | |
| 44 | Titles, descriptions, previews, sitemap | |
| All | `AUTH.md`, `DATA.md`, `PERF.md` for your routes | |

## Order of work
Sessions → the three layers → scoped queries and the attacks → live data, seeded → measure, then optimise → metadata, then deploy and verify. Security first, because optimising a page you later restructure for authorisation wastes the optimisation.

## Check yourself
- Did all three attacks fail, and can you name the line that stopped each?
- Can you change an id in a private URL and see someone else's data?
- Does typing five characters fire one request or five?
- Does the first private page show data on arrival, with no spinner?
- Are both columns of the performance budget filled in?
- Does a shared link render as a card with an image, from the deployed URL?

Files here: `AUTH.md`, `DATA.md`, `PERF.md` (templates). Fill a row as you build the thing, not on Friday: filling it is how you find the layer you forgot.
