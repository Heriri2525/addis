"use client";

import { useState } from "react";

// Lives in the menu layout. If the layout truly persists, this count survives
// navigating /menu -> /menu/3 -> /menu.
export default function MenuCounter() {
  const [n, setN] = useState(0);
  return (
    <p className="counter">
      Layout counter: <strong data-testid="counter">{n}</strong>
      <button onClick={() => setN(n + 1)} aria-label="Increment layout counter">+1</button>
    </p>
  );
}
