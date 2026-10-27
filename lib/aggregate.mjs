// DAY 46 — PURE aggregation for the dashboard. The server does this so that three summarised
// rows (not four thousand orders) cross into the browser. No imports: `npm run test:unit` runs it.
// A "fact" is { area, total, status, day } with day as "YYYY-MM-DD" (UTC).

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const dayKey = (date) => new Date(date).toISOString().slice(0, 10);

// "27 Sep" from "2026-09-27", with no Date and no time zone involved, so server and browser agree.
export function dayLabel(key) {
  const [, m, d] = key.split("-");
  return `${Number(d)} ${MONTHS[Number(m) - 1]}`;
}

// The last `count` days, oldest first, ending on `now`'s day.
export function lastDays(count, now = new Date()) {
  const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Array.from({ length: count }, (_, i) => dayKey(end - (count - 1 - i) * 86_400_000));
}

export const rangeLabel = (days) => `${dayLabel(days[0])} to ${dayLabel(days[days.length - 1])} ${days[days.length - 1].slice(0, 4)}`;

// A cancelled order earned nothing, so it is in neither chart.
const counts = (f) => f.status !== "cancelled";

export function revenueByArea(facts, areas) {
  return areas.map((area) => {
    const mine = facts.filter((f) => f.area === area && counts(f));
    return { area, orders: mine.length, revenue: mine.reduce((sum, f) => sum + f.total, 0) };
  });
}

// Every day in the range appears, including the empty ones: a line that skips a day is lying.
export function ordersPerDay(facts, days) {
  const byDay = new Map(days.map((d) => [d, 0]));
  for (const f of facts) if (counts(f) && byDay.has(f.day)) byDay.set(f.day, byDay.get(f.day) + 1);
  return days.map((day) => ({ day, label: dayLabel(day), orders: byDay.get(day) }));
}
