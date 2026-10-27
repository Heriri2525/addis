import { useEffect, useState } from "react";

// DAY 45 — DEBOUNCE. Returns `value`, but only after it has stopped changing for `delay` ms.
// Each keystroke changes `value`, which restarts the timer (the cleanup cancels the previous one),
// so typing "kitfo" quickly produces ONE update, 300 ms after the last letter.
// Client-only: it uses hooks, so import it from a "use client" file.
export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
