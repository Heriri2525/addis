"use client";

// Error boundaries must be client components. Next passes { error, reset }.
export default function MenuError({ error, reset }) {
  return (
    <section role="alert">
      <h1>The menu couldn’t load</h1>
      <p className="muted" style={{ margin: ".5rem 0 1rem" }}>{error.message}</p>
      <button className="btn alt" onClick={() => reset()}>Try again</button>
    </section>
  );
}
