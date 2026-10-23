import type { MetadataRoute } from "next";
import { LANGS, invitationTemplates, langHref } from "./lib/invitations";
import { siteUrl } from "./lib/site";

/*
 * The pages search engines may list: the home page, the occasions and each occasion's page, and pricing, help and
 * privacy in each language.
 * Invitations, the studio and the manage pages are left out (and marked noindex): they're people's own.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  // A page in every language, each listing the others.
  const everyLanguage = (path: string, priority: number, changeFrequency: "monthly" | "yearly") => {
    const alternates = { languages: Object.fromEntries(LANGS.map((lang) => [lang, `${siteUrl}${langHref(path, lang)}`])) };
    return LANGS.map((lang) => ({ url: `${siteUrl}${langHref(path, lang)}`, changeFrequency, priority, alternates }));
  };
  return [
    { url: `${siteUrl}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${siteUrl}/templates`, changeFrequency: "monthly", priority: 0.8 },
    ...invitationTemplates.map((template) => ({ url: `${siteUrl}/templates/${template.id}`, changeFrequency: "monthly" as const, priority: 0.9 })),
    ...everyLanguage("/pricing", 0.6, "monthly"),
    ...everyLanguage("/help", 0.5, "monthly"),
    ...everyLanguage("/privacy", 0.3, "yearly"),
  ];
}
