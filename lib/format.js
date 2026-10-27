// DAY 46 — one formatter, reused by the axis, the tooltip, the bar labels and the tables.
// No imports and no server code, so client charts and server tables share it.
// currencyDisplay "code" gives "ETB 14,200" everywhere. The default symbol differs between
// browsers and Node, and a server/browser mismatch is a hydration warning.
const money = new Intl.NumberFormat("en-ET", {
  style: "currency",
  currency: "ETB",
  currencyDisplay: "code",
  maximumFractionDigits: 0,
});

export const etb = (value) => money.format(value);
