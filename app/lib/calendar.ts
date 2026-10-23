import type { InvitationDraft } from "./invitations";

/*
 * "Add to calendar" for an invitation: an .ics file (Apple Calendar, Outlook, most others) and a Google Calendar link.
 *
 * Invitations store a date and an optional time but no timezone. WowLink's occasions are in India, so times
 * are read as India Standard Time (IST is UTC+5:30 all year, with no daylight saving). Without a time, the
 * event is all-day. With a time, it is given three hours.
 */

export const EVENT_TIMEZONE = "Asia/Kolkata";
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DEFAULT_LENGTH_HOURS = 3;

type Event = Pick<InvitationDraft, "title" | "date" | "time" | "venue" | "message"> & { url?: string; uid?: string };

const pad = (n: number) => String(n).padStart(2, "0");
const parts = (date: string) => date.split("-").map(Number) as [number, number, number];

/** Wall-clock start and end as "YYYYMMDD" (all-day) or "YYYYMMDDTHHMMSS" (timed, local to IST). */
function span(date: string, time: string) {
  const [y, m, d] = parts(date);
  if (!time) {
    const next = new Date(Date.UTC(y, m - 1, d + 1));
    return { allDay: true, start: `${y}${pad(m)}${pad(d)}`, end: `${next.getUTCFullYear()}${pad(next.getUTCMonth() + 1)}${pad(next.getUTCDate())}` };
  }
  const [hh, mm] = time.split(":").map(Number);
  // Do the arithmetic on a UTC clock so adding hours rolls over days and months correctly.
  const start = new Date(Date.UTC(y, m - 1, d, hh, mm));
  const end = new Date(start.getTime() + DEFAULT_LENGTH_HOURS * 3600_000);
  const stamp = (t: Date) => `${t.getUTCFullYear()}${pad(t.getUTCMonth() + 1)}${pad(t.getUTCDate())}T${pad(t.getUTCHours())}${pad(t.getUTCMinutes())}00`;
  return { allDay: false, start: stamp(start), end: stamp(end) };
}

/** The real moment the occasion starts, in epoch ms (midnight IST if there's no time). */
export function eventStartMs(date: string, time: string) {
  const [y, m, d] = parts(date);
  const [hh, mm] = time ? time.split(":").map(Number) : [0, 0];
  return Date.UTC(y, m - 1, d, hh, mm) - IST_OFFSET_MS;
}

/** Days from today to the occasion's date, both counted on India's calendar. */
export function daysUntil(date: string, now = Date.now()) {
  const [y, m, d] = parts(date);
  const todayIst = new Date(now + IST_OFFSET_MS);
  const today = Date.UTC(todayIst.getUTCFullYear(), todayIst.getUTCMonth(), todayIst.getUTCDate());
  return Math.round((Date.UTC(y, m - 1, d) - today) / 86_400_000);
}

/** A celebration on the day: still to come today, or under way right now. */
export type TodayItem = { name: string; time: string; venue: string; now: boolean };
export type DayPhase = { phase: "before" } | { phase: "today"; items: TodayItem[] } | { phase: "after" };

/**
 * Where an invitation stands right now, for the celebrations this link shows (or the occasion itself).
 *   today   something is still to come today, or is under way (a timed celebration lasts three hours)
 *   after   every one of them is over (an all-day one ends at midnight, India time)
 *   before  otherwise, including a day whose only celebration has already finished, with more to come
 */
export function dayPhase(draft: Pick<InvitationDraft, "date" | "time" | "venue" | "events">, now: number): DayPhase {
  const all = draft.events.length ? draft.events : [{ name: "", date: draft.date, time: draft.time, venue: "" }];
  const items = all.filter((e) => /^\d{4}-\d{2}-\d{2}$/.test(e.date)).map((e) => {
    const start = eventStartMs(e.date, e.time);
    const end = e.time ? start + DEFAULT_LENGTH_HOURS * 3600_000 : eventStartMs(e.date, "") + 24 * 3600_000;
    return { name: e.name, time: e.time, venue: e.venue || draft.venue, start, end, dayStart: eventStartMs(e.date, "") };
  });
  if (!items.length) return { phase: "before" };
  if (items.every((e) => e.end <= now)) return { phase: "after" };
  // Its day has begun and it isn't over (a late celebration running past midnight still counts).
  const today = items.filter((e) => e.dayStart <= now && e.end > now)
    .sort((a, b) => a.start - b.start)
    .map(({ name, time, venue, start }) => ({ name, time, venue, now: !!time && start <= now }));
  return today.length ? { phase: "today", items: today } : { phase: "before" };
}

const describe = (e: Event) => [e.message, e.url && `Your invitation: ${e.url}`].filter(Boolean).join("\n\n");

export function googleCalendarUrl(e: Event) {
  const { start, end } = span(e.date, e.time);
  const params = new URLSearchParams({ action: "TEMPLATE", text: e.title, dates: `${start}/${end}`, details: describe(e), location: e.venue, ctz: EVENT_TIMEZONE });
  return `https://calendar.google.com/calendar/render?${params}`;
}

// RFC 5545: escape text, and fold lines longer than 75 octets.
const text = (value: string) => value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
function fold(line: string) {
  const encoder = new TextEncoder();
  const out: string[] = [];
  let current = "";
  for (const char of line) {
    if (encoder.encode(current + char).length > (out.length ? 74 : 75)) {
      out.push(current);
      current = "";
    }
    current += char;
  }
  out.push(current);
  return out.join("\r\n ");
}

/** One or more events as an .ics file. Several events (a whole wedding schedule) go in one file. */
export function toIcs(input: Event | Event[], now = new Date()) {
  const events = Array.isArray(input) ? input : [input];
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const spans = events.map((e) => span(e.date, e.time));
  const anyTimed = spans.some((s) => !s.allDay);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//WowLink//Invitations//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...(anyTimed ? ["BEGIN:VTIMEZONE", `TZID:${EVENT_TIMEZONE}`, "BEGIN:STANDARD", "DTSTART:19700101T000000", "TZOFFSETFROM:+0530", "TZOFFSETTO:+0530", "TZNAME:IST", "END:STANDARD", "END:VTIMEZONE"] : []),
    ...events.flatMap((e, i) => {
      const { allDay, start, end } = spans[i];
      return [
        "BEGIN:VEVENT",
        `UID:${e.uid ?? `${start}-${e.title.length}`}@wowlink`,
        `DTSTAMP:${stamp}`,
        ...(allDay ? [`DTSTART;VALUE=DATE:${start}`, `DTEND;VALUE=DATE:${end}`] : [`DTSTART;TZID=${EVENT_TIMEZONE}:${start}`, `DTEND;TZID=${EVENT_TIMEZONE}:${end}`]),
        `SUMMARY:${text(e.title)}`,
        ...(e.venue ? [`LOCATION:${text(e.venue)}`] : []),
        ...(describe(e) ? [`DESCRIPTION:${text(describe(e))}`] : []),
        ...(e.url ? [`URL:${e.url}`] : []),
        "END:VEVENT",
      ];
    }),
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

/** The occasion's events as calendar entries: each schedule item ("Mehndi · Aarav & Meera"), or just the main event. */
export function calendarEvents(draft: InvitationDraft, url?: string, slug = ""): Event[] {
  const { title, date, time, venue, message } = draft;
  if (!draft.events.length) return [{ title, date, time, venue, message, url, uid: slug || undefined }];
  return draft.events.map((item) => ({
    title: `${item.name} · ${draft.title}`,
    date: item.date,
    time: item.time,
    venue: item.venue || draft.venue,
    message: draft.message,
    url,
    uid: slug ? `${slug}-${item.id}` : undefined,
  }));
}

/**
 * The calendar file a link serves, for the invitation as that link shows it (`view.events` are only that guest's).
 *   which = null     every event they can see
 *   which = "main"   the main details (their first celebration, when they only see some)
 *   which = <id>     one of their celebrations
 * Event UIDs don't depend on the link, so adding the same event twice updates it instead of duplicating it.
 */
export function calendarFile(view: InvitationDraft & { mainEventId?: string; pending?: boolean }, url: string, slug: string, which: string | null) {
  // While the host is updating it, there's nothing to put in a calendar.
  if (view.pending) return new Response("This invitation’s details are being updated.", { status: 404 });
  const all = calendarEvents(view, url, slug);
  const { title, date, time, venue, message } = view;
  const events = which === "main"
    ? view.mainEventId ? all.filter((e) => e.uid === `${slug}-${view.mainEventId}`) : [{ title, date, time, venue, message, url, uid: slug }]
    : which ? all.filter((e) => e.uid === `${slug}-${which}`) : all;
  if (!events.length) return new Response("That event isn’t in this invitation.", { status: 404 });
  const filename = title.replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "invitation";
  return new Response(toIcs(events), {
    headers: { "content-type": "text/calendar; charset=utf-8", "content-disposition": `attachment; filename="${filename}.ics"`, "cache-control": "no-store" },
  });
}
