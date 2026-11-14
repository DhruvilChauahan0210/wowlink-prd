import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WORDING_GUIDES, wordingGuide } from "../../lib/wording";
import { WordingGuideView, wordingGuideMetadata } from "../wording-view";

// A wording guide in English; its Gujarati and Hindi pages are ./[lang] (see wording-view.tsx).

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => WORDING_GUIDES.map((guide) => ({ slug: guide.slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return wordingGuideMetadata((await params).slug, "en");
}

export default async function WordingGuidePage({ params }: Props) {
  const { slug } = await params;
  if (!wordingGuide(slug)) notFound();
  return <WordingGuideView slug={slug} lang="en"/>;
}
