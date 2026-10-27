"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import { readRaw, subscribe, addToCart, clearCart } from "./cart-store";

// The cart provider, extracted from the pages. A provider holds state, so it must be a
// client component. It lives in its own file so app/layout.js can stay a server component:
// layout.js passes {children} IN, it never imports anything client-only itself.
const CartContext = createContext(null);

export function Providers({ children }) {
  // server snapshot "[]" -> the static HTML is an empty cart, then the browser fills it in
  const raw = useSyncExternalStore(subscribe, readRaw, () => "[]");

  const value = useMemo(() => {
    const items = JSON.parse(raw);
    const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    return { items, total, addToCart, clearCart };
  }, [raw]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("useCart must be used inside <Providers>");
  return cart;
}
