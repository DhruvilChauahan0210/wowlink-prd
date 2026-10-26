import { guideCard, shareCardSize } from "../../../e/share-card";
import { GUIDES, guide as findGuide } from "../../../lib/guides";
import { guideIn } from "../../../lib/guides-i18n";
import { isLang } from "../../../lib/invitations";

// The share preview for a guide in Gujarati or Hindi: its occasion's drawing and its title in that language.
export const size = shareCardSize;
export const contentType = "image/png";
export const alt = "A guide to sending invitations, from WowLink";
export const dynamicParams = false;
// Both params, as for the page itself (./page.tsx).
export const generateStaticParams = () => GUIDES.flatMap((guide) => ["gu", "hi"].map((lang) => ({ slug: guide.slug, lang })));

export default async function Image({ params }: { params: Promise<{ slug: string; lang: string }> }) {
  const { slug, lang } = await params;
  const guide = findGuide(slug) ?? GUIDES[0];
  const language = isLang(lang) ? lang : "en";
  return guideCard(guide.template, guideIn(guide, language).title, language);
}
