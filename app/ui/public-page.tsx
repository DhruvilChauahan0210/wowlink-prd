import Link from "next/link";
import { LANGS, LANG_NAMES, langHref, type Lang } from "../lib/invitations";
import { WowLinkBrand } from "./brand";

const FOOTER: Record<Lang, { made: string; templates: string; help: string; pricing: string; privacy: string }> = {
  en: { made: "Made with love, shared with one link.", templates: "Templates", help: "Help", pricing: "Pricing", privacy: "Privacy" },
  gu: { made: "પ્રેમથી બનાવેલું, એક લિંકથી મોકલેલું.", templates: "આમંત્રણના નમૂના", help: "મદદ", pricing: "કિંમત", privacy: "ગોપનીયતા" },
  hi: { made: "प्यार से बनाया, एक लिंक से भेजा।", templates: "निमंत्रण के नमूने", help: "मदद", pricing: "कीमत", privacy: "गोपनीयता" },
};

/** The frame of WowLink's public pages in a language: brand, the page in the other languages, and the footer. */
export function PublicPage({ lang, path, className, children }: { lang: Lang; path: string; className?: string; children: React.ReactNode }) {
  const f = FOOTER[lang];
  return <div className={`cinema cin-catalog theme-paper${className ? ` ${className}` : ""}`} lang={lang}>
    <header className="cin-catalog-nav">
      <WowLinkBrand/>
      <nav className="page-langs" aria-label="Language">{LANGS.filter(other => other !== lang).map(other => <Link key={other} href={langHref(path, other)} hrefLang={other} lang={other}>{LANG_NAMES[other]}</Link>)}</nav>
    </header>
    {children}
    <footer className="cin-catalog-footer"><span>{f.made}</span><span className="cin-catalog-footer-links">
      <Link href={langHref("/help", lang)}>{f.help}</Link>
      <Link href={langHref("/pricing", lang)}>{f.pricing}</Link>
      <Link href={langHref("/privacy", lang)}>{f.privacy}</Link>
      <Link href="/templates">{f.templates}</Link>
    </span></footer>
  </div>;
}
