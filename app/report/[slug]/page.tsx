import type { Metadata } from "next";
import Link from "next/link";
import { isGuestId } from "../../lib/guests";
import type { Lang } from "../../lib/invitations";
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
const langOf = async (searchParams: Props["searchParams"]): Promise<Lang> => ((await searchParams).lang === "gu" ? "gu" : "en");

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
  const switchQuery = new URLSearchParams({ ...(lang === "en" && { lang: "gu" }), ...(from && { from }) }).toString();
  const t = REPORT_TEXT[lang];
  const experience = await getPublished(slug);
  const other: Lang = lang === "en" ? "gu" : "en";
  return <div className="cinema cin-catalog theme-paper report-page" lang={lang}>
    <header className="cin-catalog-nav"><WowLinkBrand/><Link href={`/report/${slug}${switchQuery ? `?${switchQuery}` : ""}`} className="cin-catalog-back" hrefLang={other} lang={other}>{t.other}</Link></header>
    <main className="report">
      <h1>{t.title}</h1>
      {experience ? <>
        <p className="report-which">{t.reporting(experience.title)}</p>
        <ReportForm slug={slug} lang={lang} back={back}/>
      </> : <p className="report-which">{t.gone}</p>}
      <Link className="report-privacy" href={lang === "gu" ? "/privacy?lang=gu" : "/privacy"}>{t.privacy}</Link>
    </main>
  </div>;
}
