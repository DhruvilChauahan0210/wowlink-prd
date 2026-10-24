import Link from "next/link";
import { LANGS, LANG_NAMES, langHref, type Lang } from "../lib/invitations";
import { WowLinkBrand } from "./brand";

const FOOTER: Record<Lang, { made: string; templates: string; help: string; pricing: string; privacy: string; mine: string; create: string }> = {
  en: { made: "Made with love, shared with one link.", templates: "Occasions", help: "Help", pricing: "Pricing", privacy: "Privacy", mine: "My invitations", create: "Create invitation" },
  gu: { made: "પ્રેમથી બનાવેલું, એક લિંકથી મોકલેલું.", templates: "પ્રસંગો", help: "મદદ", pricing: "કિંમત", privacy: "ગોપનીયતા", mine: "મારાં આમંત્રણો", create: "આમંત્રણ બનાવો" },
  hi: { made: "प्यार से बनाया, एक लिंक से भेजा।", templates: "अवसर", help: "मदद", pricing: "कीमत", privacy: "गोपनीयता", mine: "मेरे निमंत्रण", create: "निमंत्रण बनाएँ" },
};

/** The footer of WowLink's own pages (these, the occasion gallery and each occasion's page): the same links everywhere. */
export function CatalogFooter({ lang }: { lang: Lang }) {
  const f = FOOTER[lang];
  return <footer className="cin-catalog-footer"><span>{f.made}</span><span className="cin-catalog-footer-links">
    <Link href="/templates">{f.templates}</Link>
    <Link href={langHref("/pricing", lang)}>{f.pricing}</Link>
    <Link href="/mine">{f.mine}</Link>
    <Link href={langHref("/help", lang)}>{f.help}</Link>
    <Link href={langHref("/privacy", lang)}>{f.privacy}</Link>
    <Link href="/">© 2026 WowLink</Link>
  </span></footer>;
}

/** The frame of WowLink's public pages in a language: brand, the page in the other languages, a way to start, and the footer. */
export function PublicPage({ lang, path, className, children }: { lang: Lang; path: string; className?: string; children: React.ReactNode }) {
  return <div className={`cinema cin-catalog theme-paper${className ? ` ${className}` : ""}`} lang={lang}>
    <header className="cin-catalog-nav">
      <WowLinkBrand/>
      <div className="page-header-actions">
        <nav className="page-langs" aria-label="Language">{LANGS.filter(other => other !== lang).map(other => <Link key={other} href={langHref(path, other)} hrefLang={other} lang={other}>{LANG_NAMES[other]}</Link>)}</nav>
        <Link className="cin-cta cin-cta-light header-cta page-create" href="/templates">{FOOTER[lang].create}</Link>
      </div>
    </header>
    {children}
    <CatalogFooter lang={lang}/>
  </div>;
}
