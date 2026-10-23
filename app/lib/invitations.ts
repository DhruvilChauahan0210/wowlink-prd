import { isPaletteValue } from "./palette";

/** One event in an occasion's schedule, e.g. the mehndi or the sangeet. A blank venue means "the main venue". */
export type ScheduleItem = { id: string; name: string; date: string; time: string; venue: string };

/** The languages a guest can read their invitation in. */
export const LANGS = ["en", "gu"] as const;
export type Lang = (typeof LANGS)[number];
export const isLang = (value: unknown): value is Lang => LANGS.includes(value as Lang);

export type InvitationDraft = {
  title: string;
  date: string;
  time: string;
  venue: string;
  message: string;
  /** Optional: the separate events of a multi-day occasion, like a Gujarati wedding. */
  events: ScheduleItem[];
  /** The language guests see first (they can switch). Missing means English. */
  language?: Lang;
  /** A thank-you note the invitation shows once the occasion is over. Optional. */
  thanks?: string;
  /** The host's colours: a palette id, "#rrggbb", or "" for the occasion's own (see palette.ts). */
  palette?: string;
};

export const invitationTemplates = [
  { id: "wedding", name: "The Wedding Edit", category: "Wedding", action: "Open the invitation", eyebrow: "Together with their families", title: "Aarav & Meera", date: "2026-11-08", time: "18:00", venue: "The Garden House, Surat", message: "Some days are made more beautiful by the people who share them. We would love to celebrate ours with you." },
  { id: "engagement", name: "Two Rings", category: "Engagement & sagai", action: "Open the ring box", eyebrow: "With our families’ blessings", title: "Kabir & Isha", date: "2026-12-20", time: "18:30", venue: "The Orchid Hall, Ahmedabad", message: "We’re making it official, and we’d love you to be there when we do. Come celebrate the start of forever with us." },
  { id: "birthday", name: "Make a Wish", category: "Birthday & milestones", action: "Reveal the surprise", eyebrow: "Another year, a little more magic", title: "A night for Riya", date: "2026-12-05", time: "19:00", venue: "The Courtyard, Surat", message: "Good friends, a few candles, and a whole lot of joy. Come make another trip around the sun one to remember." },
  { id: "garba", name: "Raas & Rhythm", category: "Garba & Navratri", action: "Let the night begin", eyebrow: "Nine nights, endless memories", title: "Raas under the stars", date: "2027-10-05", time: "20:00", venue: "Rangoli Courtyard, Navsari", message: "Bring your favourite people and your dancing shoes. Let’s fill the night with colour, rhythm, and a little magic." },
  { id: "babyshower", name: "Little Blessings", category: "Baby shower & seemant", action: "Shake the rattle", eyebrow: "A little one is on the way", title: "Seemant for Priya", date: "2027-01-17", time: "11:00", venue: "Shanti Kunj, Vadodara", message: "Join us to shower Priya with love and blessings as we wait for our little one. Your presence would mean the world." },
  { id: "housewarming", name: "Home Sweet Home", category: "Housewarming & vastu puja", action: "Open the door", eyebrow: "A new home, a new beginning", title: "The Shahs’ new home", date: "2027-02-07", time: "09:00", venue: "Shree Residency, Rajkot", message: "Our new home won’t feel complete until you’ve stepped inside. Join us for the vastu puja and a warm lunch after." },
  { id: "anniversary", name: "Still Us", category: "Anniversary", action: "Open the letter", eyebrow: "Years of love, and counting", title: "Mummy & Papa’s 25th", date: "2027-02-14", time: "19:30", venue: "Terrace Garden, Surat", message: "Twenty-five years, countless cups of chai, and a family built with love. Come celebrate them with us." },
  { id: "opening", name: "A New Beginning", category: "Grand opening", action: "Cut the ribbon", eyebrow: "The start of something wonderful", title: "A new beginning", date: "2026-12-12", time: "10:00", venue: "The Atelier, Vapi", message: "Every new beginning deserves a celebration. Be with us as we open our doors to a beautiful new chapter." },
] as const;

export type InvitationTemplate = (typeof invitationTemplates)[number];
export function getInvitationTemplate(id: string | null | undefined): InvitationTemplate {
  return invitationTemplates.find(item => item.id === id) ?? invitationTemplates[0];
}

// ---------- schedules ----------

/** Wedding events with sensible defaults relative to the main day (days before, time). Everything stays editable. */
export const SCHEDULE_PRESETS: Partial<Record<InvitationTemplate["id"], { name: string; daysBefore: number; time: string | null }[]>> = {
  wedding: [
    { name: "Mehndi", daysBefore: 2, time: "16:00" },
    { name: "Haldi", daysBefore: 1, time: "10:00" },
    { name: "Sangeet", daysBefore: 1, time: "19:30" },
    { name: "Wedding", daysBefore: 0, time: null },
    { name: "Reception", daysBefore: 0, time: "21:00" },
  ],
};
/** Names offered while typing an event's name. */
export const EVENT_NAMES = ["Mehndi", "Haldi", "Sangeet", "Garba night", "Engagement", "Wedding", "Reception", "Puja", "Dinner"];

export const newEventId = () => Math.random().toString(36).slice(2, 10);

/** The date `days` before `date` (YYYY-MM-DD), or `date` itself if it isn't a real date yet. */
export function shiftDate(date: string, days: number) {
  if (!isRealDate(date)) return date;
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

export function presetEvent(template: InvitationTemplate, name: string, main: Pick<InvitationDraft, "date" | "time">): ScheduleItem {
  const preset = SCHEDULE_PRESETS[template.id]?.find(p => p.name === name);
  return { id: newEventId(), name, date: preset ? shiftDate(main.date, preset.daysBefore) : main.date, time: preset ? preset.time ?? main.time : "", venue: "" };
}

/** Events in the order they happen (all-day events first on their day). */
export const sortSchedule = (events: ScheduleItem[]) => [...events].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

const SAMPLE_SCHEDULE: Partial<Record<InvitationTemplate["id"], ScheduleItem[]>> = {
  wedding: [
    { id: "mehndi", name: "Mehndi", date: "2026-11-06", time: "16:00", venue: "" },
    { id: "sangeet", name: "Sangeet", date: "2026-11-07", time: "19:30", venue: "Lakeview Lawns, Surat" },
    { id: "wedding", name: "Wedding", date: "2026-11-08", time: "18:00", venue: "" },
    { id: "reception", name: "Reception", date: "2026-11-08", time: "21:00", venue: "" },
  ],
};

export function initialDraft(template: InvitationTemplate): InvitationDraft {
  return { title: template.title, date: template.date, time: template.time, venue: template.venue, message: template.message, events: (SAMPLE_SCHEDULE[template.id] ?? []).map(e => ({ ...e })), language: "en", thanks: "", palette: "" };
}
export const draftKey = (id: string) => `wowlink:draft:${id}`;

const isScheduleItem = (value: unknown): value is ScheduleItem => !!value && typeof value === "object" && ["id", "name", "date", "time", "venue"].every(key => typeof (value as Record<string, unknown>)[key] === "string");

export function readDraft(id: string): InvitationDraft | null {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(draftKey(id)) ?? "null");
    if (!parsed || typeof parsed !== "object") return null;
    const data = parsed as Record<string, unknown>;
    if (!["title", "date", "time", "venue", "message"].every(key => typeof data[key] === "string")) return null;
    // Drafts saved before schedules existed simply have none.
    const events = Array.isArray(data.events) ? data.events.filter(isScheduleItem) : [];
    return { title: String(data.title), date: String(data.date), time: String(data.time), venue: String(data.venue), message: String(data.message), events, language: isLang(data.language) ? data.language : "en", thanks: typeof data.thanks === "string" ? data.thanks : "", palette: isPaletteValue(data.palette) ? data.palette : "" };
  } catch { return null; }
}

// ---------- dates and times, in English or Gujarati ----------
// Written out from fixed tables (not the browser's or server's locale data), so a page renders the same everywhere.

const MONTHS = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  gu: ["જાન્યુઆરી", "ફેબ્રુઆરી", "માર્ચ", "એપ્રિલ", "મે", "જૂન", "જુલાઈ", "ઑગસ્ટ", "સપ્ટેમ્બર", "ઑક્ટોબર", "નવેમ્બર", "ડિસેમ્બર"],
};
const MONTHS_SHORT = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  gu: ["જાન્યુ", "ફેબ્રુ", "માર્ચ", "એપ્રિલ", "મે", "જૂન", "જુલાઈ", "ઑગસ્ટ", "સપ્ટે", "ઑક્ટો", "નવે", "ડિસે"],
};
const WEEKDAYS = { en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], gu: ["રવિ", "સોમ", "મંગળ", "બુધ", "ગુરુ", "શુક્ર", "શનિ"] };
const dateParts = (value: string) => {
  const d = new Date(`${value}T12:00:00Z`);
  return { day: d.getUTCDate(), month: d.getUTCMonth(), year: d.getUTCFullYear(), weekday: d.getUTCDay() };
};

/** "8 November 2026" / "8 Nov 2026"; in Gujarati "8 નવેમ્બર 2026" / "8 નવે 2026". */
export function formatInvitationDate(value: string, long = false, lang: Lang = "en") {
  if (!isRealDate(value)) return lang === "gu" ? "યાદગાર દિવસ" : "A date to remember";
  const { day, month, year } = dateParts(value);
  return `${day} ${(long ? MONTHS : MONTHS_SHORT)[lang][month]} ${year}`;
}
/** "Fri, 6 Nov": for schedule entries, where the year is already obvious. */
export function formatEventDay(value: string, lang: Lang = "en") {
  if (!isRealDate(value)) return lang === "gu" ? "તારીખ હવે પછી" : "Date to come";
  const { day, month, weekday } = dateParts(value);
  return `${WEEKDAYS[lang][weekday]}, ${day} ${MONTHS_SHORT[lang][month]}`;
}
/** "22 Oct" for a moment (an ISO timestamp), on India's calendar. */
export function formatShortDay(iso: string, lang: Lang = "en") {
  const d = new Date(Date.parse(iso) + 5.5 * 3600_000);
  return Number.isNaN(d.getTime()) ? "" : `${d.getUTCDate()} ${MONTHS_SHORT[lang][d.getUTCMonth()]}`;
}
/** "6:00 PM"; in Gujarati the way an invitation says it, with the part of the day: "સાંજે 6:00 વાગ્યે". */
export function formatInvitationTime(value: string, lang: Lang = "en") {
  if (!/^\d{2}:\d{2}$/.test(value)) return "";
  const [hours, minutes] = value.split(":").map(Number);
  if (hours > 23 || minutes > 59) return "";
  const clock = `${hours % 12 || 12}:${String(minutes).padStart(2, "0")}`;
  if (lang === "en") return `${clock} ${hours >= 12 ? "PM" : "AM"}`;
  const part = hours >= 4 && hours < 12 ? "સવારે" : hours >= 12 && hours < 16 ? "બપોરે" : hours >= 16 && hours < 20 ? "સાંજે" : "રાત્રે";
  return `${part} ${clock} વાગ્યે`;
}

// ---------- publishing: shared by the studio (to show errors) and the server (to enforce them) ----------

export type TemplateId = InvitationTemplate["id"];
export const isTemplateId = (value: unknown): value is TemplateId => invitationTemplates.some(item => item.id === value);

export const ATTENDANCE = ["Attending", "Maybe", "Not attending"] as const;
export type Attendance = (typeof ATTENDANCE)[number];

export const LIMITS = { title: 80, venue: 140, message: 500, guestName: 100, guests: 20, rsvpsPerEvent: 100, events: 10, eventName: 40, guestList: 100, guestLabel: 80, wish: 300 } as const;

export type DraftErrors = Partial<Record<keyof InvitationDraft, string>>;

function isRealDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
const isTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

/** What's wrong with one schedule entry, if anything (the studio shows it next to that entry). */
export function scheduleItemError(item: ScheduleItem) {
  if (!item.name.trim()) return "Give this event a name.";
  if (item.name.trim().length > LIMITS.eventName) return `Keep the name under ${LIMITS.eventName} characters.`;
  if (!isRealDate(item.date)) return "Pick a date for this event.";
  if (item.time && !isTime(item.time)) return "That time doesn’t look right.";
  if (item.venue.trim().length > LIMITS.venue) return `Keep the venue under ${LIMITS.venue} characters.`;
  return "";
}

/** Title, date and venue are required to publish; everything is trimmed and length-checked. */
export function validateDraft(input: unknown): { ok: true; value: InvitationDraft } | { ok: false; errors: DraftErrors } {
  const data = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const text = (key: string, from: Record<string, unknown> = data) => (typeof from[key] === "string" ? (from[key] as string).trim() : "");
  const rawEvents = Array.isArray(data.events) ? data.events : [];
  const events: ScheduleItem[] = rawEvents.map((raw) => {
    const item = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    const id = text("id", item);
    // "main" is reserved: calendar links use ?event=main for the main occasion.
    return { id: /^[\w-]{1,40}$/.test(id) && id !== "main" ? id : newEventId(), name: text("name", item), date: text("date", item), time: text("time", item), venue: text("venue", item) };
  });
  const value: InvitationDraft = { title: text("title"), date: text("date"), time: text("time"), venue: text("venue"), message: text("message"), events, language: isLang(data.language) ? data.language : "en", thanks: text("thanks"), palette: isPaletteValue(text("palette")) ? text("palette").toLowerCase() : "" };
  const errors: DraftErrors = {};
  if (!value.title) errors.title = "Add the names or a title for the occasion.";
  else if (value.title.length > LIMITS.title) errors.title = `Keep the title under ${LIMITS.title} characters.`;
  if (!isRealDate(value.date)) errors.date = "Pick the date of the occasion.";
  if (value.time && !isTime(value.time)) errors.time = "That time doesn’t look right.";
  if (!value.venue) errors.venue = "Add where it’s happening.";
  else if (value.venue.length > LIMITS.venue) errors.venue = `Keep the venue under ${LIMITS.venue} characters.`;
  if (value.message.length > LIMITS.message) errors.message = `Keep the message under ${LIMITS.message} characters.`;
  if (value.thanks!.length > LIMITS.message) errors.thanks = `Keep the note under ${LIMITS.message} characters.`;
  if (events.length > LIMITS.events) errors.events = `A schedule can have up to ${LIMITS.events} events.`;
  else if (events.some(scheduleItemError)) errors.events = "One of the events in the schedule needs a look.";
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value };
}

/** Where a creator's private manage key for an invitation is kept on their device. */
export const ownerKey = (slug: string) => `wowlink:owner:${slug}`;
