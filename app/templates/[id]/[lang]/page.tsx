import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { invitationTemplates, isLang, isTemplateId } from "../../../lib/invitations";
import { OccasionView, occasionMetadata } from "../occasion-view";

// An occasion's page in Gujarati or Hindi. Its address is /templates/<id>?lang=<lang>: middleware.ts serves it from here.

type Props = { params: Promise<{ id: string; lang: string }> };

export const dynamicParams = false;
// Both params: the [id] page's own list doesn't reach this segment (only a layout's would), and without the ids nothing
// is built here, so on Vercel every one of these pages would be a 404.
export const generateStaticParams = () => invitationTemplates.flatMap((template) => ["gu", "hi"].map((lang) => ({ id: template.id, lang })));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, lang } = await params;
  return isTemplateId(id) && isLang(lang) && lang !== "en" ? occasionMetadata(id, lang) : {};
}

export default async function OccasionPageInLanguage({ params }: Props) {
  const { id, lang } = await params;
  if (!isTemplateId(id) || !isLang(lang) || lang === "en") notFound();
  return <OccasionView id={id} lang={lang}/>;
}
