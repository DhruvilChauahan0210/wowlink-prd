import { invitationTemplates, type Lang, type TemplateId } from "./invitations";

/*
 * The words for each occasion's own page (/templates/<id>, and ?lang=gu or hi): what someone searching for "Garba
 * invitation maker", "ગરબા આમંત્રણ" or "गृह प्रवेश निमंत्रण" hopes to find, said plainly. Everything here is something
 * WowLink does today. The Gujarati and Hindi pages say the same things, written for each language rather than word for
 * word.
 */

export type OccasionPage = {
  /** The page's <title> (WowLink is added after it). */
  title: string;
  description: string;
  /** The heading over what its invitations are good at ("Made for your wedding"). */
  madeFor: string;
  /** The heading: the words before the part with the hand-drawn underline, that part, and any words after it. */
  heading: readonly [string, string, string?];
  intro: string;
  /** What this occasion's invitations are good at. */
  /** `pro`: needs the Creator studio (a schedule, personal links, downloads…). */
  points: readonly { title: string; body: string; pro?: true }[];
};

const PAGES_EN: Record<TemplateId, OccasionPage> = {
  wedding: {
    title: "Wedding invitation website in Gujarati, Hindi or English",
    description: "A hand-drawn wedding invitation website that opens like a kankotri, in Gujarati, Hindi or English. Share one link on WhatsApp and collect RSVPs. Free to start.",
    madeFor: "Made for your wedding",
    heading: ["A wedding invitation that opens like a", "kankotri"],
    intro: "Your guests untie the knot on a hand-drawn scroll and the invitation unrolls: your names, the day, the place and every function. Share one link on WhatsApp, and the replies come back to you.",
    points: [
      { title: "Every function on one link", body: "Add the mehndi, haldi, sangeet, wedding and reception, each with its own day, time and place. Guests tick the ones they’ll come to, and you get a headcount for each, ready for the caterer.", pro: true },
      { title: "A link for each family", body: "Send the Patel family their own invitation, with their name on it and only the functions you picked for them, like the reception for office friends. You’ll see who has opened it and who hasn’t replied.", pro: true },
      { title: "Written the Gujarati way", body: "Choose Gujarati and the invitation reads the way a kankotri does: “8 નવેમ્બર 2026, સાંજે 6:00 વાગ્યે”. Guests can switch to English with one tap." },
    ],
  },
  engagement: {
    title: "Engagement and sagai invitation online, hand-drawn",
    description: "An online engagement invitation that opens like a ring box. Hand-drawn, in Gujarati, Hindi or English, with RSVPs and a link for each family.",
    madeFor: "Made for your engagement",
    heading: ["An engagement invitation in a", "ring box"],
    intro: "Guests press the clasp, the ring box opens, and your sagai invitation comes up in its place. Two families, one link, and every reply in one list.",
    points: [
      { title: "Both families, one guest list", body: "Add households from both sides, each with their own link and their name on it. Send them on WhatsApp straight from your list, and remind anyone who hasn’t replied.", pro: true },
      { title: "The ceremony and the dinner", body: "Add the ring ceremony, a puja or the dinner as separate events, and guests say which they’ll come to.", pro: true },
      { title: "Blessings from everyone", body: "Guests can leave a blessing with their reply. Keep them to yourselves, or show them on the invitation as hand-written notes." },
    ],
  },
  birthday: {
    title: "Free interactive birthday invitation, hand-drawn",
    description: "A free birthday invitation guests open by pulling the bow on a gift. Hand-drawn, with a countdown, RSVPs and birthday wishes, shared with one link on WhatsApp.",
    madeFor: "Made for your birthday",
    heading: ["A birthday invitation with a", "surprise inside"],
    intro: "Guests pull the bow on a hand-drawn gift and your invitation is inside. For a first birthday, a sweet sixteen or a fiftieth, with one link to share.",
    points: [
      { title: "A countdown to the day", body: "The invitation counts down the days. Guests add the party to Google or Apple Calendar in a tap, and get directions to the place." },
      { title: "Wishes on the page", body: "Friends leave a birthday wish when they reply, for you to read. Show them on the invitation as taped notes, too.", pro: true },
      { title: "On the day, and after", body: "On the day, the invitation leads with what’s happening now. Afterwards, it becomes a thank-you note in your words." },
    ],
  },
  garba: {
    title: "Garba and Navratri invitation maker online",
    description: "Make a Garba or Navratri invitation online: guests light a diya and the rangoli blooms. Hand-drawn, in Gujarati, Hindi or English, with RSVPs. Free.",
    madeFor: "Made for your Garba night",
    heading: ["A Garba invitation that lights a", "diya"],
    intro: "Guests light the diya, the rangoli blooms, and your invitation to raas under the stars appears. Make it for one night or for all nine.",
    points: [
      { title: "Every night on one link", body: "Add each night of Navratri with its own time and place. Guests tick the nights they’ll come to, and you see how many to expect each night.", pro: true },
      { title: "In Gujarati, naturally", body: "Write it in Gujarati and the dates read “5 ઑક્ટોબર 2027, રાત્રે 8:00 વાગ્યે”. Guests can switch to English with one tap." },
      { title: "For the society or the community", body: "Share one link in the society’s WhatsApp group, or print its QR code on a poster at the gate. Replies tell you how many are coming." },
    ],
  },
  babyshower: {
    title: "Seemant and baby shower invitation online, hand-drawn",
    description: "A seemant or baby shower invitation guests open by rocking a hand-drawn cradle. In Gujarati, Hindi or English, with RSVPs and blessings.",
    madeFor: "Made for your seemant",
    heading: ["A seemant invitation that rocks the", "cradle"],
    intro: "Guests shake the rattle, the cradle rocks, and your invitation to shower the parents-to-be with love appears. One link for family near and far.",
    points: [
      { title: "Blessings for the parents-to-be", body: "Guests leave a blessing with their reply. Keep them as a keepsake, or show them on the invitation for everyone to read." },
      { title: "The puja and the lunch", body: "Add the seemant puja and the lunch as separate events with their own times, and guests say which they’ll join.", pro: true },
      { title: "Family far away", body: "Relatives who can’t come can still open the invitation, see the day’s plan and send their blessings." },
    ],
  },
  housewarming: {
    title: "Housewarming and vastu puja invitation online",
    description: "A housewarming or vastu puja invitation guests open by lifting the latch on a hand-drawn door. With directions, RSVPs and a link for each family.",
    madeFor: "Made for your housewarming",
    heading: ["A housewarming invitation with a", "door to open"],
    intro: "Guests lift the latch, the door swings open, and your invitation to the new home is waiting inside, with a map to find the new address.",
    points: [
      { title: "Directions to the new home", body: "New addresses are hard to find. Guests get a map link to your door, and can add the puja to their calendar in a tap." },
      { title: "The puja in the morning, lunch after", body: "Add the vastu puja and the lunch as separate events, and guests say which they’ll come to, so you know how many to cook for.", pro: true },
      { title: "Relatives and neighbours", body: "Send relatives their own links with their names on them, and share one general link in the society group.", pro: true },
    ],
  },
  anniversary: {
    title: "Anniversary party invitation online, hand-drawn",
    description: "An anniversary invitation guests open by breaking the seal on a hand-drawn letter. For a 25th or a 50th, with RSVPs, wishes and personal links.",
    madeFor: "Made for your anniversary",
    heading: ["An anniversary invitation sealed in a", "letter"],
    intro: "Guests break the wax seal, the letter opens, and your invitation is inside. Made for a 25th, a 50th, or a surprise for Mummy and Papa.",
    points: [
      { title: "Planning a surprise?", body: "Send each family their own link and see who has opened it, with no group chat the couple might see.", pro: true },
      { title: "Wishes and memories", body: "Guests leave a wish or a memory with their reply. Show them on the invitation, or save them for the couple." },
      { title: "A thank-you, after", body: "Once the evening is over, the invitation becomes a thank-you note in your words." },
    ],
  },
  opening: {
    title: "Digital grand opening invitation, hand-drawn",
    description: "A digital grand opening invitation guests open by cutting a ribbon. For a shop, clinic, office or showroom, with RSVPs, directions and a QR code. Free to make.",
    madeFor: "Made for your opening",
    heading: ["A grand opening invitation with a", "ribbon to cut"],
    intro: "Guests cut the ribbon on your hand-drawn shopfront, and the invitation comes up with the day, the time and the address. For a shop, a clinic, an office or a showroom.",
    points: [
      { title: "Print the QR code", body: "Put the QR code on flyers, in the shop window or on your visiting card. It opens the same invitation as the WhatsApp link." },
      { title: "Know who’s coming", body: "Guests reply in a few taps, and you see how many to expect, with a list you can download for the day.", pro: true },
      { title: "Directions to your door", body: "A map link brings guests to the right street, and they can add the opening to their calendar." },
    ],
  },
  diwali: {
    title: "Diwali party invitation online, hand-drawn",
    description: "A Diwali party invitation that lights a row of diyas, one by one. Hand-drawn, in Gujarati, Hindi or English, with RSVPs.",
    madeFor: "Made for your Diwali get-together",
    heading: ["A Diwali invitation that lights the", "diyas"],
    intro: "Guests light the phuljhadi, the diyas catch one after another, and your invitation to the Diwali milan glows in. One link for the whole family group.",
    points: [
      { title: "Food for everyone", body: "Ask about food needs with the reply: Jain, Swaminarayan or no onion and garlic. You get the counts for the caterer." },
      { title: "Bhai dooj too", body: "Add the Diwali night, Bestu varas and Bhai dooj as separate celebrations, and guests say which they’ll come to.", pro: true },
      { title: "Wishes for the new year", body: "Guests leave a Saal Mubarak wish with their reply. Show them on the invitation, or keep them for the family." },
    ],
  },
  janoi: {
    title: "Janoi and upanayan invitation online, hand-drawn",
    description: "A janoi (sacred thread ceremony) invitation guests open by tying the thread. Hand-drawn, in Gujarati, Hindi or English, with RSVPs and directions.",
    madeFor: "Made for your janoi",
    heading: ["A janoi invitation that ties the", "sacred thread"],
    intro: "Guests tie the brahmagranthi, the three strands draw together, and your invitation to the ceremony appears, with the muhurat and the place.",
    points: [
      { title: "Grah shanti to lunch", body: "Add the grah shanti, the janoi muhurat and the lunch as separate celebrations, each with its own time.", pro: true },
      { title: "A link for each family", body: "Send relatives their own invitation with their name on it, and see who has opened it.", pro: true },
      { title: "In Gujarati or Hindi", body: "The invitation reads the way an invitation should, in Gujarati or Hindi, and guests can switch to English with one tap." },
    ],
  },
  puja: {
    title: "Satyanarayan katha and puja invitation online",
    description: "A Satyanarayan katha or home puja invitation guests open by ringing a temple bell. Hand-drawn, in Gujarati, Hindi or English, with RSVPs.",
    madeFor: "Made for your katha",
    heading: ["A puja invitation that rings the", "bell"],
    intro: "Guests ring the bell, it swings and petals drift down, and your invitation to the katha, the aarti and prasad appears.",
    points: [
      { title: "Know how many for prasad", body: "Guests reply in a few taps, and you see how many to expect, with their food needs." },
      { title: "Directions to your home", body: "Paste your Google Maps pin, so guests reach the right building and gate." },
      { title: "Katha, aarti and bhojan", body: "Add the katha, the aarti and the bhojan as separate times, and guests say which they’ll join.", pro: true },
    ],
  },
  naming: {
    title: "Naamkaran (naming ceremony) invitation online",
    description: "A naamkaran invitation guests open by lifting a bandhani cloth to reveal the naming thali. Hand-drawn, in Gujarati, Hindi or English, with RSVPs.",
    madeFor: "Made for your naamkaran",
    heading: ["A naamkaran invitation under a", "bandhani cloth"],
    intro: "Guests lift the cloth from the thali, the rice and the little swirl appear, and your invitation to hear the name for the first time is inside.",
    points: [
      { title: "Blessings for the little one", body: "Guests leave a blessing with their reply. Keep them as a keepsake, or show them on the invitation." },
      { title: "Family near and far", body: "Relatives who can’t come can still open the invitation and send their blessings." },
      { title: "A link for each family", body: "Send each family their own invitation with their name on it, so foi’s side and mama’s side both feel invited.", pro: true },
    ],
  },
};

/** What every invitation gives guests, whatever the occasion. */
const GUEST_GETS_EN = [
  "Opens from a WhatsApp link, with no app or sign-up",
  "A countdown, and the day in Google or Apple Calendar",
  "Directions to the place on the map",
  "A reply in a few taps: coming, maybe or can’t make it",
  "English, Gujarati or Hindi, and a switch between them",
  "A thank-you from you once the day is over",
] as const;

const STEPS_EN = [
  { title: "Pick this drawing", body: "Start from the sample. Nothing to install, nothing to design." },
  { title: "Add your details", body: "Names, date, place and a message. The preview changes as you type." },
  { title: "Share one link", body: "Publish, then send it on WhatsApp, copy it anywhere, or print its QR code." },
] as const;

const FAQ_EN = [
  { q: "Is it free?", a: "To start, yes: the free plan has the four starter occasions (wedding, birthday, Garba, grand opening), one celebration and up to 50 replies. Schedules, a link for each family, your own colours and the other occasions are in the Creator studio." },
  { q: "Do guests need an app or an account?", a: "No. They tap the link and it opens in their phone’s browser. Replying takes a few taps, with no sign-up." },
  { q: "Can guests read it in Gujarati or Hindi?", a: "Yes. You choose the language guests see first (English, Gujarati or Hindi), and each guest can switch. Dates and times are written the way an invitation says them in each language." },
  { q: "Can I send each family its own link?", a: "Yes, with the Creator studio. Add households to your list and each gets a link that opens with their name on it. You’ll see who has opened theirs and who hasn’t replied yet." },
  { q: "Can I change the details after sending it?", a: "Yes. Edit it any time and the same link shows the latest details. You can also unpublish it, or delete it with everything in it." },
] as const;

const PAGES_GU: Record<TemplateId, OccasionPage> = {
  wedding: {
    title: "લગ્નની કંકોત્રી ઑનલાઇન, ગુજરાતીમાં અને હાથે દોરેલી",
    description: "કંકોત્રીની જેમ ખૂલતું, હાથે દોરેલું લગ્નનું આમંત્રણ, ગુજરાતી, હિન્દી કે અંગ્રેજીમાં. WhatsApp પર એક લિંક મોકલો અને જવાબો મેળવો. શરૂઆત મફત.",
    madeFor: "આપનાં લગ્ન માટે ખાસ",
    heading: ["", "કંકોત્રીની", "જેમ ખૂલતું લગ્નનું આમંત્રણ"],
    intro: "મહેમાનો હાથે દોરેલા વીંટા પરની ગાંઠ છોડે અને આમંત્રણ ખૂલે: આપનાં નામ, દિવસ, સ્થળ અને દરેક પ્રસંગ. WhatsApp પર એક લિંક મોકલો, અને જવાબો સીધા આપની પાસે આવે.",
    points: [
      { title: "દરેક પ્રસંગ એક જ લિંક પર", body: "મહેંદી, પીઠી, સંગીત, લગ્ન અને રિસેપ્શન ઉમેરો, દરેકનો પોતાનો દિવસ, સમય અને સ્થળ. મહેમાનો જે પ્રસંગમાં આવશે તે પસંદ કરે, અને આપને દરેકની સંખ્યા મળે, કેટરર માટે તૈયાર.", pro: true },
      { title: "દરેક પરિવાર માટે એક લિંક", body: "પટેલ પરિવારને તેમનું પોતાનું આમંત્રણ મોકલો, તેમના નામ સાથે અને આપે પસંદ કરેલા પ્રસંગો જ, જેમ કે ઑફિસના મિત્રો માટે ફક્ત રિસેપ્શન. કોણે ખોલ્યું અને કોણે જવાબ નથી આપ્યો, તે આપ જોઈ શકશો.", pro: true },
      { title: "ગુજરાતી રીતે લખાયેલું", body: "ગુજરાતી પસંદ કરો અને આમંત્રણ કંકોત્રીની જેમ વંચાય: “8 નવેમ્બર 2026, સાંજે 6:00 વાગ્યે”. મહેમાનો એક ટૅપમાં તેને અંગ્રેજીમાં વાંચી શકે." },
    ],
  },
  engagement: {
    title: "સગાઈનું આમંત્રણ ઑનલાઇન, હાથે દોરેલું",
    description: "વીંટીના બોક્સની જેમ ખૂલતું સગાઈનું ઑનલાઇન આમંત્રણ. હાથે દોરેલું, ગુજરાતી, હિન્દી કે અંગ્રેજીમાં, જવાબો અને દરેક પરિવાર માટે લિંક સાથે.",
    madeFor: "આપની સગાઈ માટે ખાસ",
    heading: ["", "વીંટીના બોક્સમાં", "સગાઈનું આમંત્રણ"],
    intro: "મહેમાનો કડી દબાવે, વીંટીનું બોક્સ ખૂલે, અને તેમાંથી આપની સગાઈનું આમંત્રણ નીકળે. બે પરિવાર, એક લિંક, અને દરેક જવાબ એક જ યાદીમાં.",
    points: [
      { title: "બંને પરિવાર, એક મહેમાન યાદી", body: "બંને પક્ષના પરિવારો ઉમેરો, દરેકની પોતાની લિંક અને તેમના નામ સાથે. યાદીમાંથી સીધું WhatsApp પર મોકલો, અને જેમણે જવાબ નથી આપ્યો તેમને યાદ કરાવો.", pro: true },
      { title: "વિધિ અને ભોજન", body: "વીંટી વિધિ, પૂજા કે ભોજનને અલગ પ્રસંગ તરીકે ઉમેરો, અને મહેમાનો જણાવે કે કયામાં આવશે.", pro: true },
      { title: "સૌના આશીર્વાદ", body: "મહેમાનો જવાબ સાથે આશીર્વાદ લખી શકે. તેને આપના પૂરતા રાખો, અથવા આમંત્રણ પર હાથે લખેલી ચિઠ્ઠીઓ તરીકે બતાવો." },
    ],
  },
  birthday: {
    title: "જન્મદિવસનું મફત આમંત્રણ ઑનલાઇન, હાથે દોરેલું",
    description: "ભેટની ફીત ખેંચીને ખૂલતું જન્મદિવસનું મફત આમંત્રણ. હાથે દોરેલું, કાઉન્ટડાઉન, જવાબો અને શુભેચ્છાઓ સાથે, WhatsApp પર એક લિંકથી.",
    madeFor: "આપના જન્મદિવસ માટે ખાસ",
    heading: ["જન્મદિવસનું આમંત્રણ, અંદર એક", "સરપ્રાઇઝ"],
    intro: "મહેમાનો હાથે દોરેલી ભેટની ફીત ખેંચે અને અંદરથી આપનું આમંત્રણ નીકળે. પહેલો જન્મદિવસ હોય, સોળમો કે પચાસમો, મોકલવા માટે એક જ લિંક.",
    points: [
      { title: "એ દિવસ સુધીનું કાઉન્ટડાઉન", body: "આમંત્રણ દિવસો ગણે છે. મહેમાનો એક ટૅપમાં પાર્ટી Google કે Apple Calendar માં ઉમેરે, અને સ્થળ સુધીનો રસ્તો મેળવે." },
      { title: "પાના પર શુભેચ્છાઓ", body: "મિત્રો જવાબ સાથે જન્મદિવસની શુભેચ્છા લખે, આપના વાંચવા માટે. તેને આમંત્રણ પર ચોંટાડેલી ચિઠ્ઠીઓ તરીકે પણ બતાવો.", pro: true },
      { title: "એ દિવસે, અને પછી", body: "એ દિવસે આમંત્રણ સૌથી પહેલાં બતાવે કે અત્યારે શું ચાલે છે. પછી તે આપના શબ્દોમાં આભારની ચિઠ્ઠી બની જાય." },
    ],
  },
  garba: {
    title: "ગરબા અને નવરાત્રિનું આમંત્રણ ઑનલાઇન બનાવો",
    description: "ગરબા કે નવરાત્રિનું આમંત્રણ ઑનલાઇન બનાવો: મહેમાનો દીવો પ્રગટાવે અને રંગોળી ખીલે. હાથે દોરેલું, ગુજરાતી, હિન્દી કે અંગ્રેજીમાં, જવાબો સાથે. મફત.",
    madeFor: "આપની ગરબા રાત માટે ખાસ",
    heading: ["", "દીવો", "પ્રગટાવતું ગરબાનું આમંત્રણ"],
    intro: "મહેમાનો દીવો પ્રગટાવે, રંગોળી ખીલે, અને તારાઓ નીચે રાસનું આપનું આમંત્રણ દેખાય. એક રાત માટે બનાવો કે નવેનવ રાત માટે.",
    points: [
      { title: "દરેક રાત એક જ લિંક પર", body: "નવરાત્રિની દરેક રાત તેના સમય અને સ્થળ સાથે ઉમેરો. મહેમાનો જે જે રાતે આવશે તે પસંદ કરે, અને આપ જુઓ કે દરેક રાતે કેટલા લોકો આવશે.", pro: true },
      { title: "ગુજરાતીમાં, સહજ રીતે", body: "ગુજરાતીમાં લખો અને તારીખ વંચાય “5 ઑક્ટોબર 2027, રાત્રે 8:00 વાગ્યે”. મહેમાનો એક ટૅપમાં તેને અંગ્રેજીમાં વાંચી શકે." },
      { title: "સોસાયટી કે સમાજ માટે", body: "સોસાયટીના WhatsApp ગ્રુપમાં એક લિંક મોકલો, અથવા તેનો QR કોડ ગેટ પરના પોસ્ટર પર છાપો. જવાબો પરથી ખબર પડે કે કેટલા લોકો આવે છે." },
    ],
  },
  babyshower: {
    title: "સીમંત અને બેબી શાવરનું આમંત્રણ ઑનલાઇન",
    description: "હાથે દોરેલું પારણું ઝુલાવીને ખૂલતું સીમંત કે બેબી શાવરનું આમંત્રણ. ગુજરાતી, હિન્દી કે અંગ્રેજીમાં, જવાબો અને આશીર્વાદ સાથે.",
    madeFor: "આપના સીમંત માટે ખાસ",
    heading: ["", "પારણું", "ઝુલાવતું સીમંતનું આમંત્રણ"],
    intro: "મહેમાનો ઘૂઘરો વગાડે, પારણું ઝૂલે, અને ભાવિ માતા-પિતા પર પ્રેમ વરસાવવાનું આપનું આમંત્રણ દેખાય. નજીક અને દૂર રહેતા સૌ પરિવારજનો માટે એક લિંક.",
    points: [
      { title: "ભાવિ માતા-પિતા માટે આશીર્વાદ", body: "મહેમાનો જવાબ સાથે આશીર્વાદ લખે. તેને યાદગીરી તરીકે સાચવો, અથવા આમંત્રણ પર સૌ વાંચી શકે તેમ બતાવો." },
      { title: "પૂજા અને જમણ", body: "સીમંત પૂજા અને જમણને અલગ પ્રસંગ તરીકે તેમના સમય સાથે ઉમેરો, અને મહેમાનો જણાવે કે કયામાં જોડાશે.", pro: true },
      { title: "દૂર રહેતો પરિવાર", body: "જે સંબંધીઓ આવી ન શકે, તેઓ પણ આમંત્રણ ખોલી, દિવસનો કાર્યક્રમ જોઈ અને આશીર્વાદ મોકલી શકે." },
    ],
  },
  housewarming: {
    title: "વાસ્તુ પૂજન અને ગૃહપ્રવેશનું આમંત્રણ ઑનલાઇન",
    description: "હાથે દોરેલા દરવાજાની સાંકળ ખોલીને ખૂલતું વાસ્તુ પૂજન કે ગૃહપ્રવેશનું આમંત્રણ. નકશો, જવાબો અને દરેક પરિવાર માટે લિંક સાથે.",
    madeFor: "આપના વાસ્તુ પૂજન માટે ખાસ",
    heading: ["નવા ઘરનું આમંત્રણ, ખોલવા માટે એક", "દરવાજો"],
    intro: "મહેમાનો સાંકળ ખોલે, દરવાજો ખૂલે, અને નવા ઘરનું આપનું આમંત્રણ અંદર રાહ જુએ, નવું સરનામું શોધવા નકશા સાથે.",
    points: [
      { title: "નવા ઘરનો રસ્તો", body: "નવું સરનામું શોધવું અઘરું હોય છે. મહેમાનોને આપના દરવાજા સુધીના નકશાની લિંક મળે, અને એક ટૅપમાં પૂજા તેમના કેલેન્ડરમાં ઉમેરી શકે." },
      { title: "સવારે પૂજા, પછી જમણ", body: "વાસ્તુ પૂજા અને જમણને અલગ પ્રસંગ તરીકે ઉમેરો, અને મહેમાનો જણાવે કે કયામાં આવશે, જેથી ખબર પડે કે કેટલા લોકોની રસોઈ કરવી.", pro: true },
      { title: "સંબંધીઓ અને પડોશીઓ", body: "સંબંધીઓને તેમના નામવાળી પોતાની લિંક મોકલો, અને સોસાયટીના ગ્રુપમાં એક સામાન્ય લિંક મોકલો.", pro: true },
    ],
  },
  anniversary: {
    title: "લગ્નતિથિ પાર્ટીનું આમંત્રણ ઑનલાઇન, હાથે દોરેલું",
    description: "હાથે દોરેલા પત્રની મહોર તોડીને ખૂલતું લગ્નતિથિનું આમંત્રણ. 25મી કે 50મી માટે, જવાબો, શુભેચ્છાઓ અને દરેક પરિવારની લિંક સાથે.",
    madeFor: "આપની લગ્નતિથિ માટે ખાસ",
    heading: ["", "પત્રમાં", "બંધ લગ્નતિથિનું આમંત્રણ"],
    intro: "મહેમાનો લાખની મહોર તોડે, પત્ર ખૂલે, અને અંદર આપનું આમંત્રણ હોય. 25મી, 50મી, કે મમ્મી-પપ્પા માટેના સરપ્રાઇઝ માટે બનાવેલું.",
    points: [
      { title: "સરપ્રાઇઝનું આયોજન છે?", body: "દરેક પરિવારને તેમની પોતાની લિંક મોકલો અને જુઓ કે કોણે ખોલી, દંપતી જોઈ શકે એવા કોઈ ગ્રુપ ચેટ વગર.", pro: true },
      { title: "શુભેચ્છાઓ અને યાદો", body: "મહેમાનો જવાબ સાથે શુભેચ્છા કે કોઈ યાદ લખે. તેને આમંત્રણ પર બતાવો, અથવા દંપતી માટે સાચવી રાખો." },
      { title: "પછી, આભાર", body: "સાંજ પૂરી થાય પછી આમંત્રણ આપના શબ્દોમાં આભારની ચિઠ્ઠી બની જાય." },
    ],
  },
  opening: {
    title: "ઉદ્ઘાટનનું ડિજિટલ આમંત્રણ, હાથે દોરેલું",
    description: "રિબન કાપીને ખૂલતું ઉદ્ઘાટનનું ડિજિટલ આમંત્રણ. દુકાન, ક્લિનિક, ઑફિસ કે શોરૂમ માટે, જવાબો, નકશો અને QR કોડ સાથે. બનાવવું મફત.",
    madeFor: "આપના ઉદ્ઘાટન માટે ખાસ",
    heading: ["ઉદ્ઘાટનનું આમંત્રણ, કાપવા માટે એક", "રિબન"],
    intro: "મહેમાનો આપની હાથે દોરેલી દુકાનની રિબન કાપે, અને દિવસ, સમય અને સરનામા સાથે આમંત્રણ દેખાય. દુકાન, ક્લિનિક, ઑફિસ કે શોરૂમ માટે.",
    points: [
      { title: "QR કોડ છાપો", body: "QR કોડ પેમ્ફ્લેટ પર, દુકાનની બારી પર કે વિઝિટિંગ કાર્ડ પર મૂકો. તે WhatsApp લિંક જેવું જ આમંત્રણ ખોલે." },
      { title: "કોણ આવે છે તે જાણો", body: "મહેમાનો થોડા ટૅપમાં જવાબ આપે, અને આપ જુઓ કે કેટલા લોકો આવશે, એ દિવસ માટે ડાઉનલોડ કરી શકાય એવી યાદી સાથે.", pro: true },
      { title: "આપના દરવાજા સુધીનો રસ્તો", body: "નકશાની લિંક મહેમાનોને સાચી શેરી સુધી લાવે, અને તેઓ ઉદ્ઘાટન તેમના કેલેન્ડરમાં ઉમેરી શકે." },
    ],
  },
  diwali: {
    title: "દિવાળી પાર્ટીનું આમંત્રણ ઑનલાઇન, હાથે દોરેલું",
    description: "એક પછી એક દીવાની હાર પ્રગટાવતું દિવાળી પાર્ટીનું આમંત્રણ. હાથે દોરેલું, ગુજરાતી, હિન્દી કે અંગ્રેજીમાં, જવાબો સાથે.",
    madeFor: "આપના દિવાળી મિલન માટે ખાસ",
    heading: ["", "દીવા", "પ્રગટાવતું દિવાળીનું આમંત્રણ"],
    intro: "મહેમાનો ફૂલઝડી સળગાવે, દીવા એક પછી એક પ્રગટે, અને દિવાળી મિલનનું આપનું આમંત્રણ ઝળહળી ઊઠે. આખા પરિવારના ગ્રુપ માટે એક લિંક.",
    points: [
      { title: "સૌ માટે ભોજન", body: "જવાબ સાથે ભોજન વિશે પૂછો: જૈન, સ્વામિનારાયણ કે ડુંગળી-લસણ વગર. કેટરર માટે આપને સંખ્યા મળે." },
      { title: "ભાઈબીજ પણ", body: "દિવાળીની રાત, બેસતું વર્ષ અને ભાઈબીજને અલગ પ્રસંગ તરીકે ઉમેરો, અને મહેમાનો જણાવે કે કયામાં આવશે.", pro: true },
      { title: "નવા વર્ષની શુભેચ્છાઓ", body: "મહેમાનો જવાબ સાથે સાલ મુબારકની શુભેચ્છા લખે. તેને આમંત્રણ પર બતાવો, અથવા પરિવાર માટે સાચવી રાખો." },
    ],
  },
  janoi: {
    title: "જનોઈ અને ઉપનયનનું આમંત્રણ ઑનલાઇન, હાથે દોરેલું",
    description: "દોરો બાંધીને ખૂલતું જનોઈ (યજ્ઞોપવીત સંસ્કાર)નું આમંત્રણ. હાથે દોરેલું, ગુજરાતી, હિન્દી કે અંગ્રેજીમાં, જવાબો અને નકશા સાથે.",
    madeFor: "આપના જનોઈ પ્રસંગ માટે ખાસ",
    heading: ["", "પવિત્ર દોરો", "બાંધતું જનોઈનું આમંત્રણ"],
    intro: "મહેમાનો બ્રહ્મગાંઠ બાંધે, ત્રણ તાર એક થાય, અને મુહૂર્ત અને સ્થળ સાથે વિધિનું આપનું આમંત્રણ દેખાય.",
    points: [
      { title: "ગ્રહશાંતિથી જમણ સુધી", body: "ગ્રહશાંતિ, જનોઈ મુહૂર્ત અને જમણને અલગ પ્રસંગ તરીકે ઉમેરો, દરેકના પોતાના સમય સાથે.", pro: true },
      { title: "દરેક પરિવાર માટે એક લિંક", body: "સંબંધીઓને તેમના નામવાળું પોતાનું આમંત્રણ મોકલો, અને જુઓ કે કોણે ખોલ્યું.", pro: true },
      { title: "ગુજરાતી કે હિન્દીમાં", body: "આમંત્રણ જેમ વંચાવું જોઈએ તેમ વંચાય, ગુજરાતી કે હિન્દીમાં, અને મહેમાનો એક ટૅપમાં તેને અંગ્રેજીમાં વાંચી શકે." },
    ],
  },
  puja: {
    title: "સત્યનારાયણ કથા અને પૂજાનું આમંત્રણ ઑનલાઇન",
    description: "મંદિરનો ઘંટ વગાડીને ખૂલતું સત્યનારાયણ કથા કે ઘરની પૂજાનું આમંત્રણ. હાથે દોરેલું, ગુજરાતી, હિન્દી કે અંગ્રેજીમાં, જવાબો સાથે.",
    madeFor: "આપની કથા માટે ખાસ",
    heading: ["", "ઘંટ", "વગાડતું પૂજાનું આમંત્રણ"],
    intro: "મહેમાનો ઘંટ વગાડે, તે ઝૂલે અને ફૂલની પાંખડીઓ વરસે, અને કથા, આરતી અને પ્રસાદનું આપનું આમંત્રણ દેખાય.",
    points: [
      { title: "પ્રસાદ માટે કેટલા, તે જાણો", body: "મહેમાનો થોડા ટૅપમાં જવાબ આપે, અને આપ જુઓ કે કેટલા લોકો આવશે, ભોજન વિશેની તેમની જરૂરિયાતો સાથે." },
      { title: "આપના ઘર સુધીનો રસ્તો", body: "આપની Google Maps પિન મૂકો, જેથી મહેમાનો સાચા બિલ્ડિંગ અને ગેટ સુધી પહોંચે." },
      { title: "કથા, આરતી અને ભોજન", body: "કથા, આરતી અને ભોજનના અલગ સમય ઉમેરો, અને મહેમાનો જણાવે કે કયામાં જોડાશે.", pro: true },
    ],
  },
  naming: {
    title: "નામકરણ વિધિનું આમંત્રણ ઑનલાઇન, હાથે દોરેલું",
    description: "બાંધણીનું કપડું ઉઠાવતાં નામકરણની થાળી દેખાય એવું આમંત્રણ. હાથે દોરેલું, ગુજરાતી, હિન્દી કે અંગ્રેજીમાં, જવાબો સાથે.",
    madeFor: "આપના નામકરણ માટે ખાસ",
    heading: ["", "બાંધણી", "નીચે છુપાયેલું નામકરણનું આમંત્રણ"],
    intro: "મહેમાનો થાળી પરથી કપડું ઉઠાવે, ચોખામાં દોરેલી નાનકડી આકૃતિ દેખાય, અને પહેલી વાર નામ સાંભળવાનું આપનું આમંત્રણ અંદર હોય.",
    points: [
      { title: "બાળક માટે આશીર્વાદ", body: "મહેમાનો જવાબ સાથે આશીર્વાદ લખે. તેને યાદગીરી તરીકે સાચવો, અથવા આમંત્રણ પર બતાવો." },
      { title: "નજીક અને દૂરનો પરિવાર", body: "જે સંબંધીઓ આવી ન શકે, તેઓ પણ આમંત્રણ ખોલી આશીર્વાદ મોકલી શકે." },
      { title: "દરેક પરિવાર માટે એક લિંક", body: "દરેક પરિવારને તેમના નામવાળું પોતાનું આમંત્રણ મોકલો, જેથી ફોઈ પક્ષ અને મામા પક્ષ બંનેને પૂરું માન મળે.", pro: true },
    ],
  },
};

const PAGES_HI: Record<TemplateId, OccasionPage> = {
  wedding: {
    title: "शादी का ऑनलाइन निमंत्रण, हिन्दी में और हाथ से बना",
    description: "गाँठ खोलते ही खुलने वाला, हाथ से बना शादी का निमंत्रण, हिन्दी, गुजराती या अंग्रेज़ी में। WhatsApp पर एक लिंक भेजें और जवाब पाएँ। शुरुआत मुफ़्त।",
    madeFor: "आपकी शादी के लिए ख़ास",
    heading: ["", "गाँठ खोलते ही", "खुलने वाला शादी का निमंत्रण"],
    intro: "मेहमान हाथ से बने स्क्रॉल की गाँठ खोलते हैं और निमंत्रण खुल जाता है: आपके नाम, दिन, जगह और हर कार्यक्रम। WhatsApp पर एक लिंक भेजें, और जवाब सीधे आप तक आएँ।",
    points: [
      { title: "हर कार्यक्रम एक ही लिंक पर", body: "मेहंदी, हल्दी, संगीत, शादी और रिसेप्शन जोड़ें, हर एक का अपना दिन, समय और जगह। मेहमान बताएँ कि किन कार्यक्रमों में आएँगे, और आपको हर एक की गिनती मिले, कैटरर के लिए तैयार।", pro: true },
      { title: "हर परिवार के लिए एक लिंक", body: "शर्मा परिवार को उनका अपना निमंत्रण भेजें, उनके नाम के साथ और सिर्फ़ आपके चुने हुए कार्यक्रमों के साथ, जैसे दफ़्तर के दोस्तों के लिए सिर्फ़ रिसेप्शन। किसने खोला और किसने जवाब नहीं दिया, यह आप देख सकेंगे।", pro: true },
      { title: "हिन्दी में, सही ढंग से", body: "हिन्दी चुनें और निमंत्रण वैसे ही लिखा जाए जैसे शादी के कार्ड पर लिखा जाता है: “8 नवंबर 2026, शाम 6:00 बजे”। मेहमान एक टैप में इसे अंग्रेज़ी में पढ़ सकते हैं।" },
    ],
  },
  engagement: {
    title: "सगाई का ऑनलाइन निमंत्रण, हाथ से बना",
    description: "अंगूठी की डिब्बी की तरह खुलने वाला सगाई का ऑनलाइन निमंत्रण। हाथ से बना, हिन्दी, गुजराती या अंग्रेज़ी में, जवाबों और हर परिवार के लिंक के साथ।",
    madeFor: "आपकी सगाई के लिए ख़ास",
    heading: ["", "अंगूठी की डिब्बी", "में सगाई का निमंत्रण"],
    intro: "मेहमान खटका दबाते हैं, अंगूठी की डिब्बी खुलती है, और उसमें से आपकी सगाई का निमंत्रण निकलता है। दो परिवार, एक लिंक, और हर जवाब एक ही सूची में।",
    points: [
      { title: "दोनों परिवार, एक मेहमान सूची", body: "दोनों तरफ़ के परिवार जोड़ें, हर एक का अपना लिंक और उनके नाम के साथ। अपनी सूची से सीधे WhatsApp पर भेजें, और जिन्होंने जवाब नहीं दिया उन्हें याद दिलाएँ।", pro: true },
      { title: "रस्म और खाना", body: "अंगूठी की रस्म, पूजा या खाने को अलग कार्यक्रम के रूप में जोड़ें, और मेहमान बताएँ कि किसमें आएँगे।", pro: true },
      { title: "सबका आशीर्वाद", body: "मेहमान जवाब के साथ आशीर्वाद लिख सकते हैं। उन्हें अपने तक रखें, या निमंत्रण पर हाथ से लिखी चिट्ठियों की तरह दिखाएँ।" },
    ],
  },
  birthday: {
    title: "जन्मदिन का मुफ़्त ऑनलाइन निमंत्रण, हाथ से बना",
    description: "तोहफ़े का फ़ीता खींचकर खुलने वाला जन्मदिन का मुफ़्त निमंत्रण। हाथ से बना, काउंटडाउन, जवाबों और शुभकामनाओं के साथ, WhatsApp पर एक लिंक से।",
    madeFor: "आपके जन्मदिन के लिए ख़ास",
    heading: ["जन्मदिन का निमंत्रण, अंदर एक", "सरप्राइज़"],
    intro: "मेहमान हाथ से बने तोहफ़े का फ़ीता खींचते हैं और अंदर आपका निमंत्रण होता है। पहला जन्मदिन हो, सोलहवाँ या पचासवाँ, भेजने के लिए एक ही लिंक।",
    points: [
      { title: "उस दिन तक का काउंटडाउन", body: "निमंत्रण दिन गिनता है। मेहमान एक टैप में पार्टी को Google या Apple Calendar में जोड़ें, और जगह तक का रास्ता पाएँ।" },
      { title: "पेज पर शुभकामनाएँ", body: "दोस्त जवाब के साथ जन्मदिन की शुभकामना लिखें, आपके पढ़ने के लिए। उन्हें निमंत्रण पर चिपकी चिट्ठियों की तरह भी दिखाएँ।", pro: true },
      { title: "उस दिन, और उसके बाद", body: "उस दिन निमंत्रण सबसे पहले बताता है कि अभी क्या हो रहा है। बाद में वह आपके शब्दों में धन्यवाद का संदेश बन जाता है।" },
    ],
  },
  garba: {
    title: "गरबा और नवरात्रि का निमंत्रण ऑनलाइन बनाएँ",
    description: "गरबा या नवरात्रि का निमंत्रण ऑनलाइन बनाएँ: मेहमान दीया जलाएँ और रंगोली खिल उठे। हाथ से बना, हिन्दी, गुजराती या अंग्रेज़ी में, जवाबों के साथ। मुफ़्त।",
    madeFor: "आपकी गरबा रात के लिए ख़ास",
    heading: ["", "दीया", "जलाने वाला गरबा निमंत्रण"],
    intro: "मेहमान दीया जलाते हैं, रंगोली खिल उठती है, और तारों के नीचे रास का आपका निमंत्रण सामने आता है। एक रात के लिए बनाएँ या पूरी नौ रातों के लिए।",
    points: [
      { title: "हर रात एक ही लिंक पर", body: "नवरात्रि की हर रात उसके समय और जगह के साथ जोड़ें। मेहमान चुनें कि किन रातों में आएँगे, और आप देखें कि हर रात कितने लोग आएँगे।", pro: true },
      { title: "हिन्दी में, सहज ढंग से", body: "हिन्दी में लिखें और तारीख़ ऐसे पढ़ी जाए: “5 अक्तूबर 2027, रात 8:00 बजे”। मेहमान एक टैप में इसे अंग्रेज़ी में पढ़ सकते हैं।" },
      { title: "सोसाइटी या समाज के लिए", body: "सोसाइटी के WhatsApp ग्रुप में एक लिंक भेजें, या उसका QR कोड गेट पर लगे पोस्टर पर छापें। जवाबों से पता चले कि कितने लोग आ रहे हैं।" },
    ],
  },
  babyshower: {
    title: "गोद भराई और बेबी शावर का ऑनलाइन निमंत्रण",
    description: "हाथ से बना पालना झुलाकर खुलने वाला गोद भराई या बेबी शावर का निमंत्रण। हिन्दी, गुजराती या अंग्रेज़ी में, जवाबों और आशीर्वाद के साथ।",
    madeFor: "आपकी गोद भराई के लिए ख़ास",
    heading: ["", "पालना", "झुलाने वाला गोद भराई का निमंत्रण"],
    intro: "मेहमान झुनझुना बजाते हैं, पालना झूलता है, और होने वाले माता-पिता पर प्यार बरसाने का आपका निमंत्रण सामने आता है। पास और दूर के पूरे परिवार के लिए एक लिंक।",
    points: [
      { title: "होने वाले माता-पिता के लिए आशीर्वाद", body: "मेहमान जवाब के साथ आशीर्वाद लिखें। उन्हें यादगार के रूप में रखें, या निमंत्रण पर सबके पढ़ने के लिए दिखाएँ।" },
      { title: "पूजा और खाना", body: "गोद भराई की पूजा और दोपहर के खाने को उनके अपने समय के साथ अलग कार्यक्रम के रूप में जोड़ें, और मेहमान बताएँ कि किसमें शामिल होंगे।", pro: true },
      { title: "दूर रहने वाला परिवार", body: "जो रिश्तेदार आ नहीं सकते, वे भी निमंत्रण खोलकर दिन का कार्यक्रम देख सकते हैं और आशीर्वाद भेज सकते हैं।" },
    ],
  },
  housewarming: {
    title: "गृह प्रवेश और वास्तु पूजा का ऑनलाइन निमंत्रण",
    description: "हाथ से बने दरवाज़े की कुंडी खोलकर खुलने वाला गृह प्रवेश या वास्तु पूजा का निमंत्रण। नक़्शे, जवाबों और हर परिवार के लिंक के साथ।",
    madeFor: "आपके गृह प्रवेश के लिए ख़ास",
    heading: ["गृह प्रवेश का निमंत्रण, खोलने के लिए एक", "दरवाज़ा"],
    intro: "मेहमान कुंडी खोलते हैं, दरवाज़ा खुलता है, और नए घर का आपका निमंत्रण अंदर इंतज़ार करता है, नया पता ढूँढने के लिए नक़्शे के साथ।",
    points: [
      { title: "नए घर तक का रास्ता", body: "नया पता ढूँढना मुश्किल होता है। मेहमानों को आपके दरवाज़े तक के नक़्शे का लिंक मिले, और वे एक टैप में पूजा को अपने कैलेंडर में जोड़ सकें।" },
      { title: "सुबह पूजा, फिर भोजन", body: "वास्तु पूजा और भोजन को अलग कार्यक्रम के रूप में जोड़ें, और मेहमान बताएँ कि किसमें आएँगे, ताकि पता रहे कि कितने लोगों का खाना बनाना है।", pro: true },
      { title: "रिश्तेदार और पड़ोसी", body: "रिश्तेदारों को उनके नाम वाला अपना लिंक भेजें, और सोसाइटी के ग्रुप में एक आम लिंक भेजें।", pro: true },
    ],
  },
  anniversary: {
    title: "शादी की सालगिरह का ऑनलाइन निमंत्रण, हाथ से बना",
    description: "हाथ से बनी चिट्ठी की मोहर तोड़कर खुलने वाला सालगिरह का निमंत्रण। 25वीं या 50वीं के लिए, जवाबों, शुभकामनाओं और हर परिवार के लिंक के साथ।",
    madeFor: "आपकी सालगिरह के लिए ख़ास",
    heading: ["", "चिट्ठी", "में बंद सालगिरह का निमंत्रण"],
    intro: "मेहमान लाख की मोहर तोड़ते हैं, चिट्ठी खुलती है, और अंदर आपका निमंत्रण होता है। 25वीं, 50वीं, या मम्मी-पापा को सरप्राइज़ देने के लिए बना।",
    points: [
      { title: "सरप्राइज़ की तैयारी है?", body: "हर परिवार को उनका अपना लिंक भेजें और देखें कि किसने खोला, बिना किसी ऐसे ग्रुप चैट के जो दंपति देख सकें।", pro: true },
      { title: "शुभकामनाएँ और यादें", body: "मेहमान जवाब के साथ शुभकामना या कोई याद लिखें। उन्हें निमंत्रण पर दिखाएँ, या दंपति के लिए सहेज कर रखें।" },
      { title: "बाद में, धन्यवाद", body: "शाम ख़त्म होने के बाद निमंत्रण आपके शब्दों में धन्यवाद का संदेश बन जाता है।" },
    ],
  },
  opening: {
    title: "उद्घाटन का डिजिटल निमंत्रण, हाथ से बना",
    description: "रिबन काटकर खुलने वाला उद्घाटन का डिजिटल निमंत्रण। दुकान, क्लिनिक, दफ़्तर या शोरूम के लिए, जवाबों, नक़्शे और QR कोड के साथ। बनाना मुफ़्त।",
    madeFor: "आपके उद्घाटन के लिए ख़ास",
    heading: ["उद्घाटन का निमंत्रण, काटने के लिए एक", "रिबन"],
    intro: "मेहमान आपकी हाथ से बनी दुकान का रिबन काटते हैं, और दिन, समय और पते के साथ निमंत्रण सामने आता है। दुकान, क्लिनिक, दफ़्तर या शोरूम के लिए।",
    points: [
      { title: "QR कोड छापें", body: "QR कोड पर्चों पर, दुकान की खिड़की पर या अपने विज़िटिंग कार्ड पर लगाएँ। यह वही निमंत्रण खोलता है जो WhatsApp लिंक खोलता है।" },
      { title: "जानें कौन आ रहा है", body: "मेहमान कुछ टैप में जवाब दें, और आप देखें कि कितने लोग आएँगे, उस दिन के लिए डाउनलोड की जा सकने वाली सूची के साथ।", pro: true },
      { title: "आपके दरवाज़े तक का रास्ता", body: "नक़्शे का लिंक मेहमानों को सही गली तक लाए, और वे उद्घाटन को अपने कैलेंडर में जोड़ सकें।" },
    ],
  },
  diwali: {
    title: "दिवाली पार्टी का ऑनलाइन निमंत्रण, हाथ से बना",
    description: "एक-एक करके दीयों की क़तार जलाने वाला दिवाली पार्टी का निमंत्रण। हाथ से बना, हिन्दी, गुजराती या अंग्रेज़ी में, जवाबों के साथ।",
    madeFor: "आपके दिवाली मिलन के लिए ख़ास",
    heading: ["", "दीये", "जलाने वाला दिवाली निमंत्रण"],
    intro: "मेहमान फुलझड़ी जलाते हैं, दीये एक के बाद एक जल उठते हैं, और दिवाली मिलन का आपका निमंत्रण जगमगा उठता है। पूरे परिवार के ग्रुप के लिए एक लिंक।",
    points: [
      { title: "सबके लिए खाना", body: "जवाब के साथ खाने के बारे में पूछें: जैन, स्वामीनारायण या बिना प्याज़-लहसुन। कैटरर के लिए आपको गिनती मिले।" },
      { title: "भाई दूज भी", body: "दिवाली की रात, नया साल और भाई दूज को अलग कार्यक्रम के रूप में जोड़ें, और मेहमान बताएँ कि किसमें आएँगे।", pro: true },
      { title: "नए साल की शुभकामनाएँ", body: "मेहमान जवाब के साथ नए साल की शुभकामना लिखें। उन्हें निमंत्रण पर दिखाएँ, या परिवार के लिए सहेज कर रखें।" },
    ],
  },
  janoi: {
    title: "जनेऊ और उपनयन संस्कार का ऑनलाइन निमंत्रण",
    description: "धागा बाँधकर खुलने वाला जनेऊ (यज्ञोपवीत संस्कार) का निमंत्रण। हाथ से बना, हिन्दी, गुजराती या अंग्रेज़ी में, जवाबों और नक़्शे के साथ।",
    madeFor: "आपके जनेऊ संस्कार के लिए ख़ास",
    heading: ["", "पवित्र धागा", "बाँधने वाला जनेऊ का निमंत्रण"],
    intro: "मेहमान ब्रह्मगाँठ बाँधते हैं, तीनों धागे एक हो जाते हैं, और मुहूर्त और जगह के साथ संस्कार का आपका निमंत्रण सामने आता है।",
    points: [
      { title: "ग्रह शांति से भोजन तक", body: "ग्रह शांति, जनेऊ मुहूर्त और भोजन को अलग कार्यक्रम के रूप में जोड़ें, हर एक के अपने समय के साथ।", pro: true },
      { title: "हर परिवार के लिए एक लिंक", body: "रिश्तेदारों को उनके नाम वाला अपना निमंत्रण भेजें, और देखें कि किसने खोला।", pro: true },
      { title: "हिन्दी या गुजराती में", body: "निमंत्रण वैसे ही पढ़ा जाए जैसे पढ़ा जाना चाहिए, हिन्दी या गुजराती में, और मेहमान एक टैप में इसे अंग्रेज़ी में पढ़ सकते हैं।" },
    ],
  },
  puja: {
    title: "सत्यनारायण कथा और पूजा का ऑनलाइन निमंत्रण",
    description: "मंदिर की घंटी बजाकर खुलने वाला सत्यनारायण कथा या घर की पूजा का निमंत्रण। हाथ से बना, हिन्दी, गुजराती या अंग्रेज़ी में, जवाबों के साथ।",
    madeFor: "आपकी कथा के लिए ख़ास",
    heading: ["", "घंटी", "बजाने वाला पूजा का निमंत्रण"],
    intro: "मेहमान घंटी बजाते हैं, वह झूलती है और फूलों की पंखुड़ियाँ बरसती हैं, और कथा, आरती और प्रसाद का आपका निमंत्रण सामने आता है।",
    points: [
      { title: "प्रसाद के लिए कितने, यह जानें", body: "मेहमान कुछ टैप में जवाब दें, और आप देखें कि कितने लोग आएँगे, खाने से जुड़ी उनकी ज़रूरतों के साथ।" },
      { title: "आपके घर तक का रास्ता", body: "अपना Google Maps पिन डालें, ताकि मेहमान सही बिल्डिंग और गेट तक पहुँचें।" },
      { title: "कथा, आरती और भोजन", body: "कथा, आरती और भोजन के अलग समय जोड़ें, और मेहमान बताएँ कि किसमें शामिल होंगे।", pro: true },
    ],
  },
  naming: {
    title: "नामकरण संस्कार का ऑनलाइन निमंत्रण, हाथ से बना",
    description: "बाँधनी का कपड़ा उठाते ही नामकरण की थाली दिखाने वाला निमंत्रण। हाथ से बना, हिन्दी, गुजराती या अंग्रेज़ी में, जवाबों के साथ।",
    madeFor: "आपके नामकरण के लिए ख़ास",
    heading: ["", "बाँधनी", "के नीचे छुपा नामकरण का निमंत्रण"],
    intro: "मेहमान थाली से कपड़ा उठाते हैं, चावल और उसमें बना छोटा सा निशान दिखता है, और पहली बार नाम सुनने का आपका निमंत्रण अंदर होता है।",
    points: [
      { title: "शिशु के लिए आशीर्वाद", body: "मेहमान जवाब के साथ आशीर्वाद लिखें। उन्हें यादगार के रूप में रखें, या निमंत्रण पर दिखाएँ।" },
      { title: "पास और दूर का परिवार", body: "जो रिश्तेदार आ नहीं सकते, वे भी निमंत्रण खोलकर आशीर्वाद भेज सकते हैं।" },
      { title: "हर परिवार के लिए एक लिंक", body: "हर परिवार को उनके नाम वाला अपना निमंत्रण भेजें, ताकि बुआ की तरफ़ और मामा की तरफ़, दोनों को पूरा मान मिले।", pro: true },
    ],
  },
};

/** Everything an occasion's page says in one language. */
export type OccasionCopy = {
  /** What each occasion is called on its label (and in the breadcrumbs). */
  names: Record<TemplateId, string>;
  pages: Record<TemplateId, OccasionPage>;
  /** What every invitation gives guests, whatever the occasion. */
  guestGets: readonly string[];
  steps: readonly { title: string; body: string }[];
  faq: readonly { q: string; a: string }[];
  ui: { occasions: string; allOccasions: string; studio: string; make: string; makeFree: string; sample: string; tryIt: string; guestsGet: string; threeSteps: string; start: string; wording: string; questions: string; others: string };
};

export const OCCASION_COPY: Record<Lang, OccasionCopy> = {
  en: {
    names: Object.fromEntries(invitationTemplates.map((template) => [template.id, template.category])) as Record<TemplateId, string>,
    pages: PAGES_EN,
    guestGets: GUEST_GETS_EN,
    steps: STEPS_EN,
    faq: FAQ_EN,
    ui: { occasions: "Occasions", allOccasions: "All occasions", studio: "Creator studio", make: "Make yours", makeFree: "Make yours, free", sample: "Open the full sample", tryIt: "try it:", guestsGet: "What your guests get", threeSteps: "Ready in three steps", start: "Start with this drawing", wording: "Wording ideas, in three languages", questions: "Questions", others: "Other occasions" },
  },
  gu: {
    names: { wedding: "લગ્ન", engagement: "સગાઈ", birthday: "જન્મદિવસ", garba: "ગરબા અને નવરાત્રિ", babyshower: "સીમંત", housewarming: "વાસ્તુ પૂજન", anniversary: "લગ્નતિથિ", opening: "ઉદ્ઘાટન", diwali: "દિવાળી મિલન", janoi: "જનોઈ", puja: "સત્યનારાયણ કથા", naming: "નામકરણ" },
    pages: PAGES_GU,
    guestGets: [
      "WhatsApp લિંકથી ખૂલે, કોઈ ઍપ કે સાઇન-અપ વગર",
      "કાઉન્ટડાઉન, અને Google કે Apple Calendar માં એ દિવસ",
      "નકશા પર સ્થળ સુધીનો રસ્તો",
      "થોડા ટૅપમાં જવાબ: આવીશું, કદાચ કે નહીં આવી શકીએ",
      "અંગ્રેજી, ગુજરાતી કે હિન્દી, અને તેમની વચ્ચે બદલવાની સુવિધા",
      "દિવસ પૂરો થાય પછી આપના તરફથી આભાર",
    ],
    steps: [
      { title: "આ ચિત્ર પસંદ કરો", body: "નમૂનાથી શરૂ કરો. કંઈ ઇન્સ્ટોલ કરવાનું નથી, કંઈ ડિઝાઇન કરવાનું નથી." },
      { title: "આપની વિગતો ઉમેરો", body: "નામ, તારીખ, સ્થળ અને સંદેશ. આપ લખો તેમ પ્રિવ્યૂ બદલાય." },
      { title: "એક લિંક મોકલો", body: "પ્રકાશિત કરો, પછી WhatsApp પર મોકલો, ક્યાંય પણ કૉપિ કરો, અથવા તેનો QR કોડ છાપો." },
    ],
    faq: [
      { q: "શું તે મફત છે?", a: "શરૂઆત માટે, હા: મફત પ્લાનમાં ચાર પ્રસંગો (લગ્ન, જન્મદિવસ, ગરબા, ઉદ્ઘાટન), એક કાર્યક્રમ અને 50 જવાબો સુધી છે. ઘણા કાર્યક્રમો, દરેક પરિવાર માટે લિંક, આપના પોતાના રંગ અને બીજા પ્રસંગો ક્રિએટર સ્ટુડિયોમાં છે." },
      { q: "શું મહેમાનોને ઍપ કે એકાઉન્ટની જરૂર પડે?", a: "ના. તેઓ લિંક પર ટૅપ કરે અને તે તેમના ફોનના બ્રાઉઝરમાં ખૂલે. જવાબ આપવામાં થોડા ટૅપ લાગે, કોઈ સાઇન-અપ વગર." },
      { q: "શું મહેમાનો ગુજરાતી કે હિન્દીમાં વાંચી શકે?", a: "હા. મહેમાનો પહેલાં કઈ ભાષા જુએ તે આપ પસંદ કરો (અંગ્રેજી, ગુજરાતી કે હિન્દી), અને દરેક મહેમાન ભાષા બદલી શકે. તારીખ અને સમય દરેક ભાષામાં આમંત્રણમાં લખાય તેમ જ લખાય છે." },
      { q: "શું હું દરેક પરિવારને તેની પોતાની લિંક મોકલી શકું?", a: "હા, ક્રિએટર સ્ટુડિયો સાથે. આપની યાદીમાં પરિવારો ઉમેરો અને દરેકને એવી લિંક મળે જે તેમના નામ સાથે ખૂલે. કોણે ખોલી અને કોણે હજી જવાબ નથી આપ્યો, તે આપ જોઈ શકશો." },
      { q: "મોકલ્યા પછી શું હું વિગતો બદલી શકું?", a: "હા. ગમે ત્યારે ફેરફાર કરો, અને એ જ લિંક નવી વિગતો બતાવે. આપ તેને અપ્રકાશિત પણ કરી શકો, અથવા તેની બધી માહિતી સાથે કાઢી નાખી શકો." },
    ],
    ui: { occasions: "પ્રસંગો", allOccasions: "બધા પ્રસંગો", studio: "ક્રિએટર સ્ટુડિયો", make: "આપનું આમંત્રણ બનાવો", makeFree: "આપનું આમંત્રણ બનાવો, મફત", sample: "નમૂનાનું આખું આમંત્રણ ખોલો", tryIt: "અજમાવી જુઓ:", guestsGet: "આપના મહેમાનોને શું મળશે", threeSteps: "ત્રણ પગલાંમાં તૈયાર", start: "આ ચિત્રથી શરૂ કરો", wording: "આમંત્રણના શબ્દો, ત્રણ ભાષામાં", questions: "પ્રશ્નો", others: "બીજા પ્રસંગો" },
  },
  hi: {
    names: { wedding: "शादी", engagement: "सगाई", birthday: "जन्मदिन", garba: "गरबा और नवरात्रि", babyshower: "गोद भराई", housewarming: "गृह प्रवेश", anniversary: "सालगिरह", opening: "उद्घाटन", diwali: "दिवाली मिलन", janoi: "जनेऊ", puja: "सत्यनारायण कथा", naming: "नामकरण" },
    pages: PAGES_HI,
    guestGets: [
      "WhatsApp लिंक से खुलता है, बिना किसी ऐप या साइन-अप के",
      "काउंटडाउन, और Google या Apple Calendar में वह दिन",
      "नक़्शे पर जगह तक का रास्ता",
      "कुछ टैप में जवाब: आएँगे, शायद या नहीं आ पाएँगे",
      "अंग्रेज़ी, गुजराती या हिन्दी, और इनके बीच बदलने की सुविधा",
      "दिन ख़त्म होने के बाद आपकी ओर से धन्यवाद",
    ],
    steps: [
      { title: "यह चित्र चुनें", body: "नमूने से शुरू करें। न कुछ इंस्टॉल करना, न कुछ डिज़ाइन करना।" },
      { title: "अपनी जानकारी जोड़ें", body: "नाम, तारीख़, जगह और संदेश। आप जैसे-जैसे लिखें, प्रीव्यू बदलता जाए।" },
      { title: "एक लिंक भेजें", body: "प्रकाशित करें, फिर WhatsApp पर भेजें, कहीं भी कॉपी करें, या उसका QR कोड छापें।" },
    ],
    faq: [
      { q: "क्या यह मुफ़्त है?", a: "शुरुआत के लिए, हाँ: मुफ़्त प्लान में चार अवसर (शादी, जन्मदिन, गरबा, उद्घाटन), एक कार्यक्रम और 50 जवाबों तक शामिल हैं। कई कार्यक्रम, हर परिवार के लिए लिंक, अपने रंग और बाक़ी अवसर क्रिएटर स्टूडियो में हैं।" },
      { q: "क्या मेहमानों को ऐप या अकाउंट चाहिए?", a: "नहीं। वे लिंक पर टैप करते हैं और यह उनके फ़ोन के ब्राउज़र में खुल जाता है। जवाब देने में कुछ टैप लगते हैं, बिना साइन-अप के।" },
      { q: "क्या मेहमान इसे हिन्दी या गुजराती में पढ़ सकते हैं?", a: "हाँ। मेहमान सबसे पहले कौन सी भाषा देखें, यह आप चुनते हैं (अंग्रेज़ी, गुजराती या हिन्दी), और हर मेहमान भाषा बदल सकता है। तारीख़ और समय हर भाषा में वैसे ही लिखे जाते हैं जैसे निमंत्रण में लिखे जाते हैं।" },
      { q: "क्या हर परिवार को उसका अपना लिंक भेजा जा सकता है?", a: "हाँ, क्रिएटर स्टूडियो के साथ। अपनी सूची में परिवार जोड़ें और हर एक को ऐसा लिंक मिले जो उनके नाम के साथ खुले। किसने खोला और किसने अभी तक जवाब नहीं दिया, यह आप देख सकेंगे।" },
      { q: "क्या भेजने के बाद जानकारी बदली जा सकती है?", a: "हाँ। कभी भी बदलाव करें, और वही लिंक नई जानकारी दिखाएगा। आप इसे अप्रकाशित भी कर सकते हैं, या इसकी सारी जानकारी के साथ इसे मिटा सकते हैं।" },
    ],
    ui: { occasions: "अवसर", allOccasions: "सभी अवसर", studio: "क्रिएटर स्टूडियो", make: "अपना निमंत्रण बनाएँ", makeFree: "अपना निमंत्रण बनाएँ, मुफ़्त", sample: "पूरा नमूना खोलें", tryIt: "आज़माइए:", guestsGet: "आपके मेहमानों को क्या मिलेगा", threeSteps: "तीन क़दमों में तैयार", start: "इस चित्र से शुरू करें", wording: "निमंत्रण के शब्द, तीन भाषाओं में", questions: "सवाल", others: "दूसरे अवसर" },
  },
};
