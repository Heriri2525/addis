"use client";

import Link from "next/link";
import { useCart } from "../../providers";

// Client leaf: needs an onClick and the cart context. `dish` is a plain object, so it
// can be passed from the server page. No callbacks cross the boundary.
export default function AddToCart({ dish }) {
  const { addToCart } = useCart();
  return (
    <div style={{ marginTop: "1rem", display: "flex", gap: ".75rem" }}>
      <button className="btn" onClick={() => addToCart(dish)}>Add to cart</button>
      <Link href="/cart" className="btn alt">Go to cart</Link>
    </div>
  );
}
