import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets the end-to-end tests build into their own folder while `next dev` keeps using .next.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: { formats: ["image/avif", "image/webp"] },
  // The Postgres client (app/lib/store-pg.ts) runs as plain Node on the server, not bundled.
  serverExternalPackages: ["postgres"],
  // The share-preview images read their fonts from app/fonts/og at run time (app/e/share-card.tsx), which the bundler
  // can't see: ship them with those routes (on Vercel they'd be missing otherwise).
  outputFileTracingIncludes: { "/**/opengraph-image*": ["./app/fonts/og/*.ttf"] },
  // Basic protections on every page: no sniffing file types, no framing by other sites, links don't leak full
  // addresses, and no camera, microphone or location.
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    }];
  },
};

export default nextConfig;
