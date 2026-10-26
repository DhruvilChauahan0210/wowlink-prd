import { shareCardSize, guideCard } from "../../e/share-card";
import { GUIDES, guide as findGuide } from "../../lib/guides";

// The share preview for a guide: its occasion's drawing and its title (see share-card.tsx).
export const size = shareCardSize;
export const contentType = "image/png";
export const alt = "A guide to sending invitations, from WowLink";
export const dynamicParams = false;
export const generateStaticParams = () => GUIDES.map((guide) => ({ slug: guide.slug }));

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const guide = findGuide((await params).slug) ?? GUIDES[0];
  return guideCard(guide.template, guide.title);
}
