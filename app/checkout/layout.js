// Everything under /checkout is rendered fresh on every request.
//
// WHY: app/checkout/page.js calls `await cookies()` to read the `session`
// cookie — a request-time read that on its own already makes this route dynamic.
// `force-dynamic` states that intent explicitly for the whole segment.
export const dynamic = "force-dynamic";

export default function CheckoutLayout({ children }) {
  return <div>{children}</div>;
}
