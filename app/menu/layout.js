import { Suspense } from "react";
import Sidebar, { SidebarFallback } from "./Sidebar";
import MenuCounter from "./MenuCounter";

// Wraps /menu and every route below it. It stays mounted when you go from
// /menu to /menu/3, so the sidebar and the counter keep their state and scroll.
// Section default (Day 44): any page under /menu that sets no description of its own gets this one.
export const metadata = {
  description: "Browse the Addis Eats menu and order dishes for delivery across Addis Ababa.",
};

export default function MenuLayout({ children }) {
  return (
    <div className="shell">
      <aside className="side" aria-label="Categories">
        <h2>Categories</h2>
        {/* useSearchParams in Sidebar needs a Suspense boundary to stay static */}
        <Suspense fallback={<SidebarFallback />}>
          <Sidebar />
        </Suspense>
        <MenuCounter />
      </aside>
      <div>{children}</div>
    </div>
  );
}
