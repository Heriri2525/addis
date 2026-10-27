// Day 46 UNIT TESTS: pure logic only, no server needed.  npm run test:unit
// Runs with Node's built-in test runner (node --test): nothing to install.
import test from "node:test";
import assert from "node:assert/strict";
import { ORDER_SORT_KEYS, nextDir, ordersHref, paginate, parseOrderQuery, sortRows } from "../lib/table-query.mjs";
import { dayLabel, lastDays, ordersPerDay, rangeLabel, revenueByArea } from "../lib/aggregate.mjs";

const rows = [
  { id: "ord_1001", area: "Bole", status: "placed", total: 640 },
  { id: "ord_1002", area: "Piassa", status: "ready", total: 290 },
  { id: "ord_1010", area: "Bole", status: "cancelled", total: 290 },
  { id: "ord_1003", area: "Kazanchis", status: "placed", total: 180 },
];

test("parseOrderQuery: defaults when the URL says nothing", () => {
  assert.deepEqual(parseOrderQuery({}), { sort: "id", dir: "desc", page: 1 });
  assert.deepEqual(parseOrderQuery(undefined), { sort: "id", dir: "desc", page: 1 });
});

test("parseOrderQuery: a hostile URL falls back, it never throws or passes through", () => {
  for (const sort of ["password", "__proto__", "id; DROP TABLE", "", "TOTAL"]) {
    assert.equal(parseOrderQuery({ sort }).sort, "id", `sort=${sort}`);
  }
  for (const page of ["0", "-3", "abc", "1.5e9", "NaN", "999999999", ""]) {
    assert.equal(parseOrderQuery({ page }).page, 1, `page=${page}`);
  }
  assert.equal(parseOrderQuery({ dir: "sideways" }).dir, "desc");
});

test("parseOrderQuery: accepts good values, and takes the first of a repeated parameter", () => {
  assert.deepEqual(parseOrderQuery({ sort: "total", dir: "asc", page: "3" }), { sort: "total", dir: "asc", page: 3 });
  assert.equal(parseOrderQuery({ sort: ["area", "total"] }).sort, "area");
  for (const k of ORDER_SORT_KEYS) assert.equal(parseOrderQuery({ sort: k }).sort, k);
});

test("sortRows: numbers as numbers, ids naturally, input untouched", () => {
  const copy = JSON.stringify(rows);
  assert.deepEqual(sortRows(rows, "total", "desc").map((r) => r.total), [640, 290, 290, 180]);
  assert.deepEqual(sortRows(rows, "total", "asc").map((r) => r.total), [180, 290, 290, 640]);
  // ord_1010 is AFTER ord_1003 numerically; a plain string sort would also agree here, so check the tie-break:
  assert.deepEqual(sortRows(rows, "total", "desc").map((r) => r.id).slice(1, 3), ["ord_1010", "ord_1002"], "ties: newest first");
  assert.deepEqual(sortRows(rows, "id", "asc").map((r) => r.id), ["ord_1001", "ord_1002", "ord_1003", "ord_1010"]);
  assert.equal(JSON.stringify(rows), copy, "sortRows must not mutate");
});

test("sortRows: ord_2 sorts before ord_10", () => {
  const r = [{ id: "ord_10", total: 1 }, { id: "ord_2", total: 1 }];
  assert.deepEqual(sortRows(r, "id", "asc").map((x) => x.id), ["ord_2", "ord_10"]);
});

test("paginate: pages, remainder, clamping", () => {
  const twelve = Array.from({ length: 12 }, (_, i) => ({ id: i }));
  const p1 = paginate(twelve, 1, 5);
  assert.deepEqual({ n: p1.rows.length, pages: p1.pages, total: p1.total }, { n: 5, pages: 3, total: 12 });
  assert.equal(paginate(twelve, 3, 5).rows.length, 2, "the last page holds the remainder");
  assert.equal(paginate(twelve, 99, 5).page, 3, "beyond the end clamps to the last page");
  const none = paginate([], 1, 5);
  assert.deepEqual({ pages: none.pages, page: none.page, n: none.rows.length }, { pages: 1, page: 1, n: 0 });
});

test("ordersHref and nextDir", () => {
  assert.equal(ordersHref({ sort: "total", dir: "desc", page: 2 }), "/orders?sort=total&dir=desc&page=2");
  assert.equal(ordersHref({ sort: "area", dir: "asc", page: 1 }), "/orders?sort=area&dir=asc");
  assert.equal(nextDir({ sort: "area", dir: "asc" }, "area"), "desc");
  assert.equal(nextDir({ sort: "area", dir: "desc" }, "area"), "asc");
  assert.equal(nextDir({ sort: "id", dir: "desc" }, "total"), "desc", "money starts biggest-first");
  assert.equal(nextDir({ sort: "id", dir: "desc" }, "area"), "asc");
});

test("revenueByArea: sums per area, skips cancelled, keeps empty areas", () => {
  const facts = [
    { area: "Bole", total: 100, status: "ready" },
    { area: "Bole", total: 50, status: "placed" },
    { area: "Bole", total: 999, status: "cancelled" },
    { area: "CMC", total: 70, status: "ready" },
  ];
  assert.deepEqual(revenueByArea(facts, ["Bole", "Piassa", "CMC"]), [
    { area: "Bole", orders: 2, revenue: 150 },
    { area: "Piassa", orders: 0, revenue: 0 },
    { area: "CMC", orders: 1, revenue: 70 },
  ]);
});

test("lastDays and ordersPerDay: every day appears, even the empty ones", () => {
  const days = lastDays(3, new Date("2026-10-27T09:00:00Z"));
  assert.deepEqual(days, ["2026-10-25", "2026-10-26", "2026-10-27"]);
  const facts = [
    { day: "2026-10-25", status: "ready" }, { day: "2026-10-25", status: "placed" },
    { day: "2026-10-27", status: "ready" }, { day: "2026-10-27", status: "cancelled" },
    { day: "2025-01-01", status: "ready" }, // outside the range: ignored
  ];
  assert.deepEqual(ordersPerDay(facts, days).map((d) => d.orders), [2, 0, 1]);
  assert.equal(dayLabel("2026-09-07"), "7 Sep");
  assert.equal(rangeLabel(["2026-09-28", "2026-10-27"]), "28 Sep to 27 Oct 2026");
});

test("lastDays crosses a month and a year boundary", () => {
  assert.deepEqual(lastDays(3, new Date("2027-01-01T00:30:00Z")), ["2026-12-30", "2026-12-31", "2027-01-01"]);
});
