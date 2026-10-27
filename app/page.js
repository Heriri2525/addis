import Link from "next/link";
import Image from "next/image";
import JsonLd from "./JsonLd";
import { DELIVERY_AREAS } from "@/lib/constants";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, SITE_NAME, absoluteUrl, openGraphFor } from "@/lib/site";

// No `title` here on purpose: the home page uses the root layout's `default`, and the title
// template is not applied to it. The description and canonical are its own.
export const metadata = {
  description: DEFAULT_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: openGraphFor({ title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, path: "/" }),
};

// Restaurant structured data. Every fact in it is also visible on this page (name, cuisine, the
// delivery areas, the menu link): structured data that describes something the page does not
// show is treated as deception. No address or opening hours are claimed because the page has none.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: SITE_NAME,
  url: absoluteUrl("/"),
  image: absoluteUrl("/hero.jpg"),
  servesCuisine: "Ethiopian",
  hasMenu: absoluteUrl("/menu"),
  areaServed: DELIVERY_AREAS.map((area) => ({ "@type": "Place", name: `${area}, Addis Ababa` })),
};

export default function Home() {
  return (
    <section>
      <JsonLd data={jsonLd} />
      <h1>Welcome to Addis Eats</h1>
      <p className="muted" style={{ marginBottom: "1rem" }}>
        Doro wat, kitfo, shiro and more — straight from the kitchen.
      </p>

      {/* The hero is the LARGEST image visible without scrolling, so it is the LCP element and the
          ONE image on this page allowed `priority` (no lazy loading, preloaded). `fill` is for
          when the size is set by the container: .hero reserves the space (aspect-ratio), so
          nothing jumps. Its alt is empty because it is decoration; the heading says it all. */}
      <div className="hero">
        <Image
          src="/hero.jpg"
          alt=""
          fill
          priority
          sizes="(max-width: 896px) 100vw, 896px"
          style={{ objectFit: "cover" }}
        />
      </div>

      <p style={{ marginBottom: "1rem" }}>
        We deliver across Addis Ababa: {DELIVERY_AREAS.join(", ")}.
      </p>
      <Link href="/menu" className="btn alt">See the menu</Link>
    </section>
  );
}
