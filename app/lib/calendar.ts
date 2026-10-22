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
export function calendarEvents(draft: InvitationDraft, url?: string, slug = "") {
  if (!draft.events.length) return [{ ...draft, url, uid: slug || undefined }];
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
