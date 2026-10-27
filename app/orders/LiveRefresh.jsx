"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// DAY 46 — keeps Day 45's "live status" now that /orders is a server-rendered table.
// router.refresh() re-runs the SERVER page for the same URL (same sort, same page) and swaps in
// the new rows without a reload and without losing scroll. It renders nothing. It stops when no
// order on this page is still "placed", and it pauses while the tab is hidden.
export default function LiveRefresh({ active, everyMs = 5000 }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, everyMs);
    return () => clearInterval(id);
  }, [active, everyMs, router]);
  return null;
}
