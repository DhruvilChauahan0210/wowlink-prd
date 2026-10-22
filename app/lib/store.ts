import { createHash, randomBytes, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { answersFor, isGuestId, repliesUsed, validateGuest, validateGuestList, validatePublicEvents, viewFor, type AudienceView, type ByEvent, type EventFilter, type Guest, type GuestErrors } from "./guests";
import { LIMITS, type Attendance, type InvitationDraft, type TemplateId } from "./invitations";

/*
 * Where published invitations and RSVPs live.
 *
 * For now this is a single JSON file (.data/wowlink.json, git-ignored). That's fine for one server
 * process and for trying the product out; it is not meant for production. Everything that touches
 * storage goes through the functions below, so swapping in Supabase later means rewriting this file only.
 *
 * - Every read and write runs through one queue, and writes replace the file atomically, so two
 *   requests at once can't interleave or leave a half-written file.
 * - Owners prove themselves with a random manage key. Only its SHA-256 hash is stored.
 */

export type Experience = InvitationDraft & {
  id: string;
  slug: string;
  templateId: TemplateId;
  status: "published" | "unpublished";
  createdAt: string;
  updatedAt: string;
  /** Households with their own link. */
  guests: Guest[];
  /** The celebrations the general link shows. */
  publicEvents: EventFilter;
  /** Whether guests' wishes are shown on the invitation (the host always sees them). */
  showWishes: boolean;
};
export type Rsvp = {
  id: string;
  experienceId: string;
  name: string;
  attendance: Attendance;
  guestCount: number;
  createdAt: string;
  /** Set when a personal link replies again, which replaces its earlier reply. */
  updatedAt?: string;
  /** The personal invitation this reply came from (one reply per household). */
  guestId?: string;
  /** The answer for each celebration the guest was shown. Missing on replies sent before this existed. */
  byEvent?: ByEvent;
  /** A wish or blessing left with the reply, and whether the host has hidden it from the invitation. */
  wish?: string;
  wishHidden?: boolean;
};
/** A wish as guests see it on the invitation: the words, and the name its writer typed (if any). */
export type PublicWish = { name: string; text: string };
/**
 * What a guest is allowed to see: the invitation as their link shows it, and the wishes on show
 * (null when the host keeps wishes to themselves, so the reply form can say who will see one).
 */
export type PublicExperience = AudienceView & Pick<Experience, "slug" | "templateId"> & { wishes: PublicWish[] | null };
/** A household's reply as their link shows it back to them: who sent it, when, and what it said. */
export type HouseholdReply = Pick<Rsvp, "name" | "attendance" | "guestCount" | "byEvent" | "wish"> & { at: string };
/** A personal link's household, and their reply so far. */
export type GuestView = { experience: PublicExperience; guest: Pick<Guest, "id" | "name">; reply: HouseholdReply | null };

type StoredExperience = Experience & { keyHash: string };
type Db = { experiences: StoredExperience[]; rsvps: Rsvp[] };

// Tests point this at their own file so they never touch real data.
const FILE = process.env.WOWLINK_DATA_FILE ? path.resolve(process.env.WOWLINK_DATA_FILE) : path.join(process.cwd(), ".data", "wowlink.json");

// Survives dev-server hot reloads, so there is only ever one queue.
const g = globalThis as typeof globalThis & { __wowlinkQueue?: Promise<unknown> };

function serialized<T>(task: () => Promise<T>): Promise<T> {
  const run = (g.__wowlinkQueue ?? Promise.resolve()).then(task, task);
  g.__wowlinkQueue = run.catch(() => undefined);
  return run;
}

// Invitations saved before schedules, guest lists or languages existed: none of the first two, and English.
const withDefaults = (e: StoredExperience): StoredExperience => ({ ...e, events: e.events ?? [], guests: e.guests ?? [], publicEvents: e.publicEvents ?? "all", language: e.language ?? "en", showWishes: e.showWishes ?? false });

async function load(): Promise<Db> {
  try {
    const db = JSON.parse(await fs.readFile(FILE, "utf8")) as Db;
    return { experiences: (db.experiences ?? []).map(withDefaults), rsvps: db.rsvps ?? [] };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { experiences: [], rsvps: [] };
    throw error;
  }
}

async function save(db: Db) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2));
  await fs.rename(tmp, FILE);
}

const read = <T>(fn: (db: Db) => T) => serialized(async () => fn(await load()));
/** Run a change. Results with `ok: false` changed nothing, so the file isn't rewritten for them. */
const write = <T>(fn: (db: Db) => T) =>
  serialized(async () => {
    const db = await load();
    const result = fn(db);
    if ((result as { ok?: boolean } | null)?.ok !== false) await save(db);
    return result;
  });

// ---------- keys and slugs ----------

const hash = (key: string) => createHash("sha256").update(key).digest("hex");

function keyMatches(stored: string, key: string) {
  const a = Buffer.from(stored, "hex");
  const b = Buffer.from(hash(key), "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

// No vowels, and no look-alikes (0/O, 1/l/I), so slugs never spell words and read well aloud.
const SLUG_ALPHABET = "23456789bcdfghjkmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ";
function newSlug(taken: Set<string>, length = 7) {
  for (;;) {
    const slug = Array.from({ length }, () => SLUG_ALPHABET[randomInt(SLUG_ALPHABET.length)]).join("");
    if (!taken.has(slug)) return slug;
  }
}

const draftOf = ({ title, date, time, venue, message, events, language }: Experience): InvitationDraft => ({ title, date, time, venue, message, events, language });
/** The most wishes an invitation shows (the latest ones). */
const SHOWN_WISHES = 30;
/**
 * The wishes on show, latest first. Only the name the writer typed goes with each: never a household's name from
 * the host's list, which would reveal who else is invited.
 */
const publicWishes = (db: Db, e: Experience): PublicWish[] | null =>
  !e.showWishes ? null : db.rsvps
    .filter((r) => r.experienceId === e.id && r.wish && !r.wishHidden)
    .sort((a, b) => (b.updatedAt ?? b.createdAt).localeCompare(a.updatedAt ?? a.createdAt))
    .slice(0, SHOWN_WISHES)
    .map((r) => ({ name: r.name, text: r.wish! }));
/** The invitation as one link shows it: only the fields a guest may see, and only their celebrations. */
const toPublic = (db: Db, e: Experience, filter: EventFilter): PublicExperience => ({ slug: e.slug, templateId: e.templateId, ...viewFor(draftOf(e), filter), wishes: publicWishes(db, e) });
const strip = ({ keyHash: _keyHash, ...experience }: StoredExperience): Experience => experience;

// ---------- experiences ----------

export function createExperience(templateId: TemplateId, draft: InvitationDraft) {
  return write((db) => {
    const key = randomBytes(24).toString("base64url");
    const now = new Date().toISOString();
    const stored: StoredExperience = {
      ...draft,
      id: randomUUID(),
      slug: newSlug(new Set(db.experiences.map((e) => e.slug))),
      templateId,
      status: "published",
      createdAt: now,
      updatedAt: now,
      guests: [],
      publicEvents: "all",
      showWishes: false,
      keyHash: hash(key),
    };
    db.experiences.push(stored);
    return { experience: strip(stored), key };
  });
}

/** The general link's view of a published invitation, or null if it doesn't exist or has been unpublished. */
export function getPublished(slug: string) {
  return read((db) => {
    const found = db.experiences.find((e) => e.slug === slug && e.status === "published");
    return found ? toPublic(db, found, found.publicEvents) : null;
  });
}

/** A personal link's view: only that household's celebrations, who it's for, and their reply so far. */
export function getGuestView(slug: string, guestId: string) {
  return read((db): GuestView | null => {
    if (!isGuestId(guestId)) return null;
    const found = db.experiences.find((e) => e.slug === slug && e.status === "published");
    const guest = found?.guests.find((g) => g.id === guestId);
    if (!found || !guest) return null;
    const reply = db.rsvps.find((r) => r.experienceId === found.id && r.guestId === guest.id);
    const experience = toPublic(db, found, guest.events);
    // Only answers for celebrations this link still shows.
    const byEvent = reply?.byEvent && Object.fromEntries(Object.entries(reply.byEvent).filter(([id]) => experience.events.some((e) => e.id === id)));
    return {
      experience,
      guest: { id: guest.id, name: guest.name },
      reply: reply ? { name: reply.name, attendance: reply.attendance, guestCount: reply.guestCount, ...(byEvent && { byEvent }), ...(reply.wish && { wish: reply.wish }), at: reply.updatedAt ?? reply.createdAt } : null,
    };
  });
}

/** The full invitation (guest list included) and its RSVPs, latest first, but only for whoever holds its manage key. */
export function getOwned(slug: string, key: string) {
  return read((db) => {
    const found = db.experiences.find((e) => e.slug === slug);
    if (!found || !keyMatches(found.keyHash, key)) return null;
    const latest = (r: Rsvp) => r.updatedAt ?? r.createdAt;
    const rsvps = db.rsvps.filter((r) => r.experienceId === found.id).sort((a, b) => latest(b).localeCompare(latest(a)));
    return { experience: strip(found), rsvps };
  });
}

type Patch = { templateId?: TemplateId; draft?: InvitationDraft; status?: Experience["status"]; publicEvents?: unknown; showWishes?: boolean };

/** Edit an invitation. `publicEvents` is checked here, against the schedule as it is after this edit. */
export function updateOwned(slug: string, key: string, patch: Patch) {
  return write((db): { ok: true; experience: Experience } | { ok: false; reason: "not-yours" | "invalid" } => {
    const found = db.experiences.find((e) => e.slug === slug);
    if (!found || !keyMatches(found.keyHash, key)) return { ok: false, reason: "not-yours" };
    const publicEvents = patch.publicEvents === undefined ? undefined : validatePublicEvents(patch.publicEvents, patch.draft?.events ?? found.events);
    if (publicEvents === null) return { ok: false, reason: "invalid" };
    if (patch.templateId) found.templateId = patch.templateId;
    if (patch.draft) Object.assign(found, patch.draft);
    if (patch.status) found.status = patch.status;
    if (publicEvents) found.publicEvents = publicEvents;
    if (patch.showWishes !== undefined) found.showWishes = patch.showWishes;
    found.updatedAt = new Date().toISOString();
    return { ok: true, experience: strip(found) };
  });
}

// ---------- personal invitations (owner only) ----------

type GuestResult = { ok: true; guest: Guest } | { ok: false; reason: "not-yours" | "missing" | "full" } | { ok: false; reason: "invalid"; errors: GuestErrors };

const rsvpsOf = (db: Db, experience: Experience) => db.rsvps.filter((r) => r.experienceId === experience.id);
/** A fresh link id, never one this invitation has used before (a removed household's id must not come back). */
const newGuestId = (db: Db, experience: Experience) => newSlug(new Set([...experience.guests.map((g) => g.id), ...rsvpsOf(db, experience).flatMap((r) => (r.guestId ? [r.guestId] : []))]), 8);

export function addGuest(slug: string, key: string, input: unknown) {
  return write((db): GuestResult => {
    const found = db.experiences.find((e) => e.slug === slug);
    if (!found || !keyMatches(found.keyHash, key)) return { ok: false, reason: "not-yours" };
    if (found.guests.length >= LIMITS.guestList || repliesUsed(rsvpsOf(db, found), found.guests) >= LIMITS.rsvpsPerEvent) return { ok: false, reason: "full" };
    const checked = validateGuest(input, found.events);
    if (!checked.ok) return { ok: false, reason: "invalid", errors: checked.errors };
    const { name, events, phone } = checked.value;
    const guest: Guest = { id: newGuestId(db, found), name: name!, events: events!, createdAt: new Date().toISOString(), ...(phone && { phone }) };
    found.guests.push(guest);
    return { ok: true, guest };
  });
}

type GuestListResult = { ok: true; guests: Guest[]; skipped: string[] } | { ok: false; reason: "not-yours" } | { ok: false; reason: "full"; room: number } | { ok: false; reason: "invalid"; errors: GuestErrors };

/** Add several households at once (a pasted list), all with the same celebrations. All or nothing. */
export function addGuests(slug: string, key: string, input: unknown) {
  return write((db): GuestListResult => {
    const found = db.experiences.find((e) => e.slug === slug);
    if (!found || !keyMatches(found.keyHash, key)) return { ok: false, reason: "not-yours" };
    const checked = validateGuestList(input, found.events, found.guests);
    if (!checked.ok) return { ok: false, reason: "invalid", errors: checked.errors };
    const room = Math.max(0, Math.min(LIMITS.guestList - found.guests.length, LIMITS.rsvpsPerEvent - repliesUsed(rsvpsOf(db, found), found.guests)));
    if (checked.value.guests.length > room) return { ok: false, reason: "full", room };
    const now = new Date().toISOString();
    const added = checked.value.guests.map(({ name, phone }) => {
      const guest: Guest = { id: newGuestId(db, found), name, events: checked.value.events, createdAt: now, ...(phone && { phone }) };
      found.guests.push(guest);
      return guest;
    });
    return { ok: true, guests: added, skipped: checked.value.skipped };
  });
}

/**
 * Rename a personal invitation or change its celebrations. `newLink: true` replaces the link (when it was forwarded
 * further than meant): the old one stops working, and the household's reply moves to the new one.
 */
export function updateGuest(slug: string, key: string, guestId: string, input: unknown) {
  return write((db): GuestResult => {
    const found = db.experiences.find((e) => e.slug === slug);
    if (!found || !keyMatches(found.keyHash, key)) return { ok: false, reason: "not-yours" };
    const guest = found.guests.find((g) => g.id === guestId);
    if (!guest) return { ok: false, reason: "missing" };
    const checked = validateGuest(input, found.events, true);
    if (!checked.ok) return { ok: false, reason: "invalid", errors: checked.errors };
    Object.assign(guest, checked.value);
    if ("phone" in checked.value && !checked.value.phone) delete guest.phone;
    if ((input as { newLink?: unknown } | null)?.newLink === true) {
      const id = newGuestId(db, found);
      for (const reply of rsvpsOf(db, found)) if (reply.guestId === guest.id) reply.guestId = id;
      guest.id = id;
    }
    return { ok: true, guest };
  });
}

const OPEN_GAP_MS = 10 * 60 * 1000;

/**
 * A household opened their personal link (reported by the page itself, so link previews don't count). Refreshes
 * within ten minutes aren't recorded again, which keeps the file from being rewritten on every visit.
 */
export function markOpened(slug: string, guestId: string) {
  return write((db): { ok: boolean } => {
    if (!isGuestId(guestId)) return { ok: false };
    const found = db.experiences.find((e) => e.slug === slug && e.status === "published");
    const guest = found?.guests.find((g) => g.id === guestId);
    if (!guest) return { ok: false };
    const now = new Date();
    if (guest.lastOpenedAt && now.getTime() - Date.parse(guest.lastOpenedAt) < OPEN_GAP_MS) return { ok: false };
    guest.openedAt ??= now.toISOString();
    guest.lastOpenedAt = now.toISOString();
    return { ok: true };
  });
}

/** Their link stops working and their reply is removed with it, so the headcount only has people still invited. */
export function removeGuest(slug: string, key: string, guestId: string) {
  return write((db): { ok: true } | { ok: false; reason: "not-yours" | "missing" } => {
    const found = db.experiences.find((e) => e.slug === slug);
    if (!found || !keyMatches(found.keyHash, key)) return { ok: false, reason: "not-yours" };
    const index = found.guests.findIndex((g) => g.id === guestId);
    if (index < 0) return { ok: false, reason: "missing" };
    found.guests.splice(index, 1);
    db.rsvps = db.rsvps.filter((r) => !(r.experienceId === found.id && r.guestId === guestId));
    return { ok: true };
  });
}

// ---------- RSVPs ----------

type RsvpInput = { name: string; attendance: Attendance; guestCount: number; events?: unknown; shown?: unknown; counts?: unknown; guestId?: string; wish?: string };
type RsvpResult = { ok: true; updated: boolean } | { ok: false; reason: "missing" | "full" | "guest" } | { ok: false; reason: "invalid"; error: string };

/**
 * Save a reply, checked against what the guest's link shows. A personal link has one reply for the household:
 * replying again replaces it, keeping answers for celebrations this page didn't show.
 */
export function addRsvp(slug: string, input: RsvpInput) {
  return write((db): RsvpResult => {
    const found = db.experiences.find((e) => e.slug === slug && e.status === "published");
    if (!found) return { ok: false, reason: "missing" };
    const guest = isGuestId(input.guestId) ? found.guests.find((g) => g.id === input.guestId) : undefined;
    if (input.guestId !== undefined && !guest) return { ok: false, reason: "guest" };
    const view = viewFor(draftOf(found), guest ? guest.events : found.publicEvents);
    const answers = answersFor(view, input);
    if (!answers.ok) return { ok: false, reason: "invalid", error: answers.error };
    const now = new Date().toISOString();
    const earlier = guest && db.rsvps.find((r) => r.experienceId === found.id && r.guestId === guest.id);
    const kept = Object.fromEntries(Object.entries(earlier?.byEvent ?? {}).filter(([id]) => view.events.some((e) => e.id === id)));
    const reply = { name: input.name, attendance: input.attendance, guestCount: answers.guestCount, byEvent: { ...kept, ...answers.byEvent }, ...(input.wish && { wish: input.wish }) };
    if (earlier) {
      // A wish taken out of the reply is removed (whether the host hid it stays as it was).
      if (!input.wish) delete earlier.wish;
      Object.assign(earlier, reply, { updatedAt: now });
      return { ok: true, updated: true };
    }
    // Households with a personal link always get through: their place was kept when the host added them.
    if (!guest && repliesUsed(rsvpsOf(db, found), found.guests) >= LIMITS.rsvpsPerEvent) return { ok: false, reason: "full" };
    db.rsvps.push({ id: randomUUID(), experienceId: found.id, ...reply, ...(guest && { guestId: guest.id }), createdAt: now });
    return { ok: true, updated: false };
  });
}

/** Hide a wish from the invitation, or show it again. Owner only. */
export function setWishHidden(slug: string, key: string, rsvpId: string, hidden: boolean) {
  return write((db): { ok: true } | { ok: false; reason: "not-yours" | "missing" } => {
    const found = db.experiences.find((e) => e.slug === slug);
    if (!found || !keyMatches(found.keyHash, key)) return { ok: false, reason: "not-yours" };
    const reply = db.rsvps.find((r) => r.experienceId === found.id && r.id === rsvpId);
    if (!reply?.wish) return { ok: false, reason: "missing" };
    if (hidden) reply.wishHidden = true;
    else delete reply.wishHidden;
    return { ok: true };
  });
}
