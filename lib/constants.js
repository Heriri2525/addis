// Plain constants with NO imports, so a client component (the checkout form) can use
// them without dragging zod into the browser bundle. lib/schema.js builds on these.
export const DELIVERY_AREAS = ["Bole", "Kazanchis", "Piassa", "Megenagna", "CMC"];
export const PHONE_PATTERN = /^(09\d{8}|\+2519\d{8})$/;
export const PHONE_HINT = "Use 09... or +2519...";

// Day 46: rows per page on /orders. A real order history would use 20. It is 5 here so that the
// four seeded orders plus a few of your own already give you a second page to click through.
export const ORDERS_PAGE_SIZE = 5;
