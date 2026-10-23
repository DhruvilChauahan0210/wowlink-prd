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

const PRICING: Record<Lang, Content> = {
  en: {
    title: "Pricing — WowLink",
    description: "Start free: a hand-drawn invitation for your own occasion, with one celebration and 50 replies, in English, Gujarati or Hindi. The Creator studio adds schedules, a link for each family, your own colours and more.",
    heading: ["Start free,", "go further"],
    intro: "A simple invitation for your own day is free. For a wedding with many functions, a link for each family, your own colours or a planner’s work, there’s the Creator studio.",
    personal: { note: "for your own day", name: "Personal", tagline: "Your moment", price: "₹0", per: "free to create", cta: "Make your invitation",
      items: ["The four starter occasions: wedding, birthday, Garba and grand opening", "One live invitation at a time", "One celebration, with a countdown and calendar", "Up to 50 replies", "Ask guests about food needs", "English, Gujarati or Hindi", "WhatsApp, link and printable QR code", "Stays up until 30 days after the day"] },
    pro: { note: "for families and planners", name: "Creator studio", tagline: "Your signature", price: "₹1,999", per: "per month", soon: "coming soon",
      items: ["Every occasion, with Diwali, janoi, puja and naamkaran", "Schedules of up to 10 celebrations", "A personal link for each family, and one-tap reminders", "A custom link, like /e/isha-kabir", "Your own colours and your brand, without the WowLink link", "Client previews before you publish changes", "Song requests, a poll, and wishes shown on the invitation", "Spreadsheets for the caterer, and detailed insights"] },
    table: { caption: "Side by side", feature: "Feature", free: "Personal", pro: "Creator studio", rows: [
      ["Price", "₹0", "₹1,999 a month"],
      ["Occasions", "4 starter occasions", "All of them"],
      ["Celebrations in one invitation", "1", "Up to 10"],
      ["Replies", "Up to 50", "Up to 1,000"],
      ["Stays up", "Until 30 days after the day", "With no end date"],
      ["A personal link for each family", "—", "Included"],
      ["A custom link", "—", "Included"],
      ["Your brand and client previews", "—", "Included"],
      ["Wishes shown on the invitation", "—", "Included"],
      ["Your own colours, no WowLink link", "—", "Included"],
      ["Food needs", "Included", "Included"],
      ["Song requests and polls", "—", "Included"],
      ["Spreadsheets and detailed insights", "—", "Included"],
      ["English, Gujarati, Hindi and QR code", "Included", "Included"],
    ] },
    note: "The Creator studio can’t be bought online yet. Until it can, ask for it from your invitation’s manage page and WowLink moves it for you. Prices are in Indian rupees.",
  },
  gu: {
    title: "કિંમત — WowLink",
    description: "મફતમાં શરૂ કરો: આપના પોતાના પ્રસંગ માટે હાથે દોરેલું આમંત્રણ, એક પ્રસંગ અને 50 જવાબો, અંગ્રેજી, ગુજરાતી કે હિન્દીમાં. ક્રિએટર સ્ટુડિયોમાં કાર્યક્રમ, દરેક પરિવાર માટે લિંક, આપના પોતાના રંગ અને ઘણું વધારે છે.",
    heading: ["મફતમાં શરૂ કરો,", "આગળ વધો"],
    intro: "આપના પોતાના દિવસ માટે સાદું આમંત્રણ મફત છે. ઘણા પ્રસંગોવાળાં લગ્ન, દરેક પરિવાર માટે લિંક, આપના પોતાના રંગ કે આયોજકના કામ માટે ક્રિએટર સ્ટુડિયો છે.",
    personal: { note: "આપના પોતાના દિવસ માટે", name: "પર્સનલ", tagline: "આપની ક્ષણ", price: "₹0", per: "બનાવવું મફત", cta: "આપનું આમંત્રણ બનાવો",
      items: ["ચાર શરૂઆતના પ્રસંગો: લગ્ન, જન્મદિવસ, ગરબા અને ઉદ્ઘાટન", "એક સમયે એક લાઇવ આમંત્રણ", "એક પ્રસંગ, દિવસ સુધીની ગણતરી અને કેલેન્ડર સાથે", "50 જવાબો સુધી", "મહેમાનોને ભોજન વિશે પૂછો", "અંગ્રેજી, ગુજરાતી કે હિન્દી", "WhatsApp, લિંક અને છાપી શકાય એવો QR કોડ", "પ્રસંગ પછી 30 દિવસ સુધી ચાલુ રહે"] },
    pro: { note: "પરિવારો અને આયોજકો માટે", name: "ક્રિએટર સ્ટુડિયો", tagline: "આપની ઓળખ", price: "₹1,999", per: "દર મહિને", soon: "જલદી આવે છે",
      items: ["દરેક પ્રસંગ, દિવાળી, જનોઈ, પૂજા અને નામકરણ સાથે", "10 પ્રસંગો સુધીનો કાર્યક્રમ", "દરેક પરિવાર માટે વ્યક્તિગત લિંક, અને એક ટૅપમાં યાદ", "પોતાની લિંક, જેમ કે /e/isha-kabir", "આપના પોતાના રંગ અને બ્રાન્ડ, WowLink ની લિંક વગર", "ફેરફાર પ્રકાશિત કરતાં પહેલાં ક્લાયન્ટ પ્રીવ્યૂ", "ગીતની ફરમાઈશ, સવાલ, અને આમંત્રણ પર શુભેચ્છાઓ", "કેટરર માટે સ્પ્રેડશીટ, અને વિગતવાર આંકડા"] },
    table: { caption: "સામસામે સરખામણી", feature: "સુવિધા", free: "પર્સનલ", pro: "ક્રિએટર સ્ટુડિયો", rows: [
      ["કિંમત", "₹0", "દર મહિને ₹1,999"],
      ["પ્રસંગો", "4 શરૂઆતના પ્રસંગો", "બધા"],
      ["એક આમંત્રણમાં પ્રસંગો", "1", "10 સુધી"],
      ["જવાબો", "50 સુધી", "1,000 સુધી"],
      ["ચાલુ રહે", "પ્રસંગ પછી 30 દિવસ સુધી", "કોઈ અંતિમ તારીખ વગર"],
      ["દરેક પરિવાર માટે વ્યક્તિગત લિંક", "—", "સામેલ"],
      ["પોતાની લિંક", "—", "સામેલ"],
      ["આપની બ્રાન્ડ અને ક્લાયન્ટ પ્રીવ્યૂ", "—", "સામેલ"],
      ["આમંત્રણ પર શુભેચ્છાઓ", "—", "સામેલ"],
      ["આપના પોતાના રંગ, WowLink લિંક વગર", "—", "સામેલ"],
      ["ભોજનની જરૂરિયાત", "સામેલ", "સામેલ"],
      ["ગીતની ફરમાઈશ અને સવાલ", "—", "સામેલ"],
      ["સ્પ્રેડશીટ અને વિગતવાર આંકડા", "—", "સામેલ"],
      ["અંગ્રેજી, ગુજરાતી, હિન્દી અને QR કોડ", "સામેલ", "સામેલ"],
    ] },
    note: "ક્રિએટર સ્ટુડિયો હજી ઑનલાઇન ખરીદી શકાતો નથી. ત્યાં સુધી આપના આમંત્રણના મેનેજ પાના પરથી તે માટે પૂછો, અને WowLink તેને ખસેડી આપશે. કિંમતો ભારતીય રૂપિયામાં છે.",
  },
  hi: {
    title: "कीमत — WowLink",
    description: "मुफ़्त में शुरू करें: अपने अवसर के लिए हाथ से बना निमंत्रण, एक कार्यक्रम और 50 जवाब, अंग्रेज़ी, गुजराती या हिन्दी में। क्रिएटर स्टूडियो में कार्यक्रमों की सूची, हर परिवार के लिए लिंक, अपने रंग और बहुत कुछ है।",
    heading: ["मुफ़्त में शुरू करें,", "आगे बढ़ें"],
    intro: "अपने दिन के लिए एक सादा निमंत्रण मुफ़्त है। कई रस्मों वाली शादी, हर परिवार के लिए लिंक, अपने रंग या आयोजक के काम के लिए क्रिएटर स्टूडियो है।",
    personal: { note: "अपने दिन के लिए", name: "पर्सनल", tagline: "आपका पल", price: "₹0", per: "बनाना मुफ़्त", cta: "अपना निमंत्रण बनाएँ",
      items: ["चार शुरुआती अवसर: शादी, जन्मदिन, गरबा और उद्घाटन", "एक समय में एक लाइव निमंत्रण", "एक कार्यक्रम, उलटी गिनती और कैलेंडर के साथ", "50 जवाब तक", "मेहमानों से खाने के बारे में पूछें", "अंग्रेज़ी, गुजराती या हिन्दी", "WhatsApp, लिंक और छापने लायक QR कोड", "अवसर के 30 दिन बाद तक चालू"] },
    pro: { note: "परिवारों और आयोजकों के लिए", name: "क्रिएटर स्टूडियो", tagline: "आपकी पहचान", price: "₹1,999", per: "हर महीने", soon: "जल्द आ रहा है",
      items: ["हर अवसर, दिवाली, जनेऊ, पूजा और नामकरण के साथ", "10 कार्यक्रमों तक की सूची", "हर परिवार के लिए व्यक्तिगत लिंक, और एक टैप में याद दिलाना", "अपनी लिंक, जैसे /e/isha-kabir", "अपने रंग और ब्रांड, WowLink की लिंक के बिना", "बदलाव प्रकाशित करने से पहले क्लाइंट प्रीव्यू", "गानों की फ़रमाइश, पोल, और निमंत्रण पर शुभकामनाएँ", "कैटरर के लिए स्प्रेडशीट, और विस्तार से आँकड़े"] },
    table: { caption: "आमने-सामने", feature: "सुविधा", free: "पर्सनल", pro: "क्रिएटर स्टूडियो", rows: [
      ["कीमत", "₹0", "हर महीने ₹1,999"],
      ["अवसर", "4 शुरुआती अवसर", "सभी"],
      ["एक निमंत्रण में कार्यक्रम", "1", "10 तक"],
      ["जवाब", "50 तक", "1,000 तक"],
      ["चालू रहता है", "अवसर के 30 दिन बाद तक", "बिना आख़िरी तारीख़ के"],
      ["हर परिवार के लिए व्यक्तिगत लिंक", "—", "शामिल"],
      ["अपनी लिंक", "—", "शामिल"],
      ["आपका ब्रांड और क्लाइंट प्रीव्यू", "—", "शामिल"],
      ["निमंत्रण पर शुभकामनाएँ", "—", "शामिल"],
      ["अपने रंग, WowLink लिंक के बिना", "—", "शामिल"],
      ["खाने की ज़रूरतें", "शामिल", "शामिल"],
      ["गानों की फ़रमाइश और पोल", "—", "शामिल"],
      ["स्प्रेडशीट और विस्तार से आँकड़े", "—", "शामिल"],
      ["अंग्रेज़ी, गुजराती, हिन्दी और QR कोड", "शामिल", "शामिल"],
    ] },
    note: "क्रिएटर स्टूडियो अभी ऑनलाइन नहीं ख़रीदा जा सकता। तब तक अपने निमंत्रण के मैनेज पेज से इसके लिए पूछें, और WowLink इसे बदल देगा। कीमतें भारतीय रुपये में हैं।",
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
