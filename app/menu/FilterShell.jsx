"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

// Reads ?category= and ?crash= in the browser. It is its own tiny component so it can
// sit in its own <Suspense> boundary, beside {children} rather than around it.
function ActiveFilter({ counts }) {
  const params = useSearchParams();

  // Deliberate failure to prove error.js: open /menu?crash=1
  if (params.get("crash")) throw new Error("Deliberate crash from /menu?crash=1");

  const category = params.get("category");
  if (!category) return null;

  // `counts` came from the server: it is a plain object, so it can cross the boundary.
  // Checking against its keys also means only OUR category names reach the CSS below.
  const known = Object.hasOwn(counts, category);
  const hide = known
    ? `.dish-card:not([data-category=${JSON.stringify(category)}])`
    : ".dish-card";

  return (
    <>
      <style>{`${hide} { display: none; }`}</style>
      {!known && <p className="muted">No dishes in this category.</p>}
    </>
  );
}

// CLIENT shell. It never imports DishList: the server renders DishList first and passes
// the finished result in as {children}. Only this file (a few lines) ships to the browser.
export default function FilterShell({ counts, children }) {
  return (
    <>
      <Suspense fallback={null}>
        <ActiveFilter counts={counts} />
      </Suspense>
      {children}
    </>
  );
}
