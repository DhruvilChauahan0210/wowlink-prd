import type { Metadata } from "next";
import { LANGS, langHref, pageLang, type Lang } from "../lib/invitations";
import { PlanCards } from "../ui/plan-cards";
import { PublicPage } from "../ui/public-page";
import { breadcrumbs, webApplication } from "../lib/structured-data";
import { JsonLd } from "../ui/json-ld";

/*
 * Pricing: the two plans, said honestly. The cards are the same ones the home page shows (ui/plan-cards.tsx); here
 * they're followed by the full comparison. The Creator studio can't be bought yet, so it's shown as coming.
 */

type Content = {
  title: string; description: string; heading: readonly [string, string]; intro: string;
  table: { caption: string; feature: string; free: string; pro: string; soon: string; rows: [string, string, string][] };
  note: string;
};

const PRICING: Record<Lang, Content> = {
  en: {
    title: "Pricing: free to start — WowLink",
    description: "Start free: a hand-drawn invitation for your own occasion, in English, Gujarati or Hindi. The Creator studio adds schedules, family links and your colours.",
    heading: ["Start free,", "go further"],
    intro: "A simple invitation for your own day is free. For a wedding with many functions, a link for each family, your own colours or a planner’s work, there’s the Creator studio.",
    table: { caption: "Side by side", feature: "Feature", free: "Personal", pro: "Creator studio", soon: "coming soon", rows: [
      ["Price", "₹0", "₹1,999\u00a0a\u00a0month"],
      ["Live invitations at a time", "1", "Many"],
      ["Occasions", "4 starter occasions", "All of them"],
      ["Celebrations in one invitation", "1", "Up to 10"],
      ["Replies", "Up\u00a0to\u00a050", "Up\u00a0to\u00a01,000"],
      ["Stays up", "Until 30 days after the day", "With no end date"],
      ["A personal link for each family", "—", "Included"],
      ["A custom link", "—", "Included"],
      ["Your brand and client previews", "—", "Included"],
      ["Wishes shown on the invitation", "—", "Included"],
      ["Your own colours, without “Made with WowLink”", "—", "Included"],
      ["Food needs", "Included", "Included"],
      ["Song requests and polls", "—", "Included"],
      ["Spreadsheets and detailed insights", "—", "Included"],
      ["English, Gujarati, Hindi and QR code", "Included", "Included"],
    ] },
    note: "The Creator studio can’t be bought online yet. Until it can, ask for it from your invitation’s manage page and WowLink moves it for you. Prices are in Indian rupees.",
  },
  gu: {
    title: "કિંમત: મફતમાં શરૂ કરો — WowLink",
    description: "મફતમાં શરૂ કરો: આપના પ્રસંગ માટે હાથે દોરેલું આમંત્રણ, અંગ્રેજી, ગુજરાતી કે હિન્દીમાં. ક્રિએટર સ્ટુડિયોમાં કાર્યક્રમ, પરિવાર માટે લિંક અને આપના રંગ.",
    heading: ["મફતમાં શરૂ કરો,", "આગળ વધો"],
    intro: "આપના પોતાના દિવસ માટે સાદું આમંત્રણ મફત છે. ઘણા પ્રસંગોવાળાં લગ્ન, દરેક પરિવાર માટે લિંક, આપના પોતાના રંગ કે આયોજકના કામ માટે ક્રિએટર સ્ટુડિયો છે.",
    table: { caption: "સામસામે સરખામણી", feature: "સુવિધા", free: "પર્સનલ", pro: "ક્રિએટર સ્ટુડિયો", soon: "જલદી આવે છે", rows: [
      ["કિંમત", "₹0", "દર મહિને ₹1,999"],
      ["એક સમયે લાઇવ આમંત્રણો", "1", "ઘણાં"],
      ["આમંત્રણના પ્રકાર", "4 શરૂઆતનાં", "બધા"],
      ["એક આમંત્રણમાં પ્રસંગો", "1", "10 સુધી"],
      ["જવાબો", "50 સુધી", "1,000 સુધી"],
      ["ચાલુ રહે", "પ્રસંગ પછી 30 દિવસ સુધી", "કોઈ અંતિમ તારીખ વગર"],
      ["દરેક પરિવાર માટે વ્યક્તિગત લિંક", "—", "સામેલ"],
      ["પોતાની લિંક", "—", "સામેલ"],
      ["આપની બ્રાન્ડ અને ક્લાયન્ટ પ્રીવ્યૂ", "—", "સામેલ"],
      ["આમંત્રણ પર શુભેચ્છાઓ", "—", "સામેલ"],
      ["આપના પોતાના રંગ, “Made with WowLink” વગર", "—", "સામેલ"],
      ["ભોજનની જરૂરિયાત", "સામેલ", "સામેલ"],
      ["ગીતની ફરમાઈશ અને સવાલ", "—", "સામેલ"],
      ["સ્પ્રેડશીટ અને વિગતવાર આંકડા", "—", "સામેલ"],
      ["અંગ્રેજી, ગુજરાતી, હિન્દી અને QR કોડ", "સામેલ", "સામેલ"],
    ] },
    note: "ક્રિએટર સ્ટુડિયો હજી ઑનલાઇન ખરીદી શકાતો નથી. ત્યાં સુધી આપના આમંત્રણના મેનેજ પાના પરથી તે માટે પૂછો, અને WowLink તેને ખસેડી આપશે. કિંમતો ભારતીય રૂપિયામાં છે.",
  },
  hi: {
    title: "कीमत: मुफ़्त में शुरू करें — WowLink",
    description: "मुफ़्त में शुरू करें: अपने अवसर के लिए हाथ से बना निमंत्रण, अंग्रेज़ी, गुजराती या हिन्दी में। क्रिएटर स्टूडियो में कार्यक्रम, परिवार के लिंक और अपने रंग।",
    heading: ["मुफ़्त में शुरू करें,", "आगे बढ़ें"],
    intro: "अपने दिन के लिए एक सादा निमंत्रण मुफ़्त है। कई रस्मों वाली शादी, हर परिवार के लिए लिंक, अपने रंग या आयोजक के काम के लिए क्रिएटर स्टूडियो है।",
    table: { caption: "आमने-सामने", feature: "सुविधा", free: "पर्सनल", pro: "क्रिएटर स्टूडियो", soon: "जल्द आ रहा है", rows: [
      ["कीमत", "₹0", "हर महीने ₹1,999"],
      ["एक समय में लाइव निमंत्रण", "1", "कई"],
      ["अवसर", "4 शुरुआती अवसर", "सभी"],
      ["एक निमंत्रण में कार्यक्रम", "1", "10 तक"],
      ["जवाब", "50 तक", "1,000 तक"],
      ["चालू रहता है", "अवसर के 30 दिन बाद तक", "बिना आख़िरी तारीख़ के"],
      ["हर परिवार के लिए व्यक्तिगत लिंक", "—", "शामिल"],
      ["अपनी लिंक", "—", "शामिल"],
      ["आपका ब्रांड और क्लाइंट प्रीव्यू", "—", "शामिल"],
      ["निमंत्रण पर शुभकामनाएँ", "—", "शामिल"],
      ["अपने रंग, “Made with WowLink” के बिना", "—", "शामिल"],
      ["खाने की ज़रूरतें", "शामिल", "शामिल"],
      ["गानों की फ़रमाइश और पोल", "—", "शामिल"],
      ["स्प्रेडशीट और विस्तार से आँकड़े", "—", "शामिल"],
      ["अंग्रेज़ी, गुजराती, हिन्दी और QR कोड", "शामिल", "शामिल"],
    ] },
    note: "क्रिएटर स्टूडियो अभी ऑनलाइन नहीं ख़रीदा जा सकता। तब तक अपने निमंत्रण के मैनेज पेज से इसके लिए पूछें, और WowLink इसे क्रिएटर स्टूडियो में ले जाएगा। कीमतें भारतीय रुपये में हैं।",
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
    <JsonLd data={[breadcrumbs([["WowLink", "/"], [c.title.split(/ — |:/)[0], langHref("/pricing", lang)]]), webApplication()]}/>
    <main className="pricing">
      <h1>{c.heading[0]} <span className="scribble">{c.heading[1]}</span></h1>
      <p className="help-intro">{c.intro}</p>
      <PlanCards lang={lang} heading="h2"/>
      <div className="pricing-table-wrap"><table className="pricing-table">
        <caption>{c.table.caption}</caption>
        <thead><tr><th scope="col"><span className="studio-sr-only">{c.table.feature}</span></th><th scope="col">{c.table.free}</th><th scope="col">{c.table.pro}<span className="pricing-th-soon">{c.table.soon}</span></th></tr></thead>
        <tbody>{c.table.rows.map(([feature, free, pro]) => <tr key={feature}><th scope="row">{feature}</th><td>{free}</td><td>{pro}</td></tr>)}</tbody>
      </table></div>
      <p className="pricing-note">{c.note}</p>
    </main>
  </PublicPage>;
}
