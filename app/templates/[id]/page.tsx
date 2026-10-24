import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { invitationTemplates, isTemplateId } from "../../lib/invitations";
import { OccasionView, occasionMetadata } from "./occasion-view";

// An occasion's page in English; its Gujarati and Hindi pages are ./[lang] (see occasion-view.tsx).

type Props = { params: Promise<{ id: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => invitationTemplates.map((template) => ({ id: template.id }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return isTemplateId(id) ? occasionMetadata(id, "en") : {};
}

export default async function OccasionPage({ params }: Props) {
  const { id } = await params;
  if (!isTemplateId(id)) notFound();
  return <OccasionView id={id} lang="en"/>;
}
