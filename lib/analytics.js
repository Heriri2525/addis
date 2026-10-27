import { DELIVERY_AREAS } from "./constants";
import { listOrderFacts } from "./orders";
import { dayKey, lastDays, ordersPerDay, rangeLabel, revenueByArea } from "./aggregate.mjs";

// SERVER ONLY. Day 46: the numbers behind the staff dashboard.
//
// The store only holds four seeded orders, which cannot draw a trend. So the dashboard adds
// DEMO HISTORY: 29 days of deterministic made-up orders (the same every time, because the random
// generator is seeded). It lives here, NOT in the orders store, so the kitchen, the customers'
// order lists and every Day 39-45 test are untouched. Module 4 replaces it with a database query.
const DAYS = 30;
const PRICES = [140, 180, 290, 320, 360];
const AREA_WEIGHTS = { Bole: 5, Kazanchis: 3, Piassa: 2, Megenagna: 3, CMC: 1 };

// mulberry32: a tiny seeded random generator. Same seed, same history.
function seeded(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickArea(rand) {
  const total = Object.values(AREA_WEIGHTS).reduce((s, w) => s + w, 0);
  let n = rand() * total;
  for (const area of DELIVERY_AREAS) {
    n -= AREA_WEIGHTS[area];
    if (n < 0) return area;
  }
  return DELIVERY_AREAS[0];
}

function demoHistory(days) {
  const rand = seeded(46);
  const facts = [];
  for (const day of days.slice(0, -1)) { // everything except today, which is the real store
    const count = 3 + Math.floor(rand() * 9); // 3 to 11 orders a day
    for (let i = 0; i < count; i++) {
      const lines = 1 + Math.floor(rand() * 3);
      let total = 0;
      for (let l = 0; l < lines; l++) total += PRICES[Math.floor(rand() * PRICES.length)] * (1 + Math.floor(rand() * 2));
      facts.push({ area: pickArea(rand), total, status: rand() < 0.05 ? "cancelled" : "ready", day });
    }
  }
  return facts;
}

// { revenue: [{ area, orders, revenue }], daily: [{ day, label, orders }], range, orderCount }
// `empty` is the demo switch for the empty state (see lib/demo.js).
export function getDashboardData({ empty = false } = {}) {
  if (empty) {
    const days = lastDays(DAYS);
    return { revenue: revenueByArea([], DELIVERY_AREAS), daily: ordersPerDay([], days), range: rangeLabel(days), orderCount: 0 };
  }
  const days = lastDays(DAYS);
  const live = listOrderFacts().map((o) => ({ ...o, day: dayKey(o.createdAt) }));
  const facts = [...demoHistory(days), ...live];
  return {
    revenue: revenueByArea(facts, DELIVERY_AREAS),
    daily: ordersPerDay(facts, days),
    range: rangeLabel(days),
    orderCount: facts.filter((f) => f.status !== "cancelled").length,
  };
}
