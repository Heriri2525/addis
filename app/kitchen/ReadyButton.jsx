"use client";

import { useState, useTransition } from "react";
import { markReady } from "../actions";

// Client leaf: a click handler and a pending flag. The role check is NOT here: it is inside markReady.
export default function ReadyButton({ orderId }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState(null);

  function onClick() {
    startTransition(async () => {
      const result = await markReady(orderId);
      setMessage(result?.error ?? null);
    });
  }

  return (
    <div style={{ marginTop: ".75rem" }}>
      <button className="btn" onClick={onClick} disabled={pending}>
        {pending ? "Updating…" : "Mark ready"}
      </button>
      {message && <p className="error" role="alert">{message}</p>}
    </div>
  );
}
