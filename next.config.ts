import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets the end-to-end tests build into their own folder while `next dev` keeps using .next.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: { formats: ["image/avif", "image/webp"] },
  // The Postgres client (app/lib/store-pg.ts) runs as plain Node on the server, not bundled.
  serverExternalPackages: ["postgres"],
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
