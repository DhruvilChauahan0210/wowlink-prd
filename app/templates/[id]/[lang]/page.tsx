import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLang, isTemplateId } from "../../../lib/invitations";
import { OccasionView, occasionMetadata } from "../occasion-view";

// An occasion's page in Gujarati or Hindi. Its address is /templates/<id>?lang=<lang>: middleware.ts serves it from here.

type Props = { params: Promise<{ id: string; lang: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => [{ lang: "gu" }, { lang: "hi" }];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, lang } = await params;
  return isTemplateId(id) && isLang(lang) && lang !== "en" ? occasionMetadata(id, lang) : {};
}

export default async function OccasionPageInLanguage({ params }: Props) {
  const { id, lang } = await params;
  if (!isTemplateId(id) || !isLang(lang) || lang === "en") notFound();
  return <OccasionView id={id} lang={lang}/>;
}
