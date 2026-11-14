import type { Metadata } from "next";
import { pageLang } from "../lib/invitations";
import { WordingIndexView, wordingIndexMetadata } from "./wording-view";

// The invitation wording guides, one for each occasion (see lib/wording.ts), in English, Gujarati or Hindi (?lang=gu or hi, like pricing and help).

type Props = { searchParams: Promise<{ lang?: string | string[] }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return wordingIndexMetadata(pageLang((await searchParams).lang));
}

export default async function WordingPage({ searchParams }: Props) {
  return <WordingIndexView lang={pageLang((await searchParams).lang)}/>;
}
