import Link from "next/link";
import { ordersHref } from "@/lib/table-query.mjs";

// Numbered pages as REAL links: the URL is shareable, the back button works, middle-click works,
// and the sort order is kept while you page. Server component: no JavaScript shipped.
export default function Pager({ query, page, pages }) {
  if (pages <= 1) return null;
  const href = (p) => ordersHref({ sort: query.sort, dir: query.dir, page: p });
  return (
    <nav aria-label="Order pages" className="pager">
      {page > 1 ? <Link href={href(page - 1)} rel="prev">← Previous</Link> : <span className="pager-off" aria-hidden="true">← Previous</span>}
      <ul>
        {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
          <li key={p}>
            {p === page
              ? <span className="pager-now" aria-current="page"><span className="visually-hidden">Page </span>{p}</span>
              : <Link href={href(p)}><span className="visually-hidden">Page </span>{p}</Link>}
          </li>
        ))}
      </ul>
      {page < pages ? <Link href={href(page + 1)} rel="next">Next →</Link> : <span className="pager-off" aria-hidden="true">Next →</span>}
    </nav>
  );
}
