import type { MetadataRoute } from "next";
import { GUIDES } from "./lib/guides";
import { LANGS, invitationTemplates, langHref } from "./lib/invitations";
import { siteUrl } from "./lib/site";
import { WORDING_GUIDES } from "./lib/wording";

/*
 * The pages search engines may list: the home page, the occasions, each occasion's page in each language, the invitation
 * wording guides, the how-to guides, and pricing, help and privacy in each language.
 * Invitations, the studio and the manage pages are left out (and marked noindex): they're people's own.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  // A page in every language, each listing the others (and English for anyone else).
  const everyLanguage = (path: string, priority: number, changeFrequency: "monthly" | "yearly", lastModified?: string) => {
    const alternates = { languages: { ...Object.fromEntries(LANGS.map((lang) => [lang, `${siteUrl}${langHref(path, lang)}`])), "x-default": `${siteUrl}${path}` } };
    return LANGS.map((lang) => ({ url: `${siteUrl}${langHref(path, lang)}`, changeFrequency, priority, alternates, ...(lastModified && { lastModified }) }));
  };
  return [
    { url: `${siteUrl}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${siteUrl}/templates`, changeFrequency: "monthly", priority: 0.8 },
    ...invitationTemplates.flatMap((template) => everyLanguage(`/templates/${template.id}`, 0.9, "monthly")),
    ...everyLanguage("/wording", 0.7, "monthly"),
    ...WORDING_GUIDES.flatMap((guide) => everyLanguage(`/wording/${guide.slug}`, 0.8, "monthly")),
    ...everyLanguage("/guides", 0.7, "monthly"),
    ...GUIDES.flatMap((guide) => everyLanguage(`/guides/${guide.slug}`, 0.8, "monthly", guide.published)),
    ...everyLanguage("/pricing", 0.6, "monthly"),
    ...everyLanguage("/help", 0.5, "monthly"),
    ...everyLanguage("/privacy", 0.3, "yearly"),
  ];
}
