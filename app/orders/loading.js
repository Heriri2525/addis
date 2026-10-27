// DAY 46 — the LOADING state: a skeleton the shape of the content (a heading and five table rows),
// so nothing jumps when the data arrives. A spinner would only say "something is happening".
// Try it: /orders?demo=slow (development only).
export default function Loading() {
  return (
    <section aria-busy="true" aria-label="Loading your orders">
      <h1>My orders</h1>
      <div className="skel-rows">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skel-row" />
        ))}
      </div>
    </section>
  );
}
