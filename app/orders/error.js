"use client";

// DAY 46 — the ERROR state for /orders: what failed, and a way to retry. Error boundaries must be
// client components. In production Next hides the real message (it may hold internals), so the
// words below are ours. Try it: /orders?demo=error (development only).
export default function OrdersError({ reset }) {
  return (
    <section role="alert">
      <h1>Your orders couldn’t load</h1>
      <p className="muted" style={{ margin: ".5rem 0 1rem" }}>
        Something went wrong on our side, and your orders are safe. Try again in a moment.
      </p>
      <button className="btn alt" onClick={() => reset()}>Try again</button>
    </section>
  );
}
