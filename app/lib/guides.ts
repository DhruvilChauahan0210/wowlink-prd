import type { TemplateId } from "./invitations";

/*
 * The how-to guides (/guides/<slug>): the questions people type before they send an invitation ("how to send a wedding
 * invitation on WhatsApp", "how to collect RSVPs"). Plain advice that holds for any invitation, with WowLink named only
 * where it's the way to do the thing, and only what WowLink really does (see lib/plans.ts: a free start, one live
 * invitation at a time on the free plan). The invitation wording itself lives in lib/wording.ts.
 */

export type GuideSection = {
  title: string;
  paragraphs: readonly string[];
  /** Numbered steps, when the section is a how-to. */
  steps?: readonly string[];
};

export type Guide = {
  slug: string;
  /** The occasion whose drawing and page the guide leads to. */
  template: TemplateId;
  /** The page's <title> (WowLink is added after it). */
  title: string;
  description: string;
  /** What it's called in the list of guides. */
  name: string;
  /** The heading: the words before the part with the hand-drawn underline, that part, and any words after it. */
  heading: readonly [string, string, string?];
  intro: string;
  sections: readonly GuideSection[];
  faq: readonly { q: string; a: string }[];
  /** The wording guide that goes with it (a slug in lib/wording.ts). */
  wording: string;
  /** When it was written (ISO date). */
  published: string;
};

export const GUIDES: readonly Guide[] = [
  {
    slug: "send-wedding-invitation-on-whatsapp",
    template: "wedding",
    published: "2026-10-26",
    title: "How to send a wedding invitation on WhatsApp",
    description: "How to send a wedding invitation on WhatsApp so it looks right and gets a reply: what to send, who to send it to, how to word the message and when.",
    name: "Send a wedding invitation on WhatsApp",
    heading: ["How to send a wedding invitation on", "WhatsApp"],
    intro: "Most wedding invitations reach guests on WhatsApp now, often before the printed card does. Here is how to send one that people open, understand and answer, without a hundred separate messages back.",
    sections: [
      {
        title: "Decide what you are sending",
        paragraphs: [
          "There are three common choices: a photo of the printed card, a PDF, or a link to an online invitation. A photo or PDF is quick, but it can’t say where to park, can’t show the other functions, and gives guests no easy way to answer.",
          "A link opens a page with the details in one place, and it can carry the replies. It is also one thing to forward, and when something changes, you change it once.",
        ],
      },
      {
        title: "Send it in five steps",
        paragraphs: ["The same order works for a small family list and for a big one."],
        steps: [
          "Write down who you are inviting, grouped as family, friends and work, so each group can get a message that fits.",
          "Put the invitation in one place: a link, or a card with the date, time and place clear in the first line.",
          "Send to elders and close family first, by a call or a personal message, and then to everyone else.",
          "Use a short message with the link, not a long one. Greet them by name if you can, say the occasion and the day, and add the link.",
          "Send a reminder a few days before, and another the day before with the way there.",
        ],
      },
      {
        title: "Keep the message short and warm",
        paragraphs: [
          "The message is only the doorway. Say who is getting married, the day and the city, and that you would love them to come. Leave the full detail to the invitation.",
          "Start with a greeting that suits the person: “Jai Shri Krishna” for the family, “Namaste” for most others. A first name at the start makes a forwarded message feel personal. You can copy ready-made wording in English, Gujarati and Hindi from our wedding invitation wording guide.",
        ],
      },
      {
        title: "Avoid the common mistakes",
        paragraphs: [
          "Don’t add everyone to one group just to send the invitation, because the replies then fill the group. Don’t send a large file that a phone has to download over a slow connection. And don’t leave out the place: a map pin saves the most calls on the day.",
        ],
      },
    ],
    faq: [
      { q: "Is it okay to send a wedding invitation only on WhatsApp?", a: "For most guests, yes. Many families now send the invitation on WhatsApp and also give a printed card to elders and close relatives, which is a kind and common way to do both." },
      { q: "How many people can I send it to at once?", a: "Send it to individuals or to a broadcast list, rather than one big group, so that replies come to you privately. WhatsApp limits how many people go on a broadcast list, so for a long guest list you may need a few lists." },
      { q: "Should I send the invitation in Gujarati or Hindi?", a: "Send it in the language the guest is most at ease in. With an online invitation, the same link can open in English, Gujarati or Hindi, so you don’t have to send three versions." },
    ],
    wording: "wedding-invitation-wording",
  },
  {
    slug: "online-invitation-vs-pdf-vs-printed-card",
    template: "wedding",
    published: "2026-10-26",
    title: "Online invitation, PDF or printed card: which to send?",
    description: "Online invitation, PDF or printed card? What each one does well, what it can’t do, and how families usually combine them for a wedding or a puja.",
    name: "Online, PDF or printed card",
    heading: ["Online invitation, PDF or printed card:", "which one?"],
    intro: "Each way of inviting people does something the others can’t. Most families don’t pick just one. Here is what each is good for, so you can use the right one for the right guest.",
    sections: [
      {
        title: "The printed card",
        paragraphs: [
          "A printed card, such as a kankotri, is a keepsake and a mark of respect. It is the right thing to hand to elders, close family and anyone you invite in person, and it is often given with sweets.",
          "What it can’t do: it can’t be changed once printed, it costs more the more you print, and it won’t reach family who live far away in time.",
        ],
      },
      {
        title: "The PDF or image",
        paragraphs: [
          "A PDF or a photo of the card is the fastest way to send the same design to many people. Everyone can open it, and it needs nothing new.",
          "What it can’t do: it is a still picture, so it can’t show more than one function without getting crowded, it has no map, and guests still have to message you to say they are coming.",
        ],
      },
      {
        title: "The online invitation",
        paragraphs: [
          "An online invitation is a link that opens a page. It can hold the full schedule, a map, and a way to reply, and it can open in the guest’s language. When a time changes, you change it in one place.",
          "What it can’t do: it isn’t a keepsake in the hand, and a guest who rarely uses a smartphone may prefer a call or a card. That is why many families use it alongside a printed card for elders.",
        ],
      },
      {
        title: "How families usually combine them",
        paragraphs: [
          "A common mix is a printed card for elders and close relatives, and an online invitation link on WhatsApp for everyone else. The link then does the work the card can’t: the schedule, the way there, and the replies.",
        ],
      },
    ],
    faq: [
      { q: "Is an online invitation less respectful than a printed card?", a: "Not for most guests, and many families send both. A printed card, or a call, for elders and close relatives, with an online invitation for everyone else, is a common and well-received way to do it." },
      { q: "Which is cheapest?", a: "An online invitation or a PDF costs the least, because nothing is printed or delivered. The more guests you have, the bigger the difference. Printing a smaller number of cards for family keeps the tradition without the cost of printing for everyone." },
      { q: "Can I use one design for all three?", a: "Yes. Many people use one design for the printed card and the online invitation so that they match, and send a picture of the card to those who prefer a picture." },
    ],
    wording: "wedding-invitation-wording",
  },
  {
    slug: "collect-rsvp-on-whatsapp",
    template: "wedding",
    published: "2026-10-26",
    title: "How to collect RSVPs on WhatsApp without chasing everyone",
    description: "How to collect RSVPs for a wedding, puja or party on WhatsApp without a flood of messages: ask one clear question, set a date, keep replies in one place.",
    name: "Collect RSVPs on WhatsApp",
    heading: ["How to collect RSVPs on WhatsApp", "without chasing"],
    intro: "Counting who is coming is the part everyone dreads. A hundred separate “yes, we’ll try” messages are hard to add up. Here is a calmer way to get a clear answer from each household.",
    sections: [
      {
        title: "Ask one clear question",
        paragraphs: [
          "“Please let us know” gets “will try” and “see you soon”. Ask something with an answer you can count: “Will you come? Yes or no, and how many of you?” People answer what they are asked.",
          "If there is more than one function, ask for each: a family may come to the wedding but not the mehndi. One line per function keeps the count honest.",
        ],
      },
      {
        title: "Set a reply-by date",
        paragraphs: [
          "Give a date, and make it earlier than you really need it. The caterer, the seating and the return gifts all depend on the number. “Please reply by 25 October” gets answers sooner than “please reply soon”.",
        ],
      },
      {
        title: "Keep the replies in one place",
        paragraphs: [
          "Replies that come as chat messages end up scattered across a hundred conversations. Pick one place for them. A reply form on an online invitation does this: each guest answers in a few taps, and you see who is coming in a single list, instead of scrolling through chats.",
          "With WowLink, a guest opens the invitation from the WhatsApp link and replies on it, and the host sees the replies together. The free plan keeps up to 50 replies for each invitation.",
        ],
      },
      {
        title: "Follow up kindly, once",
        paragraphs: [
          "A few days before the date, send one gentle reminder to the households who haven’t answered. Keep it short and warm, and put the link in again so they don’t have to look for it. For close family, a phone call is better than a message.",
        ],
        steps: [
          "Send the invitation with the question and the reply-by date.",
          "A week before the date, remind those who haven’t answered.",
          "Call close family who are still quiet.",
          "After the date, count what you have and plan for a few more.",
        ],
      },
    ],
    faq: [
      { q: "What should I ask in an RSVP?", a: "Ask whether they are coming and how many people. If you have more than one function, ask for each. If you are catering, you may also ask about food needs, such as Jain or no onion and garlic." },
      { q: "How early should I ask for replies?", a: "Ask for replies one to two weeks before the day, and earlier if you are catering or booking seats, since the number decides what you must order." },
      { q: "What if guests don’t reply?", a: "It is common. Send one reminder, call close family, and plan for a few more than you have counted. Most families plan for some guests who come without replying." },
    ],
    wording: "wedding-invitation-wording",
  },
  {
    slug: "when-to-send-wedding-invitations",
    template: "wedding",
    published: "2026-10-26",
    title: "When to send wedding invitations: a simple timeline",
    description: "When to send wedding invitations and reminders: a simple timeline for family, for friends and for guests who travel, from the first call to the day before.",
    name: "When to send wedding invitations",
    heading: ["When to send wedding invitations:", "a simple timeline"],
    intro: "Send too early and people forget. Send too late and they have made other plans. This is a timeline most families can follow, whether the wedding is a small one or a big one, which you can bend to fit yours.",
    sections: [
      {
        title: "Four to eight weeks before",
        paragraphs: [
          "Call elders and close family first, and give them the date before anything is printed or posted. This is also the time to tell guests who need to travel or book leave, because they need the longest notice.",
          "Send a save-the-date message to them, with just the day and the city. It doesn’t need the full detail yet.",
        ],
      },
      {
        title: "Three to four weeks before",
        paragraphs: [
          "Send the full invitation to everyone: the schedule, the places, and how to reply. For a wedding with several functions, this is when to make sure each one has its day, time and place.",
          "Hand the printed cards to elders and close relatives, in person where you can. Send an online invitation link on WhatsApp to everyone else.",
        ],
      },
      {
        title: "One to two weeks before",
        paragraphs: [
          "Remind those who haven’t answered, once, kindly. Start your final count for the caterer and the seating. Check that anyone travelling has what they need.",
        ],
      },
      {
        title: "The day before",
        paragraphs: [
          "Send a short reminder with the time, the place and a map pin. It’s the message that saves you the most calls on the morning of the wedding.",
        ],
        steps: [
          "4–8 weeks: call elders and close family, and send a save-the-date to guests who travel.",
          "3–4 weeks: send the full invitation and hand over the printed cards.",
          "1–2 weeks: one reminder to those who haven’t replied, and the final count.",
          "The day before: the time, the place and the map.",
        ],
      },
    ],
    faq: [
      { q: "How early should I send a wedding invitation?", a: "Three to four weeks before is usual for most guests, and four to eight weeks for people who must travel or take leave. Elders and close family should hear from you first, and as early as the date is fixed." },
      { q: "Do I need a save-the-date?", a: "It’s useful when guests have to travel or book time off, and not needed for guests who live nearby. It can be a short message with the day and the city." },
      { q: "When should I send the reminder?", a: "Send one a week or two before to those who haven’t replied, and one the day before to everyone, with the time and the place." },
    ],
    wording: "wedding-invitation-wording",
  },
  {
    slug: "invitation-in-gujarati-hindi-and-english",
    template: "wedding",
    published: "2026-10-26",
    title: "Invite guests in Gujarati, Hindi and English with one link",
    description: "Guests who read different languages? How to send one invitation that opens in Gujarati, Hindi or English, and how to word each so it sounds like family.",
    name: "One invitation, three languages",
    heading: ["One invitation in Gujarati, Hindi and English:", "one link"],
    intro: "In many families, grandparents read Gujarati, cousins read Hindi, and friends read English. You shouldn’t have to send three different cards. Here is how to invite everyone in the language they love.",
    sections: [
      {
        title: "Why the language matters",
        paragraphs: [
          "An invitation in someone’s own language says that you thought of them. For an elder, a line in Gujarati or Hindi is often the difference between “a message” and an invitation.",
          "But a translation that follows the English word for word rarely sounds right. Traditional wording has its own phrases, such as “સ્નેહી શ્રી” or “आदरणीय”, “પધારશોજી” or “पधारें”, that families expect to see.",
        ],
      },
      {
        title: "Three ways to do it",
        paragraphs: ["Each works. They differ in how much you have to send and keep track of."],
        steps: [
          "Send three separate messages or cards, one for each language, and match each to the guest. This is the most work and the easiest to get wrong.",
          "Put all three languages on one card. It works for print, but it gets crowded and hard to read on a phone.",
          "Send one online link that opens in the guest’s language. They choose English, Gujarati or Hindi, and everyone sees the same schedule and the same place.",
        ],
      },
      {
        title: "Wording that sounds like family",
        paragraphs: [
          "Don’t run the English through a translator. Use wording that families already use, and change the names, date and place. We wrote wording for each occasion in English, Gujarati and Hindi, the way it is said at home, and you can copy any of it.",
          "Keep the greeting for the person: “Jai Shri Krishna” for many Gujarati families, and “Namaste” or “Ram Ram” elsewhere. A fitting greeting matters as much as the grammar.",
        ],
      },
      {
        title: "Check it before you send",
        paragraphs: [
          "Read the Gujarati and Hindi aloud to someone who speaks it. Look at the date and the weekday in each language, and check that conjuncts and matras show correctly on a phone, since some apps draw them badly.",
        ],
      },
    ],
    faq: [
      { q: "Can one invitation open in more than one language?", a: "Yes. With WowLink, the same link opens in English, Gujarati or Hindi, and the guest picks the language they prefer. You don’t have to send separate versions." },
      { q: "Should I translate the English myself?", a: "A word-for-word translation often sounds stiff. It’s better to use wording families already use for each occasion, which you can copy and change." },
      { q: "Which greeting should I use?", a: "Use the greeting the person would use. “Jai Shri Krishna” is common in many Gujarati families, “Namaste” suits most guests, and “Ram Ram” is common in many Hindi-speaking families." },
    ],
    wording: "wedding-invitation-wording",
  },
];

export const guide = (slug: string) => GUIDES.find((item) => item.slug === slug);

/** Minutes to read it, at a calm 200 words a minute. */
export const readMinutes = (item: Guide) => {
  const words = [item.intro, ...item.sections.flatMap((section) => [section.title, ...section.paragraphs, ...(section.steps ?? [])]), ...item.faq.flatMap(({ q, a }) => [q, a])].join(" ").split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
};
