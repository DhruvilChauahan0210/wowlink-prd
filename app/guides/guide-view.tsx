import type { Metadata } from "next";
import Link from "next/link";
import { GUIDES, guide as findGuide, readMinutes } from "../lib/guides";
import { GUIDE_UI, guideIn } from "../lib/guides-i18n";
import { LANGS, LANG_NAMES, getInvitationTemplate, langHref, type Lang } from "../lib/invitations";
import { OCCASION_COPY } from "../lib/occasion-pages";
import { STARTER_OCCASIONS } from "../lib/plans";
import { article, breadcrumbs, faqPage } from "../lib/structured-data";
import { wordingGuide } from "../lib/wording";
import { ArtImage } from "../ui/art";
import { WowLinkBrand } from "../ui/brand";
import { JsonLd } from "../ui/json-ld";
import { SiteFooter } from "../ui/site-footer";

/*
 * One how-to guide (see lib/guides.ts), in English (/guides/<slug>) or in Gujarati or Hindi (?lang=gu or hi, which
 * middleware.ts serves from /guides/<slug>/<lang>, so all three are built ahead like any static page): the answer in
 * short sections, the questions people ask, then the wording that goes with it and the way to send it as an invitation
 * that opens. Each names the other two as the same page in another language.
 */

const path = (slug: string) => `/guides/${slug}`;

export function guideMetadata(slug: string, lang: Lang): Metadata {
  const found = findGuide(slug);
  if (!found) return {};
  const { title, description } = guideIn(found, lang);
  const url = langHref(path(slug), lang);
  const languages = { ...Object.fromEntries(LANGS.map((other) => [other, langHref(path(slug), other)])), "x-default": path(slug) };
  return { title: `${title} — WowLink`, description, alternates: { canonical: url, languages }, openGraph: { title, description, url, type: "article", siteName: "WowLink", locale: { en: "en_IN", gu: "gu_IN", hi: "hi_IN" }[lang] } };
}

export function GuideView({ slug, lang }: { slug: string; lang: Lang }) {
  const original = findGuide(slug);
  if (!original) return null;
  const guide = guideIn(original, lang);
  const ui = GUIDE_UI[lang];
  const { ui: occasionUi } = OCCASION_COPY[lang];
  const here = langHref(path(slug), lang);
  const template = getInvitationTemplate(guide.template);
  const free = STARTER_OCCASIONS.includes(template.id);
  const wording = wordingGuide(guide.wording);
  const [before, drawn, after] = guide.heading;
  const start = `/create?template=${template.id}${lang === "en" ? "" : `&lang=${lang}`}`;
  const others = GUIDES.filter((other) => other.slug !== slug);

  return <div className="cinema cin-catalog theme-paper wording-page guide-page" lang={lang}>
    <JsonLd data={[breadcrumbs([["WowLink", "/"], [ui.guides, langHref("/guides", lang)], [guide.name, here]]), article(guide.title, here, guide.description, guide.published, lang), faqPage(guide.faq, lang)]}/>
    <header className="cin-catalog-nav">
      <WowLinkBrand/>
      <div className="page-header-actions">
        <nav className="page-langs" aria-label="Language">{LANGS.filter((other) => other !== lang).map((other) => <Link key={other} href={langHref(path(slug), other)} hrefLang={other} lang={other}>{LANG_NAMES[other]}</Link>)}</nav>
        <Link href={langHref("/guides", lang)} className="cin-catalog-back occasion-back" aria-label={ui.allGuides}><span aria-hidden="true">←</span><span className="occasion-back-label"> {ui.allGuides}</span></Link>
      </div>
    </header>
    <main>
      <section className="wording-hero">
        <div>
          <span className="occasion-kind">{ui.kind} · {ui.minRead(readMinutes(guide))}</span>
          <h1>{before && <>{before} </>}<span className="scribble">{drawn}</span>{after && <> {after}</>}</h1>
          <p className="occasion-intro">{guide.intro}</p>
          <nav className="wording-jump guide-jump" aria-label={ui.onThisPage}>{guide.sections.map((section, i) => <a key={section.title} href={`#guide-${i + 1}`}>{section.title}</a>)}</nav>
        </div>
        <Link className="wording-print" href={langHref(`/templates/${template.id}`, lang)}>
          <span className="cin-photo"><ArtImage name={template.id} fit="slice"/></span>
          <span className="wording-print-caption">{ui.seeHow} <span aria-hidden="true">→</span></span>
        </Link>
      </section>

      <div className="guide-layout">
        <div className="guide-body">
          {guide.sections.map((section, i) => <section className="guide-section" id={`guide-${i + 1}`} aria-labelledby={`guide-${i + 1}-title`} key={section.title}>
            <h2 id={`guide-${i + 1}-title`}>{section.title}</h2>
            {section.paragraphs.map((text) => <p key={text}>{text}</p>)}
            {section.steps && <ol className="guide-steps">{section.steps.map((step) => <li key={step}>{step}</li>)}</ol>}
          </section>)}
        </div>
        <aside className="guide-aside" aria-label={guide.name}>
          <nav aria-label={ui.onThisPage}><h2>{ui.onThisPage}</h2><ol>{guide.sections.map((section, i) => <li key={section.title}><a href={`#guide-${i + 1}`}>{section.title}</a></li>)}<li><a href="#guide-faq">{ui.questions}</a></li></ol></nav>
          <div className="guide-aside-cta">
            <p>{ui.asideCta}</p>
            <Link className="cin-cta cin-cta-light" href={start}>{free ? occasionUi.makeFree : occasionUi.make}</Link>
          </div>
        </aside>
      </div>

      <section className="occasion-section" aria-labelledby="guide-faq">
        <h2 id="guide-faq">{ui.questions}</h2>
        <dl className="occasion-faq">{guide.faq.map(({ q, a }) => <div key={q}><dt>{q}</dt><dd>{a}</dd></div>)}</dl>
      </section>

      <section className="occasion-section occasion-split">
        {wording && <section aria-labelledby="guide-wording">
          <h2 id="guide-wording">{ui.wordingTitle}</h2>
          <p className="guide-lead">{ui.wordingLead}</p>
          <Link className="cin-text-link" href={`/wording/${wording.slug}`}>{ui.wordingLink} <span aria-hidden="true">→</span></Link>
        </section>}
        <section className="wording-send" aria-labelledby="guide-send">
          <h2 id="guide-send">{ui.sendTitle}</h2>
          <p>{ui.sendText}</p>
          <div className="occasion-ctas">
            <Link className="cin-cta cin-cta-light" href={start}>{free ? occasionUi.makeFree : occasionUi.make}</Link>
            <Link className="cin-text-link" href={langHref("/templates", lang)}>{occasionUi.allOccasions} <span aria-hidden="true">→</span></Link>
          </div>
        </section>
      </section>

      <section className="occasion-section" aria-labelledby="more-guides">
        <h2 id="more-guides">{ui.moreGuides}</h2>
        <ul className="guide-more">{others.map((other) => <li key={other.slug}><Link href={langHref(path(other.slug), lang)}><span>{guideIn(other, lang).title}</span><span className="guide-more-min">{ui.minRead(readMinutes(guideIn(other, lang)))} <span aria-hidden="true">→</span></span></Link></li>)}</ul>
      </section>
    </main>
    <SiteFooter lang={lang}/>
  </div>;
}
