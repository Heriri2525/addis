/** @type {import('next').NextConfig} */
const nextConfig = {
  // Day 37 teaches the classic route-segment model (revalidate, dynamic,
  // generateStaticParams). With cacheComponents: true Next 16 rejects those
  // exports, so it is switched off explicitly here (the Day 36 scaffold had it on).
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  // DAY 43 — IMAGES. Remote hosts must be listed or next/image throws, on purpose:
  // it stops your optimiser being used to resize other people's images.
  // Nothing in the app loads from this host yet; it is here for when dish photos move to a CDN.
  images: {
    formats: ["image/avif", "image/webp"], // AVIF first, WebP as the fallback, JPEG last
    remotePatterns: [{ protocol: "https", hostname: "cdn.addiseats.et" }],
  },

  // DAY 43 — CONFIGURATION, NOT CODE. Static rules belong here, not in middleware.js,
  // so the middleware stays fast and narrow.
  async redirects() {
    return [
      // an old URL from before the menu had its own section
      { source: "/food", destination: "/menu", permanent: true },
      { source: "/food/:id", destination: "/menu/:id", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
