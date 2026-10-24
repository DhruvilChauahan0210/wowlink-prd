import Link from "next/link";
import { langHref, type Lang } from "../lib/invitations";
import { SealMark } from "./brand";
import { FeedbackLink } from "./feedback";
import { Toran } from "./toran";

/*
 * The one footer of every WowLink page (a guest's invitation keeps its own, which belongs to the invitation): night
 * paper under the same toran as the home page's doorway, the seal stamped large, a sign-off, the way to start, and the
 * links in three short columns. In the page's language.
 */

const TEXT: Record<Lang, { made: string; create: string; make: string; learn: string; hello: string; occasions: string; studio: string; mine: string; how: string; wording: string; pricing: string; help: string; feedback: string; privacy: string; drawn: string }> = {
  en: { made: "Made with love, shared with one link.", create: "Create your invitation", make: "Make", learn: "Learn", hello: "Say hello", occasions: "Occasions", studio: "The studio", mine: "My invitations", how: "How it works", wording: "Invitation wording", pricing: "Pricing", help: "Help", feedback: "Tell us what you think", privacy: "Privacy", drawn: "Every invitation, drawn by hand." },
  gu: { made: "પ્રેમથી બનાવેલું, એક લિંકથી મોકલેલું.", create: "આપનું આમંત્રણ બનાવો", make: "બનાવો", learn: "જાણો", hello: "અમને કહો", occasions: "પ્રસંગો", studio: "સ્ટુડિયો", mine: "મારાં આમંત્રણો", how: "કેવી રીતે કામ કરે છે", wording: "આમંત્રણના શબ્દો", pricing: "કિંમત", help: "મદદ", feedback: "આપનો અભિપ્રાય જણાવો", privacy: "ગોપનીયતા", drawn: "દરેક આમંત્રણ, હાથથી દોરેલું." },
  hi: { made: "प्यार से बनाया, एक लिंक से भेजा।", create: "अपना निमंत्रण बनाएँ", make: "बनाएँ", learn: "जानें", hello: "हमसे कहें", occasions: "अवसर", studio: "स्टूडियो", mine: "मेरे निमंत्रण", how: "कैसे काम करता है", wording: "निमंत्रण के शब्द", pricing: "कीमत", help: "मदद", feedback: "अपनी राय बताइए", privacy: "गोपनीयता", drawn: "हर निमंत्रण, हाथ से बना।" },
};

export function SiteFooter({ lang = "en" }: { lang?: Lang }) {
  const f = TEXT[lang];
  return <footer className="site-footer theme-dark" lang={lang} data-site-footer>
    <Toran className="site-footer-toran" dark/>
    <div className="site-footer-main">
      <div className="site-footer-brand">
        <Link href="/" className="site-footer-seal" aria-label="WowLink home"><SealMark/></Link>
        <span className="site-footer-wordmark" lang="en">wow<b>link</b></span>
        <span className="site-footer-made">{f.made}</span>
        <Link className="cin-cta cin-cta-light header-cta" href="/templates">{f.create}</Link>
      </div>
      <nav className="site-footer-links" aria-label="Footer">
        <div><h2>{f.make}</h2><Link href="/templates">{f.occasions}</Link><Link href="/create">{f.studio}</Link><Link href="/mine">{f.mine}</Link></div>
        <div><h2>{f.learn}</h2><Link href="/#experience">{f.how}</Link><Link href="/wording">{f.wording}</Link><Link href={langHref("/pricing", lang)}>{f.pricing}</Link><Link href={langHref("/help", lang)}>{f.help}</Link></div>
        <div><h2>{f.hello}</h2><FeedbackLink>{f.feedback}</FeedbackLink><Link href={langHref("/privacy", lang)}>{f.privacy}</Link></div>
      </nav>
    </div>
    <div className="site-footer-base">
      <span lang="en">© 2026 WowLink</span>
      <span className="site-footer-trio" aria-hidden="true"><span lang="gu">આમંત્રણ</span> · <span lang="hi">निमंत्रण</span> · <span lang="en">Invitation</span></span>
      <span>{f.drawn}</span>
    </div>
  </footer>;
}
