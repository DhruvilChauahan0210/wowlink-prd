import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLang } from "../../../lib/invitations";
import { WORDING_GUIDES, wordingGuide } from "../../../lib/wording";
import { WordingGuideView, wordingGuideMetadata } from "../../wording-view";

// A wording guide in Gujarati or Hindi. Its address is /wording/<slug>?lang=<lang>: middleware.ts serves it from here.

type Props = { params: Promise<{ slug: string; lang: string }> };

export const dynamicParams = false;
// Both params: the [slug] page's own list doesn't reach this segment, and without the slugs nothing is built here, so on
// Vercel every one of these pages would be a 404.
export const generateStaticParams = () => WORDING_GUIDES.flatMap((guide) => ["gu", "hi"].map((lang) => ({ slug: guide.slug, lang })));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, lang } = await params;
  return isLang(lang) && lang !== "en" ? wordingGuideMetadata(slug, lang) : {};
}

export default async function WordingGuidePageInLanguage({ params }: Props) {
  const { slug, lang } = await params;
  if (!wordingGuide(slug) || !isLang(lang) || lang === "en") notFound();
  return <WordingGuideView slug={slug} lang={lang}/>;
}
