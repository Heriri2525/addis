import { PRIVATE_ROUTES, SITE_URL, absoluteUrl } from "@/lib/site";

// DAY 44 — rules for crawlers, plus the pointer to the sitemap. Served at /robots.txt.
// The private pages are BOTH disallowed here (do not waste crawl time on them) and set to
// noindex in their own metadata. They cannot be crawled usefully anyway: without a session
// they only redirect to /signin. /api/ is disallowed because it returns data, not pages.
//
// Note: Disallow stops crawling, noindex stops indexing. A page that is disallowed cannot be
// fetched, so a crawler never sees its noindex tag. Both together are belt and braces for a
// course project; a real site picks the one that matches the goal.
export default function robots() {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: [...PRIVATE_ROUTES, "/api/"] }],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}
