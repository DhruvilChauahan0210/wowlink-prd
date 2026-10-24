import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "../../ui/site-footer";
import { LANGS, LANG_NAMES, getInvitationTemplate, invitationTemplates, langHref, type Lang, type TemplateId } from "../../lib/invitations";
import { OCCASION_COPY } from "../../lib/occasion-pages";
import { OCCASION_WORDS } from "../../lib/i18n";
import { ArtImage } from "../../ui/art";
import { WowLinkBrand } from "../../ui/brand";
import { OPEN_HINT } from "../../ui/openers";
import { OccasionDemo } from "./demo";
import { STARTER_OCCASIONS } from "../../lib/plans";
import { breadcrumbs, faqPage } from "../../lib/structured-data";
import { JsonLd } from "../../ui/json-ld";
import { guideFor } from "../../lib/wording";

/*
 * Each occasion's own page, in English (/templates/<id>) or in Gujarati or Hindi (?lang=gu or hi, which middleware.ts
 * serves from /templates/<id>/<lang>, so all three are built ahead like any static page): what its invitation does, a
 * sample to open right here, and a way to start. These are the pages search engines list (see sitemap.ts); the
 * invitations people make are not. Each names the other two as the same page in another language.
 */

const path = (id: TemplateId) => `/templates/${id}`;

export function occasionMetadata(id: TemplateId, lang: Lang): Metadata {
  const { title, description } = OCCASION_COPY[lang].pages[id];
  const url = langHref(path(id), lang);
  const languages = { ...Object.fromEntries(LANGS.map((other) => [other, langHref(path(id), other)])), "x-default": path(id) };
  return { title: `${title} — WowLink`, description, alternates: { canonical: url, languages }, openGraph: { title, description, url, type: "website", siteName: "WowLink", locale: { en: "en_IN", gu: "gu_IN", hi: "hi_IN" }[lang] } };
}

export function OccasionView({ id, lang }: { id: TemplateId; lang: Lang }) {
  const template = getInvitationTemplate(id);
  const { names, pages, guestGets, steps, faq, ui } = OCCASION_COPY[lang];
  const page = pages[id];
  // The studio and the full sample open in the page's language too.
  const start = `/create?template=${id}${lang === "en" ? "" : `&lang=${lang}`}`;
  const sample = `/e/preview?template=${id}${lang === "en" ? "" : `&lang=${lang}`}`;
  const pro = !STARTER_OCCASIONS.includes(id);
  const hint = OCCASION_WORDS[lang]?.[id].hint ?? OPEN_HINT[id];
  const [before, drawn, after] = page.heading;
  const guide = guideFor(id);

  return <div className="cinema cin-catalog theme-paper occasion-page" lang={lang}>
    <JsonLd data={[breadcrumbs([["WowLink", "/"], [ui.occasions, "/templates"], [names[id], langHref(path(id), lang)]]), faqPage(faq, lang)]}/>
    <header className="cin-catalog-nav">
      <WowLinkBrand/>
      <div className="page-header-actions">
        <nav className="page-langs" aria-label="Language">{LANGS.filter((other) => other !== lang).map((other) => <Link key={other} href={langHref(path(id), other)} hrefLang={other} lang={other}>{LANG_NAMES[other]}</Link>)}</nav>
        <Link href="/templates" className="cin-catalog-back occasion-back" aria-label={ui.allOccasions}><span aria-hidden="true">←</span><span className="occasion-back-label"> {ui.allOccasions}</span></Link>
      </div>
    </header>
    <main>
      <section className="occasion-hero">
        <div className="occasion-hero-text">
          <span className="occasion-kind">{names[id]}</span>{pro && <span className="studio-pro-badge occasion-pro">{ui.studio}</span>}
          <h1>{before && <>{before} </>}<span className="scribble">{drawn}</span>{after && <> {after}</>}</h1>
          <p className="occasion-intro">{page.intro}</p>
          <div className="occasion-ctas">
            <Link className="cin-cta cin-cta-light" href={start}>{pro ? ui.make : ui.makeFree}</Link>
            <Link className="cin-text-link" href={sample}>{ui.sample} <span aria-hidden="true">→</span></Link>
          </div>
        </div>
        <div className="occasion-demo">
          <OccasionDemo id={id} lang={lang}/>
          <p className="occasion-demo-note">{ui.tryIt} {hint}</p>
        </div>
      </section>

      <section className="occasion-section" aria-labelledby="made-for">
        <h2 id="made-for">{page.madeFor}</h2>
        <div className="occasion-points">{page.points.map((point) => <article className="sketch-card occasion-point" key={point.title}>
          <h3>{point.title}{point.pro && <> <span className="studio-pro-badge">{ui.studio}</span></>}</h3>
          <p>{point.body}</p>
        </article>)}</div>
      </section>

      <section className="occasion-section occasion-split">
        <section aria-labelledby="guests-get">
          <h2 id="guests-get">{ui.guestsGet}</h2>
          <ul className="occasion-ticks">{guestGets.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
        <section aria-labelledby="three-steps">
          <h2 id="three-steps">{ui.threeSteps}</h2>
          <ol className="occasion-steps">{steps.map((step) => <li key={step.title}><h3>{step.title}</h3><p>{step.body}</p></li>)}</ol>
          <div className="occasion-ctas occasion-start">
            <Link className="cin-cta cin-cta-light" href={start}>{ui.start}</Link>
            {guide && <Link className="cin-text-link" href={`/wording/${guide.slug}`}>{ui.wording} <span aria-hidden="true">→</span></Link>}
          </div>
        </section>
      </section>

      <section className="occasion-section" aria-labelledby="questions">
        <h2 id="questions">{ui.questions}</h2>
        <dl className="occasion-faq">{faq.map(({ q, a }) => <div key={q}><dt>{q}</dt><dd>{a}</dd></div>)}</dl>
      </section>

      <section className="occasion-section" aria-labelledby="other-occasions">
        <h2 id="other-occasions">{ui.others}</h2>
        <ul className="occasion-others">{invitationTemplates.filter((other) => other.id !== id).map((other) => <li key={other.id}>
          <Link href={langHref(path(other.id), lang)}><span className="cin-photo"><ArtImage name={other.id} fit="slice"/></span><span>{names[other.id]}</span>{!STARTER_OCCASIONS.includes(other.id) && <span className="studio-pro-badge">{ui.studio}</span>}</Link>
        </li>)}</ul>
      </section>
    </main>
    <SiteFooter lang={lang}/>
  </div>;
}
