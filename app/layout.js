import Link from "next/link";
import Image from "next/image";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";
import Analytics from "./Analytics";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, SITE_NAME, SITE_URL } from "@/lib/site";

// DAY 43 — FONTS. next/font self-hosts the font: the file is part of the build and is served from
// our own origin. No request to Google (this project builds with NO internet), no third party
// learning who visits, and a fallback face with matching metrics so the swap barely moves
// anything (that is what keeps CLS near zero). `display: "swap"` shows text at once.
// The files in app/fonts are Liberation Sans (SIL Open Font License, see LICENSE-Liberation.txt),
// subset to Latin. Want Inter instead? Download Inter-Variable.woff2 from rsms.me/inter, put it in
// app/fonts, and replace the `src` array below with: src: "./fonts/Inter-Variable.woff2"
const sans = localFont({
  src: [
    { path: "./fonts/LiberationSans-Regular.woff", weight: "400", style: "normal" },
    { path: "./fonts/LiberationSans-Bold.woff", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font-sans",
  fallback: ["system-ui", "Segoe UI", "Roboto", "sans-serif"],
});

// DAY 44 — SITE-WIDE DEFAULTS. Every page below inherits these and overrides only what it must.
//  * metadataBase turns relative paths ("/menu/3", the og:image files) into absolute URLs.
//    Without it social previews lose their picture. It is the production address from
//    NEXT_PUBLIC_SITE_URL (.env.production), never localhost.
//  * title.template: each page supplies only its own part -> "Menu · Addis Eats".
//    The home page sets no title, so it gets `default` and the template is not applied.
//  * openGraph here is only a fallback: a page that sets its own openGraph replaces it entirely.
export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { template: `%s · ${SITE_NAME}`, default: DEFAULT_TITLE },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: { siteName: SITE_NAME, locale: "en_ET", type: "website" },
  twitter: { card: "summary_large_image" },
};

// Root layout: still a SERVER component. The header and footer ship no JavaScript.
// <Providers> is a client component, but pages reach it as {children} (passed in, not
// imported), so every page inside it is still rendered on the server.
export default function RootLayout({ children }) {
  return (
    <html lang="en" className={sans.variable}>
      <body>
        <header className="bar">
          <Link href="/" className="brand">
            {/* A logo is an SVG (Image serves it as-is). alt is empty: the words beside it say the same thing. */}
            <Image src="/logo.svg" alt="" width={28} height={28} />
            Addis Eats
          </Link>
          <nav>
            <Link href="/menu">Menu</Link>
            <Link href="/cart">Cart</Link>
            <Link href="/checkout">Checkout</Link>
            <Link href="/orders">Orders</Link>
            <Link href="/signin">Sign in</Link>
          </nav>
        </header>
        <main>
          <Providers>{children}</Providers>
        </main>
        <footer className="foot">© Addis Eats · Day 46 — data representation</footer>
        {/* Third-party code, loaded last and lazily. Renders nothing unless a URL is configured. */}
        <Analytics />
      </body>
    </html>
  );
}
