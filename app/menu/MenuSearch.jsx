"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { fetcher, retryOnlyServerErrors } from "@/lib/fetcher";
import { useDebouncedValue } from "@/lib/use-debounced-value";

const DEBOUNCE_MS = 300;
const MIN_CHARS = 2;

// DAY 45 — THE ONE DEBOUNCED SEARCH. Client-side because it is triggered by typing: the server
// cannot know what will be typed. The rest of /menu stays a static, indexable server render.
//
//   text      what is in the box right now (changes on every keystroke)
//   query     the same text after 300 ms of silence (changes once per pause)
//   key       the URL SWR fetches; null means "do not fetch" (box empty or too short)
//
// The seed: while the box is empty, {children} is shown. That is the full menu, rendered on the
// server and passed in, so a search box never replaces data we already had with a spinner.
export default function MenuSearch({ children }) {
  const [text, setText] = useState("");
  const query = useDebouncedValue(text.trim(), DEBOUNCE_MS);
  const key = query.length >= MIN_CHARS ? `/api/dishes?q=${encodeURIComponent(query)}` : null;

  const { data, error, isLoading } = useSWR(key, fetcher, {
    keepPreviousData: true, // show the last results while the next ones load: no flicker per pause
    revalidateOnFocus: false, // a menu does not change because the tab regained focus
    onErrorRetry: retryOnlyServerErrors,
  });

  // keepPreviousData would hand back old results even after the key went back to null, so the
  // decision to show results is made from `key`, not from `data`.
  const searching = key !== null;
  const waiting = text.trim() !== query || isLoading; // typed since the last request, or one is in flight

  return (
    <>
      <div className="search">
        <label htmlFor="menu-search" className="search-label">Search the menu</label>
        <input
          id="menu-search"
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={50}
          placeholder="Try “kitfo”, “lentil” or “breakfast”"
          autoComplete="off"
        />
      </div>

      {!searching ? (
        <>
          {text.trim().length > 0 && <p className="muted">Keep typing: search starts at {MIN_CHARS} letters.</p>}
          {children}
        </>
      ) : (
        <div aria-live="polite" data-testid="search-results">
          {error ? (
            <p className="error" role="alert">Search is unavailable right now. Please try again.</p>
          ) : data === undefined ? (
            <p className="muted">Searching…</p>
          ) : (
            <>
              <p className="muted" style={{ marginBottom: ".75rem" }}>
                {waiting ? "Searching… " : ""}
                {data.length === 0
                  ? `No dishes match “${query}”.`
                  : `${data.length} ${data.length === 1 ? "dish matches" : "dishes match"} “${query}”.`}
              </p>
              <ul className="grid">
                {data.map((d) => (
                  <li key={d.id} className="card search-result">
                    <h2><Link href={`/menu/${d.id}`}>{d.name}</Link></h2>
                    <p className="muted">{d.category}{d.spicy ? " · 🌶 spicy" : ""}</p>
                    <p className="price">{d.price} ETB</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </>
  );
}
