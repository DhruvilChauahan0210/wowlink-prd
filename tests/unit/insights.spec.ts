import { expect, test } from "@playwright/test";
import { bump, dayKey, emptyStats, isShareChannel, lastDays, percent, summarise, trimDays, type Metrics } from "../../app/lib/insights";

const at = (iso: string) => new Date(iso).getTime();

test("days are India's calendar days", () => {
  // 7:00 PM in London is 12:30 AM the next day in India.
  expect(dayKey(at("2026-10-22T19:00:00Z"))).toBe("2026-10-23");
  expect(dayKey(at("2026-10-22T18:29:00Z"))).toBe("2026-10-22");
  expect(lastDays(3, at("2026-03-01T06:00:00Z"))).toEqual(["2026-02-27", "2026-02-28", "2026-03-01"]);
});

test("day counts are kept for a while, then dropped", () => {
  const days: Record<string, number> = { "2026-08-01": 4, "2026-10-01": 2, "2026-10-23": 1 };
  trimDays(days, 60, at("2026-10-23T06:00:00Z"));
  expect(days).toEqual({ "2026-10-01": 2, "2026-10-23": 1 });
});

test("app-wide counts add up by day, and summarise over a window", () => {
  const metrics: Metrics = {};
  const now = at("2026-10-23T06:00:00Z");
  bump(metrics, "view", now);
  bump(metrics, "view", now, 2);
  bump(metrics, "view", at("2026-10-20T06:00:00Z"));
  bump(metrics, "published", at("2026-09-01T06:00:00Z"));
  expect(metrics["2026-10-23"]).toEqual({ view: 3 });
  const week = summarise(metrics, 7, now, ["view"]);
  expect(week.totals).toEqual({ view: 4 });
  expect(week.dates).toHaveLength(7);
  expect(week.daily.view).toEqual([0, 0, 0, 1, 0, 0, 3]);
  expect(summarise(metrics, 90, now).totals).toEqual({ view: 4, published: 1 });
});

test("percentages never go over 100, and nothing divides by zero", () => {
  expect(percent(1, 3)).toBe(33);
  expect(percent(5, 4)).toBe(100);
  expect(percent(3, 0)).toBe(0);
});

test("only known ways of sharing count, and new stats start empty", () => {
  for (const channel of ["whatsapp", "copy", "native", "qr", "personal"]) expect(isShareChannel(channel)).toBe(true);
  for (const channel of ["email", "", null, "toString"]) expect(isShareChannel(channel)).toBe(false);
  expect(emptyStats("2026-10-23T00:00:00.000Z")).toEqual({ since: "2026-10-23T00:00:00.000Z", views: 0, visitors: 0, played: 0, viaQr: 0, shares: {}, days: {} });
});
