"use client";

import Link from "next/link";
import { useCart } from "../providers";
import CheckoutButton from "./CheckoutButton";

// Client boundary for /cart: the cart is the person's own state, read from context.
// (CheckoutButton is imported from here, so it joins the client bundle without needing
// its own directive.)
export default function CartPanel() {
  const { items, total, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <>
        <p className="muted" style={{ marginBottom: "1rem" }}>Your cart is empty.</p>
        <p><Link href="/menu">Browse the menu</Link></p>
      </>
    );
  }
  return (
    <>
      <ul className="grid" style={{ marginBottom: "1rem" }}>
        {items.map((i) => (
          <li key={i.id} className="card">
            <h2>{i.name} × {i.qty}</h2>
            <p className="price">{i.price * i.qty} ETB</p>
          </li>
        ))}
      </ul>
      <p style={{ marginBottom: "1rem" }}><strong>Total: {total} ETB</strong></p>
      <div style={{ display: "flex", gap: ".75rem" }}>
        <CheckoutButton />
        <button className="btn alt" onClick={clearCart}>Clear</button>
      </div>
    </>
  );
}
