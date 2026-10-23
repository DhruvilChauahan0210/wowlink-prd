import type { Metadata } from "next";
import { LANGS, formatInvitationDate, langHref, pageLang, type Lang } from "../lib/invitations";
import { PublicPage } from "../ui/public-page";

/*
 * What WowLink keeps, who sees it, and how it's deleted, in plain words, in English and Gujarati (?lang=gu). Guests
 * reach it from the reply form and the invitation's footer, hosts from the manage page. Everything it says is how the
 * app works today; it will be reviewed before public launch (see README, "Current limits").
 */

const UPDATED = "2026-10-23";

type Section = { heading: string; items: string[] };
type Content = { title: string; description: string; heading: readonly [string, string]; intro: string; early: string; earlyLabel: string; updated: string; sections: Section[] };

const PRIVACY: Record<Lang, Content> = {
  en: {
    title: "Privacy — WowLink",
    description: "What WowLink keeps when you make an invitation or reply to one, who can see it, and how it’s deleted.",
    heading: ["What we keep, and", "who sees it"],
    intro: "WowLink makes invitation pages. To do that it keeps what hosts write and what guests reply, plain counts of visits, and any reports. Here is all of it, in plain words.",
    earlyLabel: "early days",
    early: "WowLink is still being tried out. This page says how it works today. It will be reviewed and updated before WowLink opens to everyone, including where information is stored and for how long.",
    updated: "Last updated",
    sections: [
      {
        heading: "What a host’s invitation keeps",
        items: [
          "The invitation as the host wrote it: names, dates, places, the schedule, the messages, the colours and the language.",
          "Personal invitations: the name of each household, and a WhatsApp number if the host adds one.",
          "When each personal link was first and last opened. The page itself reports this, so a link preview in WhatsApp doesn’t count.",
          "The private manage key, kept only in scrambled form (a hash), so it can’t be read back or recovered.",
          "Plain counts, day by day: visits, how many people opened it, how many played the opening, visits from the QR code, and how the host shared it. Nobody is identified by them.",
        ],
      },
      {
        heading: "What a guest’s reply keeps",
        items: [
          "Whether you’re coming, to which celebrations, and how many of you.",
          "Your name, if you write one, and your wish or blessing, if you leave one.",
          "When you replied.",
          "That’s all. Guests never need an account, and WowLink never asks them for an email address, a phone number or their contacts.",
        ],
      },
      {
        heading: "What isn’t kept",
        items: [
          "There are no tracking cookies, no ads and no outside analytics services on any page.",
          "Your internet address (IP) is used to slow down spam. It’s held only in the server’s memory, and never saved with your reply or anywhere else.",
          "Your choice of language, and a host’s manage links, are remembered in your own browser, not by WowLink.",
          "Your browser also remembers that it has opened an invitation (and played its opening), so you’re counted once however often you come back. A host’s visits aren’t counted from a browser where they’ve opened their manage page.",
          "Links to Google Maps, Google Calendar and WhatsApp open those services only when you tap them.",
        ],
      },
      {
        heading: "Who sees what",
        items: [
          "Hosts (anyone with the invitation’s manage link) see every reply, every wish, and their list of households with any numbers.",
          "Guests see the invitation as their own link shows it. They never see the guest list, other people’s replies or anyone’s number.",
          "Wishes appear on the invitation only if the host turns that on, and only with the name the writer typed. The host can hide any one of them.",
          "Search engines are asked not to list invitations.",
          "WowLink sees totals for the whole app: how many invitations are made, opened and replied to, visits to its own pages (like the studio and the samples), and clicks on “Create yours free”. Never who replied.",
        ],
      },
      {
        heading: "Reports",
        items: [
          "Anyone can report an invitation from the link at the bottom of it. A report keeps the reason and what you write, and nothing about who sent it, so the hosts can’t find out.",
          "WowLink opens a reported invitation to look at it. If it breaks the rules, it’s taken down: guests can no longer open it and it can’t be published again. Its host keeps their replies, and can still delete it.",
        ],
      },
      {
        heading: "A link isn’t a lock",
        items: [
          "Anyone who has an invitation’s link can open it, including anyone it’s forwarded to. Don’t put anything on an invitation you’d mind being passed on.",
          "Personal links are hard to guess, but they’re links too. If one goes further than meant, the host can replace it, and the old one stops working.",
          "Keep the manage link private: whoever has it can edit the invitation and read every reply.",
        ],
      },
      {
        heading: "Changing and deleting",
        items: [
          "Guests with a personal link can change their reply from that link. To have a reply removed, ask the host.",
          "From the manage page, a host can delete one reply with its wish, remove a personal invitation (its reply goes with it), or delete the whole invitation with every reply, wish, household and number in it.",
          "Deleting happens straight away and can’t be undone. Only the link’s short code is kept, so it’s never given to a different invitation.",
          "Unpublishing hides an invitation from guests but keeps its replies, so it can be published again.",
        ],
      },
      {
        heading: "Nothing is passed on",
        items: ["Nothing here is shared with advertisers or other companies. There are no ads and no outside trackers on any page."],
      },
    ],
  },
  gu: {
    title: "ગોપનીયતા — WowLink",
    description: "આમંત્રણ બનાવો કે તેનો જવાબ આપો ત્યારે WowLink શું સાચવે છે, તે કોણ જોઈ શકે છે, અને તે કેવી રીતે કાઢી નખાય છે.",
    heading: ["અમે શું સાચવીએ છીએ, અને", "કોણ જુએ છે"],
    intro: "WowLink આમંત્રણનાં પાનાં બનાવે છે. એ માટે યજમાન જે લખે અને મહેમાનો જે જવાબ આપે તે, મુલાકાતોની સાદી ગણતરી, અને ફરિયાદો સાચવે છે. બધું અહીં સાદી ભાષામાં છે.",
    earlyLabel: "હજી શરૂઆત છે",
    early: "WowLink હજી અજમાયશમાં છે. આ પાનું આજે તે જે રીતે કામ કરે છે તે જણાવે છે. બધા માટે શરૂ થાય તે પહેલાં તેની સમીક્ષા થશે, અને માહિતી ક્યાં અને કેટલો સમય સચવાય છે તે સહિત તેને અપડેટ કરાશે.",
    updated: "છેલ્લું અપડેટ",
    sections: [
      {
        heading: "યજમાનના આમંત્રણમાં શું સચવાય છે",
        items: [
          "યજમાને લખેલું આમંત્રણ: નામ, તારીખ, સ્થળ, કાર્યક્રમ, સંદેશ, રંગ અને ભાષા.",
          "વ્યક્તિગત આમંત્રણો: દરેક પરિવારનું નામ, અને યજમાન ઉમેરે તો WhatsApp નંબર.",
          "દરેક વ્યક્તિગત લિંક પહેલી અને છેલ્લી વાર ક્યારે ખોલાઈ. પાનું પોતે જ આ જણાવે છે, એટલે WhatsAppમાં લિંકનું પ્રીવ્યૂ ગણાતું નથી.",
          "મેનેજ લિંકની ખાનગી ચાવી, ફક્ત ગૂંચવેલા રૂપમાં (hash), એટલે તે પાછી વાંચી કે મેળવી શકાતી નથી.",
          "દિવસ પ્રમાણે સાદી ગણતરી: મુલાકાતો, કેટલા લોકોએ ખોલ્યું, કેટલાએ ખોલવાની વિધિ માણી, QR કોડથી કેટલી મુલાકાતો, અને યજમાને કેવી રીતે શેર કર્યું. તેનાથી કોઈની ઓળખ થતી નથી.",
        ],
      },
      {
        heading: "મહેમાનના જવાબમાં શું સચવાય છે",
        items: [
          "આપ આવો છો કે નહીં, કયા પ્રસંગોમાં, અને કેટલા લોકો.",
          "આપનું નામ, જો આપ લખો, અને આપની શુભેચ્છા કે આશીર્વાદ, જો આપ લખો.",
          "આપે ક્યારે જવાબ આપ્યો.",
          "બસ એટલું જ. મહેમાનોને ક્યારેય એકાઉન્ટ બનાવવું પડતું નથી, અને WowLink તેમની પાસે ક્યારેય ઇમેઇલ, ફોન નંબર કે સંપર્કો માગતું નથી.",
        ],
      },
      {
        heading: "શું સચવાતું નથી",
        items: [
          "કોઈ પાના પર ટ્રેકિંગ કૂકી, જાહેરાતો કે બહારની એનાલિટિક્સ સેવા નથી.",
          "આપનું ઇન્ટરનેટ સરનામું (IP) સ્પામ રોકવા માટે વપરાય છે. તે ફક્ત સર્વરની મેમરીમાં રહે છે, અને આપના જવાબ સાથે કે બીજે ક્યાંય સચવાતું નથી.",
          "આપની ભાષાની પસંદગી, અને યજમાનની મેનેજ લિંક, આપના પોતાના બ્રાઉઝરમાં યાદ રહે છે, WowLink પાસે નહીં.",
          "આપનું બ્રાઉઝર એ પણ યાદ રાખે છે કે તેણે આમંત્રણ ખોલ્યું છે (અને ખોલવાની વિધિ માણી છે), એટલે આપ ગમે તેટલી વાર આવો, એક જ વાર ગણાઓ છો. જે બ્રાઉઝરમાં યજમાને પોતાનું મેનેજ પાનું ખોલ્યું હોય, તેમાંથી તેમની મુલાકાતો ગણાતી નથી.",
          "Google Maps, Google Calendar અને WhatsAppની લિંક આપ દબાવો ત્યારે જ એ સેવાઓ ખોલે છે.",
        ],
      },
      {
        heading: "કોણ શું જુએ છે",
        items: [
          "યજમાન (જેની પાસે આમંત્રણની મેનેજ લિંક હોય) દરેક જવાબ, દરેક શુભેચ્છા, અને નંબર સાથે પોતાના પરિવારોની યાદી જુએ છે.",
          "મહેમાનો આમંત્રણ તેમની પોતાની લિંક બતાવે તે રીતે જ જુએ છે. તેઓ મહેમાનોની યાદી, બીજાના જવાબો કે કોઈનો નંબર ક્યારેય જોતા નથી.",
          "શુભેચ્છાઓ આમંત્રણ પર ત્યારે જ દેખાય જ્યારે યજમાન તે ચાલુ કરે, અને ફક્ત લખનારે લખેલા નામ સાથે. યજમાન કોઈ પણ શુભેચ્છા છુપાવી શકે છે.",
          "સર્ચ એન્જિનને આમંત્રણો ન બતાવવા કહેવામાં આવે છે.",
          "WowLink આખી એપની કુલ સંખ્યા જુએ છે: કેટલાં આમંત્રણો બન્યાં, ખોલાયાં અને તેના જવાબ આવ્યા, તેનાં પોતાનાં પાનાંની મુલાકાતો (જેમ કે સ્ટુડિયો અને નમૂના), અને “આપનું મફત બનાવો” પરના ક્લિક. કોણે જવાબ આપ્યો તે ક્યારેય નહીં.",
        ],
      },
      {
        heading: "ફરિયાદ",
        items: [
          "કોઈ પણ વ્યક્તિ આમંત્રણના નીચેના ભાગની લિંકથી તેની ફરિયાદ કરી શકે છે. ફરિયાદમાં કારણ અને આપે લખેલું જ સચવાય છે, મોકલનાર વિશે કંઈ નહીં, એટલે યજમાન જાણી શકતા નથી કે ફરિયાદ કોણે કરી.",
          "WowLink ફરિયાદ થયેલું આમંત્રણ ખોલીને જુએ છે. જો તે નિયમો તોડતું હોય, તો તેને દૂર કરાય છે: મહેમાનો તેને ખોલી શકતા નથી અને તે ફરી પ્રકાશિત થઈ શકતું નથી. યજમાનના જવાબો તેમની પાસે રહે છે, અને તેઓ તેને કાઢી પણ શકે છે.",
        ],
      },
      {
        heading: "લિંક તાળું નથી",
        items: [
          "જેની પાસે આમંત્રણની લિંક હોય તે તેને ખોલી શકે, જેને આગળ મોકલાઈ હોય તે પણ. આગળ મોકલાય તો વાંધો હોય એવું કંઈ આમંત્રણમાં ન મૂકો.",
          "વ્યક્તિગત લિંક ધારવી અઘરી છે, પણ તે પણ લિંક જ છે. ધાર્યા કરતાં આગળ ગઈ હોય તો યજમાન નવી લિંક બનાવી શકે છે, અને જૂની બંધ થઈ જાય છે.",
          "મેનેજ લિંક ખાનગી રાખો: જેની પાસે તે હોય તે આમંત્રણમાં ફેરફાર કરી શકે અને દરેક જવાબ વાંચી શકે.",
        ],
      },
      {
        heading: "બદલવું અને કાઢી નાખવું",
        items: [
          "વ્યક્તિગત લિંકવાળા મહેમાનો એ જ લિંક પરથી પોતાનો જવાબ બદલી શકે છે. જવાબ કઢાવવો હોય તો યજમાનને કહો.",
          "મેનેજ પાના પરથી યજમાન એક જવાબ તેની શુભેચ્છા સાથે કાઢી શકે, વ્યક્તિગત આમંત્રણ કાઢી શકે (તેનો જવાબ પણ જાય), અથવા આખું આમંત્રણ તેના દરેક જવાબ, શુભેચ્છા, પરિવાર અને નંબર સાથે કાઢી શકે.",
          "કાઢી નાખવું તરત થાય છે અને પાછું લાવી શકાતું નથી. ફક્ત લિંકનો ટૂંકો કોડ રખાય છે, જેથી તે ક્યારેય બીજા આમંત્રણને ન મળે.",
          "બંધ કરવાથી આમંત્રણ મહેમાનોથી છુપાય છે પણ જવાબો સચવાય છે, જેથી તે ફરી પ્રકાશિત કરી શકાય.",
        ],
      },
      {
        heading: "કોઈને આપવામાં આવતું નથી",
        items: ["અહીંની કોઈ માહિતી જાહેરાતકારો કે બીજી કંપનીઓને અપાતી નથી. કોઈ પાના પર જાહેરાતો કે બહારના ટ્રેકર નથી."],
      },
    ],
  },
  hi: {
    title: "गोपनीयता — WowLink",
    description: "निमंत्रण बनाते या उसका जवाब देते समय WowLink क्या सहेजता है, उसे कौन देख सकता है, और वह कैसे हटाया जाता है।",
    heading: ["हम क्या सहेजते हैं, और", "कौन देखता है"],
    intro: "WowLink निमंत्रण के पेज बनाता है। इसके लिए वह मेज़बान जो लिखते हैं और मेहमान जो जवाब देते हैं, विज़िट की सीधी-सादी गिनती, और शिकायतें सहेजता है। सब कुछ यहाँ आसान शब्दों में है।",
    earlyLabel: "अभी शुरुआत है",
    early: "WowLink अभी आज़माया जा रहा है। यह पेज बताता है कि यह आज कैसे काम करता है। सबके लिए शुरू होने से पहले इसकी समीक्षा होगी और इसे अपडेट किया जाएगा, जिसमें यह भी शामिल है कि जानकारी कहाँ और कितने समय तक रखी जाती है।",
    updated: "पिछला अपडेट",
    sections: [
      {
        heading: "मेज़बान के निमंत्रण में क्या सहेजा जाता है",
        items: [
          "निमंत्रण, जैसा मेज़बान ने लिखा: नाम, तारीख़ें, जगहें, कार्यक्रम-सूची, संदेश, रंग और भाषा।",
          "व्यक्तिगत निमंत्रण: हर परिवार का नाम, और अगर मेज़बान जोड़ें तो WhatsApp नंबर।",
          "हर व्यक्तिगत लिंक पहली और आख़िरी बार कब खोला गया। यह पेज खुद बताता है, इसलिए WhatsApp में लिंक का प्रीव्यू नहीं गिना जाता।",
          "निजी मैनेज कुंजी, सिर्फ़ उलझे हुए रूप में (hash), ताकि उसे न वापस पढ़ा जा सके, न वापस पाया जा सके।",
          "दिन-ब-दिन की सीधी गिनती: विज़िट, कितने लोगों ने खोला, कितनों ने खुलने का दृश्य देखा, QR कोड से कितनी विज़िट, और मेज़बान ने कैसे शेयर किया। इनसे किसी की पहचान नहीं होती।",
        ],
      },
      {
        heading: "मेहमान के जवाब में क्या सहेजा जाता है",
        items: [
          "आप आ रहे हैं या नहीं, किन कार्यक्रमों में, और कितने लोग।",
          "आपका नाम, अगर आप लिखें, और आपकी शुभकामना या आशीर्वाद, अगर आप दें।",
          "आपने कब जवाब दिया।",
          "बस इतना ही। मेहमानों को कभी अकाउंट की ज़रूरत नहीं होती, और WowLink उनसे कभी ईमेल पता, फ़ोन नंबर या उनके कॉन्टैक्ट नहीं माँगता।",
        ],
      },
      {
        heading: "क्या नहीं सहेजा जाता",
        items: [
          "किसी भी पेज पर कोई ट्रैकिंग कुकी, विज्ञापन या बाहरी एनालिटिक्स सेवा नहीं है।",
          "आपका इंटरनेट पता (IP) स्पैम रोकने के लिए इस्तेमाल होता है। वह सिर्फ़ सर्वर की मेमोरी में रहता है, और आपके जवाब के साथ या कहीं और कभी सहेजा नहीं जाता।",
          "आपकी चुनी हुई भाषा, और मेज़बान के मैनेज लिंक, आपके अपने ब्राउज़र में याद रहते हैं, WowLink के पास नहीं।",
          "आपका ब्राउज़र यह भी याद रखता है कि उसने निमंत्रण खोला है (और उसके खुलने का दृश्य देखा है), इसलिए आप चाहे जितनी बार लौटें, आपको एक ही बार गिना जाता है। जिस ब्राउज़र में मेज़बान ने अपना मैनेज पेज खोला हो, वहाँ से उनकी विज़िट नहीं गिनी जातीं।",
          "Google Maps, Google Calendar और WhatsApp के लिंक ये सेवाएँ तभी खोलते हैं जब आप उन पर टैप करें।",
        ],
      },
      {
        heading: "कौन क्या देखता है",
        items: [
          "मेज़बान (यानी जिसके पास भी निमंत्रण का मैनेज लिंक हो) हर जवाब, हर शुभकामना, और जोड़े गए नंबरों के साथ अपने परिवारों की सूची देखते हैं।",
          "मेहमान निमंत्रण वैसा ही देखते हैं जैसा उनका अपना लिंक दिखाता है। वे मेहमानों की सूची, दूसरों के जवाब या किसी का नंबर कभी नहीं देखते।",
          "शुभकामनाएँ निमंत्रण पर तभी दिखती हैं जब मेज़बान इसे चालू करें, और सिर्फ़ उसी नाम के साथ जो लिखने वाले ने लिखा। मेज़बान इनमें से किसी को भी छिपा सकते हैं।",
          "सर्च इंजनों से कहा जाता है कि वे निमंत्रणों को अपनी सूची में न दिखाएँ।",
          "WowLink पूरे ऐप के कुल आँकड़े देखता है: कितने निमंत्रण बने, खोले गए और उनके जवाब आए, उसके अपने पेजों पर विज़िट (जैसे स्टूडियो और नमूने), और “अपना मुफ़्त बनाएँ” पर क्लिक। किसने जवाब दिया, यह कभी नहीं।",
        ],
      },
      {
        heading: "शिकायतें",
        items: [
          "कोई भी व्यक्ति निमंत्रण के नीचे दिए लिंक से उसकी शिकायत कर सकता है। शिकायत में कारण और आपका लिखा हुआ ही सहेजा जाता है, भेजने वाले के बारे में कुछ नहीं, इसलिए मेज़बान पता नहीं लगा सकते कि शिकायत किसने की।",
          "WowLink शिकायत वाले निमंत्रण को खोलकर देखता है। अगर वह नियम तोड़ता है, तो उस पर रोक लगा दी जाती है: मेहमान उसे खोल नहीं सकते और उसे दोबारा पब्लिश नहीं किया जा सकता। उसके मेज़बान के जवाब उनके पास रहते हैं, और वे उसे हटा भी सकते हैं।",
        ],
      },
      {
        heading: "लिंक ताला नहीं है",
        items: [
          "जिसके पास भी निमंत्रण का लिंक है, वह उसे खोल सकता है, जिन्हें यह आगे भेजा गया वे भी। निमंत्रण पर ऐसा कुछ न डालें जिसके आगे भेजे जाने से आपको आपत्ति हो।",
          "व्यक्तिगत लिंक का अंदाज़ा लगाना मुश्किल है, पर वे भी लिंक ही हैं। अगर कोई लिंक सोचे से ज़्यादा आगे चला जाए, तो मेज़बान उसकी जगह नया लिंक बना सकते हैं, और पुराना काम करना बंद कर देता है।",
          "मैनेज लिंक को निजी रखें: जिसके पास भी यह हो, वह निमंत्रण में बदलाव कर सकता है और हर जवाब पढ़ सकता है।",
        ],
      },
      {
        heading: "बदलना और हटाना",
        items: [
          "व्यक्तिगत लिंक वाले मेहमान उसी लिंक से अपना जवाब बदल सकते हैं। कोई जवाब हटवाना हो, तो मेज़बान से कहें।",
          "मैनेज पेज से मेज़बान एक जवाब उसकी शुभकामना के साथ हटा सकते हैं, कोई व्यक्तिगत निमंत्रण हटा सकते हैं (उसका जवाब भी साथ में हट जाता है), या पूरा निमंत्रण उसके हर जवाब, शुभकामना, परिवार और नंबर के साथ हटा सकते हैं।",
          "हटाना तुरंत होता है और इसे वापस नहीं लाया जा सकता। सिर्फ़ लिंक का छोटा कोड रखा जाता है, ताकि वह कभी किसी दूसरे निमंत्रण को न मिले।",
          "बंद करने से निमंत्रण मेहमानों से छिप जाता है पर उसके जवाब सहेजे रहते हैं, ताकि उसे दोबारा पब्लिश किया जा सके।",
        ],
      },
      {
        heading: "किसी को कुछ नहीं दिया जाता",
        items: ["यहाँ की कोई भी जानकारी विज्ञापनदाताओं या दूसरी कंपनियों के साथ शेयर नहीं की जाती। किसी भी पेज पर कोई विज्ञापन या बाहरी ट्रैकर नहीं है।"],
      },
    ],
  },
};

type Props = { searchParams: Promise<{ lang?: string | string[] }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const lang = pageLang((await searchParams).lang);
  const { title, description } = PRIVACY[lang];
  return { title, description, alternates: { canonical: langHref("/privacy", lang), languages: Object.fromEntries(LANGS.map(l => [l, langHref("/privacy", l)])) } };
}

export default async function PrivacyPage({ searchParams }: Props) {
  const lang = pageLang((await searchParams).lang);
  const c = PRIVACY[lang];
  return <PublicPage lang={lang} path="/privacy" className="privacy-page">
    <main className="privacy">
      <h1>{c.heading[0]} <span className="scribble">{c.heading[1]}</span></h1>
      <p className="privacy-intro">{c.intro}</p>
      <aside className="privacy-early"><span>{c.earlyLabel}</span><p>{c.early}</p></aside>
      {c.sections.map((section) => <section key={section.heading}>
        <h2>{section.heading}</h2>
        <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>)}
      <p className="privacy-updated">{c.updated}: <time dateTime={UPDATED}>{formatInvitationDate(UPDATED, true, lang)}</time></p>
    </main>
  </PublicPage>;
}
