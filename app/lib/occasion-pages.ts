import type { TemplateId } from "./invitations";

/*
 * The words for each occasion's own page (/templates/<id>): what someone searching for "Garba invitation maker" or
 * "Gujarati wedding invitation website" hopes to find, said plainly. Everything here is something WowLink does today.
 */

export type OccasionPage = {
  /** The page's <title> (WowLink is added after it). */
  title: string;
  description: string;
  /** What the occasion is called in a sentence ("Made for your …"). */
  noun: string;
  /** The heading; the second part gets the hand-drawn underline. */
  heading: readonly [string, string];
  intro: string;
  /** What this occasion's invitations are good at. */
  /** `pro`: needs the Creator studio (a schedule, personal links, downloads…). */
  points: readonly { title: string; body: string; pro?: true }[];
};

export const OCCASION_PAGES: Record<TemplateId, OccasionPage> = {
  wedding: {
    title: "Wedding invitation website in Gujarati, Hindi or English",
    description: "A hand-drawn wedding invitation website that opens like a kankotri, in Gujarati, Hindi or English. Share one link on WhatsApp and collect RSVPs. Free to start.",
    noun: "wedding",
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
    noun: "engagement",
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
    noun: "birthday",
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
    noun: "Garba night",
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
    noun: "seemant",
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
    noun: "housewarming",
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
    noun: "anniversary",
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
    noun: "opening",
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
    noun: "Diwali get-together",
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
    noun: "janoi",
    heading: ["A janoi invitation that ties the", "sacred thread"],
    intro: "Guests tie the brahmagranthi, the three strands draw together, and your invitation to the ceremony appears, with the muhurat and the place.",
    points: [
      { title: "Mandap muhurat to lunch", body: "Add the grah shanti, the janoi muhurat and the lunch as separate celebrations, each with its own time.", pro: true },
      { title: "A link for each family", body: "Send relatives their own invitation with their name on it, and see who has opened it.", pro: true },
      { title: "In Gujarati or Hindi", body: "The invitation reads the way an invitation should, in Gujarati or Hindi, and guests can switch to English with one tap." },
    ],
  },
  puja: {
    title: "Satyanarayan katha and puja invitation online",
    description: "A Satyanarayan katha or home puja invitation guests open by ringing a temple bell. Hand-drawn, in Gujarati, Hindi or English, with RSVPs.",
    noun: "katha",
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
    noun: "naamkaran",
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
export const GUEST_GETS = [
  "Opens from a WhatsApp link, with no app or sign-up",
  "A countdown, and the day in Google or Apple Calendar",
  "Directions to the place on the map",
  "A reply in a few taps: coming, maybe or can’t make it",
  "English, Gujarati or Hindi, and a switch between them",
  "A thank-you from you once the day is over",
] as const;

export const STEPS = [
  { title: "Pick this drawing", body: "Start from the sample. Nothing to install, nothing to design." },
  { title: "Add your details", body: "Names, date, place and a message. The preview changes as you type." },
  { title: "Share one link", body: "Publish, then send it on WhatsApp, copy it anywhere, or print its QR code." },
] as const;

export const FAQ = [
  { q: "Is it free?", a: "To start, yes: the free plan has the four starter occasions (wedding, birthday, Garba, grand opening), one celebration and up to 50 replies. Schedules, a link for each family, your own colours and the other occasions are in the Creator studio." },
  { q: "Do guests need an app or an account?", a: "No. They tap the link and it opens in their phone’s browser. Replying takes a few taps, with no sign-up." },
  { q: "Can guests read it in Gujarati or Hindi?", a: "Yes. You choose the language guests see first (English, Gujarati or Hindi), and each guest can switch. Dates and times are written the way an invitation says them in each language." },
  { q: "Can I send each family its own link?", a: "Yes, with the Creator studio. Add households to your list and each gets a link that opens with their name on it. You’ll see who has opened theirs and who hasn’t replied yet." },
  { q: "Can I change the details after sending it?", a: "Yes. Edit it any time and the same link shows the latest details. You can also unpublish it, or delete it with everything in it." },
] as const;
