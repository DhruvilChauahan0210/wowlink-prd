import type { Metadata } from "next";
import Link from "next/link";
import { LANGS, LANG_NAMES, getInvitationTemplate, langHref, type Lang } from "../lib/invitations";
import { OCCASION_WORDS } from "../lib/i18n";
import { OCCASION_COPY } from "../lib/occasion-pages";
import { STARTER_OCCASIONS } from "../lib/plans";
import { breadcrumbs, itemList } from "../lib/structured-data";
import { WORDING_GUIDES, wordingGuide } from "../lib/wording";
import { WORDING_UI, wordingIn } from "../lib/wording-i18n";
import { ArtImage } from "../ui/art";
import { WowLinkBrand } from "../ui/brand";
import { JsonLd } from "../ui/json-ld";
import { OPEN_HINT } from "../ui/openers";
import { SiteFooter } from "../ui/site-footer";
import { CopyButton } from "./copy-button";

/*
 * The invitation wording guides (see lib/wording.ts) and their list, in English (/wording) or in Gujarati or Hindi
 * (?lang=gu or hi: a guide is served by middleware.ts from /wording/<slug>/<lang>, so all three are built ahead like any
 * static page; the list reads ?lang= itself, like pricing and help). Each wording side by side in English, Gujarati and
 * Hindi, ready to copy, then what the invitation should say and the way to send it as one that opens. Each page names
 * the other two as the same page in another language.
 */

const guidePath = (slug: string) => `/wording/${slug}`;
const hreflangs = (path: string) => ({ ...Object.fromEntries(LANGS.map((other) => [other, langHref(path, other)])), "x-default": path });
const LOCALES = { en: "en_IN", gu: "gu_IN", hi: "hi_IN" } as const;

export function wordingGuideMetadata(slug: string, lang: Lang): Metadata {
  const found = wordingGuide(slug);
  if (!found) return {};
  const { title, description } = wordingIn(found, lang);
  const url = langHref(guidePath(slug), lang);
  return { title: `${title} — WowLink`, description, alternates: { canonical: url, languages: hreflangs(guidePath(slug)) }, openGraph: { title, description, url, type: "article", siteName: "WowLink", locale: LOCALES[lang] } };
}

export function wordingIndexMetadata(lang: Lang): Metadata {
  const { listTitle, listDescription } = WORDING_UI[lang];
  return { title: listTitle, description: listDescription, alternates: { canonical: langHref("/wording", lang), languages: hreflangs("/wording") } };
}

function LanguageLinks({ path, lang }: { path: string; lang: Lang }) {
  return <nav className="page-langs" aria-label="Language">{LANGS.filter((other) => other !== lang).map((other) => <Link key={other} href={langHref(path, other)} hrefLang={other} lang={other}>{LANG_NAMES[other]}</Link>)}</nav>;
}

export function WordingGuideView({ slug, lang }: { slug: string; lang: Lang }) {
  const original = wordingGuide(slug);
  if (!original) return null;
  const guide = wordingIn(original, lang);
  const ui = WORDING_UI[lang];
  const { ui: occasionUi } = OCCASION_COPY[lang];
  const here = langHref(guidePath(slug), lang);
  const template = getInvitationTemplate(guide.template);
  const free = STARTER_OCCASIONS.includes(template.id);
  const [before, drawn, after] = guide.heading;
  const hint = OCCASION_WORDS[lang]?.[template.id].hint ?? OPEN_HINT[template.id];
  const start = `/create?template=${template.id}${lang === "en" ? "" : `&lang=${lang}`}`;
  const others = WORDING_GUIDES.filter((other) => other.slug !== slug).map((other) => wordingIn(other, lang));

  return <div className="cinema cin-catalog theme-paper wording-page" lang={lang}>
    <JsonLd data={[breadcrumbs([["WowLink", "/"], [ui.crumb, langHref("/wording", lang)], [guide.name, here]])]}/>
    <header className="cin-catalog-nav">
      <WowLinkBrand/>
      <div className="page-header-actions">
        <LanguageLinks path={guidePath(slug)} lang={lang}/>
        <Link href={langHref("/wording", lang)} className="cin-catalog-back occasion-back" aria-label={ui.allWording}><span aria-hidden="true">←</span><span className="occasion-back-label"> {ui.allWording}</span></Link>
      </div>
    </header>
    <main>
      <section className="wording-hero">
        <div>
          <span className="occasion-kind">{ui.kind} · {guide.name}</span>
          <h1>{before && <>{before} </>}<span className="scribble">{drawn}</span>{after && <> {after}</>}</h1>
          <p className="occasion-intro">{guide.intro}</p>
          <nav className="wording-jump" aria-label={ui.kind}>{guide.wordings.map((wording, i) => <a key={wording.title} href={`#wording-${i + 1}`}>{wording.title}</a>)}</nav>
        </div>
        <Link className="wording-print" href={langHref(`/templates/${template.id}`, lang)}>
          <span className="cin-photo"><ArtImage name={template.id} fit="slice"/></span>
          <span className="wording-print-caption">{ui.tryIt} {hint} <span aria-hidden="true">→</span></span>
        </Link>
      </section>

      {guide.wordings.map((wording, i) => <section className="occasion-section wording-section" id={`wording-${i + 1}`} aria-labelledby={`wording-${i + 1}-title`} key={wording.title}>
        <h2 id={`wording-${i + 1}-title`}>{wording.title}</h2>
        <div className="wording-grid">{LANGS.map((other) => <article className="sketch-card wording-card" key={other}>
          <div className="wording-card-head">
            <h3 lang={other}>{LANG_NAMES[other]}</h3>
            <CopyButton text={wording.text[other].join("\n")} textId={`wording-${i + 1}-${other}`} what={`${lang === "en" ? `${wording.title[0].toLowerCase()}${wording.title.slice(1)}` : wording.title}, ${ui.in[other]}`} labels={ui.copy}/>
          </div>
          <p className="wording-text" id={`wording-${i + 1}-${other}`} lang={other}>{wording.text[other].join("\n")}</p>
        </article>)}</div>
      </section>)}

      <section className="occasion-section occasion-split">
        <section aria-labelledby="include">
          <h2 id="include">{ui.include}</h2>
          <ul className="occasion-ticks">{guide.include.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
        <section className="wording-send" aria-labelledby="send">
          <h2 id="send">{ui.sendTitle}</h2>
          <p>{ui.sendText}</p>
          <div className="occasion-ctas">
            <Link className="cin-cta cin-cta-light" href={start}>{free ? occasionUi.makeFree : occasionUi.make}</Link>
            <Link className="cin-text-link" href={langHref(`/templates/${template.id}`, lang)}>{ui.howItOpens} <span aria-hidden="true">→</span></Link>
          </div>
        </section>
      </section>

      <section className="occasion-section" aria-labelledby="more-wording">
        <h2 id="more-wording">{ui.moreWording}</h2>
        <ul className="occasion-others">{others.map((other) => <li key={other.slug}>
          <Link href={langHref(guidePath(other.slug), lang)}><span className="cin-photo"><ArtImage name={other.template} fit="slice"/></span><span>{other.name}</span></Link>
        </li>)}</ul>
      </section>
    </main>
    <SiteFooter lang={lang}/>
  </div>;
}

export function WordingIndexView({ lang }: { lang: Lang }) {
  const ui = WORDING_UI[lang];
  const { ui: occasionUi } = OCCASION_COPY[lang];
  const [before, drawn, after] = ui.listHeading;
  const guides = WORDING_GUIDES.map((guide) => wordingIn(guide, lang));
  return <div className="cinema cin-catalog theme-paper wording-page" lang={lang}>
    <JsonLd data={[breadcrumbs([["WowLink", "/"], [ui.crumb, langHref("/wording", lang)]]), itemList(ui.listJsonName, guides.map((guide) => [guide.title, langHref(guidePath(guide.slug), lang)] as const))]}/>
    <header className="cin-catalog-nav">
      <WowLinkBrand/>
      <div className="page-header-actions">
        <LanguageLinks path="/wording" lang={lang}/>
        <Link href={langHref("/templates", lang)} className="cin-catalog-back">{occasionUi.occasions} <span aria-hidden="true">→</span></Link>
      </div>
    </header>
    <main>
      <div className="cin-catalog-heading">
        <h1>{before && <>{before} </>}<span className="scribble">{drawn}</span>{after && <> {after}</>}</h1>
        <p>{ui.listIntro}</p>
      </div>
      <ul className="wording-index">{guides.map((guide) => <li key={guide.slug}>
        <Link href={langHref(guidePath(guide.slug), lang)}>
          <span className="cin-photo"><ArtImage name={guide.template} fit="slice"/></span>
          <span className="wording-index-name">{guide.name}</span>
          <span className="wording-index-title">{guide.title}</span>
        </Link>
      </li>)}</ul>
    </main>
    <SiteFooter lang={lang}/>
  </div>;
}
