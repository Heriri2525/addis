// Tiny localStorage cart. A plain module with NO directive: it only ever runs in the
// browser because only client components (providers.jsx) import it. The server never sees it.
const KEY = "addis-eats-cart";
const listeners = new Set();

export function readRaw() {
  try { return localStorage.getItem(KEY) ?? "[]"; } catch { return "[]"; }
}
export function subscribe(cb) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => { listeners.delete(cb); window.removeEventListener("storage", cb); };
}
export function addToCart(dish) {
  const items = JSON.parse(readRaw());
  const found = items.find((i) => i.id === dish.id);
  if (found) found.qty += 1; else items.push({ ...dish, qty: 1 });
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  listeners.forEach((cb) => cb());
}
export function clearCart() {
  try { localStorage.removeItem(KEY); } catch {}
  listeners.forEach((cb) => cb());
}
