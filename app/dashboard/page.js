import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import EmptyState from "@/app/EmptyState";
import { getDashboardData } from "@/lib/analytics";
import { etb } from "@/lib/format";
import { getSession } from "@/lib/session";
import { applyDemo, demoMode } from "@/lib/demo";
import { NO_INDEX } from "@/lib/site";
import DataTable from "./DataTable";
import OrdersChart from "./OrdersChart";
import RevenueChart from "./RevenueChart";

export const metadata = {
  title: "Dashboard",
  description: "Staff view of revenue by neighbourhood and orders per day. Staff accounts only.",
  robots: NO_INDEX,
};

// STAFF ONLY, checked on the server, exactly like /kitchen. The numbers cover everyone's orders,
// so a customer gets a 404 and the page does not even confirm that it exists.
//
// This page is a SERVER component: it reads the session, AGGREGATES (30 daily rows and 5 area
// rows cross to the browser, never every order) and renders the tables itself. The only client
// code on the page is the two chart leaves. Nothing but plain arrays and numbers crosses.
export default async function DashboardPage({ searchParams }) {
  const user = await getSession();
  if (!user) redirect("/signin?next=/dashboard");
  if (user.role !== "staff") notFound();

  const params = await searchParams;
  const forceEmpty = await applyDemo(demoMode(params)); // dev-only: ?demo=slow | empty | error

  const { revenue, daily, range, orderCount } = getDashboardData({ empty: forceEmpty });

  if (orderCount === 0) {
    return (
      <section>
        <h1>Dashboard</h1>
        <EmptyState title="No orders to chart yet" href="/menu" action="Open the menu">
          Revenue and daily totals appear here as soon as the first order is placed.
        </EmptyState>
      </section>
    );
  }

  const top = [...revenue].sort((a, b) => b.revenue - a.revenue)[0];
  const totalRevenue = revenue.reduce((s, r) => s + r.revenue, 0);
  const peak = [...daily].sort((a, b) => b.orders - a.orders)[0];

  return (
    <section>
      <h1>Dashboard</h1>
      <p className="muted" style={{ margin: "0 0 1.25rem" }}>
        Signed in as {user.name} (staff) · <Link href="/kitchen">Kitchen</Link> · cancelled orders are not counted.
        {" "}Figures before today are demonstration data.
      </p>

      <section aria-labelledby="rev-h" className="panel">
        <h2 id="rev-h">Revenue by neighbourhood, {range} (ETB)</h2>
        <p className="muted">{top.area} earned the most: {etb(top.revenue)} of {etb(totalRevenue)}.</p>
        <RevenueChart
          data={revenue}
          label={`Bar chart of revenue in ETB by neighbourhood, ${range}. ${top.area} is highest at ${etb(top.revenue)}. The same figures are in the table below.`}
        />
        <DataTable
          caption={`Revenue by neighbourhood, ${range}`}
          columns={[
            { key: "area", label: "Neighbourhood" },
            { key: "orders", label: "Orders", numeric: true },
            { key: "revenue", label: "Revenue", numeric: true, format: etb },
          ]}
          rows={revenue}
          footer={{ area: "All areas", orders: revenue.reduce((s, r) => s + r.orders, 0), revenue: etb(totalRevenue) }}
        />
      </section>

      <section aria-labelledby="day-h" className="panel">
        <h2 id="day-h">Orders per day, {range} (number of orders)</h2>
        <p className="muted">The busiest day was {peak.label}, with {peak.orders} orders.</p>
        <OrdersChart
          data={daily}
          label={`Line chart of orders per day, ${range}. The busiest day was ${peak.label} with ${peak.orders} orders. The same figures are in the table below.`}
        />
        <DataTable
          caption={`Orders per day, ${range}`}
          label="Orders per day (scrolls)"
          scroll
          columns={[
            { key: "label", label: "Day" },
            { key: "orders", label: "Orders", numeric: true },
          ]}
          rows={daily}
        />
      </section>
    </section>
  );
}
