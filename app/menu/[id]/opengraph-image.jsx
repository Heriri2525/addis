import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getDish } from "../dishes";

// DAY 44 — one preview card per dish, drawn from JSX on the server. The file name is the API:
// Next.js adds <meta property="og:image"> for /menu/[id] by itself, as an absolute URL
// (it needs metadataBase), and it overrides app/menu/opengraph-image.jpg for this route.
//
// ImageResponse supports a SMALL subset of CSS: flexbox and basic properties, no grid, no external
// stylesheet, and every element with more than one child needs display: "flex". Failures are
// silent, so open /menu/1/opengraph-image in the browser after every change.
export const alt = "Addis Eats dish preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The dish photo is read from public/ and embedded as a data URI. If the file cannot be read
// (some hosts do not bundle public/ into server functions) the card simply has no photo.
async function photoDataUri(slug) {
  try {
    const file = await readFile(path.join(process.cwd(), "public", "dishes", `${slug}.jpg`));
    return `data:image/jpeg;base64,${file.toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function Image({ params }) {
  const { id } = await params;
  const dish = await getDish(id);
  const photo = dish ? await photoDataUri(dish.slug) : null;

  const name = dish ? dish.name : "Addis Eats";
  const line = dish ? `${dish.category}${dish.spicy ? " · Spicy" : ""}` : "Ethiopian food, ordered from your phone";

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#1f1a14", color: "#fffaf0" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flex: 1,
            padding: 64,
          }}
        >
          <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: "#f4b400", letterSpacing: 4 }}>
            ADDIS EATS
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: name.length > 12 ? 84 : 104, fontWeight: 700, lineHeight: 1.05 }}>
              {name}
            </div>
            <div style={{ display: "flex", fontSize: 38, color: "#eadfc4", marginTop: 20 }}>{line}</div>
          </div>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 700, color: "#f4b400" }}>
            {dish ? `${dish.price} ETB` : "addiseats.et"}
          </div>
        </div>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} width={520} height={630} style={{ objectFit: "cover" }} alt="" />
        ) : null}
      </div>
    ),
    { ...size },
  );
}
