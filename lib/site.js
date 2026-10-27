// Day 44: one place for everything metadata needs to agree on. Plain values and tiny helpers,
// no imports, so layouts, pages, sitemap.js and robots.js all read the same facts.
//
// NEXT_PUBLIC_SITE_URL is inlined at BUILD time (Day 43). It must be the PRODUCTION address in
// .env.production: with a localhost value every og:image URL points at the visitor's own
// computer, and every shared card arrives without its picture.
export const SITE_NAME = "Addis Eats";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");

export const DEFAULT_TITLE = "Addis Eats — food delivery in Addis Ababa";
export const DEFAULT_DESCRIPTION =
  "Order Doro Wat, Kitfo, Shiro and more from your phone. Food delivered across Addis Ababa, from kitchens in Bole, Kazanchis and beyond.";

// Pages that need a sign-in or hold private state. Used by robots.js (Disallow) and by the
// pages themselves (noindex). Nothing in this list may appear in the sitemap.
export const PRIVATE_ROUTES = ["/cart", "/checkout", "/orders", "/kitchen", "/dashboard", "/signin"];
export const NO_INDEX = { index: false, follow: false };

export const withBrand = (title) => `${title} · ${SITE_NAME}`;

// "/menu/3" -> "https://addiseats.et/menu/3". Used where a URL must be absolute (JSON-LD, sitemap).
export const absoluteUrl = (path = "/") => new URL(path, `${SITE_URL}/`).toString();

// Descriptions show about 150-160 characters in a result. Cut on a word, add an ellipsis.
export function clip(text, max = 160) {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
}

// IMPORTANT: a page's `openGraph` REPLACES the layout's (the merge is shallow, one level deep).
// So every page that sets openGraph must repeat siteName, locale and type. This does it once.
// `images` is left out on purpose: the opengraph-image files in app/ supply them.
export function openGraphFor({ title, description, path }) {
  return { title, description, url: path, siteName: SITE_NAME, locale: "en_ET", type: "website" };
}
