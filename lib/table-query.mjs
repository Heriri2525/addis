// DAY 46 — PURE table logic: no imports, no Next, no server-only code. That is deliberate:
// it runs in the page, and `npm run test:unit` runs it with nothing but Node.
//
// THE RULE: the URL is untrusted input. Every value below is checked against a whitelist or a
// range, and anything unrecognised silently falls back to the default. There is never an id here:
// WHOSE orders are shown still comes from the session (see app/orders/page.js).

export const ORDER_SORT_KEYS = ["id", "area", "status", "total"];
export const DEFAULT_QUERY = { sort: "id", dir: "desc", page: 1 };

const first = (v) => (Array.isArray(v) ? v[0] : v); // ?sort=a&sort=b arrives as an array

export function parseOrderQuery(params = {}) {
  const rawSort = first(params.sort);
  const sort = ORDER_SORT_KEYS.includes(rawSort) ? rawSort : DEFAULT_QUERY.sort;
  const dir = first(params.dir) === "asc" ? "asc" : "desc";
  const n = Number.parseInt(first(params.page), 10);
  const page = Number.isInteger(n) && n >= 1 && n <= 100000 ? n : 1;
  return { sort, dir, page };
}

// Does not mutate its input. Numbers compare as numbers, text compares naturally (ord_2 < ord_10).
export function sortRows(rows, sort, dir) {
  const sign = dir === "asc" ? 1 : -1;
  const byId = (a, b) => a.id.localeCompare(b.id, "en", { numeric: true });
  return [...rows].sort((a, b) => {
    const diff =
      sort === "total"
        ? a.total - b.total
        : String(a[sort]).localeCompare(String(b[sort]), "en", { numeric: true });
    return diff !== 0 ? diff * sign : byId(a, b) * -1; // ties: newest first, always
  });
}

// Returns one page and the facts a pager needs. `page` is clamped, so the caller can compare it
// with the requested page and redirect when someone typed ?page=999.
export function paginate(rows, page, pageSize) {
  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), pages);
  const start = (current - 1) * pageSize;
  return { rows: rows.slice(start, start + pageSize), total, pages, page: current };
}

// The one place a /orders URL is built, so sort links, pager links and redirects agree.
export function ordersHref({ sort = DEFAULT_QUERY.sort, dir = DEFAULT_QUERY.dir, page = 1 } = {}) {
  const q = new URLSearchParams({ sort, dir });
  if (page > 1) q.set("page", String(page));
  return `/orders?${q.toString()}`;
}

// Clicking a column: the same column flips direction, a new column starts ascending
// (except money, where people want the biggest first).
export function nextDir(query, key) {
  if (query.sort === key) return query.dir === "asc" ? "desc" : "asc";
  return key === "total" ? "desc" : "asc";
}
