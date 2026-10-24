import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LANGS, LANG_NAMES, getInvitationTemplate, type Lang } from "../../lib/invitations";
import { STARTER_OCCASIONS } from "../../lib/plans";
import { breadcrumbs } from "../../lib/structured-data";
import { WORDING_GUIDES, wordingGuide } from "../../lib/wording";
import { ArtImage } from "../../ui/art";
import { WowLinkBrand } from "../../ui/brand";
import { JsonLd } from "../../ui/json-ld";
import { OPEN_HINT } from "../../ui/openers";
import { SiteFooter } from "../../ui/site-footer";
import { CopyButton } from "../copy-button";

/*
 * One occasion's invitation wording (see lib/wording.ts): each wording side by side in English, Gujarati and Hindi,
 * ready to copy, then what the invitation should say and the way to send it as one that opens.
 */

type Props = { params: Promise<{ slug: string }> };

const IN: Record<Lang, string> = { en: "in English", gu: "in Gujarati", hi: "in Hindi" };

export const dynamicParams = false;
export const generateStaticParams = () => WORDING_GUIDES.map((guide) => ({ slug: guide.slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guide = wordingGuide((await params).slug);
  if (!guide) return {};
  const url = `/wording/${guide.slug}`;
  return { title: `${guide.title} — WowLink`, description: guide.description, alternates: { canonical: url }, openGraph: { title: guide.title, description: guide.description, url, type: "article", siteName: "WowLink" } };
}

export default async function WordingGuidePage({ params }: Props) {
  const guide = wordingGuide((await params).slug);
  if (!guide) notFound();
  const template = getInvitationTemplate(guide.template);
  const free = STARTER_OCCASIONS.includes(template.id);
  const [before, drawn, after] = guide.heading;

  return <div className="cinema cin-catalog theme-paper wording-page">
    <JsonLd data={[breadcrumbs([["WowLink", "/"], ["Invitation wording", "/wording"], [guide.name, `/wording/${guide.slug}`]])]}/>
    <header className="cin-catalog-nav">
      <WowLinkBrand/>
      <Link href="/wording" className="cin-catalog-back occasion-back" aria-label="All invitation wording"><span aria-hidden="true">←</span><span className="occasion-back-label"> All wording</span></Link>
    </header>
    <main>
      <section className="wording-hero">
        <div>
          <span className="occasion-kind">Invitation wording · {guide.name}</span>
          <h1>{before && <>{before} </>}<span className="scribble">{drawn}</span>{after && <> {after}</>}</h1>
          <p className="occasion-intro">{guide.intro}</p>
          <nav className="wording-jump" aria-label="On this page">{guide.wordings.map((wording, i) => <a key={wording.title} href={`#wording-${i + 1}`}>{wording.title}</a>)}</nav>
        </div>
        <Link className="wording-print" href={`/templates/${template.id}`}>
          <span className="cin-photo"><ArtImage name={template.id} fit="slice"/></span>
          <span className="wording-print-caption">try it: {OPEN_HINT[template.id]} <span aria-hidden="true">→</span></span>
        </Link>
      </section>

      {guide.wordings.map((wording, i) => <section className="occasion-section wording-section" id={`wording-${i + 1}`} aria-labelledby={`wording-${i + 1}-title`} key={wording.title}>
        <h2 id={`wording-${i + 1}-title`}>{wording.title}</h2>
        <div className="wording-grid">{LANGS.map((lang) => <article className="sketch-card wording-card" key={lang}>
          <div className="wording-card-head">
            <h3 lang={lang}>{LANG_NAMES[lang]}</h3>
            <CopyButton text={wording.text[lang].join("\n")} textId={`wording-${i + 1}-${lang}`} what={`${wording.title[0].toLowerCase()}${wording.title.slice(1)}, ${IN[lang]}`}/>
          </div>
          <p className="wording-text" id={`wording-${i + 1}-${lang}`} lang={lang}>{wording.text[lang].join("\n")}</p>
        </article>)}</div>
      </section>)}

      <section className="occasion-section occasion-split">
        <section aria-labelledby="include">
          <h2 id="include">What to include</h2>
          <ul className="occasion-ticks">{guide.include.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
        <section className="wording-send" aria-labelledby="send">
          <h2 id="send">Send it as an invitation that opens</h2>
          <p>Put your words in a hand-drawn invitation. Guests open it from the WhatsApp link, read it in English, Gujarati or Hindi, and reply in a few taps. You see who’s coming.</p>
          <div className="occasion-ctas">
            <Link className="cin-cta cin-cta-light" href={`/create?template=${template.id}`}>{free ? "Make yours, free" : "Make yours"}</Link>
            <Link className="cin-text-link" href={`/templates/${template.id}`}>How it opens <span aria-hidden="true">→</span></Link>
          </div>
        </section>
      </section>

      <section className="occasion-section" aria-labelledby="more-wording">
        <h2 id="more-wording">More invitation wording</h2>
        <ul className="occasion-others">{WORDING_GUIDES.filter((other) => other.slug !== guide.slug).map((other) => <li key={other.slug}>
          <Link href={`/wording/${other.slug}`}><span className="cin-photo"><ArtImage name={other.template} fit="slice"/></span><span>{other.name}</span></Link>
        </li>)}</ul>
      </section>
    </main>
    <SiteFooter/>
  </div>;
}
