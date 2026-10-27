import { Suspense } from "react";
import DishList from "./DishList";
import DishSkeleton from "./DishSkeleton";
import FilterShell from "./FilterShell";
import MenuSearch from "./MenuSearch";
import { getDishes } from "./dishes";
import { openGraphFor, withBrand } from "@/lib/site";

// SEO (Day 44): a static object, because nothing here depends on data. The canonical tag is what
// folds /menu?category=vegan, /menu?ref=telegram and /menu/ into this one URL for a crawler
// (the query string stays: it is right for the person, canonical is what the crawler needs).
const description =
  "Doro Wat, Kitfo, Tibs, Shiro and more: Ethiopian, vegetarian, breakfast and fast-food dishes, delivered across Addis Ababa.";
export const metadata = {
  title: "Menu",
  description,
  alternates: { canonical: "/menu" },
  openGraph: openGraphFor({ title: withBrand("Menu"), description, path: "/menu" }),
};

// ISR (Day 37, unchanged): built at deploy time, then regenerated in the background
// at most hourly.
export const revalidate = 3600;

// Plain object of numbers: serialisable, so it may be passed to a client component.
function countByCategory(dishes) {
  const counts = {};
  for (const d of dishes) counts[d.category] = (counts[d.category] ?? 0) + 1;
  return counts;
}

// ASYNC SERVER COMPONENT: awaits its data directly. No useState, no useEffect, no
// loading flag, no /api endpoint. loading.js / <Suspense> cover the wait, error.js
// catches a throw.
async function Dishes() {
  const dishes = await getDishes(); // the slow part
  return (
    <FilterShell counts={countByCategory(dishes)}> {/* client */}
      {/* Day 45: MenuSearch is a client leaf. DishList is still rendered on the server and handed
          in as children: it is the "seed" shown whenever the search box is empty. */}
      <MenuSearch>
        <DishList dishes={dishes} /> {/* server: passed as children, never imported */}
      </MenuSearch>
    </FilterShell>
  );
}

export default function MenuPage() {
  return (
    <section>
      <h1>Menu</h1>
      {/* Sidebar (in menu/layout.js) is already on screen; only this waits. */}
      <Suspense fallback={<DishSkeleton />}>
        <Dishes />
      </Suspense>
    </section>
  );
}
