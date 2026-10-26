import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GUIDES, guide as findGuide } from "../../lib/guides";
import { getInvitationTemplate } from "../../lib/invitations";
import { STARTER_OCCASIONS } from "../../lib/plans";
import { article, breadcrumbs, faqPage } from "../../lib/structured-data";
import { wordingGuide } from "../../lib/wording";
import { ArtImage } from "../../ui/art";
import { WowLinkBrand } from "../../ui/brand";
import { JsonLd } from "../../ui/json-ld";
import { SiteFooter } from "../../ui/site-footer";

/*
 * One how-to guide (see lib/guides.ts): the answer in short sections, the questions people ask, then the wording that
 * goes with it and the way to send it as an invitation that opens.
 */

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => GUIDES.map((guide) => ({ slug: guide.slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guide = findGuide((await params).slug);
  if (!guide) return {};
  const url = `/guides/${guide.slug}`;
  return { title: `${guide.title} — WowLink`, description: guide.description, alternates: { canonical: url }, openGraph: { title: guide.title, description: guide.description, url, type: "article", siteName: "WowLink" } };
}

export default async function GuidePage({ params }: Props) {
  const guide = findGuide((await params).slug);
  if (!guide) notFound();
  const path = `/guides/${guide.slug}`;
  const template = getInvitationTemplate(guide.template);
  const free = STARTER_OCCASIONS.includes(template.id);
  const wording = wordingGuide(guide.wording);
  const [before, drawn, after] = guide.heading;

  return <div className="cinema cin-catalog theme-paper wording-page guide-page">
    <JsonLd data={[breadcrumbs([["WowLink", "/"], ["Guides", "/guides"], [guide.name, path]]), article(guide.title, path, guide.description, guide.published), faqPage(guide.faq)]}/>
    <header className="cin-catalog-nav">
      <WowLinkBrand/>
      <Link href="/guides" className="cin-catalog-back occasion-back" aria-label="All guides"><span aria-hidden="true">←</span><span className="occasion-back-label"> All guides</span></Link>
    </header>
    <main>
      <section className="wording-hero">
        <div>
          <span className="occasion-kind">Guide</span>
          <h1>{before && <>{before} </>}<span className="scribble">{drawn}</span>{after && <> {after}</>}</h1>
          <p className="occasion-intro">{guide.intro}</p>
          <nav className="wording-jump" aria-label="On this page">{guide.sections.map((section, i) => <a key={section.title} href={`#guide-${i + 1}`}>{section.title}</a>)}</nav>
        </div>
        <Link className="wording-print" href={`/templates/${template.id}`}>
          <span className="cin-photo"><ArtImage name={template.id} fit="slice"/></span>
          <span className="wording-print-caption">see how it opens <span aria-hidden="true">→</span></span>
        </Link>
      </section>

      <div className="guide-body">
        {guide.sections.map((section, i) => <section className="guide-section" id={`guide-${i + 1}`} aria-labelledby={`guide-${i + 1}-title`} key={section.title}>
          <h2 id={`guide-${i + 1}-title`}>{section.title}</h2>
          {section.paragraphs.map((text) => <p key={text}>{text}</p>)}
          {section.steps && <ol className="guide-steps">{section.steps.map((step) => <li key={step}>{step}</li>)}</ol>}
        </section>)}
      </div>

      <section className="occasion-section" aria-labelledby="guide-faq">
        <h2 id="guide-faq">Questions people ask</h2>
        <dl className="occasion-faq">{guide.faq.map(({ q, a }) => <div key={q}><dt>{q}</dt><dd>{a}</dd></div>)}</dl>
      </section>

      <section className="occasion-section occasion-split">
        {wording && <section aria-labelledby="guide-wording">
          <h2 id="guide-wording">Words to send with it</h2>
          <p className="guide-lead">Ready-to-copy wording in English, Gujarati and Hindi, for the invitation and the WhatsApp message.</p>
          <Link className="cin-text-link" href={`/wording/${wording.slug}`}>{wording.title} <span aria-hidden="true">→</span></Link>
        </section>}
        <section className="wording-send" aria-labelledby="guide-send">
          <h2 id="guide-send">Send it as an invitation that opens</h2>
          <p>Make a hand-drawn invitation, share one link on WhatsApp, and see who’s coming. Guests read it in English, Gujarati or Hindi and reply in a few taps.</p>
          <div className="occasion-ctas">
            <Link className="cin-cta cin-cta-light" href={`/create?template=${template.id}`}>{free ? "Make yours, free" : "Make yours"}</Link>
            <Link className="cin-text-link" href="/templates">All occasions <span aria-hidden="true">→</span></Link>
          </div>
        </section>
      </section>

      <section className="occasion-section" aria-labelledby="more-guides">
        <h2 id="more-guides">More guides</h2>
        <ul className="guide-more">{GUIDES.filter((other) => other.slug !== guide.slug).map((other) => <li key={other.slug}><Link href={`/guides/${other.slug}`}>{other.title}</Link></li>)}</ul>
      </section>
    </main>
    <SiteFooter/>
  </div>;
}
