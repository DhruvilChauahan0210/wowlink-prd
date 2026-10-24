import type { Lang, TemplateId } from "./invitations";

/*
 * The invitation wording guides (/wording/<slug>): words people search for ("wedding invitation wording in Gujarati",
 * "griha pravesh invitation message in Hindi") and can copy as they are. Each guide has three wordings (the invitation,
 * the WhatsApp message that carries its link, and a reminder, a thank-you or a variation), each written in English,
 * Gujarati and Hindi the way families say it, not translated word for word. The names, days and places are the same
 * ones the sample invitations use (lib/invitations.ts), and every weekday is the real one for its date.
 */

export type Wording = {
  /** What it's for ("The invitation", "The WhatsApp message"). */
  title: string;
  /** Each language's words, line by line ("" is a blank line). */
  text: Record<Lang, readonly string[]>;
};

export type WordingGuide = {
  slug: string;
  /** The occasion it's for: its drawing, its page and the studio. */
  template: TemplateId;
  /** The page's <title> (WowLink is added after it). */
  title: string;
  description: string;
  /** What it's called in the list of guides. */
  name: string;
  /** The heading: the words before the part with the hand-drawn underline, that part, and any words after it. */
  heading: readonly [string, string, string?];
  intro: string;
  wordings: readonly Wording[];
  /** What this occasion's invitation should say. */
  include: readonly string[];
};

export const WORDING_GUIDES: readonly WordingGuide[] = [
  {
    slug: "wedding-invitation-wording",
    template: "wedding",
    title: "Wedding invitation wording in Gujarati, Hindi and English",
    description: "Ready-to-copy wedding invitation wording: a traditional Gujarati kankotri, a Hindi shaadi card and English, plus WhatsApp messages to send with the link.",
    name: "Wedding",
    heading: ["Wedding invitation wording, in", "three languages"],
    intro: "Words for the invitation, the WhatsApp message that carries it, and a reminder the day before. Each is written in English, Gujarati and Hindi the way families say it. Copy one, and change the names, date and place to yours.",
    wordings: [
      {
        title: "The invitation",
        text: {
          en: ["With the blessings of our elders,", "Mr. and Mrs. Rajesh Shah", "request the pleasure of your company", "at the wedding of their son", "Aarav", "with", "Meera", "(daughter of Mr. and Mrs. Nilesh Patel)", "", "Sunday, 8 November 2026, at 6:00 pm", "The Garden House, Surat", "", "Your presence and blessings will make the day complete."],
          gu: ["॥ શ્રી ગણેશાય નમઃ ॥", "", "સ્નેહી શ્રી,", "અમારા સુપુત્ર ચિ. આરવનાં શુભ લગ્ન", "શ્રી નિલેશભાઈ પટેલની સુપુત્રી", "અ.સૌ.કાં. મીરા સાથે નિર્ધારેલ છે.", "", "આ શુભ પ્રસંગે આપ સહકુટુંબ પધારી", "નવદંપતીને આશીર્વાદ આપશોજી.", "", "રવિવાર, 8 નવેમ્બર 2026, સાંજે 6:00 વાગ્યે", "ધ ગાર્ડન હાઉસ, સુરત", "", "લિ. શ્રી રાજેશભાઈ તથા શ્રીમતી નીતાબેન શાહ"],
          hi: ["॥ श्री गणेशाय नमः ॥", "", "आदरणीय,", "हमारे सुपुत्र चि. आरव का शुभ विवाह", "श्री नीलेश पटेल की सुपुत्री", "आयु. मीरा के साथ होना निश्चित हुआ है।", "", "इस शुभ अवसर पर आप सपरिवार पधारकर", "नवदंपति को अपना आशीर्वाद दें।", "", "रविवार, 8 नवंबर 2026, शाम 6:00 बजे", "द गार्डन हाउस, सूरत", "", "विनीत", "श्रीमती एवं श्री राजेश शाह"],
        },
      },
      {
        title: "The WhatsApp message, with the link",
        text: {
          en: ["Namaste 🙏", "Aarav and Meera are getting married on 8 November in Surat, and we’d love you to be there.", "Open the invitation for all the functions, and to tell us you’re coming:", "[invitation link]"],
          gu: ["જય શ્રી કૃષ્ણ 🙏", "આરવ અને મીરાનાં લગ્ન 8 નવેમ્બરે સુરતમાં છે, અને આપ જરૂર પધારો એવી અમારી ઇચ્છા છે.", "બધા પ્રસંગોની વિગત જોવા અને આપ પધારશો કે નહીં તે જણાવવા, આમંત્રણ ખોલો:", "[આમંત્રણની લિંક]"],
          hi: ["नमस्ते 🙏", "आरव और मीरा की शादी 8 नवंबर को सूरत में है, और हम चाहेंगे कि आप ज़रूर आएँ।", "सभी कार्यक्रमों की जानकारी के लिए, और अपने आने के बारे में बताने के लिए, निमंत्रण खोलें:", "[निमंत्रण का लिंक]"],
        },
      },
      {
        title: "A reminder, the day before",
        text: {
          en: ["Just a reminder: the wedding is tomorrow, 8 November, at 6:00 pm at The Garden House, Surat.", "The map and the day’s plan are on the invitation: [invitation link]", "See you there!"],
          gu: ["યાદ અપાવીએ: આવતીકાલે, 8 નવેમ્બરે સાંજે 6:00 વાગ્યે ધ ગાર્ડન હાઉસ, સુરતમાં લગ્ન છે.", "નકશો અને દિવસનો કાર્યક્રમ આમંત્રણમાં છે: [આમંત્રણની લિંક]", "આપની રાહ જોઈશું!"],
          hi: ["याद दिला दें: कल, 8 नवंबर को शाम 6:00 बजे द गार्डन हाउस, सूरत में शादी है।", "नक़्शा और दिन का कार्यक्रम निमंत्रण में है: [निमंत्रण का लिंक]", "आपका इंतज़ार रहेगा!"],
        },
      },
    ],
    include: ["Who is inviting: the parents or the couple, with the blessings of elders if you like.", "The couple’s names, and each family’s.", "The day, the time and the place, and each function’s if there are several.", "A line asking for their presence and blessings, and how to reply."],
  },
  {
    slug: "engagement-invitation-wording",
    template: "engagement",
    title: "Engagement (sagai) invitation wording and messages",
    description: "Ready-to-copy engagement and sagai invitation wording in English, Gujarati and Hindi, with a WhatsApp message to send with the link and a thank-you.",
    name: "Engagement and sagai",
    heading: ["Engagement invitation wording, for the", "ring ceremony"],
    intro: "Words for a sagai or ring ceremony invitation, the WhatsApp message that carries it, and a thank-you after. In English, Gujarati and Hindi; change the names, date and place to yours.",
    wordings: [
      {
        title: "The invitation",
        text: {
          en: ["With the blessings of both our families,", "we invite you to the engagement of", "Kabir and Isha", "", "Sunday, 20 December 2026, at 6:30 pm", "The Orchid Hall, Ahmedabad", "", "Come be there as two families become one."],
          gu: ["બંને પરિવારના આશીર્વાદ સાથે,", "કબીર અને ઈશાની", "સગાઈ વિધિમાં", "આપને સહકુટુંબ પધારવા સ્નેહભર્યું આમંત્રણ છે.", "", "રવિવાર, 20 ડિસેમ્બર 2026, સાંજે 6:30 વાગ્યે", "ધ ઓર્કિડ હૉલ, અમદાવાદ", "", "બે પરિવાર એક થાય એ પળે આપની હાજરી અમારે માટે આશીર્વાદ છે."],
          hi: ["दोनों परिवारों के आशीर्वाद के साथ,", "कबीर और ईशा की", "सगाई के शुभ अवसर पर", "आप सपरिवार सादर आमंत्रित हैं।", "", "रविवार, 20 दिसंबर 2026, शाम 6:30 बजे", "द ऑर्किड हॉल, अहमदाबाद", "", "दो परिवारों के एक होने के इस पल में आपकी उपस्थिति हमारे लिए आशीर्वाद होगी।"],
        },
      },
      {
        title: "The WhatsApp message, with the link",
        text: {
          en: ["Big news! 💍 Kabir and Isha are getting engaged on 20 December in Ahmedabad, and we’d love you there.", "The invitation has the time, the place and a quick way to reply:", "[invitation link]"],
          gu: ["ખુશખબર! 💍 કબીર અને ઈશાની સગાઈ 20 ડિસેમ્બરે અમદાવાદમાં છે, અને આપ જરૂર પધારો.", "સમય, સ્થળ અને જવાબ આપવાની સરળ રીત આમંત્રણમાં છે:", "[આમંત્રણની લિંક]"],
          hi: ["ख़ुशख़बरी! 💍 कबीर और ईशा की सगाई 20 दिसंबर को अहमदाबाद में है, और हम चाहेंगे कि आप ज़रूर आएँ।", "समय, जगह और जवाब देने का आसान तरीक़ा निमंत्रण में है:", "[निमंत्रण का लिंक]"],
        },
      },
      {
        title: "A thank-you, after",
        text: {
          en: ["Thank you for being with us yesterday, and for all your blessings. Kabir and Isha, and both our families, felt so loved. ❤️"],
          gu: ["ગઈકાલે અમારી સાથે રહેવા અને આપના આશીર્વાદ માટે દિલથી આભાર. કબીર અને ઈશાને, અને બંને પરિવારોને, આપનો ખૂબ પ્રેમ મળ્યો. ❤️"],
          hi: ["कल हमारे साथ रहने और आपके आशीर्वाद के लिए दिल से धन्यवाद। कबीर और ईशा को, और दोनों परिवारों को, आपका बहुत प्यार मिला। ❤️"],
        },
      },
    ],
    include: ["Both families’ names, or the couple’s, with their blessings.", "The ring ceremony’s day, time and place, and the dinner’s if it’s separate.", "A warm line asking them to come, and how to reply."],
  },
  {
    slug: "birthday-invitation-wording",
    template: "birthday",
    title: "Birthday invitation wording and WhatsApp messages",
    description: "Ready-to-copy birthday invitation wording in English, Gujarati and Hindi: for a first birthday, a party with friends or a milestone like a 50th.",
    name: "Birthday",
    heading: ["Birthday invitation wording, from a first birthday to a", "fiftieth"],
    intro: "Words for a child’s first birthday, a party with friends and a milestone birthday. In English, Gujarati and Hindi; change the names, date and place to yours.",
    wordings: [
      {
        title: "A first birthday",
        text: {
          en: ["Our little Riya is turning one! 🎂", "Come celebrate her very first birthday with us.", "", "Saturday, 5 December 2026, at 7:00 pm", "The Courtyard, Surat", "", "Your blessings are the best gift."],
          gu: ["અમારી નાનકડી રિયા એક વર્ષની થાય છે! 🎂", "તેના પહેલા જન્મદિવસની ઉજવણીમાં અમારી સાથે જોડાઓ.", "", "શનિવાર, 5 ડિસેમ્બર 2026, સાંજે 7:00 વાગ્યે", "ધ કોર્ટયાર્ડ, સુરત", "", "આપના આશીર્વાદ એ જ સૌથી મોટી ભેટ."],
          hi: ["हमारी नन्ही रिया एक साल की हो रही है! 🎂", "उसके पहले जन्मदिन के जश्न में हमारे साथ शामिल हों।", "", "शनिवार, 5 दिसंबर 2026, शाम 7:00 बजे", "द कोर्टयार्ड, सूरत", "", "आपका आशीर्वाद ही सबसे बड़ा तोहफ़ा है।"],
        },
      },
      {
        title: "A party with friends",
        text: {
          en: ["Good friends, a few candles and a whole lot of cake. 🎉", "Come make my birthday one to remember!", "", "Saturday, 5 December, 7:00 pm", "The Courtyard, Surat", "", "Tap the link to say you’re coming: [invitation link]"],
          gu: ["સારા મિત્રો, થોડી મીણબત્તીઓ અને ઘણી બધી કેક. 🎉", "મારા જન્મદિવસને યાદગાર બનાવવા આવજો!", "", "શનિવાર, 5 ડિસેમ્બર, સાંજે 7:00 વાગ્યે", "ધ કોર્ટયાર્ડ, સુરત", "", "આવો છો તે જણાવવા લિંક પર ટૅપ કરો: [આમંત્રણની લિંક]"],
          hi: ["अच्छे दोस्त, कुछ मोमबत्तियाँ और ढेर सारा केक। 🎉", "मेरे जन्मदिन को यादगार बनाने ज़रूर आना!", "", "शनिवार, 5 दिसंबर, शाम 7:00 बजे", "द कोर्टयार्ड, सूरत", "", "आ रहे हो, यह बताने के लिए लिंक पर टैप करो: [निमंत्रण का लिंक]"],
        },
      },
      {
        title: "A milestone: a 50th, a 60th",
        text: {
          en: ["Fifty years of laughter, love and family. 🌼", "Join us to celebrate Papa’s 50th birthday.", "", "Saturday, 5 December 2026, at 7:00 pm", "The Courtyard, Surat", "", "It wouldn’t be the same without you."],
          gu: ["પચાસ વર્ષનું હાસ્ય, પ્રેમ અને પરિવાર. 🌼", "પપ્પાના 50મા જન્મદિવસની ઉજવણીમાં અમારી સાથે જોડાઓ.", "", "શનિવાર, 5 ડિસેમ્બર 2026, સાંજે 7:00 વાગ્યે", "ધ કોર્ટયાર્ડ, સુરત", "", "આપના વિના આ ઉજવણી અધૂરી છે."],
          hi: ["पचास साल की हँसी, प्यार और परिवार। 🌼", "पापा के 50वें जन्मदिन के जश्न में हमारे साथ शामिल हों।", "", "शनिवार, 5 दिसंबर 2026, शाम 7:00 बजे", "द कोर्टयार्ड, सूरत", "", "आपके बिना यह जश्न अधूरा है।"],
        },
      },
    ],
    include: ["Whose birthday it is, and which one if it’s a milestone.", "The day, the time and the place.", "Anything guests should know: a theme, a surprise to keep, or no gifts please."],
  },
  {
    slug: "navratri-garba-invitation-message",
    template: "garba",
    title: "Navratri and Garba invitation messages for WhatsApp",
    description: "Ready-to-copy Navratri and Garba invitation messages in Gujarati, Hindi and English: for a society garba, a raas night with friends, or all nine nights.",
    name: "Garba and Navratri",
    heading: ["Garba invitation messages, for one night or", "all nine"],
    intro: "Words for a society Garba, a raas night with family and friends, and a Navratri wish to send with the invitation. In Gujarati, Hindi and English; change the names, dates and place to yours.",
    wordings: [
      {
        title: "For the society group",
        text: {
          en: ["Navratri is here! 🪔", "Shree Residency invites you and your family to nine nights of garba and raas in the society ground.", "", "Every night of Navratri, from 8:00 pm", "Shree Residency ground, Navsari", "", "Aarti at 8:00 pm, prasad after. Come dressed for raas!", "Tell us which nights you’ll come: [invitation link]"],
          gu: ["નવરાત્રિ આવી ગઈ! 🪔", "શ્રી રેસિડેન્સી આપને અને આપના પરિવારને સોસાયટીના ગ્રાઉન્ડમાં નવ રાતના ગરબા અને રાસ માટે આમંત્રણ આપે છે.", "", "નવરાત્રિની દરેક રાત, રાત્રે 8:00 વાગ્યાથી", "શ્રી રેસિડેન્સી ગ્રાઉન્ડ, નવસારી", "", "રાત્રે 8:00 વાગ્યે આરતી, પછી પ્રસાદ. ચણિયાચોળી અને કેડિયું પહેરીને આવજો!", "કઈ કઈ રાતે આવશો તે જણાવો: [આમંત્રણની લિંક]"],
          hi: ["नवरात्रि आ गई! 🪔", "श्री रेज़िडेंसी आपको और आपके परिवार को सोसाइटी ग्राउंड में नौ रातों के गरबा और रास के लिए आमंत्रित करती है।", "", "नवरात्रि की हर रात, रात 8:00 बजे से", "श्री रेज़िडेंसी ग्राउंड, नवसारी", "", "रात 8:00 बजे आरती, फिर प्रसाद। चनिया चोली और केडिया पहनकर आइए!", "किन रातों में आएँगे, बताइए: [निमंत्रण का लिंक]"],
        },
      },
      {
        title: "A raas night with friends",
        text: {
          en: ["Dandiya out, dancing shoes on! 💃", "Join us for a night of raas under the stars.", "", "Tuesday, 5 October 2027, at 8:00 pm", "Rangoli Courtyard, Navsari", "", "Bring your favourite people. Let’s fill the night with colour and rhythm.", "[invitation link]"],
          gu: ["દાંડિયા કાઢો, નાચવા તૈયાર થાઓ! 💃", "તારાઓ નીચે રાસની એક રાતમાં અમારી સાથે જોડાઓ.", "", "મંગળવાર, 5 ઑક્ટોબર 2027, રાત્રે 8:00 વાગ્યે", "રંગોળી કોર્ટયાર્ડ, નવસારી", "", "આપના મનગમતા લોકોને સાથે લાવજો. રાતને રંગ અને તાલથી ભરી દઈએ.", "[આમંત્રણની લિંક]"],
          hi: ["डांडिया निकालिए, नाचने के लिए तैयार हो जाइए! 💃", "तारों के नीचे रास की एक रात में हमारे साथ शामिल हों।", "", "मंगलवार, 5 अक्तूबर 2027, रात 8:00 बजे", "रंगोली कोर्टयार्ड, नवसारी", "", "अपने पसंदीदा लोगों को साथ लाइए। रात को रंग और ताल से भर दें।", "[निमंत्रण का लिंक]"],
        },
      },
      {
        title: "A Navratri wish, with the invitation",
        text: {
          en: ["Wishing you and your family a joyful Navratri! 🙏 May Maa Amba bless you with health and happiness.", "We’d love to see you at our garba: [invitation link]"],
          gu: ["આપને અને આપના પરિવારને નવરાત્રિની હાર્દિક શુભેચ્છાઓ! 🙏 મા અંબા આપને સુખ અને આરોગ્ય આપે.", "અમારા ગરબામાં આપને મળવાનો આનંદ થશે: [આમંત્રણની લિંક]"],
          hi: ["आपको और आपके परिवार को नवरात्रि की हार्दिक शुभकामनाएँ! 🙏 माँ अंबे आपको सुख और स्वास्थ्य दें।", "हमारे गरबा में आपसे मिलकर ख़ुशी होगी: [निमंत्रण का लिंक]"],
        },
      },
    ],
    include: ["Which nights, and the time the garba starts.", "The place, with a map for guests from outside the society.", "The aarti and prasad times, a dress code, and passes or entry if there are any."],
  },
  {
    slug: "seemant-baby-shower-invitation-wording",
    template: "babyshower",
    title: "Seemant and godh bharai invitation wording",
    description: "Ready-to-copy seemant, godh bharai and baby shower invitation wording in Gujarati, Hindi and English, with a WhatsApp message and a note for family far away.",
    name: "Seemant and godh bharai",
    heading: ["Seemant and godh bharai wording, with", "blessings"],
    intro: "Words for the seemant or godh bharai invitation, the WhatsApp message that carries it, and a note for family who can’t come. In Gujarati, Hindi and English; change the names, date and place to yours.",
    wordings: [
      {
        title: "The invitation",
        text: {
          en: ["A little one is on the way! 🌸", "With joy, we invite you to the seemant (baby shower) of", "Priya", "", "Sunday, 17 January 2027, at 11:00 am", "Shanti Kunj, Vadodara", "", "Come shower the parents-to-be with your love and blessings. Lunch will follow the ceremony."],
          gu: ["નાનકડા મહેમાનનું આગમન થવાનું છે! 🌸", "અ.સૌ. પ્રિયાના", "સીમંત પ્રસંગે", "આપને સહકુટુંબ પધારવા સ્નેહભર્યું આમંત્રણ છે.", "", "રવિવાર, 17 જાન્યુઆરી 2027, સવારે 11:00 વાગ્યે", "શાંતિ કુંજ, વડોદરા", "", "ભાવિ માતા-પિતાને આશીર્વાદ આપવા પધારશો. વિધિ પછી ભોજન રાખેલ છે."],
          hi: ["नन्हा मेहमान आने वाला है! 🌸", "सौ. प्रिया की", "गोद भराई के शुभ अवसर पर", "आप सपरिवार सादर आमंत्रित हैं।", "", "रविवार, 17 जनवरी 2027, सुबह 11:00 बजे", "शांति कुंज, वडोदरा", "", "होने वाले माता-पिता को अपना आशीर्वाद देने ज़रूर पधारें। रस्म के बाद भोजन रखा गया है।"],
        },
      },
      {
        title: "The WhatsApp message, with the link",
        text: {
          en: ["We’re celebrating Priya’s seemant on 17 January in Vadodara, and it would mean so much to have you there. 🙏", "The invitation has the time, the place and a way to send your blessings:", "[invitation link]"],
          gu: ["17 જાન્યુઆરીએ વડોદરામાં પ્રિયાનું સીમંત છે, અને આપ પધારશો તો અમને ખૂબ આનંદ થશે. 🙏", "સમય, સ્થળ અને આશીર્વાદ મોકલવાની રીત આમંત્રણમાં છે:", "[આમંત્રણની લિંક]"],
          hi: ["17 जनवरी को वडोदरा में प्रिया की गोद भराई है, और आपके आने से हमें बहुत ख़ुशी होगी। 🙏", "समय, जगह और आशीर्वाद भेजने का तरीक़ा निमंत्रण में है:", "[निमंत्रण का लिंक]"],
        },
      },
      {
        title: "For family far away",
        text: {
          en: ["We know you can’t be with us for Priya’s seemant, but you’re in our hearts.", "Open the invitation to see the day, and leave your blessings for the parents-to-be: [invitation link]"],
          gu: ["અમે જાણીએ છીએ કે આપ પ્રિયાના સીમંતમાં આવી નહીં શકો, પણ આપ અમારા દિલમાં છો.", "દિવસની વિગત જોવા, અને ભાવિ માતા-પિતા માટે આશીર્વાદ લખવા, આમંત્રણ ખોલો: [આમંત્રણની લિંક]"],
          hi: ["हम जानते हैं कि आप प्रिया की गोद भराई में नहीं आ पाएँगे, पर आप हमारे दिल में हैं।", "दिन की जानकारी देखने, और होने वाले माता-पिता के लिए आशीर्वाद लिखने के लिए, निमंत्रण खोलें: [निमंत्रण का लिंक]"],
        },
      },
    ],
    include: ["The mother-to-be’s name, and who is inviting.", "The puja’s time, and the lunch’s if it’s separate.", "A line for blessings, especially from family who can’t come."],
  },
  {
    slug: "griha-pravesh-invitation-message",
    template: "housewarming",
    title: "Griha pravesh invitation message, in Hindi and Gujarati",
    description: "Ready-to-copy griha pravesh and vastu puja invitation messages in Hindi, Gujarati and English, with a WhatsApp message that carries the map to your new home.",
    name: "Griha pravesh and vastu puja",
    heading: ["Griha pravesh invitation messages, for your", "new home"],
    intro: "Words for the griha pravesh or vastu puja invitation, the WhatsApp message that carries it (with the way to your new address), and a thank-you after. In Hindi, Gujarati and English; change the names, date and place to yours.",
    wordings: [
      {
        title: "The invitation",
        text: {
          en: ["With the blessings of God and our elders, we have a new home. 🏡", "We warmly invite you and your family to the griha pravesh and vastu puja.", "", "Sunday, 7 February 2027", "Puja at 9:00 am, lunch from 12:30 pm", "Shree Residency, Rajkot", "", "Our new home won’t feel complete until you’ve stepped inside.", "The Shah family"],
          gu: ["ઈશ્વરની કૃપા અને વડીલોના આશીર્વાદથી", "અમારા નવા ઘરનું વાસ્તુ પૂજન રાખેલ છે. 🏡", "આ શુભ પ્રસંગે આપ સહકુટુંબ પધારશોજી.", "", "રવિવાર, 7 ફેબ્રુઆરી 2027", "પૂજા સવારે 9:00 વાગ્યે, ભોજન બપોરે 12:30 વાગ્યાથી", "શ્રી રેસિડેન્સી, રાજકોટ", "", "આપનાં પગલાં પડશે ત્યારે જ આ નવું મકાન સાચે ઘર બનશે.", "લિ. શાહ પરિવાર"],
          hi: ["ईश्वर की कृपा और बड़ों के आशीर्वाद से", "हमारे नए घर का गृह प्रवेश होने जा रहा है। 🏡", "इस शुभ अवसर पर आप सपरिवार सादर आमंत्रित हैं।", "", "रविवार, 7 फ़रवरी 2027", "पूजा सुबह 9:00 बजे, भोजन दोपहर 12:30 बजे से", "श्री रेज़िडेंसी, राजकोट", "", "आपके क़दम पड़ेंगे, तभी यह नया मकान सच में घर बनेगा।", "शाह परिवार"],
        },
      },
      {
        title: "The WhatsApp message, with the way there",
        text: {
          en: ["We’ve moved! 🏡 Join us for the griha pravesh puja at our new home on Sunday, 7 February, at 9:00 am, and stay for lunch.", "The invitation has a map to the new address: [invitation link]"],
          gu: ["અમે નવા ઘરમાં આવી ગયાં! 🏡 રવિવાર, 7 ફેબ્રુઆરીએ સવારે 9:00 વાગ્યે નવા ઘરના વાસ્તુ પૂજનમાં પધારશો, અને ભોજન લઈને જજો.", "નવા સરનામાનો નકશો આમંત્રણમાં છે: [આમંત્રણની લિંક]"],
          hi: ["हम नए घर में आ गए हैं! 🏡 रविवार, 7 फ़रवरी को सुबह 9:00 बजे हमारे नए घर के गृह प्रवेश की पूजा में पधारें, और भोजन करके जाएँ।", "नए पते का नक़्शा निमंत्रण में है: [निमंत्रण का लिंक]"],
        },
      },
      {
        title: "A thank-you, after",
        text: {
          en: ["Thank you for coming to bless our new home. It already feels like home, because you were in it. 🙏"],
          gu: ["અમારા નવા ઘરને આશીર્વાદ આપવા પધાર્યા તે બદલ દિલથી આભાર. આપ આવ્યા એટલે જ આ ઘર હવે સાચે જ ઘર લાગે છે. 🙏"],
          hi: ["हमारे नए घर को आशीर्वाद देने आने के लिए दिल से धन्यवाद। आप आए, इसीलिए यह घर अब सच में घर लगता है। 🙏"],
        },
      },
    ],
    include: ["Who is inviting, and that it’s a new home.", "The puja’s time (the muhurat) and the meal’s.", "The new address, with a map: it’s the part guests most often get wrong."],
  },
  {
    slug: "anniversary-invitation-wording",
    template: "anniversary",
    title: "Anniversary party invitation wording (25th, 50th)",
    description: "Ready-to-copy anniversary invitation wording in English, Gujarati and Hindi: for a 25th or a 50th, a surprise for parents, and a WhatsApp message.",
    name: "Anniversary",
    heading: ["Anniversary invitation wording, for a 25th, a 50th or a", "surprise"],
    intro: "Words for a silver or golden anniversary invitation, a surprise party for Mummy and Papa, and the WhatsApp message that carries it. In English, Gujarati and Hindi; change the names, date and place to yours.",
    wordings: [
      {
        title: "A 25th or 50th anniversary",
        text: {
          en: ["Twenty-five years, countless cups of chai, and a family built with love. 💛", "Join us to celebrate the 25th wedding anniversary of", "Mr. and Mrs. Rajesh Shah", "", "Sunday, 14 February 2027, at 7:30 pm", "Terrace Garden, Surat", "", "With love, Aarav and Meera"],
          gu: ["પચીસ વર્ષ, અગણિત ચાના કપ, અને પ્રેમથી બનેલો પરિવાર. 💛", "શ્રી રાજેશભાઈ તથા શ્રીમતી નીતાબેન શાહની", "25મી લગ્નતિથિની ઉજવણીમાં", "આપને સહકુટુંબ પધારવા આમંત્રણ છે.", "", "રવિવાર, 14 ફેબ્રુઆરી 2027, સાંજે 7:30 વાગ્યે", "ટેરેસ ગાર્ડન, સુરત", "", "સ્નેહ સહ, આરવ અને મીરા"],
          hi: ["पच्चीस साल, अनगिनत चाय के प्याले, और प्यार से बना एक परिवार। 💛", "श्रीमती एवं श्री राजेश शाह की", "शादी की 25वीं सालगिरह के जश्न में", "आप सपरिवार आमंत्रित हैं।", "", "रविवार, 14 फ़रवरी 2027, शाम 7:30 बजे", "टैरेस गार्डन, सूरत", "", "प्यार सहित, आरव और मीरा"],
        },
      },
      {
        title: "A surprise (keep it secret)",
        text: {
          en: ["Shh, it’s a surprise! 🤫", "We’re throwing Mummy and Papa a party for their 25th anniversary, and they don’t know yet.", "Sunday, 14 February, 7:30 pm, Terrace Garden, Surat. Please arrive by 7:15.", "Reply on the invitation, not in the family group: [invitation link]"],
          gu: ["શ્…, આ સરપ્રાઇઝ છે! 🤫", "મમ્મી-પપ્પાની 25મી લગ્નતિથિ માટે અમે પાર્ટી રાખી છે, અને તેમને હજી ખબર નથી.", "રવિવાર, 14 ફેબ્રુઆરી, સાંજે 7:30 વાગ્યે, ટેરેસ ગાર્ડન, સુરત. કૃપા કરીને 7:15 સુધીમાં આવી જજો.", "જવાબ આમંત્રણ પર આપજો, ફેમિલી ગ્રુપમાં નહીં: [આમંત્રણની લિંક]"],
          hi: ["श्…, यह सरप्राइज़ है! 🤫", "हम मम्मी-पापा की 25वीं सालगिरह पर पार्टी दे रहे हैं, और उन्हें अभी पता नहीं है।", "रविवार, 14 फ़रवरी, शाम 7:30 बजे, टैरेस गार्डन, सूरत। कृपया 7:15 तक पहुँच जाएँ।", "जवाब निमंत्रण पर दें, फ़ैमिली ग्रुप में नहीं: [निमंत्रण का लिंक]"],
        },
      },
      {
        title: "The WhatsApp message, with the link",
        text: {
          en: ["Mummy and Papa are celebrating 25 years together on 14 February, and we’d love you to raise a cup of chai with us. 💛", "All the details are here: [invitation link]"],
          gu: ["14 ફેબ્રુઆરીએ મમ્મી-પપ્પાના લગ્નને 25 વર્ષ પૂરાં થાય છે, અને આ ઉજવણીમાં આપ અમારી સાથે હો એવી ઇચ્છા છે. 💛", "બધી વિગતો અહીં છે: [આમંત્રણની લિંક]"],
          hi: ["14 फ़रवरी को मम्मी-पापा की शादी को 25 साल पूरे हो रहे हैं, और हम चाहेंगे कि इस जश्न में आप हमारे साथ हों। 💛", "सारी जानकारी यहाँ है: [निमंत्रण का लिंक]"],
        },
      },
    ],
    include: ["Whose anniversary it is and which one, and who is hosting.", "The day, the time and the place.", "For a surprise: an earlier arrival time, and a way to reply that the couple won’t see."],
  },
  {
    slug: "shop-opening-invitation-message",
    template: "opening",
    title: "Shop opening and inauguration invitation messages",
    description: "Ready-to-copy invitation messages for a shop, office or clinic opening (udghatan) in English, Gujarati and Hindi, for WhatsApp and for print.",
    name: "Shop and office opening",
    heading: ["Opening ceremony invitation messages, for your", "big day"],
    intro: "Words for the opening invitation, the WhatsApp message for customers and friends, and a line for the flyer next to the QR code. In English, Gujarati and Hindi; change the names, date and place to yours.",
    wordings: [
      {
        title: "The invitation",
        text: {
          en: ["Every new beginning deserves a celebration. ✨", "With the blessings of our family and well-wishers, we invite you to the opening of", "The Atelier", "", "Saturday, 12 December 2026, at 10:00 am", "Station Road, Vapi", "", "Your presence will make our beginning auspicious."],
          gu: ["દરેક નવી શરૂઆત ઉજવવા જેવી હોય છે. ✨", "કુટુંબીજનો અને શુભેચ્છકોના આશીર્વાદ સાથે", "ધ એટેલિયરના શુભ ઉદ્ઘાટન પ્રસંગે", "આપને પધારવા ભાવભર્યું આમંત્રણ છે.", "", "શનિવાર, 12 ડિસેમ્બર 2026, સવારે 10:00 વાગ્યે", "સ્ટેશન રોડ, વાપી", "", "આપની હાજરીથી અમારી શરૂઆત શુભ બનશે."],
          hi: ["हर नई शुरुआत का जश्न तो बनता है। ✨", "परिवार और शुभचिंतकों के आशीर्वाद के साथ", "द एटेलियर के शुभ उद्घाटन पर", "आप सादर आमंत्रित हैं।", "", "शनिवार, 12 दिसंबर 2026, सुबह 10:00 बजे", "स्टेशन रोड, वापी", "", "आपकी उपस्थिति से हमारी शुरुआत शुभ होगी।"],
        },
      },
      {
        title: "For customers, on WhatsApp",
        text: {
          en: ["We’re opening our doors! 🎀 Come see The Atelier on Saturday, 12 December, from 10:00 am, at Station Road, Vapi.", "Directions and details: [invitation link]"],
          gu: ["ધ એટેલિયર હવે શરૂ થાય છે! 🎀 શનિવાર, 12 ડિસેમ્બરે સવારે 10:00 વાગ્યાથી સ્ટેશન રોડ, વાપી ખાતે જરૂર પધારો.", "રસ્તો અને વિગતો: [આમંત્રણની લિંક]"],
          hi: ["द एटेलियर अब खुल रहा है! 🎀 शनिवार, 12 दिसंबर को सुबह 10:00 बजे से स्टेशन रोड, वापी पर ज़रूर आइए।", "रास्ता और जानकारी: [निमंत्रण का लिंक]"],
        },
      },
      {
        title: "For the flyer, next to the QR code",
        text: {
          en: ["You’re invited to our grand opening.", "Scan to see the day, the time and the way here."],
          gu: ["અમારા ઉદ્ઘાટનમાં આપને આમંત્રણ છે.", "દિવસ, સમય અને અહીં સુધીનો રસ્તો જોવા સ્કૅન કરો."],
          hi: ["हमारे उद्घाटन में आप आमंत्रित हैं।", "दिन, समय और यहाँ तक का रास्ता देखने के लिए स्कैन करें।"],
        },
      },
    ],
    include: ["The name of the shop, office or clinic, and who is opening it.", "The day and the time, and the muhurat if there’s a puja.", "The address with a map, and the QR code on your flyers and in the window."],
  },
  {
    slug: "diwali-party-invitation-message",
    template: "diwali",
    title: "Diwali party invitation messages for WhatsApp",
    description: "Ready-to-copy Diwali party and Diwali sneh milan invitation messages in English, Gujarati and Hindi, with new year wishes to send with them.",
    name: "Diwali",
    heading: ["Diwali invitation messages, with a", "diya lit"],
    intro: "Words for a Diwali get-together at home, a sneh milan for the community, and a new year wish to send with the invitation. In English, Gujarati and Hindi; change the names, date and place to yours.",
    wordings: [
      {
        title: "A Diwali party at home",
        text: {
          en: ["Diyas, mithai and the whole family under one roof. 🪔", "Come celebrate Diwali with us!", "", "Sunday, 8 November 2026, at 7:30 pm", "Mehta Niwas, Ahmedabad", "", "With love, the Mehtas"],
          gu: ["દીવા, મીઠાઈ અને આખો પરિવાર એક છત નીચે. 🪔", "અમારી સાથે દિવાળી ઉજવવા પધારો!", "", "રવિવાર, 8 નવેમ્બર 2026, સાંજે 7:30 વાગ્યે", "મહેતા નિવાસ, અમદાવાદ", "", "સ્નેહ સહ, મહેતા પરિવાર"],
          hi: ["दीये, मिठाई और पूरा परिवार एक छत के नीचे। 🪔", "हमारे साथ दिवाली मनाने आइए!", "", "रविवार, 8 नवंबर 2026, शाम 7:30 बजे", "मेहता निवास, अहमदाबाद", "", "प्यार सहित, मेहता परिवार"],
        },
      },
      {
        title: "A Diwali sneh milan",
        text: {
          en: ["Our community’s Diwali sneh milan is here. 🙏", "Join us to welcome the new year together, with bhajans, dinner and family.", "", "Sunday, 15 November 2026, from 6:00 pm", "Community hall, Ahmedabad", "", "Tell us how many of you are coming: [invitation link]"],
          gu: ["આપણા સમાજનું દિવાળી સ્નેહ મિલન યોજાયું છે. 🙏", "ભજન, ભોજન અને પરિવાર સાથે નવા વર્ષને વધાવવા પધારો.", "", "રવિવાર, 15 નવેમ્બર 2026, સાંજે 6:00 વાગ્યાથી", "સમાજની વાડી, અમદાવાદ", "", "આપના પરિવારમાંથી કેટલા લોકો આવશે તે જણાવો: [આમંત્રણની લિંક]"],
          hi: ["हमारे समाज का दिवाली स्नेह मिलन आयोजित है। 🙏", "भजन, भोजन और परिवार के साथ नए साल का स्वागत करने पधारें।", "", "रविवार, 15 नवंबर 2026, शाम 6:00 बजे से", "समाज भवन, अहमदाबाद", "", "आपके परिवार से कितने लोग आएँगे, बताइए: [निमंत्रण का लिंक]"],
        },
      },
      {
        title: "A new year wish, with the invitation",
        text: {
          en: ["Happy Diwali and a prosperous new year! 🪔 May this year bring your family health, happiness and success.", "We’d love to see you at our Diwali get-together: [invitation link]"],
          gu: ["દિવાળીની શુભેચ્છાઓ અને નૂતન વર્ષાભિનંદન! 🪔 નવું વર્ષ આપના પરિવાર માટે સુખ, આરોગ્ય અને સમૃદ્ધિ લાવે.", "અમારા દિવાળી મિલનમાં આપને મળવાનો આનંદ થશે: [આમંત્રણની લિંક]"],
          hi: ["दिवाली और नए साल की हार्दिक शुभकामनाएँ! 🪔 नया साल आपके परिवार के लिए सुख, स्वास्थ्य और समृद्धि लाए।", "हमारे दिवाली मिलन में आपसे मिलकर ख़ुशी होगी: [निमंत्रण का लिंक]"],
        },
      },
    ],
    include: ["Whether it’s a dinner at home, a milan for the community or a card party.", "The day and the time, and a note on food (Jain, no onion and garlic) if you’ll ask.", "How to reply, so you know how many to cook for."],
  },
  {
    slug: "janoi-upanayan-invitation-wording",
    template: "janoi",
    title: "Janoi (janeu) and upanayan invitation wording",
    description: "Ready-to-copy janoi, janeu and upanayan sanskar invitation wording in Gujarati, Hindi and English, with the muhurat, the lunch and a WhatsApp message.",
    name: "Janoi and upanayan",
    heading: ["Janoi invitation wording, for the", "sacred thread"],
    intro: "Words for the janoi or upanayan invitation (with the grah shanti, the muhurat and the lunch), the WhatsApp message that carries it, and a reminder. In Gujarati, Hindi and English; change the names, date and place to yours.",
    wordings: [
      {
        title: "The invitation",
        text: {
          en: ["॥ Shree Ganeshaya Namah ॥", "", "With the blessings of our elders, our son", "Aarav", "will take the sacred thread.", "We invite you and your family to his janoi (upanayan sanskar).", "", "Saturday, 20 February 2027", "Grah shanti: 8:30 am", "Janoi muhurat: 10:15 am", "Lunch: 12:30 pm", "Shree Ram Vadi, Surat", "", "The Shah family"],
          gu: ["॥ શ્રી ગણેશાય નમઃ ॥", "", "વડીલોના આશીર્વાદથી અમારા સુપુત્ર", "ચિ. આરવના યજ્ઞોપવીત (જનોઈ) સંસ્કાર", "નિમિત્તે આપને સહકુટુંબ પધારવા ભાવભર્યું આમંત્રણ છે.", "", "શનિવાર, 20 ફેબ્રુઆરી 2027", "ગ્રહશાંતિ: સવારે 8:30 વાગ્યે", "જનોઈ મુહૂર્ત: સવારે 10:15 વાગ્યે", "ભોજન: બપોરે 12:30 વાગ્યે", "શ્રી રામ વાડી, સુરત", "", "લિ. શાહ પરિવાર"],
          hi: ["॥ श्री गणेशाय नमः ॥", "", "बड़ों के आशीर्वाद से हमारे सुपुत्र", "चि. आरव के यज्ञोपवीत (जनेऊ) संस्कार", "के शुभ अवसर पर आप सपरिवार सादर आमंत्रित हैं।", "", "शनिवार, 20 फ़रवरी 2027", "ग्रह शांति: सुबह 8:30 बजे", "जनेऊ मुहूर्त: सुबह 10:15 बजे", "भोजन: दोपहर 12:30 बजे", "श्री राम वाड़ी, सूरत", "", "विनीत", "शाह परिवार"],
        },
      },
      {
        title: "The WhatsApp message, with the link",
        text: {
          en: ["Aarav’s janoi is on Saturday, 20 February, in Surat, and we’d be blessed to have you there. 🙏", "The muhurat, the place and the lunch are on the invitation: [invitation link]"],
          gu: ["શનિવાર, 20 ફેબ્રુઆરીએ સુરતમાં આરવની જનોઈ છે, અને આપ પધારશો તો અમને ખૂબ આનંદ થશે. 🙏", "મુહૂર્ત, સ્થળ અને ભોજનની વિગત આમંત્રણમાં છે: [આમંત્રણની લિંક]"],
          hi: ["शनिवार, 20 फ़रवरी को सूरत में आरव का जनेऊ संस्कार है, और आपके आने से हमें बहुत ख़ुशी होगी। 🙏", "मुहूर्त, जगह और भोजन की जानकारी निमंत्रण में है: [निमंत्रण का लिंक]"],
        },
      },
      {
        title: "A reminder, the day before",
        text: {
          en: ["A gentle reminder: Aarav’s janoi is tomorrow. The grah shanti starts at 8:30 am at Shree Ram Vadi, Surat.", "Map: [invitation link]"],
          gu: ["યાદ અપાવીએ: આવતીકાલે આરવની જનોઈ છે. ગ્રહશાંતિ સવારે 8:30 વાગ્યે શ્રી રામ વાડી, સુરતમાં શરૂ થશે.", "નકશો: [આમંત્રણની લિંક]"],
          hi: ["याद दिला दें: कल आरव का जनेऊ संस्कार है। ग्रह शांति सुबह 8:30 बजे श्री राम वाड़ी, सूरत में शुरू होगी।", "नक़्शा: [निमंत्रण का लिंक]"],
        },
      },
    ],
    include: ["The boy’s name and his parents’, with the blessings of elders.", "Each part’s time: the grah shanti, the janoi muhurat and the lunch.", "The place, with a map, and how to reply."],
  },
  {
    slug: "satyanarayan-katha-invitation-message",
    template: "puja",
    title: "Satyanarayan katha and puja invitation messages",
    description: "Ready-to-copy Satyanarayan katha and home puja invitation messages in Hindi, Gujarati and English, with the katha, aarti and prasad times.",
    name: "Satyanarayan katha and puja",
    heading: ["Satyanarayan katha invitation messages, with", "prasad after"],
    intro: "Words for a Satyanarayan katha or a puja at home, the WhatsApp message that carries it, and a short note for neighbours. In Hindi, Gujarati and English; change the names, date and place to yours.",
    wordings: [
      {
        title: "The invitation",
        text: {
          en: ["With faith and gratitude, we are holding a", "Shree Satyanarayan Katha", "at our home.", "", "Sunday, 20 December 2026", "Katha at 5:00 pm, aarti at 6:30 pm, prasad after", "Shah residence, Vadodara", "", "Please come with your family and receive the prasad.", "The Shah family"],
          gu: ["શ્રદ્ધા અને આભાર સાથે અમારા ઘરે", "શ્રી સત્યનારાયણ ભગવાનની કથા", "રાખેલ છે.", "", "રવિવાર, 20 ડિસેમ્બર 2026", "કથા સાંજે 5:00 વાગ્યે, આરતી સાંજે 6:30 વાગ્યે, પછી પ્રસાદ", "શાહ નિવાસ, વડોદરા", "", "આપ સહકુટુંબ પધારી કથાનો લાભ લેશો અને પ્રસાદ ગ્રહણ કરશોજી.", "લિ. શાહ પરિવાર"],
          hi: ["श्रद्धा और आभार के साथ हमारे घर पर", "श्री सत्यनारायण भगवान की कथा", "का आयोजन किया गया है।", "", "रविवार, 20 दिसंबर 2026", "कथा शाम 5:00 बजे, आरती शाम 6:30 बजे, फिर प्रसाद", "शाह निवास, वडोदरा", "", "आप सपरिवार पधारकर कथा का लाभ लें और प्रसाद ग्रहण करें।", "शाह परिवार"],
        },
      },
      {
        title: "The WhatsApp message, with the link",
        text: {
          en: ["Jai Shree Krishna 🙏 We’re holding a Satyanarayan katha at home on Sunday, 20 December, at 5:00 pm.", "Please join us for the katha, the aarti and prasad. Details and directions: [invitation link]"],
          gu: ["જય શ્રી કૃષ્ણ 🙏 રવિવાર, 20 ડિસેમ્બરે સાંજે 5:00 વાગ્યે અમારા ઘરે સત્યનારાયણની કથા રાખેલ છે.", "કથા, આરતી અને પ્રસાદ માટે જરૂર પધારશો. વિગત અને રસ્તો: [આમંત્રણની લિંક]"],
          hi: ["जय श्री कृष्ण 🙏 रविवार, 20 दिसंबर को शाम 5:00 बजे हमारे घर पर सत्यनारायण कथा है।", "कथा, आरती और प्रसाद के लिए ज़रूर पधारें। जानकारी और रास्ता: [निमंत्रण का लिंक]"],
        },
      },
      {
        title: "For neighbours",
        text: {
          en: ["Namaste! We’re having a small Satyanarayan katha at home this Sunday at 5:00 pm. It would be lovely if you could come for the aarti and prasad. 🙏"],
          gu: ["નમસ્તે! આ રવિવારે સાંજે 5:00 વાગ્યે અમારા ઘરે નાની સત્યનારાયણ કથા રાખી છે. આરતી અને પ્રસાદ માટે આપ આવશો તો ખૂબ ગમશે. 🙏"],
          hi: ["नमस्ते! इस रविवार शाम 5:00 बजे हमारे घर पर छोटी सी सत्यनारायण कथा है। आरती और प्रसाद के लिए आप आएँगे तो बहुत अच्छा लगेगा। 🙏"],
        },
      },
    ],
    include: ["Which puja or katha, and at whose home.", "The katha’s time, the aarti’s, and when prasad (or a meal) is served.", "The address and a map pin, so guests find the right building and gate."],
  },
  {
    slug: "naming-ceremony-invitation-wording",
    template: "naming",
    title: "Naamkaran (naming ceremony) invitation wording",
    description: "Ready-to-copy naamkaran and naming ceremony invitation wording in English, Gujarati and Hindi, with a WhatsApp message and a thank-you after.",
    name: "Naamkaran",
    heading: ["Naamkaran invitation wording, to hear the", "name first"],
    intro: "Words for the naming ceremony invitation, the WhatsApp message that carries it, and a thank-you after. In English, Gujarati and Hindi; change the names, date and place to yours.",
    wordings: [
      {
        title: "The invitation",
        text: {
          en: ["Our little one is ready for a name! 👶", "With the blessings of our elders, we invite you to our baby’s naamkaran.", "", "Sunday, 10 January 2027, at 11:00 am", "Patel family home, Navsari", "", "Foi will whisper the name, and we’d love you there to hear it first.", "The Patel family"],
          gu: ["અમારા બાળકને નામ મળવાનું છે! 👶", "વડીલોના આશીર્વાદ સાથે અમારા બાળકના", "નામકરણ પ્રસંગે", "આપને સહકુટુંબ પધારવા આમંત્રણ છે.", "", "રવિવાર, 10 જાન્યુઆરી 2027, સવારે 11:00 વાગ્યે", "પટેલ નિવાસ, નવસારી", "", "ફોઈ કાનમાં નામ કહેશે, અને એ નામ સૌથી પહેલાં સાંભળવા આપ ત્યાં હો એવી અમારી ઇચ્છા છે.", "લિ. પટેલ પરિવાર"],
          hi: ["हमारे शिशु को नाम मिलने वाला है! 👶", "बड़ों के आशीर्वाद के साथ हमारे शिशु के", "नामकरण संस्कार के शुभ अवसर पर", "आप सपरिवार आमंत्रित हैं।", "", "रविवार, 10 जनवरी 2027, सुबह 11:00 बजे", "पटेल परिवार का घर, नवसारी", "", "बुआ कान में नाम कहेंगी, और हम चाहेंगे कि वह नाम सबसे पहले सुनने के लिए आप वहाँ हों।", "पटेल परिवार"],
        },
      },
      {
        title: "The WhatsApp message, with the link",
        text: {
          en: ["Our baby’s naamkaran is on Sunday, 10 January, at 11:00 am, and we’d love you to be there when Foi says the name. 💛", "Details: [invitation link]"],
          gu: ["રવિવાર, 10 જાન્યુઆરીએ સવારે 11:00 વાગ્યે અમારા બાળકનું નામકરણ છે, અને ફોઈ નામ પાડે ત્યારે આપ ત્યાં હો એવી અમારી ઇચ્છા છે. 💛", "વિગતો: [આમંત્રણની લિંક]"],
          hi: ["रविवार, 10 जनवरी को सुबह 11:00 बजे हमारे शिशु का नामकरण है, और हम चाहेंगे कि जब बुआ नाम रखें, तब आप वहाँ हों। 💛", "जानकारी: [निमंत्रण का लिंक]"],
        },
      },
      {
        title: "A thank-you, after",
        text: {
          en: ["Thank you for coming to bless our little one, and for being among the first to hear the name. 🙏"],
          gu: ["અમારા બાળકને આશીર્વાદ આપવા પધાર્યા, અને સૌથી પહેલાં તેનું નામ સાંભળ્યું, તે બદલ દિલથી આભાર. 🙏"],
          hi: ["हमारे शिशु को आशीर्वाद देने आने, और सबसे पहले उसका नाम सुनने के लिए दिल से धन्यवाद। 🙏"],
        },
      },
    ],
    include: ["Who is inviting, and the baby’s parents’ names.", "The day, the time and the place.", "If the name is a surprise, say so: guests love to hear it first."],
  },
];

export const wordingGuide = (slug: string) => WORDING_GUIDES.find((guide) => guide.slug === slug);
export const guideFor = (template: TemplateId) => WORDING_GUIDES.find((guide) => guide.template === template);
