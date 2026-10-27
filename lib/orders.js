import { getDish } from "@/app/menu/dishes";
import { orderSchema } from "./schema";
import { userName } from "./users";

// SERVER ONLY. A tiny in-memory "database" (see Day 39). It lives on globalThis so dev-mode
// reloads and the separate route bundles all share ONE store; it resets when the server restarts.

function seedOrders() {
  const now = new Date().toISOString();
  const order = (id, userId, name, phone, area, items) => ({
    id, userId, name, phone, area, items,
    total: items.reduce((sum, i) => sum + i.price * i.qty, 0),
    currency: "ETB", status: "placed", createdAt: now,
  });
  return [
    order("ord_1001", "abebe", "Abebe", "0911000001", "Bole", [{ id: 1, name: "Doro Wat", price: 320, qty: 2 }]),
    order("ord_1002", "selam", "Selam", "0911000002", "Piassa", [{ id: 3, name: "Tibs", price: 290, qty: 1 }]),
    order("ord_1003", "abebe", "Abebe", "0911000001", "Kazanchis", [{ id: 4, name: "Shiro", price: 180, qty: 1 }]),
    order("ord_1004", "selam", "Selam", "0911000002", "Megenagna", [{ id: 7, name: "Firfir", price: 140, qty: 2 }]),
  ];
}

function createStore() {
  const orders = new Map();
  for (const o of seedOrders()) orders.set(o.id, o);
  return { orders, nextNumber: 1005 };
}

const store = (globalThis.__addisEatsOrders ??= createStore());

// What a page may show. No phone number, no user id: those stay on the server.
function toPublic(o) {
  return {
    id: o.id, status: o.status, area: o.area, owner: userName(o.userId),
    items: o.items, total: o.total, currency: o.currency,
  };
}

// SCOPED TO THE PERSON. The id comes from the session, never from the request, so there is
// no argument an attacker can change to read someone else's orders.
export function listOrdersFor(userId) {
  return [...store.orders.values()].filter((o) => o.userId === userId).reverse().map(toPublic);
}

// Everyone's orders. For the kitchen only: the caller MUST have checked role === "staff".
export function listAllOrders() {
  return [...store.orders.values()].reverse().map(toPublic);
}

// Day 46: what the dashboard needs and nothing more. No name, phone or user id, only area, money,
// status and when. The caller MUST have checked role === "staff" (the dashboard page does).
export function listOrderFacts() {
  return [...store.orders.values()].map((o) => ({ area: o.area, total: o.total, status: o.status, createdAt: o.createdAt }));
}

// The FULL record, including userId. For server-side checks only; never send it out.
export function getOrder(id) {
  return store.orders.get(id) ?? null;
}

export function setStatus(id, status) {
  const order = store.orders.get(id);
  if (order) order.status = status;
}

// AUTHENTICATION, then AUTHORISATION, for one order. Used by the cancelOrder action, the
// DELETE and GET route handlers, so every door applies the same rules:
//   401 not signed in -> 404 no such order -> 403 not yours
// Returns { order } on success or { status, error }.
export function orderForUser(user, orderId) {
  if (!user) return { status: 401, error: "Not signed in" };
  const order = getOrder(String(orderId));
  if (!order) return { status: 404, error: "No such order" };
  if (order.userId !== user.id) return { status: 403, error: "Not yours" }; // ownership, from the record
  return { order };
}

export function cancelOrderFor(user, orderId) {
  const found = orderForUser(user, orderId);
  if (!found.order) return found;
  if (found.order.status !== "placed") return { status: 409, error: `Order is already ${found.order.status}` };
  setStatus(found.order.id, "cancelled");
  return { ok: true };
}

export function toPublicOrder(order) {
  return toPublic(order);
}

// The server decides the prices, never the browser.
async function priceItems(items) {
  const dishes = await Promise.all(items.map((i) => getDish(i.id))); // parallel, not sequential
  const missing = items.filter((_, idx) => !dishes[idx]).map((i) => i.id);
  if (missing.length > 0) {
    return { ok: false, errors: missing.map((id) => `No such dish: ${id}`) };
  }
  const lines = items.map((i, idx) => ({
    id: dishes[idx].id, name: dishes[idx].name, price: dishes[idx].price, qty: i.qty,
  }));
  const total = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
  return { ok: true, lines, total };
}

// THE single enforcement point for creating an order (Day 39). The caller has already
// established WHO is ordering; userId is the session's id, never a value from the request.
export async function submitOrder(input, userId) {
  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const priced = await priceItems(parsed.data.items);
  if (!priced.ok) return { ok: false, fieldErrors: { items: priced.errors } };

  const id = `ord_${store.nextNumber++}`;
  store.orders.set(id, {
    id, userId, name: parsed.data.name, phone: parsed.data.phone, area: parsed.data.area,
    items: priced.lines, total: priced.total, currency: "ETB", status: "placed",
    createdAt: new Date().toISOString(),
  });
  return { ok: true, order: { id, total: priced.total, currency: "ETB", status: "placed" } };
}
