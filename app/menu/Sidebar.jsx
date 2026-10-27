"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CATEGORIES } from "./categories";

const href = (c) => (c === "All" ? "/menu" : `/menu?category=${encodeURIComponent(c)}`);

export function SidebarFallback() {
  return (
    <ul>
      {CATEGORIES.map((c) => (
        <li key={c}><Link href={href(c)}>{c}</Link></li>
      ))}
    </ul>
  );
}

// Client component: reads the query string in the browser, so /menu stays static.
export default function Sidebar() {
  const active = useSearchParams().get("category") ?? "All";
  return (
    <ul>
      {CATEGORIES.map((c) => (
        <li key={c}>
          <Link href={href(c)} className={c === active ? "on" : ""}>{c}</Link>
        </li>
      ))}
    </ul>
  );
}
