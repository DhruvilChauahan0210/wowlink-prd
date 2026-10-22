import { LIMITS, sortSchedule, type Attendance, type InvitationDraft, type ScheduleItem } from "./invitations";

/*
 * Personal invitations and replies per celebration.
 *
 * Every link has an *audience*: the general link (/e/<slug>) shows what the host chose for it, and a personal link
 * (/e/<slug>/<guest id>) shows the celebrations that household is invited to. The server turns the audience into a
 * *view* of the invitation before anything reaches the browser, so celebrations someone isn't invited to never leave it.
 * Shared by the server (to enforce), the guest page (to ask) and the manage page (to count).
 */

/** Which celebrations an audience sees: every one, including any added later, or only these schedule ids. */
export type EventFilter = "all" | string[];

/**
 * A household with its own link. The id is also the secret part of that link. `phone` (digits with the country code,
 * like "919825012345") lets the host's WhatsApp button open that family's chat directly; only the host ever sees it.
 */
export type Guest = {
  id: string;
  name: string;
  events: EventFilter;
  createdAt: string;
  phone?: string;
  /** When the household first opened their link, and most recently (a real visit, not a link preview). */
  openedAt?: string;
  lastOpenedAt?: string;
};

/**
 * An invitation as one audience sees it.
 * - `mainEventId`: they only see some celebrations, so the main details are those of their first one.
 * - `pending`: none of the celebrations they were invited to exist any more (the host is mid-edit). They see the card
 *   but no date, place or reply form, rather than details the host never meant to show them.
 */
export type AudienceView = InvitationDraft & { mainEventId?: string; pending?: boolean };

/** One celebration's answer, with how many people it's for (0 when not coming). */
export type EventAnswer = { attendance: Attendance; guestCount: number };
/**
 * The answer for each celebration the guest was shown. Replies sent before this existed have none: they answered
 * for the whole invitation, so their overall answer stands for every celebration.
 */
export type ByEvent = Record<string, EventAnswer>;
type ReplyLike = { attendance: Attendance; guestCount: number; guestId?: string; byEvent?: ByEvent };

export const invitedTo = (filter: EventFilter, eventId: string) => filter === "all" || filter.includes(eventId);

/** A guest's wish or blessing: trimmed, no runs of blank lines, at most LIMITS.wish characters. */
export function cleanWish(input: unknown) {
  if (typeof input !== "string") return "";
  return input.replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").replace(/ ?\n ?/g, "\n").replace(/\n{3,}/g, "\n\n").trim().slice(0, LIMITS.wish).trim();
}

/** Replies that count towards the free plan's limit: the general link's. A personal link has one reply per household. */
export const generalReplies = (replies: { guestId?: string }[]) => replies.filter(r => !r.guestId).length;

/** Schedule ids an audience's list mentions that are no longer in the schedule (the host should pick again). */
export const missingEvents = (filter: EventFilter, schedule: ScheduleItem[]) => (filter === "all" ? [] : filter.filter(id => !schedule.some(e => e.id === id)));

/**
 * The invitation as this audience sees it. Ids that no longer exist are ignored. When someone sees only some of the
 * celebrations, the main date, time and venue become those of their first one (by date): a guest invited only to the
 * reception should count down to the reception, not to the ceremony before it.
 */
export function viewFor(draft: InvitationDraft, filter: EventFilter): AudienceView {
  const events = draft.events.filter(e => invitedTo(filter, e.id));
  if (events.length === draft.events.length) return { ...draft, events };
  if (!events.length) return { ...draft, date: "", time: "", venue: "", events: [], pending: true };
  const first = sortSchedule(events)[0];
  return { ...draft, events, date: first.date, time: first.time, venue: first.venue || draft.venue, mainEventId: first.id };
}

/** The reply's answer for one celebration, or null if it was never asked about that one. */
export function answerFor(reply: Pick<ReplyLike, "attendance" | "guestCount" | "byEvent">, eventId: string): EventAnswer | null {
  if (!reply.byEvent) return { attendance: reply.attendance, guestCount: reply.guestCount };
  // Own keys only: an event id like "constructor" must not find something on Object.prototype.
  return Object.hasOwn(reply.byEvent, eventId) ? reply.byEvent[eventId] : null;
}

/** Personal links are 8 characters from the slug alphabet; anything else can't be one, so isn't looked up. */
export const isGuestId = (value: unknown): value is string => typeof value === "string" && /^[2-9b-df-hjkmnp-tv-zB-DF-HJ-NP-TV-Z]{8}$/.test(value);

/**
 * The free plan's replies: every general-link reply, plus one place held for each personal invitation (its household
 * replies at most once, and can always reply). So invited households are never turned away, and the total stays within the limit.
 */
export const repliesUsed = (replies: { guestId?: string }[], guests: unknown[]) => generalReplies(replies) + guests.length;

type ReplyInput = {
  attendance: Attendance;
  /** Party size, for every celebration unless `counts` says otherwise. */
  guestCount: number;
  /** The celebrations ticked. Undefined from older pages: all of them. */
  events?: unknown;
  /** The celebrations the page showed. Undefined from older pages: the whole view. */
  shown?: unknown;
  /** Different party sizes for some celebrations. */
  counts?: unknown;
};

const strings = (value: unknown) => (Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : null);
const isCount = (n: unknown): n is number => Number.isInteger(n) && (n as number) >= 1 && (n as number) <= LIMITS.guests;

/**
 * Turn a reply form into an answer for each celebration the guest saw, checked against what their link shows *now*:
 * anything they ticked that isn't in their view any more is dropped (never stored), and celebrations added since they
 * opened the page stay unanswered rather than being recorded as a "no" they never gave.
 */
export function answersFor(view: AudienceView, input: ReplyInput): { ok: true; byEvent: ByEvent; guestCount: number } | { ok: false; error: string } {
  const { attendance } = input;
  if (view.pending) return { ok: false, error: "The hosts are updating this invitation. Please try again a little later." };
  const current = view.events.map(e => e.id);
  const shownInput = strings(input.shown);
  const seen = shownInput ? current.filter(id => shownInput.includes(id)) : current;
  if (!current.length) return { ok: true, byEvent: {}, guestCount: attendance === "Not attending" ? 0 : input.guestCount };
  const changed = { ok: false as const, error: "The celebrations changed since you opened this page. Please reload it to see the latest." };
  if (!seen.length) return changed;
  const ticked = input.events === undefined ? seen : strings(input.events);
  if (!ticked) return { ok: false, error: "Something went wrong. Please try again." };
  const chosen = attendance === "Not attending" ? [] : seen.length === 1 ? seen : seen.filter(id => ticked.includes(id));
  if (attendance !== "Not attending" && !chosen.length) return ticked.some(id => !current.includes(id)) ? changed : { ok: false, error: "Tick at least one celebration, or choose Not attending." };
  const counts = (input.counts && typeof input.counts === "object" ? input.counts : {}) as Record<string, unknown>;
  const countFor = (id: string) => (isCount(counts[id]) ? (counts[id] as number) : input.guestCount);
  const byEvent: ByEvent = Object.fromEntries(seen.map(id => [id, chosen.includes(id) ? { attendance, guestCount: countFor(id) } : { attendance: "Not attending" as const, guestCount: 0 }]));
  return { ok: true, byEvent, guestCount: chosen.length ? Math.max(...chosen.map(countFor)) : 0 };
}

export type EventTally = {
  event: ScheduleItem;
  /** People coming (party sizes added up), and how many replies that is. */
  coming: number; comingReplies: number;
  /** People who might come, and how many replies. */
  maybe: number; maybeReplies: number;
  /** Replies that can't make it. */
  cant: number;
  /** Personal invitations that include this celebration but haven't answered for it yet. */
  waiting: number;
};

/** Headcount for each celebration, in the order they happen: the numbers a caterer needs. */
export function tallyByEvent(events: ScheduleItem[], replies: ReplyLike[], guests: Guest[]): EventTally[] {
  const byId = new Map(guests.map(g => [g.id, g]));
  return sortSchedule(events).map(event => {
    const tally: EventTally = { event, coming: 0, comingReplies: 0, maybe: 0, maybeReplies: 0, cant: 0, waiting: 0 };
    for (const reply of replies) {
      // A household the host has since taken off this celebration isn't counted for it, whatever they said.
      if (reply.guestId) {
        const guest = byId.get(reply.guestId);
        if (!guest || !invitedTo(guest.events, event.id)) continue;
      }
      const answer = answerFor(reply, event.id);
      if (answer?.attendance === "Attending") { tally.coming += answer.guestCount; tally.comingReplies += 1; }
      else if (answer?.attendance === "Maybe") { tally.maybe += answer.guestCount; tally.maybeReplies += 1; }
      else if (answer?.attendance === "Not attending") tally.cant += 1;
    }
    for (const guest of guests) {
      if (!invitedTo(guest.events, event.id)) continue;
      const reply = replies.find(r => r.guestId === guest.id);
      if (!reply || !answerFor(reply, event.id)) tally.waiting += 1;
    }
    return tally;
  });
}

// ---------- validation ----------

/** "all", or the given ids that exist in the schedule (deduplicated, in schedule order). Null if that leaves none. */
function eventFilter(input: unknown, schedule: ScheduleItem[]): EventFilter | null {
  if (input === "all" || !schedule.length) return "all";
  const given = strings(input);
  if (!given) return null;
  const ids = schedule.map(e => e.id).filter(id => given.includes(id));
  return ids.length ? ids : null;
}

export type GuestErrors = { name?: string; events?: string; phone?: string; list?: string };

const cleanName = (text: string) => text.trim().replace(/\s+/g, " ");
/** Names that differ only in case or spacing are the same household. */
export const sameName = (a: string, b: string) => cleanName(a).toLowerCase() === cleanName(b).toLowerCase();

/**
 * A WhatsApp number as digits with the country code. Ten digits (with or without a leading 0) are an Indian mobile,
 * so +91 is added; anything else needs its country code (+44…). Null if it can't be a phone number.
 */
export function normalizePhone(input: string): string | null {
  const digits = input.trim().replace(/[\s().-]/g, "");
  if (/^\+\d{8,15}$/.test(digits)) return digits.slice(1);
  if (/^00\d{8,15}$/.test(digits)) return digits.slice(2);
  if (/^0?\d{10}$/.test(digits)) return `91${digits.slice(-10)}`;
  if (/^91\d{10}$/.test(digits)) return digits;
  return null;
}

/** One pasted line: "the Patel family", or with a number after it: "the Patel family, 98250 12345" (comma, tab or space). */
export function parseGuestLine(line: string): { name: string; phone?: string } {
  const match = line.match(/^(.*?)[\s,;|]*(\+?\d[\d\s().-]{6,}\d)\s*$/);
  const phone = match && cleanName(match[1]) ? normalizePhone(match[2]) : null;
  return phone ? { name: cleanName(match![1]).replace(/[\s,;|-]+$/, ""), phone } : { name: cleanName(line) };
}

/** A new or edited personal invitation. With `partial`, missing fields are left as they are; a blank phone removes it. */
export function validateGuest(input: unknown, schedule: ScheduleItem[], partial = false): { ok: true; value: Partial<Pick<Guest, "name" | "events" | "phone">> } | { ok: false; errors: GuestErrors } {
  const data = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const value: Partial<Pick<Guest, "name" | "events" | "phone">> = {};
  const errors: GuestErrors = {};
  if (!partial || data.name !== undefined) {
    const name = typeof data.name === "string" ? cleanName(data.name) : "";
    if (!name) errors.name = "Add who it’s for, like “the Patel family”.";
    else if (name.length > LIMITS.guestLabel) errors.name = `Keep it under ${LIMITS.guestLabel} characters.`;
    else value.name = name;
  }
  if (!partial || data.events !== undefined) {
    const events = eventFilter(data.events ?? "all", schedule);
    if (!events) errors.events = "Pick at least one celebration.";
    else value.events = events;
  }
  if (typeof data.phone === "string") {
    if (!data.phone.trim()) value.phone = undefined;
    else {
      const phone = normalizePhone(data.phone);
      if (!phone) errors.phone = "That doesn’t look like a WhatsApp number. Include the country code if it’s not Indian (+44…).";
      else value.phone = phone;
    }
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value };
}

/**
 * A pasted list: one household per line, optionally with a WhatsApp number after the name. Blank lines are ignored;
 * households already on the list (or repeated in the paste) are skipped rather than added twice.
 */
export function validateGuestList(input: unknown, schedule: ScheduleItem[], existing: Pick<Guest, "name">[]): { ok: true; value: { guests: { name: string; phone?: string }[]; skipped: string[]; events: EventFilter } } | { ok: false; errors: GuestErrors } {
  const data = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const errors: GuestErrors = {};
  const lines = (typeof data.list === "string" ? data.list : "").split(/\r?\n/).map(parseGuestLine).filter(l => l.name);
  const tooLong = lines.map((l, i) => (l.name.length > LIMITS.guestLabel ? i + 1 : 0)).filter(Boolean);
  if (!lines.length) errors.list = "Add at least one household, one per line.";
  else if (tooLong.length) errors.list = `Line ${tooLong.join(", ")} ${tooLong.length === 1 ? "is" : "are"} too long. Keep each name under ${LIMITS.guestLabel} characters.`;
  const events = eventFilter(data.events ?? "all", schedule);
  if (!events) errors.events = "Pick at least one celebration.";
  if (Object.keys(errors).length || !events) return { ok: false, errors };
  const guests: { name: string; phone?: string }[] = [];
  const skipped: string[] = [];
  for (const line of lines) {
    if (existing.some(g => sameName(g.name, line.name)) || guests.some(g => sameName(g.name, line.name))) skipped.push(line.name);
    else guests.push(line);
  }
  return { ok: true, value: { guests, skipped, events } };
}

/** What the general link shows. Same rules as a guest's celebrations; null if invalid. */
export const validatePublicEvents = (input: unknown, schedule: ScheduleItem[]) => eventFilter(input, schedule);
