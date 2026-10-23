/**
 * The public address, for absolute URLs: share previews (og:image and friends), the sitemap and robots.txt.
 * Set NEXT_PUBLIC_SITE_URL to the public domain when deploying.
 */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")).replace(/\/+$/, "");
