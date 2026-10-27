import Link from "next/link";
import Image from "next/image";

// SERVER component (no directive): still ships no JavaScript of its own.
//
// width/height are the ASPECT RATIO of the file (4:3), not the displayed size. They let the
// browser reserve the space before the photo arrives, so the grid does not jump (CLS).
// `sizes` tells the browser how wide the card really is, so it downloads a ~300px version
// instead of the largest one. Cards sit at 15rem+ in a grid, and go full width under 640px.
// No `priority` here: only one image per page may have it, and on /menu none needs it.
export default function DishCard({ dish }) {
  return (
    <li className="card dish-card" data-category={dish.category}>
      <Image
        className="dish-img"
        src={`/dishes/${dish.slug}.jpg`}
        alt={`${dish.name}, ${dish.category.toLowerCase()} dish`}
        width={400}
        height={300}
        sizes="(max-width: 640px) 100vw, 300px"
      />
      <h2><Link href={`/menu/${dish.id}`}>{dish.name}</Link></h2>
      <p className="muted">{dish.category}{dish.spicy ? " · 🌶 spicy" : ""}</p>
      <p className="price">{dish.price} ETB</p>
    </li>
  );
}
