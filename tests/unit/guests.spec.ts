import { expect, test } from "@playwright/test";
import { answerFor, answersFor, isGuestId, missingEvents, repliesUsed, tallyByEvent, validateGuest, validatePublicEvents, viewFor, type Guest } from "../../app/lib/guests";
import type { InvitationDraft, ScheduleItem } from "../../app/lib/invitations";

// Studio order on purpose: the Haldi was added last but happens before the Sangeet.
const events: ScheduleItem[] = [
  { id: "mehndi", name: "Mehndi", date: "2026-11-06", time: "16:00", venue: "" },
  { id: "sangeet", name: "Sangeet", date: "2026-11-07", time: "19:30", venue: "Lakeview Lawns, Surat" },
  { id: "reception", name: "Reception", date: "2026-11-08", time: "21:00", venue: "" },
  { id: "haldi", name: "Haldi", date: "2026-11-07", time: "10:00", venue: "Patel home" },
];
const draft: InvitationDraft = { title: "Aarav & Meera", date: "2026-11-08", time: "18:00", venue: "The Garden House, Surat", message: "", events };
const guest = (id: string, filter: Guest["events"], name = id): Guest => ({ id, name, events: filter, createdAt: "2026-10-01T00:00:00Z" });

// ---------- what each link shows ----------

test("everyone: the whole invitation, unchanged", () => {
  expect(viewFor(draft, "all")).toEqual(draft);
  expect(viewFor(draft, ["mehndi", "sangeet", "reception", "haldi"])).toEqual(draft);
});

test("only some: just those celebrations, and the main details become their first one", () => {
  const view = viewFor(draft, ["reception", "sangeet"]);
  expect(view.events.map(e => e.id)).toEqual(["sangeet", "reception"]);
  expect(view).toMatchObject({ date: "2026-11-07", time: "19:30", venue: "Lakeview Lawns, Surat", mainEventId: "sangeet" });
  // A celebration with no venue of its own is at the main venue.
  expect(viewFor(draft, ["reception"])).toMatchObject({ date: "2026-11-08", time: "21:00", venue: "The Garden House, Surat", mainEventId: "reception" });
  // "First" is by date and time, not studio order.
  expect(viewFor(draft, ["sangeet", "haldi"]).mainEventId).toBe("haldi");
});

test("celebrations that no longer exist are ignored; if none are left, the details are withheld", () => {
  expect(viewFor(draft, ["gone", "reception"]).events.map(e => e.id)).toEqual(["reception"]);
  const pending = viewFor(draft, ["gone"]);
  expect(pending).toMatchObject({ pending: true, date: "", time: "", venue: "", events: [] });
  expect(pending.title).toBe("Aarav & Meera");
  // Without a schedule there's nothing to hide: everyone sees the occasion.
  expect(viewFor({ ...draft, events: [] }, ["gone"])).toEqual({ ...draft, events: [] });
  expect(missingEvents(["gone", "reception"], events)).toEqual(["gone"]);
  expect(missingEvents("all", events)).toEqual([]);
});

// ---------- turning a reply form into answers ----------

test("ticked celebrations get the answer, the rest are a no, each with its own party size", () => {
  const result = answersFor(draft, { attendance: "Attending", guestCount: 4, events: ["mehndi", "reception"], counts: { mehndi: 2 } });
  expect(result).toEqual({
    ok: true,
    guestCount: 4,
    byEvent: {
      mehndi: { attendance: "Attending", guestCount: 2 },
      sangeet: { attendance: "Not attending", guestCount: 0 },
      reception: { attendance: "Attending", guestCount: 4 },
      haldi: { attendance: "Not attending", guestCount: 0 },
    },
  });
  // The overall party size is the largest group coming to any one celebration.
  const split = answersFor(draft, { attendance: "Maybe", guestCount: 1, events: ["mehndi", "sangeet"], counts: { mehndi: 2, sangeet: 5 } });
  expect(split.ok && split.guestCount).toBe(5);
  // Counts that aren't a sensible number fall back to the party size.
  const odd = answersFor(draft, { attendance: "Attending", guestCount: 3, events: ["mehndi"], counts: { mehndi: 99, constructor: 2 } });
  expect(odd.ok && odd.byEvent.mehndi.guestCount).toBe(3);
});

test("not attending is a no for every celebration shown", () => {
  const result = answersFor(draft, { attendance: "Not attending", guestCount: 0, events: ["mehndi"] });
  expect(result.ok && Object.values(result.byEvent).every(a => a.attendance === "Not attending" && a.guestCount === 0)).toBe(true);
  expect(result.ok && result.guestCount).toBe(0);
});

test("coming, but to nothing, is turned back", () => {
  expect(answersFor(draft, { attendance: "Attending", guestCount: 2, events: [] })).toEqual({ ok: false, error: "Tick at least one celebration, or choose Not attending." });
  expect(answersFor(draft, { attendance: "Attending", guestCount: 2, events: "mehndi" })).toMatchObject({ ok: false });
});

test("one celebration on show needs no ticking; older pages that send no choice mean all of them", () => {
  const one = viewFor(draft, ["sangeet"]);
  expect(answersFor(one, { attendance: "Attending", guestCount: 2, events: [] })).toMatchObject({ ok: true, byEvent: { sangeet: { attendance: "Attending", guestCount: 2 } } });
  const older = answersFor(draft, { attendance: "Maybe", guestCount: 2 });
  expect(older.ok && Object.keys(older.byEvent).sort()).toEqual(["haldi", "mehndi", "reception", "sangeet"]);
});

test("answers are only recorded for what the guest saw and their link still shows", () => {
  // The Haldi was added after they opened the page: it stays unanswered, not a "no".
  const stale = answersFor(draft, { attendance: "Attending", guestCount: 2, events: ["mehndi"], shown: ["mehndi", "sangeet", "reception"] });
  expect(stale.ok && Object.keys(stale.byEvent).sort()).toEqual(["mehndi", "reception", "sangeet"]);
  // Hidden or unknown celebrations they tick are dropped, never stored.
  const narrowed = viewFor(draft, ["reception", "sangeet"]);
  const sneaky = answersFor(narrowed, { attendance: "Attending", guestCount: 2, events: ["mehndi", "sangeet"] });
  expect(sneaky.ok && Object.keys(sneaky.byEvent).sort()).toEqual(["reception", "sangeet"]);
  // Everything they ticked has since been removed: ask them to reload rather than guess.
  expect(answersFor(narrowed, { attendance: "Attending", guestCount: 2, events: ["mehndi"], shown: ["mehndi"] })).toMatchObject({ ok: false, error: expect.stringContaining("changed since you opened") });
  // While the details are being updated, nothing can be answered.
  expect(answersFor(viewFor(draft, ["gone"]), { attendance: "Attending", guestCount: 1 })).toMatchObject({ ok: false });
});

test("without a schedule there's nothing per celebration", () => {
  expect(answersFor({ ...draft, events: [] }, { attendance: "Attending", guestCount: 3 })).toEqual({ ok: true, byEvent: {}, guestCount: 3 });
});

// ---------- counting ----------

test("a reply's answer for one celebration; older replies answered for everything", () => {
  const legacy = { attendance: "Attending" as const, guestCount: 3 };
  expect(answerFor(legacy, "mehndi")).toEqual({ attendance: "Attending", guestCount: 3 });
  const reply = { attendance: "Attending" as const, guestCount: 3, byEvent: { mehndi: { attendance: "Maybe" as const, guestCount: 2 } } };
  expect(answerFor(reply, "mehndi")).toEqual({ attendance: "Maybe", guestCount: 2 });
  expect(answerFor(reply, "sangeet")).toBeNull();
  // Event ids are the host's own; one called "constructor" must not find Object.prototype.constructor.
  expect(answerFor(reply, "constructor")).toBeNull();
});

test("the headcount for each celebration: people coming, maybes, can'ts, and who hasn't said", () => {
  const guests = [guest("patel", ["sangeet", "reception"]), guest("shah", "all"), guest("desai", ["mehndi"])];
  const replies: Parameters<typeof tallyByEvent>[1] = [
    // A general-link reply with a different number for the Mehndi.
    { attendance: "Attending" as const, guestCount: 4, byEvent: { mehndi: { attendance: "Attending" as const, guestCount: 2 }, sangeet: { attendance: "Attending" as const, guestCount: 4 }, reception: { attendance: "Not attending" as const, guestCount: 0 }, haldi: { attendance: "Maybe" as const, guestCount: 3 } } },
    // The Patels answered for the Sangeet only; the Reception was added to their invitation later.
    { attendance: "Maybe" as const, guestCount: 2, guestId: "patel", byEvent: { sangeet: { attendance: "Maybe" as const, guestCount: 2 } } },
    // The Shahs replied before replies had answers per celebration: their yes counts for every one.
    { attendance: "Attending" as const, guestCount: 5, guestId: "shah" },
  ];
  const rows = Object.fromEntries(tallyByEvent(events, replies, guests).map(r => [r.event.id, r]));
  expect(tallyByEvent(events, replies, guests).map(r => r.event.id)).toEqual(["mehndi", "haldi", "sangeet", "reception"]);
  expect(rows.mehndi).toMatchObject({ coming: 7, comingReplies: 2, maybe: 0, cant: 0, waiting: 1 });
  expect(rows.haldi).toMatchObject({ coming: 5, maybe: 3, maybeReplies: 1, waiting: 0 });
  expect(rows.sangeet).toMatchObject({ coming: 9, comingReplies: 2, maybe: 2, maybeReplies: 1, waiting: 0 });
  expect(rows.reception).toMatchObject({ coming: 5, cant: 1, waiting: 1 });
});

test("a household taken off a celebration isn't counted for it, whatever they said", () => {
  const replies = [{ attendance: "Attending" as const, guestCount: 4, guestId: "patel", byEvent: { mehndi: { attendance: "Attending" as const, guestCount: 4 }, reception: { attendance: "Attending" as const, guestCount: 4 } } }];
  const rows = Object.fromEntries(tallyByEvent(events, replies, [guest("patel", ["reception"])]).map(r => [r.event.id, r]));
  expect(rows.mehndi.coming).toBe(0);
  expect(rows.reception.coming).toBe(4);
});

test("the free plan counts general replies plus one place per personal invitation", () => {
  expect(repliesUsed([{ guestId: "a" }, {}, {}], [1, 2, 3])).toBe(5);
});

// ---------- validation ----------

test("a personal invitation needs a name; celebrations default to all", () => {
  expect(validateGuest({ name: "  the   Patel family " }, events)).toEqual({ ok: true, value: { name: "the Patel family", events: "all" } });
  expect(validateGuest({ name: " " }, events)).toMatchObject({ ok: false, errors: { name: expect.any(String) } });
  expect(validateGuest({ name: "x".repeat(81) }, events)).toMatchObject({ ok: false });
  expect(validateGuest(null, events)).toMatchObject({ ok: false });
});

test("its celebrations must exist; ticking every one is still a list (new celebrations won't be added to it)", () => {
  expect(validateGuest({ name: "Patel", events: ["reception", "nope", "mehndi", "mehndi"] }, events)).toEqual({ ok: true, value: { name: "Patel", events: ["mehndi", "reception"] } });
  expect(validateGuest({ name: "Patel", events: events.map(e => e.id) }, events)).toMatchObject({ ok: true, value: { events: ["mehndi", "sangeet", "reception", "haldi"] } });
  expect(validateGuest({ name: "Patel", events: [] }, events)).toEqual({ ok: false, errors: { events: "Pick at least one celebration." } });
  expect(validateGuest({ name: "Patel", events: ["nope"] }, events)).toMatchObject({ ok: false });
  // No schedule: invited to the occasion.
  expect(validateGuest({ name: "Patel", events: ["nope"] }, [])).toEqual({ ok: true, value: { name: "Patel", events: "all" } });
});

test("editing changes only what's given", () => {
  expect(validateGuest({ events: ["sangeet"] }, events, true)).toEqual({ ok: true, value: { events: ["sangeet"] } });
  expect(validateGuest({}, events, true)).toEqual({ ok: true, value: {} });
  expect(validatePublicEvents("all", events)).toBe("all");
  expect(validatePublicEvents([], events)).toBeNull();
});

test("personal link ids are 8 characters from the slug alphabet", () => {
  expect(isGuestId("bKLRnYc2")).toBe(true);
  for (const bad of ["bKLRnYc", "bKLRnYc23", "aKLRnYc2", "bKLRnYl2", "../../xx", 12345678, null]) expect(isGuestId(bad)).toBe(false);
});
