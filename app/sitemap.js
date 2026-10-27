import { absoluteUrl } from "@/lib/site";
import { getDishes } from "./menu/dishes";

// DAY 44 — generated from the real records at build time: a dish added next month appears here
// without anybody remembering to edit a file. Only PUBLIC pages are listed. /cart, /checkout,
// /orders, /kitchen and /signin are deliberately absent (see PRIVATE_ROUTES in lib/site.js).
export default async function sitemap() {
  const dishes = await getDishes();
  return [
    { url: absoluteUrl("/"), changeFrequency: "monthly", priority: 1 },
    { url: absoluteUrl("/menu"), changeFrequency: "daily", priority: 0.8 },
    ...dishes.map((d) => ({
      url: absoluteUrl(`/menu/${d.id}`),
      changeFrequency: "weekly",
      priority: 0.6,
    })),
  ];
}
