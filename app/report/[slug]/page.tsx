import type { Metadata } from "next";
import Link from "next/link";
import { isGuestId } from "../../lib/guests";
import { LANGS, LANG_NAMES, langHref, pageLang, type Lang } from "../../lib/invitations";
import { REPORT_TEXT } from "../../lib/reports";
import { getPublished } from "../../lib/store";
import { WowLinkBrand } from "../../ui/brand";
import { ReportForm } from "./report-form";

/*
 * Reporting an invitation (linked from every invitation's footer, in the guest's language). Only invitations guests
 * can open can be reported; the form keeps the reason and what's written, nothing about who sent it.
 */

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string | string[]; from?: string | string[] }> };
const langOf = async (searchParams: Props["searchParams"]): Promise<Lang> => pageLang((await searchParams).lang);

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return { title: `${REPORT_TEXT[await langOf(searchParams)].title} — WowLink`, robots: { index: false, follow: false } };
}

export default async function ReportPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const lang = await langOf(searchParams);
  // Back to the link they came from: a household's personal link, or the general one.
  const fromParam = (await searchParams).from;
  const from = typeof fromParam === "string" && isGuestId(fromParam) ? fromParam : "";
  const back = `/e/${slug}${from && `/${from}`}`;
  const inLang = (other: Lang) => {
    const query = new URLSearchParams({ ...(other !== "en" && { lang: other }), ...(from && { from }) }).toString();
    return `/report/${slug}${query ? `?${query}` : ""}`;
  };
  const t = REPORT_TEXT[lang];
  const experience = await getPublished(slug);
  return <div className="cinema cin-catalog theme-paper report-page" lang={lang}>
    <header className="cin-catalog-nav"><WowLinkBrand/><nav className="page-langs" aria-label="Language">{LANGS.filter(other => other !== lang).map(other => <Link key={other} href={inLang(other)} hrefLang={other} lang={other}>{LANG_NAMES[other]}</Link>)}</nav></header>
    <main className="report">
      <h1>{t.title}</h1>
      {experience ? <>
        <p className="report-which">{t.reporting(experience.title)}</p>
        <ReportForm slug={slug} lang={lang} back={back}/>
      </> : <p className="report-which">{t.gone}</p>}
      <Link className="report-privacy" href={langHref("/privacy", lang)}>{t.privacy}</Link>
    </main>
  </div>;
}
