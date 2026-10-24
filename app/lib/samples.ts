import { initialDraft, type InvitationDraft, type InvitationTemplate, type Lang, type TemplateId } from "./invitations";

/*
 * The sample invitations in Gujarati and Hindi: the same families, places and words as the English ones, so an
 * occasion's Gujarati page (and its full sample) shows an invitation that reads in Gujarati from end to end.
 */

type SampleWords = { title: string; venue: string; message: string };

const SAMPLES: Partial<Record<Lang, Record<TemplateId, SampleWords>>> = {
  gu: {
    wedding: { title: "આરવ અને મીરા", venue: "ધ ગાર્ડન હાઉસ, સુરત", message: "કેટલાક દિવસો સાથે ઉજવનારા સ્વજનોથી વધુ સુંદર બને છે. અમારો આ દિવસ આપની સાથે ઉજવવાની અમને ખૂબ ખુશી થશે." },
    engagement: { title: "કબીર અને ઈશા", venue: "ધ ઓર્કિડ હૉલ, અમદાવાદ", message: "અમે સગાઈ કરી રહ્યાં છીએ, અને એ પળે આપ અમારી સાથે હો એવી ઇચ્છા છે. જીવનભરના સાથની આ શરૂઆત ઉજવવા પધારશો." },
    birthday: { title: "રિયા માટે એક સાંજ", venue: "ધ કોર્ટયાર્ડ, સુરત", message: "સારા મિત્રો, થોડી મીણબત્તીઓ અને ઘણો બધો આનંદ. આ વર્ષને યાદગાર બનાવવા જરૂર આવજો." },
    garba: { title: "તારાઓ નીચે રાસ", venue: "રંગોળી કોર્ટયાર્ડ, નવસારી", message: "આપના મનગમતા લોકો અને નાચવાનો ઉત્સાહ સાથે લાવજો. ચાલો, રાતને રંગ, તાલ અને થોડા જાદુથી ભરી દઈએ." },
    babyshower: { title: "પ્રિયાનું સીમંત", venue: "શાંતિ કુંજ, વડોદરા", message: "નાનકડા મહેમાનની રાહ જોતાં પ્રિયા પર પ્રેમ અને આશીર્વાદ વરસાવવા પધારશો. આપની હાજરી અમારા માટે ખૂબ મહત્ત્વની છે." },
    housewarming: { title: "શાહ પરિવારનું નવું ઘર", venue: "શ્રી રેસિડેન્સી, રાજકોટ", message: "આપનાં પગલાં ન પડે ત્યાં સુધી અમારું નવું ઘર અધૂરું લાગશે. વાસ્તુ પૂજન અને પછી ભોજન માટે પધારશો." },
    anniversary: { title: "મમ્મી-પપ્પાની 25મી લગ્નતિથિ", venue: "ટેરેસ ગાર્ડન, સુરત", message: "પચીસ વર્ષ, અગણિત ચાના કપ, અને પ્રેમથી બનેલો પરિવાર. તેમની સાથે ઉજવવા પધારશો." },
    opening: { title: "એક નવી શરૂઆત", venue: "ધ એટેલિયર, વાપી", message: "દરેક નવી શરૂઆત ઉજવવા જેવી હોય છે. એક સુંદર નવા પ્રકરણ માટે અમે દરવાજા ખોલીએ ત્યારે અમારી સાથે રહેજો." },
    diwali: { title: "મહેતા પરિવારની દિવાળી", venue: "મહેતા નિવાસ, અમદાવાદ", message: "અમારી સાથે દીવો પ્રગટાવવા આવજો. મીઠાઈ, સંગીત અને આખો પરિવાર એક છત નીચે હશે." },
    janoi: { title: "આરવની જનોઈ", venue: "શ્રી રામ વાડી, સુરત", message: "અમારો દીકરો જનોઈ ધારણ કરે છે. વિધિમાં સાથે રહેજો, અને ભોજન લઈને જજો." },
    puja: { title: "ઘરે સત્યનારાયણ કથા", venue: "શાહ નિવાસ, વડોદરા", message: "કથા, આરતી અને પ્રસાદ માટે પધારશો. આપની હાજરીથી જ પ્રસંગ પૂર્ણ થશે." },
    naming: { title: "પટેલ પરિવારના બાળકનું નામકરણ", venue: "પટેલ નિવાસ, નવસારી", message: "ફોઈ કાનમાં નામ કહેશે, અને એ નામ સૌથી પહેલાં સાંભળવા આપ ત્યાં હો એવી અમારી ઇચ્છા છે." },
  },
  hi: {
    wedding: { title: "आरव और मीरा", venue: "द गार्डन हाउस, सूरत", message: "कुछ दिन उन्हें साथ मनाने वाले लोगों से और भी ख़ूबसूरत बन जाते हैं। हम अपना यह दिन आपके साथ मनाना चाहेंगे।" },
    engagement: { title: "कबीर और ईशा", venue: "द ऑर्किड हॉल, अहमदाबाद", message: "हम सगाई कर रहे हैं, और चाहते हैं कि उस पल आप हमारे साथ हों। उम्र भर के साथ की इस शुरुआत का जश्न हमारे साथ मनाइए।" },
    birthday: { title: "रिया के लिए एक शाम", venue: "द कोर्टयार्ड, सूरत", message: "अच्छे दोस्त, कुछ मोमबत्तियाँ और ढेर सारी ख़ुशियाँ। इस साल को यादगार बनाने ज़रूर आइए।" },
    garba: { title: "तारों के नीचे रास", venue: "रंगोली कोर्टयार्ड, नवसारी", message: "अपने पसंदीदा लोगों और नाचने के जोश के साथ आइए। चलिए, रात को रंग, ताल और थोड़े से जादू से भर दें।" },
    babyshower: { title: "प्रिया की गोद भराई", venue: "शांति कुंज, वडोदरा", message: "नन्हे मेहमान के इंतज़ार में प्रिया पर प्यार और आशीर्वाद बरसाने आइए। आपका आना हमारे लिए बहुत मायने रखता है।" },
    housewarming: { title: "शाह परिवार का नया घर", venue: "श्री रेज़िडेंसी, राजकोट", message: "जब तक आप क़दम नहीं रखेंगे, हमारा नया घर अधूरा लगेगा। वास्तु पूजा और उसके बाद भोजन के लिए पधारिए।" },
    anniversary: { title: "मम्मी-पापा की 25वीं सालगिरह", venue: "टैरेस गार्डन, सूरत", message: "पच्चीस साल, अनगिनत चाय के प्याले, और प्यार से बना एक परिवार। उनके साथ जश्न मनाने आइए।" },
    opening: { title: "एक नई शुरुआत", venue: "द एटेलियर, वापी", message: "हर नई शुरुआत का जश्न तो बनता है। जब हम एक ख़ूबसूरत नए अध्याय के लिए अपने दरवाज़े खोलें, तब हमारे साथ रहिए।" },
    diwali: { title: "मेहता परिवार की दिवाली", venue: "मेहता निवास, अहमदाबाद", message: "हमारे साथ दीया जलाने आइए। मिठाई, संगीत और पूरा परिवार एक छत के नीचे होगा।" },
    janoi: { title: "आरव का जनेऊ संस्कार", venue: "श्री राम वाड़ी, सूरत", message: "हमारा बेटा जनेऊ धारण कर रहा है। संस्कार में साथ रहिए, और भोजन करके जाइए।" },
    puja: { title: "घर पर सत्यनारायण कथा", venue: "शाह निवास, वडोदरा", message: "कथा, आरती और प्रसाद के लिए पधारिए। आपकी उपस्थिति से ही आयोजन पूरा होगा।" },
    naming: { title: "पटेल परिवार के शिशु का नामकरण", venue: "पटेल परिवार का घर, नवसारी", message: "बुआ कान में नाम कहेंगी, और हम चाहेंगे कि वह नाम सबसे पहले सुनने के लिए आप वहाँ हों।" },
  },
};

// The wedding sample's functions, by their id in the English sample.
const EVENTS: Partial<Record<Lang, Record<string, { name: string; venue?: string }>>> = {
  gu: { mehndi: { name: "મહેંદી" }, sangeet: { name: "સંગીત સંધ્યા", venue: "લેકવ્યૂ લૉન્સ, સુરત" }, wedding: { name: "લગ્ન" }, reception: { name: "રિસેપ્શન" } },
  hi: { mehndi: { name: "मेहंदी" }, sangeet: { name: "संगीत संध्या", venue: "लेकव्यू लॉन्स, सूरत" }, wedding: { name: "शादी" }, reception: { name: "रिसेप्शन" } },
};

/** A template's sample invitation, written in (and shown to guests in) a language. */
export function sampleDraft(template: InvitationTemplate, lang: Lang): InvitationDraft {
  const draft = initialDraft(template);
  const words = SAMPLES[lang]?.[template.id];
  if (!words) return draft;
  const events = draft.events.map((event) => ({ ...event, ...EVENTS[lang]?.[event.id] }));
  return { ...draft, ...words, events, language: lang };
}
