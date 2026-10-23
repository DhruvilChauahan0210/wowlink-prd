import Link from "next/link";
import type { Lang } from "../lib/invitations";

/*
 * The two plans as cards, the same wherever they're shown (the home page, /pricing), so they can't drift apart. Short
 * on purpose: /pricing has the full comparison table. Only what's true today: the free plan's rules are in plans.ts,
 * and the Creator studio can't be bought yet (it's asked for from an invitation's manage page).
 */

type Card = { note: string; name: string; tagline: string; line: string; price: string; per: string; items: string[] };
type Plans = { personal: Card & { cta: string }; pro: Card & { soon: readonly [string, string] } };

const PLANS: Record<Lang, Plans> = {
  en: {
    personal: { note: "for your own day", name: "Personal", tagline: "Your moment", line: "One beautiful occasion, with every essential.", price: "₹0", per: "free to create", cta: "Make your invitation",
      items: ["The four starter occasions: wedding, birthday, Garba, grand opening", "One live invitation at a time", "One celebration, with a countdown and calendar", "Up to 50 replies, and food needs", "English, Gujarati or Hindi, WhatsApp and QR code", "Stays up until 30 days after the day"] },
    pro: { note: "for families and planners", name: "Creator studio", tagline: "Your signature", line: "For big weddings, and for planners creating for clients.", price: "₹1,999", per: "per month", soon: ["Coming soon", "Until then, ask for it from your invitation’s manage page."],
      items: ["Every occasion, and up to 10 celebrations", "A personal link for each family, with reminders", "A custom link, and your own colours", "Your brand and client previews, no WowLink link", "Song requests, a poll, and wishes on show", "Spreadsheets and detailed insights"] },
  },
  gu: {
    personal: { note: "આપના પોતાના દિવસ માટે", name: "પર્સનલ", tagline: "આપની ક્ષણ", line: "એક સુંદર પ્રસંગ, જરૂરી બધું સાથે.", price: "₹0", per: "બનાવવું મફત", cta: "આપનું આમંત્રણ બનાવો",
      items: ["ચાર શરૂઆતના પ્રસંગો: લગ્ન, જન્મદિવસ, ગરબા, ઉદ્ઘાટન", "એક સમયે એક લાઇવ આમંત્રણ", "એક પ્રસંગ, દિવસ સુધીની ગણતરી અને કેલેન્ડર સાથે", "50 જવાબો સુધી, અને ભોજનની જરૂરિયાતો", "અંગ્રેજી, ગુજરાતી કે હિન્દી, WhatsApp અને QR કોડ", "પ્રસંગ પછી 30 દિવસ સુધી ચાલુ રહે"] },
    pro: { note: "પરિવારો અને આયોજકો માટે", name: "ક્રિએટર સ્ટુડિયો", tagline: "આપની ઓળખ", line: "મોટાં લગ્નો માટે, અને ક્લાયન્ટ માટે બનાવતા આયોજકો માટે.", price: "₹1,999", per: "દર મહિને", soon: ["જલદી આવે છે", "ત્યાં સુધી, આપના આમંત્રણના મેનેજ પાના પરથી તે માગો."],
      items: ["દરેક પ્રસંગ, અને 10 પ્રસંગો સુધીનો કાર્યક્રમ", "દરેક પરિવાર માટે વ્યક્તિગત લિંક, યાદ અપાવવા સાથે", "પોતાની લિંક, અને આપના પોતાના રંગ", "આપની બ્રાન્ડ અને ક્લાયન્ટ પ્રીવ્યૂ, WowLink ની લિંક વગર", "ગીતની ફરમાઈશ, સવાલ, અને આમંત્રણ પર શુભેચ્છાઓ", "સ્પ્રેડશીટ અને વિગતવાર આંકડા"] },
  },
  hi: {
    personal: { note: "अपने दिन के लिए", name: "पर्सनल", tagline: "आपका पल", line: "एक खूबसूरत अवसर, ज़रूरी सब कुछ साथ।", price: "₹0", per: "बनाना मुफ़्त", cta: "अपना निमंत्रण बनाएँ",
      items: ["चार शुरुआती अवसर: शादी, जन्मदिन, गरबा, उद्घाटन", "एक समय में एक लाइव निमंत्रण", "एक कार्यक्रम, उलटी गिनती और कैलेंडर के साथ", "50 जवाब तक, और खाने की ज़रूरतें", "अंग्रेज़ी, गुजराती या हिन्दी, WhatsApp और QR कोड", "अवसर के 30 दिन बाद तक चालू"] },
    pro: { note: "परिवारों और आयोजकों के लिए", name: "क्रिएटर स्टूडियो", tagline: "आपकी पहचान", line: "बड़ी शादियों के लिए, और क्लाइंट के लिए बनाने वाले आयोजकों के लिए।", price: "₹1,999", per: "हर महीने", soon: ["जल्द आ रहा है", "तब तक, अपने निमंत्रण के मैनेज पेज से इसे माँगें।"],
      items: ["हर अवसर, और 10 कार्यक्रमों तक की सूची", "हर परिवार के लिए व्यक्तिगत लिंक, याद दिलाने के साथ", "अपनी लिंक, और अपने रंग", "आपका ब्रांड और क्लाइंट प्रीव्यू, WowLink की लिंक के बिना", "गानों की फ़रमाइश, पोल, और निमंत्रण पर शुभकामनाएँ", "स्प्रेडशीट और विस्तार से आँकड़े"] },
  },
};

/** The plan cards. `heading`: the level of each card's title (h3 under a section's h2, h2 under a page's h1). */
export function PlanCards({ lang, heading: Heading = "h3" }: { lang: Lang; heading?: "h2" | "h3" }) {
  const { personal, pro } = PLANS[lang];
  const top = (card: Card) => <>
    <span className="cin-plan-note">{card.note}</span><span className="cin-plan-name">{card.name}</span>
    <Heading>{card.tagline}</Heading><p>{card.line}</p>
    <div className="cin-price">{card.price}<span>{card.per}</span></div>
    <ul>{card.items.map(item => <li key={item}>{item}</li>)}</ul>
  </>;
  return <div className="cin-plan-grid">
    <article className="cin-plan">{top(personal)}<Link className="cin-cta cin-cta-outline" href="/templates">{personal.cta}</Link></article>
    <article className="cin-plan cin-plan-pro theme-dark">{top(pro)}<p className="cin-plan-soon"><strong>{pro.soon[0]}</strong> {pro.soon[1]}</p></article>
  </div>;
}
