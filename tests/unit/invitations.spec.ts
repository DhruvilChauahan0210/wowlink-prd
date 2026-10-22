import { expect, test } from "@playwright/test";
import { formatEventDay, formatInvitationDate, formatInvitationTime, formatShortDay, getInvitationTemplate, presetEvent, scheduleItemError, shiftDate, sortSchedule, validateDraft, type ScheduleItem } from "../../app/lib/invitations";

const good = { title: "Aarav & Meera", date: "2026-11-08", time: "18:00", venue: "Surat", message: "", events: [] as ScheduleItem[] };
const event = (overrides: Partial<ScheduleItem> = {}): ScheduleItem => ({ id: "mehndi", name: "Mehndi", date: "2026-11-06", time: "16:00", venue: "", ...overrides });

test("a complete draft is valid, and its text is trimmed", () => {
  const result = validateDraft({ ...good, title: "  Aarav & Meera  ", venue: " Surat " });
  expect(result).toEqual({ ok: true, value: { ...good, language: "en" } });
});

test("title, date and venue are required", () => {
  const result = validateDraft({ title: " ", date: "", time: "", venue: "", message: "" });
  expect(result.ok).toBe(false);
  if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(["date", "title", "venue"]);
});

test("impossible dates and times are rejected", () => {
  for (const date of ["2026-02-30", "2026-13-01", "26-11-08", "tomorrow"]) expect(validateDraft({ ...good, date }).ok).toBe(false);
  for (const time of ["24:00", "18:60", "6pm"]) expect(validateDraft({ ...good, time }).ok).toBe(false);
  expect(validateDraft({ ...good, date: "2028-02-29" }).ok).toBe(true);
  expect(validateDraft({ ...good, time: "" }).ok).toBe(true);
});

test("length limits are enforced", () => {
  expect(validateDraft({ ...good, title: "x".repeat(81) }).ok).toBe(false);
  expect(validateDraft({ ...good, venue: "x".repeat(141) }).ok).toBe(false);
  expect(validateDraft({ ...good, message: "x".repeat(501) }).ok).toBe(false);
});

test("anything that isn't a draft is handled safely", () => {
  for (const input of [null, undefined, 42, "text", [], { title: 5 }]) expect(validateDraft(input).ok).toBe(false);
});

test("dates and times read naturally", () => {
  expect(formatInvitationDate("2026-11-08", true)).toBe("8 November 2026");
  expect(formatInvitationDate("not a date")).toBe("A date to remember");
  expect(formatInvitationTime("18:00")).toBe("6:00 PM");
  expect(formatInvitationTime("00:05")).toBe("12:05 AM");
  expect(formatInvitationTime("")).toBe("");
});

// ---------- schedules ----------

test("drafts without a schedule are still valid (older clients and saved drafts)", () => {
  const { events: _events, ...withoutEvents } = good;
  const result = validateDraft(withoutEvents);
  expect(result.ok && result.value.events).toEqual([]);
});

test("schedule entries are trimmed, and unsafe ids are replaced", () => {
  const result = validateDraft({ ...good, events: [event({ name: "  Sangeet ", venue: " Lakeview Lawns " }), event({ id: "<script>" })] });
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.value.events[0]).toMatchObject({ id: "mehndi", name: "Sangeet", venue: "Lakeview Lawns" });
  expect(result.value.events[1].id).toMatch(/^[a-z0-9]+$/);
});

test("each schedule entry needs a name and a real date; time and venue are optional", () => {
  expect(scheduleItemError(event())).toBe("");
  expect(scheduleItemError(event({ time: "", venue: "" }))).toBe("");
  expect(scheduleItemError(event({ name: " " }))).toBe("Give this event a name.");
  expect(scheduleItemError(event({ date: "2026-11-31" }))).toBe("Pick a date for this event.");
  expect(scheduleItemError(event({ time: "7pm" }))).toBe("That time doesn’t look right.");
  expect(validateDraft({ ...good, events: [event({ name: "" })] })).toMatchObject({ ok: false, errors: { events: "One of the events in the schedule needs a look." } });
});

test("a schedule has at most 8 events", () => {
  const nine = Array.from({ length: 9 }, (_, i) => event({ id: `e${i}` }));
  expect(validateDraft({ ...good, events: nine })).toMatchObject({ ok: false, errors: { events: "A schedule can have up to 8 events." } });
  expect(validateDraft({ ...good, events: nine.slice(0, 8) }).ok).toBe(true);
});

test("wedding presets land on sensible days relative to the main day", () => {
  const wedding = getInvitationTemplate("wedding");
  const main = { date: "2026-11-08", time: "18:00" };
  expect(presetEvent(wedding, "Mehndi", main)).toMatchObject({ name: "Mehndi", date: "2026-11-06", time: "16:00", venue: "" });
  expect(presetEvent(wedding, "Haldi", main)).toMatchObject({ date: "2026-11-07", time: "10:00" });
  expect(presetEvent(wedding, "Wedding", main)).toMatchObject({ date: "2026-11-08", time: "18:00" });
  expect(shiftDate("2026-03-01", 2)).toBe("2026-02-27");
  expect(shiftDate("2027-01-01", 1)).toBe("2026-12-31");
  expect(shiftDate("not a date", 1)).toBe("not a date");
});

test("the schedule is shown in the order things happen", () => {
  const order = sortSchedule([
    event({ id: "reception", date: "2026-11-08", time: "21:00" }),
    event({ id: "wedding", date: "2026-11-08", time: "18:00" }),
    event({ id: "puja", date: "2026-11-08", time: "" }),
    event({ id: "mehndi", date: "2026-11-06", time: "16:00" }),
  ]).map((e) => e.id);
  expect(order).toEqual(["mehndi", "puja", "wedding", "reception"]);
  expect(formatEventDay("2026-11-06")).toBe("Fri, 6 Nov");
});

// ---------- Gujarati ----------

test("the language is English unless Gujarati is chosen", () => {
  expect(validateDraft({ ...good, language: "gu" })).toMatchObject({ ok: true, value: { language: "gu" } });
  expect(validateDraft({ ...good, language: "fr" })).toMatchObject({ ok: true, value: { language: "en" } });
});

test("dates and times read naturally in Gujarati, the way an invitation says them", () => {
  expect(formatInvitationDate("2026-11-08", true, "gu")).toBe("8 નવેમ્બર 2026");
  expect(formatInvitationDate("2026-11-08", false, "gu")).toBe("8 નવે 2026");
  expect(formatEventDay("2026-11-06", "gu")).toBe("શુક્ર, 6 નવે");
  expect(formatInvitationTime("10:00", "gu")).toBe("સવારે 10:00 વાગ્યે");
  expect(formatInvitationTime("13:30", "gu")).toBe("બપોરે 1:30 વાગ્યે");
  expect(formatInvitationTime("18:00", "gu")).toBe("સાંજે 6:00 વાગ્યે");
  expect(formatInvitationTime("21:00", "gu")).toBe("રાત્રે 9:00 વાગ્યે");
  expect(formatInvitationTime("00:30", "gu")).toBe("રાત્રે 12:30 વાગ્યે");
  expect(formatInvitationDate("nope", true, "gu")).toBe("યાદગાર દિવસ");
});

test("a moment's day is on India's calendar", () => {
  // 19:00 UTC on 21 October is already 22 October in India.
  expect(formatShortDay("2026-10-21T19:00:00Z")).toBe("22 Oct");
  expect(formatShortDay("2026-10-21T19:00:00Z", "gu")).toBe("22 ઑક્ટો");
});
