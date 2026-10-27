import CartPanel from "./CartPanel";
import { NO_INDEX } from "@/lib/site";

// Private by nature (the cart lives in this browser), so it is noindex and disallowed in robots.js.
export const metadata = {
  title: "Cart",
  description: "Review the dishes in your cart before you check out. Your cart is kept in this browser.",
  robots: NO_INDEX,
};

// Static shell; the contents are client-rendered from the browser's own storage.
export default function CartPage() {
  return (
    <section>
      <h1>Your cart</h1>
      <CartPanel />
    </section>
  );
}
