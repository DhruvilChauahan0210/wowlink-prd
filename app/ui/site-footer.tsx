import Link from "next/link";
import { invitationTemplates, langHref, type Lang, type TemplateId } from "../lib/invitations";
import { SealMark } from "./brand";
import { FeedbackLink } from "./feedback";
import { Toran } from "./toran";

/*
 * The one footer of every WowLink page (a guest's invitation keeps its own, which belongs to the invitation): night
 * paper under the same toran as the home page's doorway, the seal stamped large, a sign-off, the way to start, and the
 * links in three short columns. In the page's language.
 */

const TEXT: Record<Lang, { made: string; create: string; make: string; learn: string; hello: string; occasions: string; studio: string; mine: string; how: string; wording: string; guides: string; pricing: string; help: string; feedback: string; privacy: string; drawn: string }> = {
  en: { made: "Made with love, shared with one link.", create: "Create your invitation", make: "Make", learn: "Learn", hello: "Say hello", occasions: "Occasions", studio: "The studio", mine: "My invitations", how: "How it works", wording: "Invitation wording", guides: "Guides", pricing: "Pricing", help: "Help", feedback: "Tell us what you think", privacy: "Privacy", drawn: "Every invitation, drawn by hand." },
  gu: { made: "પ્રેમથી બનાવેલું, એક લિંકથી મોકલેલું.", create: "આપનું આમંત્રણ બનાવો", make: "બનાવો", learn: "જાણો", hello: "અમને કહો", occasions: "પ્રસંગો", studio: "સ્ટુડિયો", mine: "મારાં આમંત્રણો", how: "કેવી રીતે કામ કરે છે", wording: "આમંત્રણના શબ્દો", guides: "માર્ગદર્શિકા", pricing: "કિંમત", help: "મદદ", feedback: "આપનો અભિપ્રાય જણાવો", privacy: "ગોપનીયતા", drawn: "દરેક આમંત્રણ, હાથથી દોરેલું." },
  hi: { made: "प्यार से बनाया, एक लिंक से भेजा।", create: "अपना निमंत्रण बनाएँ", make: "बनाएँ", learn: "जानें", hello: "हमसे कहें", occasions: "अवसर", studio: "स्टूडियो", mine: "मेरे निमंत्रण", how: "कैसे काम करता है", wording: "निमंत्रण के शब्द", guides: "गाइड", pricing: "कीमत", help: "मदद", feedback: "अपनी राय बताइए", privacy: "गोपनीयता", drawn: "हर निमंत्रण, हाथ से बना।" },
};

/*
 * A link to every occasion's page, in the reader's language, on every page: how crawlers (and readers) reach each of the
 * pages meant to be found by, from the home page and from every other page. Kept here, not read from the occasion
 * pages' copy, because the home page's footer is part of its script and that copy is large.
 */
const OCCASION_LINKS: Record<Lang, { title: string; names: Record<TemplateId, string> }> = {
  en: { title: "Invitations for every occasion", names: { wedding: "Wedding invitations", engagement: "Engagement invitations", birthday: "Birthday invitations", garba: "Garba and Navratri invitations", babyshower: "Baby shower and seemant invitations", housewarming: "Housewarming and griha pravesh invitations", anniversary: "Anniversary invitations", opening: "Shop and office opening invitations", diwali: "Diwali invitations", janoi: "Janoi and upanayan invitations", puja: "Satyanarayan katha invitations", naming: "Naming ceremony invitations" } },
  gu: { title: "દરેક પ્રસંગ માટે આમંત્રણ", names: { wedding: "લગ્નનું આમંત્રણ", engagement: "સગાઈનું આમંત્રણ", birthday: "જન્મદિવસનું આમંત્રણ", garba: "ગરબા અને નવરાત્રિનું આમંત્રણ", babyshower: "સીમંતનું આમંત્રણ", housewarming: "વાસ્તુ પૂજનનું આમંત્રણ", anniversary: "લગ્નતિથિનું આમંત્રણ", opening: "ઉદ્ઘાટનનું આમંત્રણ", diwali: "દિવાળી મિલનનું આમંત્રણ", janoi: "જનોઈનું આમંત્રણ", puja: "સત્યનારાયણ કથાનું આમંત્રણ", naming: "નામકરણનું આમંત્રણ" } },
  hi: { title: "हर अवसर के लिए निमंत्रण", names: { wedding: "शादी का निमंत्रण", engagement: "सगाई का निमंत्रण", birthday: "जन्मदिन का निमंत्रण", garba: "गरबा और नवरात्रि का निमंत्रण", babyshower: "गोद भराई का निमंत्रण", housewarming: "गृह प्रवेश का निमंत्रण", anniversary: "सालगिरह का निमंत्रण", opening: "उद्घाटन का निमंत्रण", diwali: "दिवाली मिलन का निमंत्रण", janoi: "जनेऊ का निमंत्रण", puja: "सत्यनारायण कथा का निमंत्रण", naming: "नामकरण का निमंत्रण" } },
};

export function SiteFooter({ lang = "en" }: { lang?: Lang }) {
  const f = TEXT[lang];
  const occasions = OCCASION_LINKS[lang];
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
        <div><h2>{f.learn}</h2><Link href="/#experience">{f.how}</Link><Link href={langHref("/wording", lang)}>{f.wording}</Link><Link href={langHref("/guides", lang)}>{f.guides}</Link><Link href={langHref("/pricing", lang)}>{f.pricing}</Link><Link href={langHref("/help", lang)}>{f.help}</Link></div>
        <div><h2>{f.hello}</h2><FeedbackLink>{f.feedback}</FeedbackLink><Link href={langHref("/privacy", lang)}>{f.privacy}</Link></div>
      </nav>
    </div>
    <nav className="site-footer-occasions" aria-label={occasions.title}>
      <h2>{occasions.title}</h2>
      <ul>{invitationTemplates.map((template) => <li key={template.id}><Link href={langHref(`/templates/${template.id}`, lang)}>{occasions.names[template.id]}</Link></li>)}</ul>
    </nav>
    <div className="site-footer-base">
      <span lang="en">© 2026 WowLink</span>
      <span className="site-footer-trio" aria-hidden="true"><span lang="gu">આમંત્રણ</span> · <span lang="hi">निमंत्रण</span> · <span lang="en">Invitation</span></span>
      <span>{f.drawn}</span>
    </div>
  </footer>;
}
