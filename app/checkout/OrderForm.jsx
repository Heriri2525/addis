"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { placeOrder } from "../actions";
import { useCart } from "../providers";
import { DELIVERY_AREAS, PHONE_HINT } from "@/lib/constants";

function FieldError({ messages }) {
  if (!messages?.length) return null;
  return <p className="error" role="alert">{messages[0]}</p>;
}

// Client leaf: useActionState gives the result AND the pending flag; there is no fetch,
// no URL and no JSON.stringify here. (The Day 33 version managed three states by hand.)
export default function OrderForm() {
  const [state, formAction, pending] = useActionState(placeOrder, null);
  const { items, total, clearCart } = useCart();
  const errors = state?.fieldErrors ?? {};
  const values = state?.values ?? {};

  // The cart lives in the browser (localStorage), so the browser empties it after success.
  useEffect(() => {
    if (state?.id) clearCart();
  }, [state?.id, clearCart]);

  if (state?.id) {
    return (
      <div className="notice" role="status">
        <strong>Order {state.id} placed.</strong> Total {state.total} {state.currency}.{" "}
        <Link href="/orders">See all orders</Link>
      </div>
    );
  }

  // noValidate: the browser's own checks are skipped so you see the SERVER's answers,
  // which are the ones that count.
  return (
    <form action={formAction} className="form" noValidate>
      <div className="notice">
        {items.length === 0 ? (
          <>Your cart is empty. <Link href="/menu">Browse the menu</Link></>
        ) : (
          <>{items.reduce((n, i) => n + i.qty, 0)} item(s) · {total} ETB (the server recalculates the price)</>
        )}
        <FieldError messages={errors.items} />
      </div>

      {/* Only dish ids and quantities travel. Prices are looked up on the server. */}
      <input
        type="hidden"
        name="items"
        value={JSON.stringify(items.map(({ id, qty }) => ({ id, qty })))}
      />

      <div className="field">
        <label htmlFor="name">Full name</label>
        <input id="name" name="name" defaultValue={values.name ?? ""} aria-invalid={Boolean(errors.name)} />
        <FieldError messages={errors.name} />
      </div>

      <div className="field">
        <label htmlFor="phone">TeleBirr phone</label>
        <input
          id="phone" name="phone" placeholder="0911223344" inputMode="tel"
          defaultValue={values.phone ?? ""} aria-invalid={Boolean(errors.phone)}
        />
        <p className="muted" style={{ fontSize: ".85rem" }}>{PHONE_HINT}</p>
        <FieldError messages={errors.phone} />
      </div>

      <div className="field">
        <label htmlFor="area">Delivery area</label>
        <select id="area" name="area" defaultValue={values.area ?? ""} aria-invalid={Boolean(errors.area)}>
          <option value="">Choose…</option>
          {DELIVERY_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <FieldError messages={errors.area} />
      </div>

      {state?.error && !state.fieldErrors && (
        <p className="error" role="alert">
          {state.error}.{" "}
          {state.error === "Not signed in" && <Link href="/signin?next=/checkout">Sign in again</Link>}
        </p>
      )}

      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Sending..." : "Place order"}
      </button>
    </form>
  );
}
