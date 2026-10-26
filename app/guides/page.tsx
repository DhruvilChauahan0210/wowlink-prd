import type { Metadata } from "next";
import Link from "next/link";
import { GUIDES, readMinutes } from "../lib/guides";
import { GUIDE_UI, guideIn } from "../lib/guides-i18n";
import { LANGS, LANG_NAMES, langHref, pageLang } from "../lib/invitations";
import { breadcrumbs, itemList } from "../lib/structured-data";
import { ArtImage } from "../ui/art";
import { WowLinkBrand } from "../ui/brand";
import { JsonLd } from "../ui/json-ld";
import { SiteFooter } from "../ui/site-footer";

// The how-to guides (see lib/guides.ts), in English, Gujarati or Hindi (?lang=gu or hi, like pricing and help).

type Props = { searchParams: Promise<{ lang?: string | string[] }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const lang = pageLang((await searchParams).lang);
  const { listTitle, listDescription } = GUIDE_UI[lang];
  const languages = { ...Object.fromEntries(LANGS.map((other) => [other, langHref("/guides", other)])), "x-default": "/guides" };
  return { title: listTitle, description: listDescription, alternates: { canonical: langHref("/guides", lang), languages } };
}

export default async function GuidesPage({ searchParams }: Props) {
  const lang = pageLang((await searchParams).lang);
  const ui = GUIDE_UI[lang];
  const [before, drawn, after] = ui.listHeading;
  const guides = GUIDES.map((guide) => guideIn(guide, lang));
  return <div className="cinema cin-catalog theme-paper wording-page guide-page" lang={lang}>
    <JsonLd data={[breadcrumbs([["WowLink", "/"], [ui.guides, langHref("/guides", lang)]]), itemList(ui.listJsonName, guides.map((guide) => [guide.title, langHref(`/guides/${guide.slug}`, lang)] as const))]}/>
    <header className="cin-catalog-nav">
      <WowLinkBrand/>
      <div className="page-header-actions">
        <nav className="page-langs" aria-label="Language">{LANGS.filter((other) => other !== lang).map((other) => <Link key={other} href={langHref("/guides", other)} hrefLang={other} lang={other}>{LANG_NAMES[other]}</Link>)}</nav>
        <Link href="/wording" className="cin-catalog-back">{ui.wordingNav} <span aria-hidden="true">→</span></Link>
      </div>
    </header>
    <main>
      <div className="cin-catalog-heading">
        <h1>{before && <>{before} </>}<span className="scribble">{drawn}</span>{after && <> {after}</>}</h1>
        <p>{ui.listIntro}</p>
      </div>
      <ol className="guide-list">{guides.map((guide, i) => <li key={guide.slug}>
        <Link href={langHref(`/guides/${guide.slug}`, lang)}>
          <span className="guide-list-num" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
          <span className="guide-list-text">
            <span className="guide-list-title">{guide.title}</span>
            <span className="guide-list-desc">{guide.description}</span>
            <span className="guide-list-meta">{ui.minRead(readMinutes(guide))} <span aria-hidden="true">→</span></span>
          </span>
          <span className="cin-photo guide-list-thumb"><ArtImage name={guide.template} fit="slice"/></span>
        </Link>
      </li>)}</ol>
    </main>
    <SiteFooter lang={lang}/>
  </div>;
}
