import type { MetadataRoute } from "next";
import { invitationTemplates } from "./lib/invitations";
import { siteUrl } from "./lib/site";

/*
 * The pages search engines may list: the home page, the occasions and each occasion's page, and the privacy page.
 * Invitations, the studio and the manage pages are left out (and marked noindex): they're people's own.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const privacy = { languages: { en: `${siteUrl}/privacy`, gu: `${siteUrl}/privacy?lang=gu` } };
  return [
    { url: `${siteUrl}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${siteUrl}/templates`, changeFrequency: "monthly", priority: 0.8 },
    ...invitationTemplates.map((template) => ({ url: `${siteUrl}/templates/${template.id}`, changeFrequency: "monthly" as const, priority: 0.9 })),
    { url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.3, alternates: privacy },
    { url: `${siteUrl}/privacy?lang=gu`, changeFrequency: "yearly", priority: 0.3, alternates: privacy },
  ];
}
