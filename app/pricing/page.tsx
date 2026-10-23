import type { Metadata } from "next";
import Link from "next/link";
import { LANGS, langHref, pageLang, type Lang } from "../lib/invitations";
import { PublicPage } from "../ui/public-page";

/*
 * Pricing: the two plans from the PRD, said honestly. Personal is free and everything on it works today; the Creator
 * studio isn't open yet, so it's shown as coming, with what it's planned to include.
 */

type Content = {
  title: string; description: string; heading: readonly [string, string]; intro: string;
  personal: { note: string; name: string; tagline: string; price: string; per: string; items: string[]; cta: string };
  pro: { note: string; name: string; tagline: string; price: string; per: string; items: string[]; soon: string };
  table: { caption: string; feature: string; free: string; pro: string; rows: [string, string, string][] };
  note: string;
};

export const PRICING: Record<Lang, Content> = {
  en: {
    title: "Pricing — WowLink",
    description: "WowLink is free for your own occasion: every hand-drawn invitation, personal links for each family, up to 100 replies, in English, Gujarati or Hindi. A Creator studio plan for planners is coming.",
    heading: ["Free for your own", "occasion"],
    intro: "Everything you need for your own wedding, birthday or puja is free. A plan for planners and businesses who make invitations for others is on its way.",
    personal: { note: "for your own day", name: "Personal", tagline: "Your moment", price: "₹0", per: "free to create", cta: "Make your invitation",
      items: ["All eight hand-drawn occasions and their openings", "Up to 100 replies per invitation", "A personal link for each family", "English, Gujarati or Hindi, guests can switch", "WhatsApp, link and printable QR code", "Your own colours", "See who opened it and how it’s doing"] },
    pro: { note: "for planners", name: "Creator studio", tagline: "Your signature", price: "₹1,999", per: "per month", soon: "coming soon",
      items: ["Up to 20 live invitations", "Your brand, colours and logo", "No WowLink link on your invitations", "Up to 5,000 replies a month", "Reusable presets and client previews", "Priority support"] },
    table: { caption: "Side by side", feature: "Feature", free: "Personal", pro: "Creator studio", rows: [
      ["Price", "₹0", "₹1,999 a month"],
      ["Live invitations", "Your own occasion", "Up to 20"],
      ["Replies", "Up to 100 per invitation", "Up to 5,000 a month"],
      ["Personal links, QR code, Gujarati and Hindi", "Included", "Included"],
      ["“Made with WowLink” link", "Shown", "Removable"],
      ["Your logo and brand", "—", "Included"],
      ["Support", "Help pages", "Priority"],
    ] },
    note: "The Creator studio isn’t open yet, so there’s nothing to pay for today. Prices are in Indian rupees.",
  },
  gu: {
    title: "કિંમત — WowLink",
    description: "આપના પોતાના પ્રસંગ માટે WowLink મફત છે: દરેક હાથે દોરેલું આમંત્રણ, દરેક પરિવાર માટે વ્યક્તિગત લિંક, 100 જવાબો સુધી, અંગ્રેજી, ગુજરાતી કે હિન્દીમાં. આયોજકો માટે ક્રિએટર સ્ટુડિયો પ્લાન આવી રહ્યો છે.",
    heading: ["આપના પોતાના પ્રસંગ માટે", "મફત"],
    intro: "આપના પોતાના લગ્ન, જન્મદિવસ કે પૂજા માટે જરૂરી બધું મફત છે. બીજાઓ માટે આમંત્રણ બનાવતા આયોજકો અને વ્યવસાયો માટેનો પ્લાન આવી રહ્યો છે.",
    personal: { note: "આપના પોતાના દિવસ માટે", name: "પર્સનલ", tagline: "આપની ક્ષણ", price: "₹0", per: "બનાવવું મફત", cta: "આપનું આમંત્રણ બનાવો",
      items: ["આઠેય હાથે દોરેલા પ્રસંગો અને તેમની ખોલવાની વિધિ", "દરેક આમંત્રણ પર 100 જવાબો સુધી", "દરેક પરિવાર માટે વ્યક્તિગત લિંક", "અંગ્રેજી, ગુજરાતી કે હિન્દી, મહેમાનો બદલી શકે", "WhatsApp, લિંક અને છાપી શકાય એવો QR કોડ", "આપના પોતાના રંગ", "કોણે ખોલ્યું અને આમંત્રણ કેવું ચાલે છે તે જુઓ"] },
    pro: { note: "આયોજકો માટે", name: "ક્રિએટર સ્ટુડિયો", tagline: "આપની ઓળખ", price: "₹1,999", per: "દર મહિને", soon: "જલદી આવે છે",
      items: ["20 ચાલુ આમંત્રણો સુધી", "આપની બ્રાન્ડ, રંગ અને લોગો", "આપનાં આમંત્રણો પર WowLink ની લિંક નહીં", "દર મહિને 5,000 જવાબો સુધી", "ફરી વાપરી શકાય એવા પ્રીસેટ અને ક્લાયન્ટ પ્રીવ્યૂ", "પહેલી પ્રાથમિકતાવાળી મદદ"] },
    table: { caption: "સામસામે સરખામણી", feature: "સુવિધા", free: "પર્સનલ", pro: "ક્રિએટર સ્ટુડિયો", rows: [
      ["કિંમત", "₹0", "દર મહિને ₹1,999"],
      ["ચાલુ આમંત્રણો", "આપનો પોતાનો પ્રસંગ", "20 સુધી"],
      ["જવાબો", "દરેક આમંત્રણ પર 100 સુધી", "દર મહિને 5,000 સુધી"],
      ["વ્યક્તિગત લિંક, QR કોડ, ગુજરાતી અને હિન્દી", "સામેલ", "સામેલ"],
      ["“WowLink થી બનાવેલું” લિંક", "દેખાય છે", "કાઢી શકાય"],
      ["આપનો લોગો અને બ્રાન્ડ", "—", "સામેલ"],
      ["મદદ", "મદદનાં પાનાં", "પહેલી પ્રાથમિકતા"],
    ] },
    note: "ક્રિએટર સ્ટુડિયો હજી શરૂ થયો નથી, એટલે આજે કંઈ ચૂકવવાનું નથી. કિંમતો ભારતીય રૂપિયામાં છે.",
  },
  hi: {
    title: "कीमत — WowLink",
    description: "आपके अपने अवसर के लिए WowLink मुफ़्त है: हर हाथ से बना निमंत्रण, हर परिवार के लिए व्यक्तिगत लिंक, 100 जवाबों तक, अंग्रेज़ी, गुजराती या हिंदी में। आयोजकों के लिए क्रिएटर स्टूडियो प्लान आ रहा है।",
    heading: ["आपके अपने अवसर के लिए", "मुफ़्त"],
    intro: "आपकी अपनी शादी, जन्मदिन या पूजा के लिए ज़रूरी सब कुछ मुफ़्त है। दूसरों के लिए निमंत्रण बनाने वाले आयोजकों और कारोबारों के लिए एक प्लान आ रहा है।",
    personal: { note: "आपके अपने दिन के लिए", name: "पर्सनल", tagline: "आपका पल", price: "₹0", per: "बनाना मुफ़्त", cta: "अपना निमंत्रण बनाएँ",
      items: ["हाथ से बने सभी आठ अवसर और उनके खुलने के दृश्य", "हर निमंत्रण पर 100 जवाबों तक", "हर परिवार के लिए व्यक्तिगत लिंक", "अंग्रेज़ी, गुजराती या हिंदी, मेहमान भाषा बदल सकते हैं", "WhatsApp, लिंक और प्रिंट करने लायक QR कोड", "आपके अपने रंग", "देखें किसने खोला और निमंत्रण कैसा चल रहा है"] },
    pro: { note: "आयोजकों के लिए", name: "क्रिएटर स्टूडियो", tagline: "आपकी पहचान", price: "₹1,999", per: "हर महीने", soon: "जल्द आ रहा है",
      items: ["20 चालू निमंत्रणों तक", "आपका ब्रांड, रंग और लोगो", "आपके निमंत्रणों पर WowLink का लिंक नहीं", "हर महीने 5,000 जवाबों तक", "दोबारा इस्तेमाल होने वाले प्रीसेट और क्लाइंट प्रीव्यू", "प्राथमिकता वाली मदद"] },
    table: { caption: "आमने-सामने तुलना", feature: "सुविधा", free: "पर्सनल", pro: "क्रिएटर स्टूडियो", rows: [
      ["कीमत", "₹0", "₹1,999 हर महीने"],
      ["चालू निमंत्रण", "आपका अपना अवसर", "20 तक"],
      ["जवाब", "हर निमंत्रण पर 100 तक", "हर महीने 5,000 तक"],
      ["व्यक्तिगत लिंक, QR कोड, गुजराती और हिंदी", "शामिल", "शामिल"],
      ["“WowLink से बनाया गया” लिंक", "दिखता है", "हटाया जा सकता है"],
      ["आपका लोगो और ब्रांड", "—", "शामिल"],
      ["मदद", "मदद के पेज", "प्राथमिकता"],
    ] },
    note: "क्रिएटर स्टूडियो अभी शुरू नहीं हुआ है, इसलिए आज कुछ भी चुकाना नहीं है। कीमतें भारतीय रुपये में हैं।",
  },
};

type Props = { searchParams: Promise<{ lang?: string | string[] }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const lang = pageLang((await searchParams).lang);
  const { title, description } = PRICING[lang];
  return { title, description, alternates: { canonical: langHref("/pricing", lang), languages: Object.fromEntries(LANGS.map(l => [l, langHref("/pricing", l)])) } };
}

export default async function PricingPage({ searchParams }: Props) {
  const lang = pageLang((await searchParams).lang);
  const c = PRICING[lang];
  return <PublicPage lang={lang} path="/pricing" className="pricing-page">
    <main className="pricing">
      <h1>{c.heading[0]} <span className="scribble">{c.heading[1]}</span></h1>
      <p className="help-intro">{c.intro}</p>
      <div className="cin-plan-grid">
        <article className="cin-plan"><span className="cin-plan-note">{c.personal.note}</span><span className="cin-plan-name">{c.personal.name}</span><h2>{c.personal.tagline}</h2>
          <div className="cin-price">{c.personal.price}<span>{c.personal.per}</span></div>
          <ul>{c.personal.items.map(item => <li key={item}>{item}</li>)}</ul>
          <Link className="cin-cta cin-cta-outline" href="/templates">{c.personal.cta}</Link>
        </article>
        <article className="cin-plan cin-plan-pro theme-dark"><span className="cin-plan-note">{c.pro.note}</span><span className="cin-plan-name">{c.pro.name}</span><h2>{c.pro.tagline}</h2>
          <div className="cin-price">{c.pro.price}<span>{c.pro.per}</span></div>
          <span className="pricing-soon">{c.pro.soon}</span>
          <ul>{c.pro.items.map(item => <li key={item}>{item}</li>)}</ul>
        </article>
      </div>
      <div className="pricing-table-wrap"><table className="pricing-table">
        <caption>{c.table.caption}</caption>
        <thead><tr><th scope="col"><span className="studio-sr-only">{c.table.feature}</span></th><th scope="col">{c.table.free}</th><th scope="col">{c.table.pro}</th></tr></thead>
        <tbody>{c.table.rows.map(([feature, free, pro]) => <tr key={feature}><th scope="row">{feature}</th><td>{free}</td><td>{pro}</td></tr>)}</tbody>
      </table></div>
      <p className="pricing-note">{c.note}</p>
    </main>
  </PublicPage>;
}
