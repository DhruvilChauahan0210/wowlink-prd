import type { MetadataRoute } from "next";
import { siteUrl } from "./lib/site";

/*
 * Crawlers may read everything except the API and the hosts' private pages. Invitations (/e/…) aren't blocked here
 * on purpose: they carry noindex, which a crawler can only see if it may fetch them, and link-preview bots (WhatsApp,
 * X, Slack) need them for the share card.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/manage/", "/mine", "/admin"] },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
