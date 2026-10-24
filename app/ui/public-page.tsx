import Link from "next/link";
import { LANGS, LANG_NAMES, langHref, type Lang } from "../lib/invitations";
import { WowLinkBrand } from "./brand";
import { SiteFooter } from "./site-footer";

// The header's words in each language.
const FOOTER: Record<Lang, { made: string; templates: string; help: string; pricing: string; privacy: string; mine: string; create: string }> = {
  en: { made: "Made with love, shared with one link.", templates: "Occasions", help: "Help", pricing: "Pricing", privacy: "Privacy", mine: "My invitations", create: "Create invitation" },
  gu: { made: "પ્રેમથી બનાવેલું, એક લિંકથી મોકલેલું.", templates: "પ્રસંગો", help: "મદદ", pricing: "કિંમત", privacy: "ગોપનીયતા", mine: "મારાં આમંત્રણો", create: "આમંત્રણ બનાવો" },
  hi: { made: "प्यार से बनाया, एक लिंक से भेजा।", templates: "अवसर", help: "मदद", pricing: "कीमत", privacy: "गोपनीयता", mine: "मेरे निमंत्रण", create: "निमंत्रण बनाएँ" },
};

/** The frame of WowLink's public pages in a language: the header (brand, the page in the other languages, a way to start) and the footer. */
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
    <SiteFooter lang={lang}/>
  </div>;
}
