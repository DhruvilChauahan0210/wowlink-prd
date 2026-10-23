import type { Metadata } from "next";
import Link from "next/link";
import { LANGS, langHref, pageLang, type Lang } from "../lib/invitations";
import { PublicPage } from "../ui/public-page";

/*
 * Help: the questions hosts actually ask, answered from how WowLink works today, in each language (?lang=).
 */

type Content = { title: string; description: string; heading: readonly [string, string]; intro: string; sections: { heading: string; items: [string, string][] }[]; more: string; start: string };

const HELP: Record<Lang, Content> = {
  en: {
    title: "Help — WowLink",
    description: "How to make, send and manage a WowLink invitation: personal links for each family, Gujarati and Hindi, changing details, replies, printing and deleting.",
    heading: ["How can we", "help?"],
    intro: "Short answers to what hosts ask most. Everything here is about how WowLink works today.",
    sections: [
      {
        heading: "Making your invitation",
        items: [
          ["Is it free?", "Yes, to start. The free plan has one live invitation at a time, the four starter occasions, one celebration and up to 50 replies, and stays up until 30 days after the day. Schedules, a link for each family, your own colours and more are in the Creator studio."],
          ["How do I get the Creator studio?", "Publish your invitation, then on its manage page choose “Ask for the Creator studio”. WowLink moves it for you. Paying online comes later."],
          ["Do I need an account?", "To publish, yes: you sign in with your Google account. No new password. Your invitations are then yours on every phone: sign in on My invitations. Guests never need an account."],
          ["Can I add the mehndi, sangeet and reception?", "With the Creator studio, yes. Add up to 10 celebrations, each with its own day, time and place. Guests tick the ones they’re coming to, and you get a headcount for each."],
          ["Can guests read it in Gujarati or Hindi?", "Yes. In the studio you choose the language guests see first, and each guest can switch with one tap. Dates and times are written the way an invitation says them."],
          ["Can I use my own colours?", "With the Creator studio, yes. Keep the occasion’s colours, pick one of seven palettes, or choose any colour. WowLink adjusts it so the words stay easy to read."],
          ["Can I make another one like it?", "With the Creator studio, yes. On its manage page choose “Make another like this”: the new one starts with the same drawing, colours, words and schedule. Its guests and replies aren’t copied."],
        ],
      },
      {
        heading: "Sending it",
        items: [
          ["How do I send each family its own link?", "With the Creator studio: on the manage page, add households under Personal invitations, one at a time or as a pasted list. Each gets a link that opens with their name on it, and you can send it on WhatsApp straight from the list. You’ll see who has opened theirs and who hasn’t replied."],
          ["Can I print it?", "Yes. Show the QR code on the manage page and download it for cards, posters or the shop window. It opens the same invitation as the link."],
          ["Can it be an announcement, with no replies?", "Yes. In the studio, under “On the invitation”, turn off “Ask guests to reply”. You can also hide the countdown there."],
          ["Can guests get directions to the exact gate?", "Yes. Paste the place’s share link from Google Maps into the studio. Without it, guests search for the venue’s name."],
          ["Who sees the replies?", "Only you, on the manage page. In the Creator studio you can also download every reply, and a headcount per celebration for the caterer, as a spreadsheet."],
        ],
      },
      {
        heading: "When something’s not right",
        items: [
          ["My manage page says the link isn’t valid.", "Use the whole manage link, including the part after #k=. If it’s lost, sign in on My invitations: your invitations come back on this device."],
          ["A guest says the link doesn’t open.", "Check the manage page says Live. A personal link stops working if you made a new link for that family or removed them; send them the current one."],
          ["How do I change something after sending it?", "Open the manage page, choose “Edit in studio”, make the change and press Update. The same link shows the new details."],
          ["How do I delete it?", "At the bottom of the manage page, “Delete this invitation” removes it for good, with every reply, wish and personal invitation. To hide it for now, unpublish it instead."],
          ["Something on an invitation looks wrong or abusive.", "Use the Report link at the bottom of the invitation. WowLink looks at every reported invitation."],
        ],
      },
    ],
    more: "Still stuck? The privacy page explains what’s kept and who sees it.",
    start: "Make your invitation",
  },
  gu: {
    title: "મદદ — WowLink",
    description: "WowLink આમંત્રણ કેવી રીતે બનાવવું, મોકલવું અને સંભાળવું: દરેક પરિવાર માટે વ્યક્તિગત લિંક, ગુજરાતી અને હિન્દી, વિગતો બદલવી, જવાબો, છાપવું અને કાઢી નાખવું.",
    heading: ["અમે કેવી રીતે", "મદદ કરીએ?"],
    intro: "યજમાનો સૌથી વધુ પૂછે છે તેના ટૂંકા જવાબો. અહીંનું બધું WowLink આજે જે રીતે કામ કરે છે તે વિશે છે.",
    sections: [
      {
        heading: "આમંત્રણ બનાવવું",
        items: [
          ["શું તે મફત છે?", "હા, શરૂઆત માટે. મફત પ્લાનમાં એક સમયે એક લાઇવ આમંત્રણ, ચાર શરૂઆતના પ્રસંગો, એક પ્રસંગ અને 50 જવાબો સુધી છે, અને તે પ્રસંગ પછી 30 દિવસ સુધી ચાલુ રહે છે. કાર્યક્રમ, દરેક પરિવાર માટે લિંક, આપના પોતાના રંગ અને ઘણું વધારે ક્રિએટર સ્ટુડિયોમાં છે."],
          ["ક્રિએટર સ્ટુડિયો કેવી રીતે મળે?", "આમંત્રણ પ્રકાશિત કરો, પછી તેના મેનેજ પાના પર “ક્રિએટર સ્ટુડિયો માટે પૂછો” પસંદ કરો. WowLink તેને ખસેડી આપશે. ઑનલાઇન ચુકવણી પછી આવશે."],
          ["શું મારે એકાઉન્ટ બનાવવું પડશે?", "પ્રકાશિત કરવા, હા: આપના Google એકાઉન્ટથી સાઇન ઇન કરો. નવો પાસવર્ડ નહીં. પછી આપનાં આમંત્રણો દરેક ફોન પર આપનાં: મારાં આમંત્રણોમાં સાઇન ઇન કરો. મહેમાનોને ક્યારેય એકાઉન્ટની જરૂર નથી."],
          ["શું હું મહેંદી, સંગીત અને રિસેપ્શન ઉમેરી શકું?", "ક્રિએટર સ્ટુડિયોમાં, હા. 10 પ્રસંગો સુધી ઉમેરો, દરેકનો પોતાનો દિવસ, સમય અને સ્થળ. મહેમાનો જેમાં આવવાના હોય તે પસંદ કરે છે, અને આપને દરેકની ગણતરી મળે છે."],
          ["શું મહેમાનો તેને ગુજરાતી કે હિન્દીમાં વાંચી શકે?", "હા. સ્ટુડિયોમાં આપ પસંદ કરો કે મહેમાનો પહેલાં કઈ ભાષા જુએ, અને દરેક મહેમાન એક ટૅપથી બદલી શકે છે. તારીખ અને સમય આમંત્રણમાં લખાય છે એ રીતે જ લખાય છે."],
          ["શું હું મારા પોતાના રંગ વાપરી શકું?", "ક્રિએટર સ્ટુડિયોમાં, હા. પ્રસંગના પોતાના રંગ રાખો, સાતમાંથી એક રંગસમૂહ પસંદ કરો, અથવા કોઈ પણ રંગ પસંદ કરો. WowLink તેને એવો ગોઠવે છે કે શબ્દો સહેલાઈથી વંચાય."],
          ["શું હું આના જેવું બીજું બનાવી શકું?", "ક્રિએટર સ્ટુડિયોમાં, હા. તેના મેનેજ પાના પર “આના જેવું બીજું બનાવો” પસંદ કરો: નવું આમંત્રણ એ જ ચિત્ર, રંગ, શબ્દો અને કાર્યક્રમથી શરૂ થાય છે. તેના મહેમાનો અને જવાબો નકલ થતા નથી."],
        ],
      },
      {
        heading: "આમંત્રણ મોકલવું",
        items: [
          ["દરેક પરિવારને તેની પોતાની લિંક કેવી રીતે મોકલું?", "ક્રિએટર સ્ટુડિયોમાં: મેનેજ પાના પર વ્યક્તિગત આમંત્રણોમાં પરિવારો ઉમેરો, એક એક કરીને અથવા આખી યાદી પેસ્ટ કરીને. દરેકને એવી લિંક મળે છે જે તેમના નામ સાથે ખૂલે, અને આપ યાદીમાંથી જ WhatsApp પર મોકલી શકો છો. કોણે ખોલી અને કોણે જવાબ નથી આપ્યો તે આપ જોઈ શકશો."],
          ["શું હું તેને છાપી શકું?", "હા. મેનેજ પાના પર QR કોડ બતાવો અને કાર્ડ, પોસ્ટર કે દુકાનની બારી માટે ડાઉનલોડ કરો. તે લિંક જેવું જ આમંત્રણ ખોલે છે."],
          ["શું તે જવાબ વગરની ફક્ત જાણ બની શકે?", "હા. સ્ટુડિયોમાં “આમંત્રણ પર” હેઠળ “મહેમાનોને જવાબ આપવા કહો” બંધ કરો. ત્યાં જ દિવસ સુધીની ગણતરી પણ છુપાવી શકાય છે."],
          ["શું મહેમાનોને સાચા દરવાજા સુધીનો રસ્તો મળે?", "હા. Google Maps માંથી સ્થળની શેર લિંક સ્ટુડિયોમાં મૂકો. તે વગર મહેમાનો સ્થળનું નામ શોધે છે."],
          ["જવાબો કોણ જુએ છે?", "ફક્ત આપ, મેનેજ પાના પર. ક્રિએટર સ્ટુડિયોમાં આપ દરેક જવાબ, અને કેટરર માટે દરેક પ્રસંગની ગણતરી, સ્પ્રેડશીટ તરીકે ડાઉનલોડ કરી શકો છો."],
        ],
      },
      {
        heading: "કંઈક બરાબર ન હોય ત્યારે",
        items: [
          ["મારું મેનેજ પાનું કહે છે કે લિંક માન્ય નથી.", "આખી મેનેજ લિંક વાપરો, #k= પછીના ભાગ સહિત. જો તે ખોવાઈ ગઈ હોય, તો મારાં આમંત્રણોમાં સાઇન ઇન કરો: આપનાં આમંત્રણો આ ઉપકરણ પર પાછાં આવી જશે."],
          ["મહેમાન કહે છે કે લિંક ખૂલતી નથી.", "મેનેજ પાના પર ચાલુ લખેલું છે તે તપાસો. જો આપે તે પરિવાર માટે નવી લિંક બનાવી હોય અથવા તેમને કાઢી નાખ્યા હોય, તો તેમની જૂની વ્યક્તિગત લિંક બંધ થઈ જાય છે; તેમને હાલની લિંક મોકલો."],
          ["મોકલ્યા પછી કંઈક કેવી રીતે બદલું?", "મેનેજ પાનું ખોલો, “સ્ટુડિયોમાં ફેરફાર કરો” પસંદ કરો, ફેરફાર કરો અને અપડેટ દબાવો. એ જ લિંક નવી વિગતો બતાવે છે."],
          ["તેને કેવી રીતે કાઢી નાખું?", "મેનેજ પાનાની નીચે “આ આમંત્રણ કાઢી નાખો” તેને દરેક જવાબ, શુભેચ્છા અને વ્યક્તિગત આમંત્રણ સાથે હંમેશ માટે કાઢી નાખે છે. હમણાં ફક્ત છુપાવવું હોય તો તેના બદલે તેને બંધ કરો."],
          ["આમંત્રણમાં કંઈક ખોટું કે અયોગ્ય લાગે છે.", "આમંત્રણની નીચેની “ફરિયાદ કરો” લિંક વાપરો. WowLink દરેક ફરિયાદ થયેલું આમંત્રણ જુએ છે."],
        ],
      },
    ],
    more: "હજી મૂંઝવણ છે? ગોપનીયતાનું પાનું જણાવે છે કે શું સચવાય છે અને કોણ જુએ છે.",
    start: "આપનું આમંત્રણ બનાવો",
  },
  hi: {
    title: "मदद — WowLink",
    description: "WowLink निमंत्रण कैसे बनाएँ, भेजें और संभालें: हर परिवार के लिए व्यक्तिगत लिंक, गुजराती और हिंदी, जानकारी बदलना, जवाब, प्रिंट करना और हटाना।",
    heading: ["हम कैसे", "मदद करें?"],
    intro: "मेज़बान जो सबसे ज़्यादा पूछते हैं, उनके छोटे जवाब। यहाँ सब कुछ इस बारे में है कि WowLink आज कैसे काम करता है।",
    sections: [
      {
        heading: "अपना निमंत्रण बनाना",
        items: [
          ["क्या यह मुफ़्त है?", "हाँ, शुरुआत के लिए। फ़्री प्लान में एक समय में एक लाइव निमंत्रण, चार शुरुआती अवसर, एक कार्यक्रम और 50 जवाब तक हैं, और यह अवसर के 30 दिन बाद तक चालू रहता है। कार्यक्रमों की सूची, हर परिवार के लिए लिंक, अपने रंग और बहुत कुछ क्रिएटर स्टूडियो में है।"],
          ["क्रिएटर स्टूडियो कैसे मिलेगा?", "निमंत्रण प्रकाशित करें, फिर उसके मैनेज पेज पर “क्रिएटर स्टूडियो के लिए पूछें” चुनें। WowLink उसे बदल देगा। ऑनलाइन भुगतान बाद में आएगा।"],
          ["क्या मुझे अकाउंट बनाना होगा?", "पब्लिश करने के लिए, हाँ: अपने Google अकाउंट से साइन इन करें। नया पासवर्ड नहीं। फिर आपके निमंत्रण हर फ़ोन पर आपके: मेरे निमंत्रण में साइन इन करें। मेहमानों को कभी अकाउंट की ज़रूरत नहीं।"],
          ["क्या मेहंदी, संगीत और रिसेप्शन भी जोड़े जा सकते हैं?", "क्रिएटर स्टूडियो में, हाँ। 10 कार्यक्रमों तक जोड़ें, हर एक का अपना दिन, समय और जगह। मेहमान उन पर टिक करते हैं जिनमें वे आ रहे हैं, और आपको हर एक की गिनती मिलती है।"],
          ["क्या मेहमान इसे गुजराती या हिंदी में पढ़ सकते हैं?", "हाँ। स्टूडियो में आप चुनते हैं कि मेहमान पहले कौन-सी भाषा देखें, और हर मेहमान एक टैप में भाषा बदल सकता है। तारीख़ और समय वैसे ही लिखे जाते हैं जैसे निमंत्रण में लिखे जाते हैं।"],
          ["क्या मैं अपने खुद के रंग चुन सकता हूँ?", "क्रिएटर स्टूडियो में, हाँ। अवसर के अपने रंग रखें, सात पैलेट में से एक चुनें, या कोई भी रंग चुनें। WowLink उसे ऐसे ढालता है कि शब्द आसानी से पढ़े जा सकें।"],
          ["क्या इस जैसा एक और बनाया जा सकता है?", "क्रिएटर स्टूडियो में, हाँ। उसके मैनेज पेज पर “इस जैसा एक और बनाएँ” चुनें: नया निमंत्रण उसी चित्र, रंगों, शब्दों और कार्यक्रम-सूची से शुरू होता है। उसके मेहमान और जवाब कॉपी नहीं होते।"],
        ],
      },
      {
        heading: "निमंत्रण भेजना",
        items: [
          ["हर परिवार को उसका अपना लिंक कैसे भेजें?", "क्रिएटर स्टूडियो में: मैनेज पेज पर व्यक्तिगत निमंत्रण में परिवार जोड़ें, एक-एक करके या पूरी सूची पेस्ट करके। हर परिवार को ऐसा लिंक मिलता है जो उनके नाम के साथ खुलता है, और आप सूची से ही उसे WhatsApp पर भेज सकते हैं। आप देख पाएँगे कि किसने अपना लिंक खोला और किसने जवाब नहीं दिया।"],
          ["क्या इसे प्रिंट किया जा सकता है?", "हाँ। मैनेज पेज पर QR कोड दिखाएँ और कार्ड, पोस्टर या दुकान की खिड़की के लिए डाउनलोड करें। यह लिंक वाला ही निमंत्रण खोलता है।"],
          ["क्या यह बिना जवाब वाली सिर्फ़ सूचना हो सकती है?", "हाँ। स्टूडियो में “निमंत्रण पर” के नीचे “मेहमानों से जवाब माँगें” बंद करें। वहीं आप उलटी गिनती भी छिपा सकते हैं।"],
          ["क्या मेहमानों को सही गेट तक का रास्ता मिल सकता है?", "हाँ। Google Maps से जगह का शेयर लिंक स्टूडियो में पेस्ट करें। उसके बिना, मेहमान जगह का नाम सर्च करते हैं।"],
          ["जवाब कौन देखता है?", "सिर्फ़ आप, मैनेज पेज पर। क्रिएटर स्टूडियो में आप हर जवाब, और कैटरर के लिए हर कार्यक्रम की गिनती, स्प्रेडशीट के रूप में डाउनलोड कर सकते हैं।"],
        ],
      },
      {
        heading: "जब कुछ ठीक न हो",
        items: [
          ["मेरा मैनेज पेज कहता है कि लिंक सही नहीं है।", "पूरा मैनेज लिंक इस्तेमाल करें, #k= के बाद वाले हिस्से समेत। अगर वह खो गया है, तो मेरे निमंत्रण में साइन इन करें: आपके निमंत्रण इस डिवाइस पर वापस आ जाएँगे।"],
          ["मेहमान कहते हैं कि लिंक नहीं खुलता।", "देखें कि मैनेज पेज पर चालू लिखा है। अगर आपने उस परिवार के लिए नया लिंक बनाया है या उन्हें हटा दिया है, तो उनका व्यक्तिगत लिंक काम करना बंद कर देता है; उन्हें मौजूदा लिंक भेजें।"],
          ["भेजने के बाद कुछ कैसे बदलें?", "मैनेज पेज खोलें, “स्टूडियो में बदलाव करें” चुनें, बदलाव करें और अपडेट करें दबाएँ। उसी लिंक पर नई जानकारी दिखती है।"],
          ["इसे कैसे हटाएँ?", "मैनेज पेज के नीचे “इस निमंत्रण को हटाएँ” इसे हमेशा के लिए हटा देता है, हर जवाब, शुभकामना और व्यक्तिगत निमंत्रण के साथ। अभी के लिए सिर्फ़ छिपाना हो, तो इसकी जगह इसे बंद करें।"],
          ["निमंत्रण पर कुछ गलत या आपत्तिजनक लगता है।", "निमंत्रण के नीचे दिए “शिकायत करें” लिंक का इस्तेमाल करें। WowLink हर शिकायत वाले निमंत्रण को देखता है।"],
        ],
      },
    ],
    more: "अब भी उलझन है? गोपनीयता पेज बताता है कि क्या सहेजा जाता है और कौन देखता है।",
    start: "अपना निमंत्रण बनाएँ",
  },
};

type Props = { searchParams: Promise<{ lang?: string | string[] }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const lang = pageLang((await searchParams).lang);
  const { title, description } = HELP[lang];
  return { title, description, alternates: { canonical: langHref("/help", lang), languages: Object.fromEntries(LANGS.map(l => [l, langHref("/help", l)])) } };
}

export default async function HelpPage({ searchParams }: Props) {
  const lang = pageLang((await searchParams).lang);
  const c = HELP[lang];
  return <PublicPage lang={lang} path="/help" className="help-page">
    <main className="help">
      <h1>{c.heading[0]} <span className="scribble">{c.heading[1]}</span></h1>
      <p className="help-intro">{c.intro}</p>
      {c.sections.map(section => <section key={section.heading}>
        <h2>{section.heading}</h2>
        {section.items.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
      </section>)}
      <p className="help-more"><Link href={langHref("/privacy", lang)}>{c.more}</Link></p>
      <p className="help-more"><Link className="cin-cta cin-cta-light" href="/templates">{c.start}</Link></p>
    </main>
  </PublicPage>;
}
