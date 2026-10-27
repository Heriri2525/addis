"use client";

// DAY 46 — ERROR for /dashboard: what failed, and a way to retry.
// Try it: /dashboard?demo=error (development only).
export default function DashboardError({ reset }) {
  return (
    <section role="alert">
      <h1>The dashboard couldn’t load</h1>
      <p className="muted" style={{ margin: ".5rem 0 1rem" }}>
        The numbers could not be gathered. Nothing is lost: try again in a moment.
      </p>
      <button className="btn alt" onClick={() => reset()}>Try again</button>
    </section>
  );
}
