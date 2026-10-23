import type { Attendance, Lang, TemplateId } from "./invitations";

/*
 * Everything a guest reads, in English and Gujarati. The host's own words (names, message, venues, celebration
 * names) are shown as written. Host-only screens stay in English.
 *
 * Gujarati uses the respectful આપ throughout, as a printed kankotri would.
 */

/** Where a guest's own choice of language is remembered on their device. */
export const LANG_KEY = "wowlink:lang";

/** Each occasion's opening words, button and hint ("untie the knot") in Gujarati. English comes from the templates. */
export const OCCASION_GU: Record<TemplateId, { eyebrow: string; action: string; hint: string }> = {
  wedding: { eyebrow: "બંને પરિવારો તરફથી સ્નેહભર્યું આમંત્રણ", action: "આમંત્રણ ખોલો", hint: "ગાંઠ છોડો" },
  birthday: { eyebrow: "વધુ એક વર્ષ, થોડો વધુ જાદુ", action: "સરપ્રાઇઝ ખોલો", hint: "ફીત ખેંચો" },
  garba: { eyebrow: "નવ રાત, અઢળક યાદો", action: "રાતની શરૂઆત કરો", hint: "દીવો પ્રગટાવો" },
  opening: { eyebrow: "એક સુંદર શરૂઆત", action: "રિબન કાપો", hint: "રિબન કાપો" },
  engagement: { eyebrow: "પરિવારના આશીર્વાદ સાથે", action: "વીંટીનું બોક્સ ખોલો", hint: "કડી દબાવો" },
  babyshower: { eyebrow: "નાનકડા મહેમાનના આગમનની ખુશી", action: "ઘૂઘરો વગાડો", hint: "ઘૂઘરો વગાડો" },
  housewarming: { eyebrow: "નવું ઘર, નવી શરૂઆત", action: "દરવાજો ખોલો", hint: "સાંકળ ખોલો" },
  anniversary: { eyebrow: "પ્રેમનાં વર્ષો, હજી ઘણાં બાકી", action: "પત્ર ખોલો", hint: "મહોર તોડો" },
};

/** Plain words, then the word that gets the hand-drawn underline. */
type Pair = readonly [string, string];

const listEn = (names: string[]) => (names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`);
const listGu = (names: string[]) => (names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} અને ${names.at(-1)}`);

const en = {
  lang: "en" as Lang,
  list: listEn,
  people: (n: number) => `${n} ${n === 1 ? "person" : "people"}`,
  makeYourOwn: "Make your own",
  // the opening and the card
  addressedTo: (name: string) => `For ${name}`,
  momentComplete: "You make the moment complete",
  celebrationsSpan: (n: number, from: string, to: string) => `${n} celebrations · ${from} to ${to}`,
  seeDetails: "See the details",
  watchAgain: "Watch it again",
  detailsToFollow: "Details to follow",
  occasionFallback: "Your occasion",
  venueFallback: "Your venue",
  // details and schedule
  saveThe: ["Save the", "date"] as Pair,
  pendingHeading: ["Details to", "follow"] as Pair,
  pendingBody: "The hosts are updating the details of your invitation. Please check back soon.",
  replay: "Replay the invitation",
  when: "When",
  where: "Where",
  addToCalendar: "Add to calendar",
  openInMaps: "Open in Maps",
  somewhere: "A place to remember",
  celebrationsHeading: (personal: boolean): Pair => [personal ? "Your" : "The", "celebrations"],
  addAll: "Add every event to your calendar",
  allDay: "All day",
  map: "Map",
  addGoogle: (name: string) => `Add the ${name} to Google Calendar`,
  addApple: (name: string) => `Add the ${name} to Apple or Outlook calendar`,
  mapFor: (name: string) => `Map for the ${name}`,
  defaultMessage: "We would love to share this moment with you.",
  withLove: (title: string) => `With love, ${title}`,
  // replying
  rsvpHeading: "Will you be there?",
  rsvpIntro: (many: boolean): string => (many ? "A quick reply means a lot. Let us know which celebrations you can be part of." : "A quick reply means a lot. Let us know if you can be part of the day."),
  attendance: { Attending: "Attending", Maybe: "Maybe", "Not attending": "Not attending" } as Record<Attendance, string>,
  joining: "Will you be joining us?",
  which: (maybe: boolean): string => (maybe ? "Which might you make it to?" : "Which will you come to?"),
  perCelebration: (maybe: boolean): string => (maybe ? "How many of you might come to each?" : "How many of you, for each?"),
  countLabel: (attendance: Attendance, personal: boolean, many: boolean): string => (attendance === "Maybe" ? "How many of you might come?" : personal ? "How many of you are coming, in all?" : many ? "How many of you are coming?" : "How many guests?"),
  everyoneFrom: (name: string) => `Everyone from ${name}, including you.`,
  splitToggle: (split: boolean): string => (split ? "Same number for every celebration" : "Not everyone coming to everything?"),
  yourName: "Your name",
  optional: "Optional",
  namePlaceholder: (personal: boolean): string => (personal ? "Who’s replying?" : "As we know and love you"),
  tickOne: "Tick at least one celebration, or choose Not attending.",
  offline: "Your reply didn’t go through. Check your connection and try again.",
  sending: "Sending…",
  send: "Send my reply",
  update: "Update the reply",
  previewSubmit: "Preview my reply",
  previewNote: "Preview · Responses won’t be sent.",
  // after replying
  labelPreview: "Reply preview",
  labelSent: "Reply sent",
  labelUpdated: "Reply updated",
  labelYours: "Your reply",
  labelFrom: (name: string) => `Reply from ${name}`,
  replyTitle: { Attending: "Joyfully, yes.", Maybe: "A little maybe.", "Not attending": "With you in spirit." } as Record<Attendance, string>,
  /** `names` already carry their counts when those differ ("Mehndi (2)"); `size` is the shared count, if any. */
  describe: (attendance: Attendance, names: string[], size: string) => {
    if (attendance === "Not attending") return "Can’t make it this time.";
    const which = names.length ? listEn(names) : "";
    if (attendance === "Maybe") return which ? `A maybe for the ${which}${size}.` : `A maybe${size}.`;
    return which ? `Coming to the ${which}${size}.` : `Coming${size}.`;
  },
  sentBy: (name: string, on: string) => `${name ? `Sent by ${name}` : "Sent"}${on ? ` on ${on}` : ""}. It’s one reply for everyone on this invitation.`,
  fresh: (names: string[]) => `New since then: the ${listEn(names)}. Let them know if you can come.`,
  thanks: (title: string) => `Your reply is on its way to ${title}. Thank you!`,
  canChange: "Plans change, so you can update it any time.",
  notSent: "This is a preview. Your response hasn’t been sent.",
  again: { preview: "Try another response", personal: "Change the reply", general: "Reply for someone else" },
  // wishes
  wishLabel: "A wish or a blessing",
  wishHint: (shown: boolean): string => (shown ? "The hosts may show it on this page, with your name." : "Only the hosts will see it."),
  wishPlaceholder: "Wishing you a lifetime of happiness…",
  wishesHeading: ["Blessings &", "wishes"] as Pair,
  aGuest: "A guest",
  // footer
  madeWith: "Made with WowLink",
  createYours: "Create yours free",
  // the countdown ("what" is a celebration's name once the main day has passed)
  countdown: {
    days: (what: string): string => (what ? `days to the ${what}` : "days to go"),
    tomorrow: (what: string): string => (what ? `Tomorrow: the ${what}!` : "Tomorrow!"),
    inHours: (what: string, hours: number) => `${what ? `Today: the ${what}` : "Today"}, in ${hours} hours`,
    withinHour: (what: string) => `${what ? `Today: the ${what}` : "Today"}, within the hour!`,
    now: (what: string): string => (what ? `Happening now: the ${what}!` : "Happening now!"),
    today: (what: string): string => (what ? `Today: the ${what}!` : "It’s today!"),
    passed: "This day has passed. Thank you for being part of it.",
  },
  // the language switch: its name includes the visible label (the language it switches to)
  switchTo: "Read this in Gujarati (ગુજરાતી)",
};

export type GuestText = typeof en;

const gu: GuestText = {
  lang: "gu",
  list: listGu,
  people: (n: number) => (n === 1 ? "1 વ્યક્તિ" : `${n} લોકો`),
  makeYourOwn: "આપનું પણ બનાવો",
  addressedTo: (name: string) => `${name} માટે`,
  momentComplete: "આપના આવવાથી જ પ્રસંગ પૂર્ણ થશે",
  celebrationsSpan: (n: number, from: string, to: string) => `${n} પ્રસંગો · ${from} થી ${to}`,
  seeDetails: "વિગતો જુઓ",
  watchAgain: "ફરી જુઓ",
  detailsToFollow: "વિગતો ટૂંક સમયમાં",
  occasionFallback: "આપનો પ્રસંગ",
  venueFallback: "આપનું સ્થળ",
  saveThe: ["તારીખ", "યાદ રાખજો"],
  pendingHeading: ["વિગતો", "ટૂંક સમયમાં"],
  pendingBody: "યજમાન આપના આમંત્રણની વિગતો અપડેટ કરી રહ્યા છે. થોડી વાર પછી ફરી જોશો.",
  replay: "આમંત્રણ ફરી જુઓ",
  when: "ક્યારે",
  where: "ક્યાં",
  addToCalendar: "કેલેન્ડરમાં ઉમેરો",
  openInMaps: "નકશામાં જુઓ",
  somewhere: "એક યાદગાર સ્થળ",
  celebrationsHeading: (personal: boolean): Pair => [personal ? "આપના" : "બધા", "પ્રસંગો"],
  addAll: "બધા પ્રસંગો કેલેન્ડરમાં ઉમેરો",
  allDay: "આખો દિવસ",
  map: "નકશો",
  addGoogle: (name: string) => `${name} Google Calendar માં ઉમેરો`,
  addApple: (name: string) => `${name} Apple કે Outlook કેલેન્ડરમાં ઉમેરો`,
  mapFor: (name: string) => `${name} નો નકશો`,
  defaultMessage: "આ ખાસ પળ આપની સાથે ઉજવવાની અમને ખૂબ ખુશી થશે.",
  withLove: (title: string) => `સ્નેહ સહ, ${title}`,
  rsvpHeading: "શું આપ પધારશો?",
  rsvpIntro: (many: boolean) => (many ? "આપનો જવાબ અમારા માટે ખૂબ મહત્વનો છે. કયા પ્રસંગોમાં આપ જોડાઈ શકશો તે જણાવશો." : "આપનો જવાબ અમારા માટે ખૂબ મહત્વનો છે. આપ પધારી શકશો કે નહીં તે જણાવશો."),
  attendance: { Attending: "આવીશું", Maybe: "કદાચ", "Not attending": "નહીં આવી શકીએ" },
  joining: "આપ પધારશો?",
  which: (maybe: boolean) => (maybe ? "કયા પ્રસંગોમાં કદાચ આવી શકશો?" : "કયા પ્રસંગોમાં પધારશો?"),
  perCelebration: (maybe: boolean) => (maybe ? "દરેક પ્રસંગમાં કદાચ કેટલા લોકો?" : "દરેક પ્રસંગમાં કેટલા લોકો?"),
  countLabel: (attendance: Attendance, personal: boolean, many: boolean) => (attendance === "Maybe" ? "કદાચ કેટલા લોકો આવશો?" : personal ? "કુલ કેટલા લોકો આવશો?" : many ? "કેટલા લોકો આવશો?" : "કેટલા મહેમાન?"),
  everyoneFrom: (name: string) => `${name} માંથી આપ સહિત બધા.`,
  splitToggle: (split: boolean) => (split ? "દરેક પ્રસંગ માટે સરખી સંખ્યા" : "દરેક પ્રસંગમાં બધા નથી આવતા?"),
  yourName: "આપનું નામ",
  optional: "વૈકલ્પિક",
  namePlaceholder: (personal: boolean) => (personal ? "કોણ જવાબ આપે છે?" : "જે નામથી અમે આપને ઓળખીએ"),
  tickOne: "ઓછામાં ઓછો એક પ્રસંગ પસંદ કરો, અથવા “નહીં આવી શકીએ” પસંદ કરો.",
  offline: "જવાબ પહોંચ્યો નહીં. ઇન્ટરનેટ તપાસીને ફરી પ્રયાસ કરો.",
  sending: "મોકલી રહ્યા છીએ…",
  send: "જવાબ મોકલો",
  update: "બદલેલો જવાબ મોકલો",
  previewSubmit: "જવાબ અજમાવી જુઓ",
  previewNote: "પૂર્વદર્શન · જવાબ મોકલાશે નહીં.",
  labelPreview: "જવાબનું પૂર્વદર્શન",
  labelSent: "જવાબ મોકલાયો",
  labelUpdated: "જવાબ બદલાયો",
  labelYours: "આપનો જવાબ",
  labelFrom: (name: string) => `${name} તરફથી જવાબ`,
  replyTitle: { Attending: "ખુશીથી, હા!", Maybe: "કદાચ આવીશું.", "Not attending": "મનથી આપની સાથે." },
  describe: (attendance: Attendance, names: string[], size: string) => {
    if (attendance === "Not attending") return "આ વખતે નહીં આવી શકીએ.";
    const which = names.length ? listGu(names) : "";
    if (attendance === "Maybe") return which ? `${which} માટે કદાચ${size}.` : `કદાચ${size}.`;
    return which ? `${which} માં આવીશું${size}.` : `આવીશું${size}.`;
  },
  sentBy: (name: string, on: string) => `${name ? `${name} એ ` : ""}${on ? `${on} ના રોજ ` : ""}મોકલ્યો. આ આમંત્રણ પરના સૌ માટે આ એક જ જવાબ છે.`,
  fresh: (names: string[]) => `નવો પ્રસંગ: ${listGu(names)}. આપ આવી શકશો કે નહીં તે જણાવશો.`,
  thanks: (title: string) => `આપનો જવાબ ${title} સુધી પહોંચાડી રહ્યા છીએ. આભાર!`,
  canChange: "યોજના બદલાય તો આપ ગમે ત્યારે જવાબ બદલી શકો છો.",
  notSent: "આ પૂર્વદર્શન છે. આપનો જવાબ મોકલાયો નથી.",
  again: { preview: "બીજો જવાબ અજમાવો", personal: "જવાબ બદલો", general: "બીજા કોઈ માટે જવાબ આપો" },
  wishLabel: "આપની શુભેચ્છા કે આશીર્વાદ",
  wishHint: (shown: boolean) => (shown ? "યજમાન તે આ પાના પર આપના નામ સાથે બતાવી શકે છે." : "ફક્ત યજમાન જ તે જોઈ શકશે."),
  wishPlaceholder: "જીવનભર સુખી રહો…",
  wishesHeading: ["આશીર્વાદ અને", "શુભેચ્છાઓ"],
  aGuest: "એક મહેમાન",
  madeWith: "WowLink થી બનાવેલું",
  createYours: "આપનું મફત બનાવો",
  countdown: {
    days: (what: string) => (what ? `દિવસ બાકી · ${what}` : "દિવસ બાકી"),
    tomorrow: (what: string) => (what ? `આવતીકાલે: ${what}!` : "આવતીકાલે!"),
    inHours: (what: string, hours: number) => `${what ? `આજે: ${what}` : "આજે"}, ${hours} કલાકમાં`,
    withinHour: (what: string) => `${what ? `આજે: ${what}` : "આજે"}, એક કલાકમાં!`,
    now: (what: string) => (what ? `હમણાં ચાલુ છે: ${what}!` : "હમણાં ચાલુ છે!"),
    today: (what: string) => (what ? `આજે: ${what}!` : "આજે જ છે!"),
    passed: "આ દિવસ વીતી ગયો. સાથે રહેવા બદલ આભાર.",
  },
  switchTo: "આ અંગ્રેજીમાં વાંચો (English)",
};

export const GUEST_TEXT: Record<Lang, GuestText> = { en, gu };

/** What the host sends (WhatsApp, the share sheet): written for the guest, so in the invitation's language. */
export const MESSAGES: Record<Lang, {
  invited: (title: string) => string;
  personal: (name: string, title: string, url: string) => string;
  /** `celebrations`: the ones they haven't answered for, or null if they haven't replied at all. */
  reminder: (name: string, title: string, celebrations: string[] | null, url: string) => string;
}> = {
  en: {
    invited: (title) => `You’re invited: ${title}`,
    personal: (name, title, url) => `For ${name}\nYou’re invited: ${title}\n${url}`,
    reminder: (name, title, celebrations, url) => `Hello ${name}! A gentle reminder from ${title}: we’d love to know if you can ${celebrations ? `come to the ${listEn(celebrations)}` : "make it"}. You can reply here:\n${url}`,
  },
  gu: {
    invited: (title) => `આપને આમંત્રણ છે: ${title}`,
    personal: (name, title, url) => `${name} માટે\nઆપને આમંત્રણ છે: ${title}\n${url}`,
    reminder: (name, title, celebrations, url) => `નમસ્તે ${name}! ${title} તરફથી એક નમ્ર યાદ: આપ ${celebrations ? `${listGu(celebrations)} માં ` : ""}પધારી શકશો કે નહીં તે જણાવશો. અહીં જવાબ આપો:\n${url}`,
  },
};
