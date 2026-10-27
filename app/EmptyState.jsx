import Link from "next/link";

// DAY 46 — the EMPTY state. Empty is not an error and not "No data": say why it is empty and
// give the next step. A server component (no state, no handlers), so it ships no JavaScript.
export default function EmptyState({ title, children, href, action }) {
  return (
    <div className="empty">
      <h2>{title}</h2>
      <p className="muted">{children}</p>
      {href && <Link href={href} className="btn alt">{action}</Link>}
    </div>
  );
}
