import { answerFor, invitedTo, tallyByEvent } from "./guests";
import { formatEventDay, formatInvitationTime, sortSchedule } from "./invitations";
import type { Experience, Rsvp } from "./store";

/*
 * Spreadsheets for the host: every reply, the headcount for each celebration (for the caterer), and the list of
 * personal invitations with their links. CSV that Excel, Numbers and Google Sheets all open as-is.
 */

type Cell = string | number;

/**
 * One cell: quoted when it has to be, and text starting with = + - @ is prefixed with ' so a spreadsheet shows it
 * instead of running it as a formula (guests type their own names).
 */
function cell(value: Cell) {
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Rows as CSV, starting with a byte-order mark so Excel reads Gujarati names correctly. */
export const toCsv = (rows: Cell[][]) => `﻿${rows.map(row => row.map(cell).join(",")).join("\r\n")}\r\n`;

const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
/** "91 98250 12345": no leading +, so spreadsheets keep it as text rather than a number or a formula. */
const phoneCell = (phone?: string) => (!phone ? "" : /^91\d{10}$/.test(phone) ? `91 ${phone.slice(2, 7)} ${phone.slice(7)}` : phone);
const celebration = (e: { name: string; date: string }) => `${e.name} (${formatEventDay(e.date)})`;

/** Every reply, latest first, with a column per celebration: the number coming, "Maybe (n)", "No", or blank if not asked. */
export function repliesCsv({ experience, rsvps }: { experience: Experience; rsvps: Rsvp[] }) {
  const schedule = sortSchedule(experience.events);
  const households = new Map(experience.guests.map(g => [g.id, g]));
  const rows: Cell[][] = [["Name", "Household", "Reply", "People", ...schedule.map(celebration), "Sent"]];
  for (const r of rsvps) {
    const household = r.guestId ? households.get(r.guestId) : undefined;
    rows.push([
      r.name || household?.name || "",
      household?.name ?? "",
      r.attendance,
      r.attendance === "Not attending" ? 0 : r.guestCount,
      ...schedule.map(e => {
        // Same rule as the headcount: a household taken off a celebration isn't counted for it.
        if (household && !invitedTo(household.events, e.id)) return "";
        const answer = answerFor(r, e.id);
        return !answer ? "" : answer.attendance === "Attending" ? answer.guestCount : answer.attendance === "Maybe" ? `Maybe (${answer.guestCount})` : "No";
      }),
      when(r.updatedAt ?? r.createdAt),
    ]);
  }
  return toCsv(rows);
}

/** The caterer's sheet: one row per celebration. */
export function headcountCsv({ experience, rsvps }: { experience: Experience; rsvps: Rsvp[] }) {
  const rows: Cell[][] = [["Celebration", "Date", "Time", "Venue", "Coming (people)", "Coming (replies)", "Maybe (people)", "Maybe (replies)", "Can’t make it (replies)", "Yet to reply (personal invitations)"]];
  for (const t of tallyByEvent(experience.events, rsvps, experience.guests)) {
    rows.push([t.event.name, formatEventDay(t.event.date), formatInvitationTime(t.event.time) || "All day", t.event.venue || experience.venue, t.coming, t.comingReplies, t.maybe, t.maybeReplies, t.cant, t.waiting]);
  }
  return toCsv(rows);
}

/** Personal invitations with their links (to send another way, or keep), and where each stands. */
export function invitationsCsv({ experience, rsvps }: { experience: Experience; rsvps: Rsvp[] }, origin: string) {
  const schedule = sortSchedule(experience.events);
  const rows: Cell[][] = [["Household", "Link", "WhatsApp", "Celebrations", "Opened", "Reply", "People", "Replied on"]];
  for (const g of experience.guests) {
    const reply = rsvps.find(r => r.guestId === g.id);
    const celebrations = g.events === "all" ? "Every celebration" : schedule.filter(e => g.events.includes(e.id)).map(e => e.name).join(", ");
    rows.push([g.name, `${origin}/e/${experience.slug}/${g.id}`, phoneCell(g.phone), schedule.length ? celebrations : "", g.lastOpenedAt ? when(g.lastOpenedAt) : "Not yet", reply?.attendance ?? "No reply yet", reply && reply.attendance !== "Not attending" ? reply.guestCount : "", reply ? when(reply.updatedAt ?? reply.createdAt) : ""]);
  }
  return toCsv(rows);
}

/** A file name from the invitation's title: "isha-kabir-replies.csv". */
export const csvName = (title: string, what: string) => `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "invitation"}-${what}.csv`;
