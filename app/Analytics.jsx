import Script from "next/script";

// DAY 43 — THIRD-PARTY SCRIPTS. Somebody else's JavaScript can outweigh the whole app, so:
//   * it only loads if NEXT_PUBLIC_ANALYTICS_SRC is set (empty in .env, so nothing loads by default)
//   * strategy="lazyOnload" waits for browser idle time: the person gets a usable page first
// The URL is NEXT_PUBLIC_ on purpose: it is the address of a script the browser downloads, so it
// is public by nature. It is inlined at build time, so changing it means rebuilding.
export default function Analytics() {
  const src = process.env.NEXT_PUBLIC_ANALYTICS_SRC;
  if (!src) return null;
  return <Script src={src} strategy="lazyOnload" />;
}
