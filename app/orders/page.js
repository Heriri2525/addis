import Link from "next/link";
import { redirect } from "next/navigation";
import SignOutButton from "@/app/SignOutButton";
import EmptyState from "@/app/EmptyState";
import { listOrdersFor } from "@/lib/orders";
import { getSession } from "@/lib/session";
import { applyDemo, demoMode } from "@/lib/demo";
import { ORDERS_PAGE_SIZE } from "@/lib/constants";
import { ordersHref, paginate, parseOrderQuery, sortRows } from "@/lib/table-query.mjs";
import LiveRefresh from "./LiveRefresh";
import OrderTable from "./OrderTable";
import Pager from "./Pager";
import { NO_INDEX } from "@/lib/site";

export const metadata = {
  title: "My orders",
  description: "Your Addis Eats orders and their status. Sign in to see them.",
  robots: NO_INDEX,
};

const SORT_NAMES = { id: "order number", area: "area", status: "status", total: "total" };

// Day 46: a SERVER-rendered, sortable, paged table. Sort and page live in the URL
// (/orders?sort=total&dir=desc&page=2), so a view can be linked, refreshed and gone back to.
// Layers are unchanged: middleware (cookie exists) -> THIS check (session is real) -> the cancel
// action (ownership). The URL chooses ORDER and PAGE only; WHOSE orders is still the session's id.
// In Next 16 searchParams is a Promise, so it is awaited.
export default async function OrdersPage({ searchParams }) {
  const user = await getSession();
  if (!user) redirect("/signin?next=/orders"); // layer 2: do not trust that middleware ran

  const params = await searchParams;
  const forceEmpty = await applyDemo(demoMode(params)); // dev-only: ?demo=slow | empty | error

  const query = parseOrderQuery(params); // whitelisted: anything unknown falls back to a default
  const all = forceEmpty ? [] : listOrdersFor(user.id); // scoped to the SESSION's id
  const result = paginate(sortRows(all, query.sort, query.dir), query.page, ORDERS_PAGE_SIZE);

  // ?page=999 on a three-page list: send them to the last real page rather than show nothing.
  if (all.length > 0 && result.page !== query.page) {
    redirect(ordersHref({ sort: query.sort, dir: query.dir, page: result.page }));
  }

  const caption = `Your orders, sorted by ${SORT_NAMES[query.sort]} (${query.dir === "asc" ? "ascending" : "descending"}) · page ${result.page} of ${result.pages} · ${result.total} in all`;

  return (
    <section>
      <h1>My orders</h1>
      <div style={{ display: "flex", gap: ".75rem", alignItems: "center", flexWrap: "wrap", margin: "0 0 1rem" }}>
        <span className="muted">Signed in as {user.name}</span>
        {/* Showing these links is interface only. /kitchen and /dashboard refuse customers themselves. */}
        {user.role === "staff" && <Link href="/kitchen">Kitchen</Link>}
        {user.role === "staff" && <Link href="/dashboard">Dashboard</Link>}
        <SignOutButton />
      </div>

      {result.total === 0 ? (
        // THE EMPTY STATE: why it is empty, and what to do next. Not "No data".
        <EmptyState title="No orders yet" href="/menu" action="Browse the menu">
          When you place your first order it will appear here, with its status.
        </EmptyState>
      ) : (
        <>
          {/* aria-live: a screen reader hears the row change when a status changes */}
          <p className="muted live-note" aria-live="polite">
            {result.rows.some((o) => o.status === "placed")
              ? "Live: statuses on this page refresh every few seconds."
              : "Nothing on this page can change, so updates have stopped."}
          </p>
          <OrderTable orders={result.rows} query={query} caption={caption} />
          <Pager query={query} page={result.page} pages={result.pages} />
          <LiveRefresh active={result.rows.some((o) => o.status === "placed")} />
        </>
      )}
    </section>
  );
}
