import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import SignOutButton from "@/app/SignOutButton";
import { getSession } from "@/lib/session";
import OrderForm from "./OrderForm";
import { NO_INDEX } from "@/lib/site";

export const metadata = {
  title: "Checkout",
  description: "Confirm your delivery area and TeleBirr phone number to place your Addis Eats order.",
  robots: NO_INDEX, // private: also disallowed in robots.js and kept out of the sitemap
};

async function LivePricing() {
  await new Promise((r) => setTimeout(r, 800)); // pretend: live pricing service
  return <p className="price" data-testid="pricing">Delivery today: 45 ETB (live price)</p>;
}

// PRIVATE. Layer 1 is middleware.js (a cookie exists); this is layer 2 (the session is real).
// The order itself is protected by layer 3, inside placeOrder.
export default async function CheckoutPage() {
  const user = await getSession(); // also what makes this route dynamic
  if (!user) redirect("/signin?next=/checkout");

  return (
    <section>
      <h1>Checkout</h1>
      <div style={{ display: "flex", gap: ".75rem", alignItems: "center", margin: "0 0 1rem" }}>
        <span className="muted">Signed in as {user.name}</span>
        <SignOutButton />
      </div>
      <Suspense fallback={<p className="muted">Fetching live pricing…</p>}>
        <LivePricing />
      </Suspense>
      <div style={{ margin: "1rem 0" }}>
        <OrderForm />
      </div>
      <p style={{ marginTop: "1rem" }}><Link href="/cart">← Back to cart</Link></p>
    </section>
  );
}
