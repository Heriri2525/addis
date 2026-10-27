// DAY 46 — LOADING for /dashboard: a skeleton shaped like the page (heading, a chart-sized block,
// a few table rows), not a centred spinner. Try it: /dashboard?demo=slow (development only).
export default function Loading() {
  return (
    <section aria-busy="true" aria-label="Loading the dashboard">
      <h1>Dashboard</h1>
      <div className="skel chart-skel" />
      <div className="skel-rows">
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skel-row" />)}
      </div>
    </section>
  );
}
