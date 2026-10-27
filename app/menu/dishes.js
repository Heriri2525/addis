// Colocated data module (not a route). Latency is simulated so the Suspense
// boundary has something to wait on; in a static build it is paid once at build.
import { cache } from "react";
import dishes from "./dishes.json";

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// Day 44: wrapped in React's cache(). generateMetadata, the page, and the sitemap all ask for the
// same dish in ONE render, and cache() makes that cost one lookup. (fetch() is deduped by Next.js
// automatically; a database call or a JSON import is not, so we ask for it explicitly.)
export const getDishes = cache(async () => {
  await delay(700);
  return dishes;
});

export const getDish = cache(async (id) => {
  await delay(100);
  return dishes.find((d) => String(d.id) === String(id)) ?? null;
});

// DAY 45 — SEARCH. Called by GET /api/dishes?q=..., which the debounced search box fetches.
// Not wrapped in cache(): every keystroke-pause asks a different question. The delay is shorter
// than getDishes' on purpose, so the box feels live while the network tab still shows a request.
export async function searchDishes(term, category) {
  await delay(150);
  const needle = String(term ?? "").trim().toLowerCase();
  if (!needle) return [];
  const inCategory = (d) => !category || category === "All" || d.category === category;
  return dishes.filter(
    (d) => inCategory(d) && [d.name, d.category, d.description].some((t) => t.toLowerCase().includes(needle)),
  );
}
