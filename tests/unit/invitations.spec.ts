import { expect, test } from "@playwright/test";
import { formatInvitationDate, formatInvitationTime, validateDraft } from "../../app/lib/invitations";

const good = { title: "Aarav & Meera", date: "2026-11-08", time: "18:00", venue: "Surat", message: "" };

test("a complete draft is valid, and its text is trimmed", () => {
  const result = validateDraft({ ...good, title: "  Aarav & Meera  ", venue: " Surat " });
  expect(result).toEqual({ ok: true, value: { ...good } });
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
