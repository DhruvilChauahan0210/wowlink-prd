import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets the end-to-end tests build into their own folder while `next dev` keeps using .next.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: { formats: ["image/avif", "image/webp"] },
  // The Postgres client (app/lib/store-pg.ts) runs as plain Node on the server, not bundled.
  serverExternalPackages: ["postgres"],
};

export default nextConfig;
