import { occasionCard, shareCardSize } from "../../e/share-card";
import { invitationTemplates, isTemplateId } from "../../lib/invitations";

// The share preview for an occasion's page: its drawing and its heading (see share-card.tsx).
export const size = shareCardSize;
export const contentType = "image/png";
export const alt = "A hand-drawn invitation made with WowLink";
export const dynamicParams = false;
export const generateStaticParams = () => invitationTemplates.map((template) => ({ id: template.id }));

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return occasionCard(isTemplateId(id) ? id : "wedding");
}
