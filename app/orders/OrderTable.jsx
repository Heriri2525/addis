import { etb } from "@/lib/format";
import CancelButton from "./CancelButton";
import SortHeader from "./SortHeader";

// A SERVER component: real table markup. caption names it, th scope="col" ties each cell to its
// heading, aria-sort says how it is ordered. Numbers are right-aligned (class "num") and use
// tabular figures so a column of ETB lines up. The scroll wrapper is a labelled region and is
// focusable, so a keyboard user can scroll a wide table on a narrow screen.
// CancelButton is a client leaf placed inside a server table: only that button ships JavaScript.
export default function OrderTable({ orders, query, caption }) {
  return (
    <div className="table-scroll" role="region" aria-label="Your orders (scrolls sideways on a narrow screen)" tabIndex={0}>
      <table className="data">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <SortHeader column="id" label="Order" query={query} />
            <SortHeader column="area" label="Area" query={query} />
            <th scope="col">Items</th>
            <SortHeader column="status" label="Status" query={query} />
            <SortHeader column="total" label="Total" query={query} numeric />
            <th scope="col"><span className="visually-hidden">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <th scope="row">{o.id}</th>
              <td>{o.area}</td>
              <td>{o.items.map((i) => `${i.name} × ${i.qty}`).join(", ")}</td>
              <td>
                <span data-testid={`status-${o.id}`} className={`status status-${o.status}`}>{o.status}</span>
              </td>
              <td className="num">{etb(o.total)}</td>
              <td>{o.status === "placed" && <CancelButton orderId={o.id} />}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
