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

/** A household with its own link. The id is also the secret part of that link. */
export type Guest = { id: string; name: string; events: EventFilter; createdAt: string };

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

export type GuestErrors = { name?: string; events?: string };

/** A new or edited personal invitation. With `partial`, missing fields are left as they are. */
export function validateGuest(input: unknown, schedule: ScheduleItem[], partial = false): { ok: true; value: Partial<Pick<Guest, "name" | "events">> } | { ok: false; errors: GuestErrors } {
  const data = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const value: Partial<Pick<Guest, "name" | "events">> = {};
  const errors: GuestErrors = {};
  if (!partial || data.name !== undefined) {
    const name = typeof data.name === "string" ? data.name.trim().replace(/\s+/g, " ") : "";
    if (!name) errors.name = "Add who it’s for, like “the Patel family”.";
    else if (name.length > LIMITS.guestLabel) errors.name = `Keep it under ${LIMITS.guestLabel} characters.`;
    else value.name = name;
  }
  if (!partial || data.events !== undefined) {
    const events = eventFilter(data.events ?? "all", schedule);
    if (!events) errors.events = "Pick at least one celebration.";
    else value.events = events;
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value };
}

/** What the general link shows. Same rules as a guest's celebrations; null if invalid. */
export const validatePublicEvents = (input: unknown, schedule: ScheduleItem[]) => eventFilter(input, schedule);
