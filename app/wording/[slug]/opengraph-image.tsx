import { shareCardSize, wordingCard } from "../../e/share-card";
import { WORDING_GUIDES, wordingGuide } from "../../lib/wording";

// The share preview for a wording guide: its occasion's drawing and its title (see share-card.tsx).
export const size = shareCardSize;
export const contentType = "image/png";
export const alt = "Invitation wording in English, Gujarati and Hindi, from WowLink";
export const dynamicParams = false;
export const generateStaticParams = () => WORDING_GUIDES.map((guide) => ({ slug: guide.slug }));

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const guide = wordingGuide((await params).slug) ?? WORDING_GUIDES[0];
  return wordingCard(guide.template, guide.title);
}
