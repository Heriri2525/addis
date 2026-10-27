import Link from "next/link";

// Root not-found: used for unknown URLs and for notFound() calls.
export default function NotFound() {
  return (
    <section>
      <h1>404 — Nothing here</h1>
      <p className="muted" style={{ margin: ".5rem 0 1rem" }}>
        That page or dish doesn’t exist.
      </p>
      <Link href="/menu" className="btn alt">Back to the menu</Link>
    </section>
  );
}
