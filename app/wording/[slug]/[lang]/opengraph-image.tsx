import { shareCardSize, wordingCard } from "../../../e/share-card";
import { isLang } from "../../../lib/invitations";
import { WORDING_GUIDES, wordingGuide } from "../../../lib/wording";
import { wordingIn } from "../../../lib/wording-i18n";

// The share preview for a wording guide in Gujarati or Hindi: its occasion's drawing and its title in that language.
export const size = shareCardSize;
export const contentType = "image/png";
export const alt = "Invitation wording in English, Gujarati and Hindi, from WowLink";
export const dynamicParams = false;
// Both params, as for the page itself (./page.tsx).
export const generateStaticParams = () => WORDING_GUIDES.flatMap((guide) => ["gu", "hi"].map((lang) => ({ slug: guide.slug, lang })));

export default async function Image({ params }: { params: Promise<{ slug: string; lang: string }> }) {
  const { slug, lang } = await params;
  const guide = wordingGuide(slug) ?? WORDING_GUIDES[0];
  const language = isLang(lang) ? lang : "en";
  return wordingCard(guide.template, wordingIn(guide, language).title, language);
}
