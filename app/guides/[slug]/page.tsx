import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GUIDES, guide as findGuide } from "../../lib/guides";
import { GuideView, guideMetadata } from "../guide-view";

// A guide in English; its Gujarati and Hindi pages are ./[lang] (see guide-view.tsx).

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => GUIDES.map((guide) => ({ slug: guide.slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return guideMetadata((await params).slug, "en");
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  if (!findGuide(slug)) notFound();
  return <GuideView slug={slug} lang="en"/>;
}
