import Link from "next/link";
import { nextDir, ordersHref } from "@/lib/table-query.mjs";

// A column header that sorts. The sort lives in the URL, so it is a real link: shareable, works
// with the back button, and needs no JavaScript. Sorting always returns to page 1.
// aria-sort is what tells a screen reader the table is ordered, and by which column.
export default function SortHeader({ column, label, query, numeric = false }) {
  const active = query.sort === column;
  const ariaSort = active ? (query.dir === "asc" ? "ascending" : "descending") : undefined;
  const href = ordersHref({ sort: column, dir: nextDir(query, column), page: 1 });
  return (
    <th scope="col" aria-sort={ariaSort} className={numeric ? "num" : undefined}>
      <Link href={href} className="sort-link">
        {label}
        {/* the arrow is decoration: aria-sort already says it, so hide it from assistive tech */}
        <span aria-hidden="true">{active ? (query.dir === "asc" ? " ▲" : " ▼") : ""}</span>
      </Link>
    </th>
  );
}
