import { expect, test } from "@playwright/test";
import { daysUntil, eventStartMs, googleCalendarUrl, toIcs } from "../../app/lib/calendar";

const event = { title: "Isha & Kabir", date: "2026-11-08", time: "18:00", venue: "Lakeview Lawns, Udaipur", message: "" };
const at = (iso: string) => new Date(iso).getTime();

test("an evening event runs three hours, in IST", () => {
  const ics = toIcs(event, new Date("2026-10-01T00:00:00Z"));
  expect(ics).toContain("DTSTART;TZID=Asia/Kolkata:20261108T180000");
  expect(ics).toContain("DTEND;TZID=Asia/Kolkata:20261108T210000");
  expect(ics).toContain("TZOFFSETTO:+0530");
  expect(ics).toContain("DTSTAMP:20261001T000000Z");
});

test("a late event rolls over into the next day, month and year", () => {
  expect(toIcs({ ...event, date: "2026-12-31", time: "22:30" })).toContain("DTEND;TZID=Asia/Kolkata:20270101T013000");
});

test("without a time it is an all-day event, ending the next day", () => {
  const ics = toIcs({ ...event, date: "2027-02-28", time: "" });
  expect(ics).toContain("DTSTART;VALUE=DATE:20270228");
  expect(ics).toContain("DTEND;VALUE=DATE:20270301");
  expect(ics).not.toContain("VTIMEZONE");
});

test("text is escaped and long lines are folded at 75 bytes, even with multi-byte characters", () => {
  const ics = toIcs({ ...event, title: "Raas; Garba, \\ fun", message: `${"રાસ ગરબા ".repeat(20)}\nLine two` });
  // Title "Raas; Garba, \ fun" → ";" "," and "\" each get a backslash in front.
  expect(ics).toContain(String.raw`SUMMARY:Raas\; Garba\, \\ fun`);
  for (const line of ics.split("\r\n")) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  // Unfolding must give back the original text.
  const unfolded = ics.replace(/\r\n /g, "");
  expect(unfolded).toContain("રાસ ગરબા રાસ ગરબા");
  expect(unfolded).toContain("\\nLine two");
});

test("Google Calendar link carries the dates and the timezone", () => {
  const params = new URL(googleCalendarUrl({ ...event, url: "https://wowlink.example/e/abc" })).searchParams;
  expect(params.get("dates")).toBe("20261108T180000/20261108T210000");
  expect(params.get("ctz")).toBe("Asia/Kolkata");
  expect(params.get("details")).toContain("https://wowlink.example/e/abc");
});

test("days are counted on India's calendar, not the device's", () => {
  // 19:00 UTC on 7 Nov is already 00:30 on 8 Nov in India.
  expect(daysUntil("2026-11-08", at("2026-11-07T19:00:00Z"))).toBe(0);
  expect(daysUntil("2026-11-08", at("2026-11-07T18:00:00Z"))).toBe(1);
  expect(daysUntil("2026-11-08", at("2026-10-22T04:30:00Z"))).toBe(17);
  expect(daysUntil("2026-11-08", at("2026-11-09T12:00:00Z"))).toBe(-1);
});

test("the event starts at the right instant", () => {
  expect(new Date(eventStartMs("2026-11-08", "18:00")).toISOString()).toBe("2026-11-08T12:30:00.000Z");
  expect(new Date(eventStartMs("2026-11-08", "")).toISOString()).toBe("2026-11-07T18:30:00.000Z");
});
