import { occasionCard, shareCardSize } from "../../../e/share-card";
import { invitationTemplates, isLang, isTemplateId } from "../../../lib/invitations";

// The share preview for an occasion's page in Gujarati or Hindi: its drawing and its heading in that language.
export const size = shareCardSize;
export const contentType = "image/png";
export const alt = "A hand-drawn invitation made with WowLink";
export const dynamicParams = false;
// Both params, as for the page itself (./page.tsx).
export const generateStaticParams = () => invitationTemplates.flatMap((template) => ["gu", "hi"].map((lang) => ({ id: template.id, lang })));

export default async function Image({ params }: { params: Promise<{ id: string; lang: string }> }) {
  const { id, lang } = await params;
  return occasionCard(isTemplateId(id) ? id : "wedding", isLang(lang) ? lang : "en");
}
