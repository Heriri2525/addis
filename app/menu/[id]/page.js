import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import JsonLd from "@/app/JsonLd";
import { NO_INDEX, absoluteUrl, clip, openGraphFor, withBrand } from "@/lib/site";
import { getDish, getDishes } from "../dishes";
import AddToCart from "./AddToCart";

// One static HTML page per dish, built at `next build` time.
// (ids must be strings.) A dish added after the build is rendered on first
// request and then cached, because dynamicParams defaults to true.
export async function generateStaticParams() {
  const dishes = await getDishes();
  return dishes.map((d) => ({ id: String(d.id) }));
}

// DAY 44 — METADATA FROM DATA. Runs on the server before the page renders, with the same params
// (a Promise in Next 15/16, so it is awaited). It asks for the dish exactly as the page does;
// getDish is wrapped in cache(), so the two calls cost one lookup.
//
// Every dish gets its OWN description, built from its record. The same sentence on twelve pages
// would tell a crawler they are duplicates. No `openGraph.images` here: the generated
// opengraph-image.jsx next to this file supplies the 1200x630 card for each dish.
export async function generateMetadata({ params }) {
  const { id } = await params;
  const dish = await getDish(id);
  if (!dish) return { title: "Dish not found", robots: NO_INDEX };

  const path = `/menu/${dish.id}`; // canonical even if the visitor typed /menu/01
  // name + price + the dish's own sentence + where it is delivered; clip() keeps it near 160 characters
  const description = clip(`${dish.name} — ${dish.price} ETB. ${dish.description} Delivered across Addis Ababa.`);
  return {
    title: dish.name,
    description,
    alternates: { canonical: path },
    openGraph: openGraphFor({ title: withBrand(dish.name), description, path }),
  };
}

export default async function DishPage({ params }) {
  const { id } = await params; // Next 15/16: params is a Promise
  const dish = await getDish(id);
  if (!dish) notFound();

  // Structured data from the SAME object this page renders below: the name is the h1, and the
  // price is the "{dish.price} ETB" line. If the page changes, this changes with it.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MenuItem",
    name: dish.name,
    description: dish.description,
    image: absoluteUrl(`/dishes/${dish.slug}.jpg`),
    url: absoluteUrl(`/menu/${dish.id}`),
    offers: {
      "@type": "Offer",
      price: dish.price,
      priceCurrency: "ETB",
      url: absoluteUrl(`/menu/${dish.id}`),
    },
  };

  return (
    <article className="card">
      <JsonLd data={jsonLd} />
      <p><Link href="/menu">← Back to menu</Link></p>
      {/* The one big image above the fold on this page, so it is the one with `priority`. */}
      <Image
        className="dish-img"
        src={`/dishes/${dish.slug}.jpg`}
        alt={`${dish.name}, ${dish.category.toLowerCase()} dish`}
        width={800}
        height={600}
        priority
        sizes="(max-width: 640px) 100vw, 600px"
      />
      <h1>{dish.name}</h1>
      <p className="muted">{dish.category}{dish.spicy ? " · 🌶 spicy" : ""}{dish.special ? " · ⭐ special" : ""}</p>
      <p style={{ margin: ".75rem 0" }}>{dish.description}</p>
      <p className="price">{dish.price} ETB</p>
      <AddToCart dish={{ id: dish.id, name: dish.name, price: dish.price }} />
    </article>
  );
}
