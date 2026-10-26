import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GUIDES, guide as findGuide } from "../../../lib/guides";
import { isLang } from "../../../lib/invitations";
import { GuideView, guideMetadata } from "../../guide-view";

// A guide in Gujarati or Hindi. Its address is /guides/<slug>?lang=<lang>: middleware.ts serves it from here.

type Props = { params: Promise<{ slug: string; lang: string }> };

export const dynamicParams = false;
// Both params: the [slug] page's own list doesn't reach this segment, and without the slugs nothing is built here, so on
// Vercel every one of these pages would be a 404.
export const generateStaticParams = () => GUIDES.flatMap((guide) => ["gu", "hi"].map((lang) => ({ slug: guide.slug, lang })));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, lang } = await params;
  return isLang(lang) && lang !== "en" ? guideMetadata(slug, lang) : {};
}

export default async function GuidePageInLanguage({ params }: Props) {
  const { slug, lang } = await params;
  if (!findGuide(slug) || !isLang(lang) || lang === "en") notFound();
  return <GuideView slug={slug} lang={lang}/>;
}
