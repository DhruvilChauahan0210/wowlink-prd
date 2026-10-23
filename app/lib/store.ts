import { createHash, randomBytes, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { answersFor, isGuestId, repliesUsed, validateGuest, validateGuestList, validatePublicEvents, viewFor, type AudienceView, type ByEvent, type EventFilter, type Guest, type GuestErrors } from "./guests";
import { INVITATION_DAYS, METRIC_DAYS, bump, dayKey, emptyStats, summarise, trimDays, type InvitationStats, type Metrics, type PageMetric, type ShareChannel } from "./insights";
import { LIMITS, draftOf, type Attendance, type InvitationDraft, type TemplateId } from "./invitations";
import type { Removal, Report, ReportReason } from "./reports";
import { cleanExtras, type Diet } from "./extras";
import { freeDraft, hasEnded, planOf, proFeaturesIn, repliesLimit, type Plan, type ProFeature } from "./plans";

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
  /** Free or the Creator studio (plans.ts). Missing on invitations made before plans existed, which keep everything. */
  plan?: Plan;
  /** Set when WowLink took it down after a report: guests can't open it and it can't be published again. */
  removed?: Removal;
  /** Plain counts of visits, openings and shares (see insights.ts). Missing until the first one. */
  stats?: InvitationStats;
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
  /** Extras the invitation asked for (extras.ts): food needs, a song, the poll answer (its option's index). */
  diet?: Diet[];
  dietNote?: string;
  song?: string;
  pick?: number;
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
export type HouseholdReply = Pick<Rsvp, "name" | "attendance" | "guestCount" | "byEvent" | "wish" | "diet" | "dietNote" | "song" | "pick"> & { at: string };
/** A personal link's household, and their reply so far. */
export type GuestView = { experience: PublicExperience; guest: Pick<Guest, "id" | "name">; reply: HouseholdReply | null };

type StoredExperience = Experience & { keyHash: string };
/** `retired`: the slugs of deleted invitations, so an old link shared on WhatsApp never opens someone else's. Nothing else of them is kept. */
type Db = { experiences: StoredExperience[]; rsvps: Rsvp[]; retired: string[]; reports: Report[]; metrics: Metrics };

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
    return { experiences: (db.experiences ?? []).map(withDefaults), rsvps: db.rsvps ?? [], retired: db.retired ?? [], reports: db.reports ?? [], metrics: db.metrics ?? {} };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { experiences: [], rsvps: [], retired: [], reports: [], metrics: {} };
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
// A free invitation never shows the Creator studio's parts, whatever is stored.
const toPublic = (db: Db, e: Experience, filter: EventFilter): PublicExperience => ({ slug: e.slug, templateId: e.templateId, ...viewFor(planOf(e) === "pro" ? draftOf(e) : freeDraft(draftOf(e)), filter), wishes: publicWishes(db, e) });
const strip = ({ keyHash: _keyHash, ...experience }: StoredExperience): Experience => experience;
/** What guests can reach: published, and not taken down. */
const isLive = (e: Experience) => e.status === "published" && !e.removed && !hasEnded(e);

// ---------- experiences ----------

export function createExperience(templateId: TemplateId, draft: InvitationDraft, plan: Plan = "free") {
  return write((db) => {
    const key = randomBytes(24).toString("base64url");
    const now = new Date().toISOString();
    bump(db.metrics, "published", Date.now());
    bump(db.metrics, `published:${templateId}`, Date.now());
    const stored: StoredExperience = {
      ...draft,
      id: randomUUID(),
      slug: newSlug(new Set([...db.experiences.map((e) => e.slug), ...db.retired])),
      templateId,
      status: "published",
      createdAt: now,
      updatedAt: now,
      guests: [],
      publicEvents: "all",
      showWishes: false,
      stats: emptyStats(now),
      plan,
      keyHash: hash(key),
    };
    db.experiences.push(stored);
    return { experience: strip(stored), key };
  });
}

/** The general link's view of a published invitation, or null if it doesn't exist or has been unpublished. */
export function getPublished(slug: string) {
  return read((db) => {
    const found = db.experiences.find((e) => e.slug === slug && isLive(e));
    return found ? toPublic(db, found, found.publicEvents) : null;
  });
}

/** A personal link's view: only that household's celebrations, who it's for, and their reply so far. */
export function getGuestView(slug: string, guestId: string) {
  return read((db): GuestView | null => {
    if (!isGuestId(guestId)) return null;
    const found = db.experiences.find((e) => e.slug === slug && isLive(e));
    const guest = found?.guests.find((g) => g.id === guestId);
    if (!found || !guest) return null;
    const reply = db.rsvps.find((r) => r.experienceId === found.id && r.guestId === guest.id);
    const experience = toPublic(db, found, guest.events);
    // Only answers for celebrations this link still shows.
    const byEvent = reply?.byEvent && Object.fromEntries(Object.entries(reply.byEvent).filter(([id]) => experience.events.some((e) => e.id === id)));
    return {
      experience,
      guest: { id: guest.id, name: guest.name },
      reply: reply ? { name: reply.name, attendance: reply.attendance, guestCount: reply.guestCount, ...(byEvent && { byEvent }), ...(reply.wish && { wish: reply.wish }), ...(reply.diet && { diet: reply.diet }), ...(reply.dietNote && { dietNote: reply.dietNote }), ...(reply.song && { song: reply.song }), ...(reply.pick !== undefined && { pick: reply.pick }), at: reply.updatedAt ?? reply.createdAt } : null,
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
type UpdateResult = { ok: true; experience: Experience } | { ok: false; reason: "not-yours" | "invalid" | "removed" } | { ok: false; reason: "pro"; features: ProFeature[] };

/** Edit an invitation. `publicEvents` is checked here, against the schedule as it is after this edit. */
export function updateOwned(slug: string, key: string, patch: Patch) {
  return write((db): UpdateResult => {
    const found = db.experiences.find((e) => e.slug === slug);
    if (!found || !keyMatches(found.keyHash, key)) return { ok: false, reason: "not-yours" };
    // A taken-down invitation can't be put back in front of guests (its host can still delete it).
    if (found.removed && patch.status === "published") return { ok: false, reason: "removed" };
    if (planOf(found) === "free" && (patch.draft || patch.templateId)) {
      const features = proFeaturesIn(patch.templateId ?? found.templateId, patch.draft ?? draftOf(found));
      if (features.length) return { ok: false, reason: "pro", features };
    }
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

/**
 * Delete an invitation for good, with everything in it: its replies and wishes, its personal invitations (and their
 * WhatsApp numbers) and its links. Only the slug is kept, so the link can't be given to a new invitation.
 */
export function deleteOwned(slug: string, key: string) {
  return write((db): { ok: true; replies: number } | { ok: false } => {
    const index = db.experiences.findIndex((e) => e.slug === slug);
    if (index < 0 || !keyMatches(db.experiences[index].keyHash, key)) return { ok: false };
    const [gone] = db.experiences.splice(index, 1);
    const before = db.rsvps.length;
    db.rsvps = db.rsvps.filter((r) => r.experienceId !== gone.id);
    db.reports = db.reports.filter((r) => r.experienceId !== gone.id);
    db.retired.push(gone.slug);
    return { ok: true, replies: before - db.rsvps.length };
  });
}

// ---------- personal invitations (owner only) ----------

type GuestResult = { ok: true; guest: Guest } | { ok: false; reason: "not-yours" | "missing" | "full" | "pro" } | { ok: false; reason: "invalid"; errors: GuestErrors };

const rsvpsOf = (db: Db, experience: Experience) => db.rsvps.filter((r) => r.experienceId === experience.id);
/** A fresh link id, never one this invitation has used before (a removed household's id must not come back). */
const newGuestId = (db: Db, experience: Experience) => newSlug(new Set([...experience.guests.map((g) => g.id), ...rsvpsOf(db, experience).flatMap((r) => (r.guestId ? [r.guestId] : []))]), 8);

export function addGuest(slug: string, key: string, input: unknown) {
  return write((db): GuestResult => {
    const found = db.experiences.find((e) => e.slug === slug);
    if (!found || !keyMatches(found.keyHash, key)) return { ok: false, reason: "not-yours" };
    if (planOf(found) === "free") return { ok: false, reason: "pro" };
    if (found.guests.length >= LIMITS.guestList || repliesUsed(rsvpsOf(db, found), found.guests) >= repliesLimit(planOf(found))) return { ok: false, reason: "full" };
    const checked = validateGuest(input, found.events);
    if (!checked.ok) return { ok: false, reason: "invalid", errors: checked.errors };
    const { name, events, phone } = checked.value;
    const guest: Guest = { id: newGuestId(db, found), name: name!, events: events!, createdAt: new Date().toISOString(), ...(phone && { phone }) };
    found.guests.push(guest);
    return { ok: true, guest };
  });
}

type GuestListResult = { ok: true; guests: Guest[]; skipped: string[] } | { ok: false; reason: "not-yours" | "pro" } | { ok: false; reason: "full"; room: number } | { ok: false; reason: "invalid"; errors: GuestErrors };

/** Add several households at once (a pasted list), all with the same celebrations. All or nothing. */
export function addGuests(slug: string, key: string, input: unknown) {
  return write((db): GuestListResult => {
    const found = db.experiences.find((e) => e.slug === slug);
    if (!found || !keyMatches(found.keyHash, key)) return { ok: false, reason: "not-yours" };
    const checked = validateGuestList(input, found.events, found.guests);
    if (!checked.ok) return { ok: false, reason: "invalid", errors: checked.errors };
    if (planOf(found) === "free") return { ok: false, reason: "pro" };
    const room = Math.max(0, Math.min(LIMITS.guestList - found.guests.length, repliesLimit(planOf(found)) - repliesUsed(rsvpsOf(db, found), found.guests)));
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

/** Record that a household opened their link; refreshes within ten minutes aren't recorded again. */
function opened(guest: Guest, now: number) {
  if (guest.lastOpenedAt && now - Date.parse(guest.lastOpenedAt) < OPEN_GAP_MS) return false;
  const at = new Date(now).toISOString();
  guest.openedAt ??= at;
  guest.lastOpenedAt = at;
  return true;
}

/**
 * A household opened their personal link (reported by the page itself, so link previews don't count). Refreshes
 * within ten minutes aren't recorded again, which keeps the file from being rewritten on every visit.
 */
export function markOpened(slug: string, guestId: string) {
  return write((db): { ok: boolean } => {
    if (!isGuestId(guestId)) return { ok: false };
    const found = db.experiences.find((e) => e.slug === slug && isLive(e));
    const guest = found?.guests.find((g) => g.id === guestId);
    if (!guest) return { ok: false };
    return { ok: opened(guest, Date.now()) };
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

type RsvpInput = { name: string; attendance: Attendance; guestCount: number; events?: unknown; shown?: unknown; counts?: unknown; guestId?: string; wish?: string; extras?: Record<string, unknown> };
type RsvpResult = { ok: true; updated: boolean } | { ok: false; reason: "missing" | "full" | "guest" | "closed" } | { ok: false; reason: "invalid"; error: string };

/**
 * Save a reply, checked against what the guest's link shows. A personal link has one reply for the household:
 * replying again replaces it, keeping answers for celebrations this page didn't show.
 */
export function addRsvp(slug: string, input: RsvpInput) {
  return write((db): RsvpResult => {
    const found = db.experiences.find((e) => e.slug === slug && isLive(e));
    if (!found) return { ok: false, reason: "missing" };
    if (found.rsvp === false) return { ok: false, reason: "closed" };
    const guest = isGuestId(input.guestId) ? found.guests.find((g) => g.id === input.guestId) : undefined;
    if (input.guestId !== undefined && !guest) return { ok: false, reason: "guest" };
    const view = viewFor(draftOf(found), guest ? guest.events : found.publicEvents);
    const answers = answersFor(view, input);
    if (!answers.ok) return { ok: false, reason: "invalid", error: answers.error };
    const now = new Date().toISOString();
    const earlier = guest && db.rsvps.find((r) => r.experienceId === found.id && r.guestId === guest.id);
    const kept = Object.fromEntries(Object.entries(earlier?.byEvent ?? {}).filter(([id]) => view.events.some((e) => e.id === id)));
    // Extras only for what this invitation asks (song and poll are the Creator studio's), and none for "can't make it".
    const pro = planOf(found) === "pro";
    const extras = input.attendance === "Not attending" ? {} : cleanExtras(input.extras ?? {}, { diet: !!found.askDiet, song: pro && !!found.askSong, poll: pro ? found.poll ?? null : null });
    const reply = { name: input.name, attendance: input.attendance, guestCount: answers.guestCount, byEvent: { ...kept, ...answers.byEvent }, ...(input.wish && { wish: input.wish }), ...extras };
    if (earlier) {
      // A wish taken out of the reply is removed (whether the host hid it stays as it was).
      if (!input.wish) delete earlier.wish;
      for (const field of ["diet", "dietNote", "song", "pick"] as const) delete earlier[field];
      Object.assign(earlier, reply, { updatedAt: now });
      return { ok: true, updated: true };
    }
    // Households with a personal link always get through: their place was kept when the host added them.
    if (!guest && repliesUsed(rsvpsOf(db, found), found.guests) >= repliesLimit(planOf(found))) return { ok: false, reason: "full" };
    bump(db.metrics, "reply", Date.now());
    db.rsvps.push({ id: randomUUID(), experienceId: found.id, ...reply, ...(guest && { guestId: guest.id }), createdAt: now });
    return { ok: true, updated: false };
  });
}

/**
 * Delete one reply (a guest asked to be taken off, say), with its wish. A household with a personal link can reply
 * again; their invitation stays. Owner only.
 */
export function removeRsvp(slug: string, key: string, rsvpId: string) {
  return write((db): { ok: true } | { ok: false; reason: "not-yours" | "missing" } => {
    const found = db.experiences.find((e) => e.slug === slug);
    if (!found || !keyMatches(found.keyHash, key)) return { ok: false, reason: "not-yours" };
    const index = db.rsvps.findIndex((r) => r.experienceId === found.id && r.id === rsvpId);
    if (index < 0) return { ok: false, reason: "missing" };
    db.rsvps.splice(index, 1);
    return { ok: true };
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

// ---------- counting (see insights.ts) ----------

const statsOf = (e: Experience) => (e.stats ??= emptyStats(new Date().toISOString()));

type Visit = { first: boolean; viaQr: boolean; guestId?: string };

/**
 * Someone opened an invitation: reported by the page once it's running, so link previews and crawlers don't count,
 * and not by the host's own browser. `first` is the browser's first visit, so each person is counted once.
 */
export function recordVisit(slug: string, visit: Visit) {
  return write((db): { ok: boolean } => {
    const found = db.experiences.find((e) => e.slug === slug && isLive(e));
    if (!found) return { ok: false };
    const now = Date.now();
    const stats = statsOf(found);
    stats.views += 1;
    if (visit.first) stats.visitors += 1;
    if (visit.viaQr) stats.viaQr += 1;
    stats.days[dayKey(now)] = (stats.days[dayKey(now)] ?? 0) + 1;
    trimDays(stats.days, INVITATION_DAYS, now);
    bump(db.metrics, "view", now);
    if (visit.first) bump(db.metrics, "visitor", now);
    if (visit.viaQr) bump(db.metrics, "via-qr", now);
    const guest = isGuestId(visit.guestId) ? found.guests.find((g) => g.id === visit.guestId) : undefined;
    if (guest) opened(guest, now);
    trimDays(db.metrics, METRIC_DAYS, now);
    return { ok: true };
  });
}

/** Someone played the opening (once per browser). */
export function recordPlayed(slug: string) {
  return write((db): { ok: boolean } => {
    const found = db.experiences.find((e) => e.slug === slug && isLive(e));
    if (!found) return { ok: false };
    statsOf(found).played += 1;
    bump(db.metrics, "played", Date.now());
    return { ok: true };
  });
}

/** A guest followed "Create yours free" from an invitation: how WowLink spreads. */
export function recordAttribution(slug: string) {
  return write((db): { ok: boolean } => {
    if (!db.experiences.some((e) => e.slug === slug && isLive(e))) return { ok: false };
    bump(db.metrics, "attribution", Date.now());
    return { ok: true };
  });
}

/** The host shared their invitation (or a personal link) one way or another. Owner only. */
export function recordShare(slug: string, key: string, channel: ShareChannel) {
  return write((db): { ok: boolean } => {
    const found = db.experiences.find((e) => e.slug === slug);
    if (!found || !keyMatches(found.keyHash, key) || found.removed) return { ok: false };
    const stats = statsOf(found);
    stats.shares[channel] = (stats.shares[channel] ?? 0) + 1;
    bump(db.metrics, `share:${channel}`, Date.now());
    return { ok: true };
  });
}

/** A visit to one of WowLink's own pages (the studio, a sample, an occasion's page). */
export function recordPageView(page: PageMetric) {
  return write((db) => {
    bump(db.metrics, page, Date.now());
    return { ok: true };
  });
}

// ---------- reports and taking down (WowLink's admin) ----------

/** The most open reports one invitation keeps, so it can't be flooded: newer ones replace the oldest. */
const OPEN_REPORTS_MAX = 50;

export function addReport(slug: string, reason: ReportReason, details: string) {
  return write((db): { ok: true } | { ok: false; reason: "missing" } => {
    const found = db.experiences.find((e) => e.slug === slug && isLive(e));
    if (!found) return { ok: false, reason: "missing" };
    // At the cap, the oldest open report makes way, so the latest (often the most telling) is always there.
    const open = db.reports.filter((r) => r.experienceId === found.id && !r.resolvedAt);
    if (open.length >= OPEN_REPORTS_MAX) db.reports.splice(db.reports.indexOf(open[0]), 1);
    db.reports.push({ id: randomUUID(), experienceId: found.id, reason, details, createdAt: new Date().toISOString() });
    bump(db.metrics, "report", Date.now());
    return { ok: true };
  });
}

/** What the admin sees of an invitation: enough to judge a report, not its guest list or replies. */
export type AdminInvitation = Pick<Experience, "slug" | "templateId" | "title" | "date" | "venue" | "status" | "createdAt" | "removed"> & { plan: Plan; households: number; replies: number; reports: Report[] };

const forAdmin = (db: Db, e: StoredExperience): AdminInvitation => ({
  slug: e.slug, templateId: e.templateId, title: e.title, date: e.date, venue: e.venue, status: e.status, createdAt: e.createdAt, removed: e.removed, plan: planOf(e),
  households: e.guests.length,
  replies: rsvpsOf(db, e).length,
  reports: db.reports.filter((r) => r.experienceId === e.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
});

/** Every invitation with reports: those still to look at first (most reported first), then the rest, latest first. */
export function reportedInvitations() {
  return read((db) => {
    const reported = db.experiences.filter((e) => db.reports.some((r) => r.experienceId === e.id)).map((e) => forAdmin(db, e));
    const open = (i: AdminInvitation) => i.reports.filter((r) => !r.resolvedAt).length;
    return reported.sort((a, b) => open(b) - open(a) || b.reports[0].createdAt.localeCompare(a.reports[0].createdAt));
  });
}

export function adminInvitation(slug: string) {
  return read((db) => {
    const found = db.experiences.find((e) => e.slug === slug);
    return found ? forAdmin(db, found) : null;
  });
}

/** The invitation as its general link shows guests, whatever its state: for the admin to look at before deciding. */
export function adminView(slug: string) {
  return read((db) => {
    const found = db.experiences.find((e) => e.slug === slug);
    return found ? toPublic(db, found, "all") : null;
  });
}

export type Moderation = "take-down" | "restore" | "dismiss" | "make-pro" | "make-free";

/** Take an invitation down (its open reports count as acted on), put it back, or dismiss its open reports. */
export function moderate(slug: string, action: Moderation) {
  return write((db): { ok: true; invitation: AdminInvitation } | { ok: false } => {
    const found = db.experiences.find((e) => e.slug === slug);
    if (!found) return { ok: false };
    const now = new Date().toISOString();
    const open = db.reports.filter((r) => r.experienceId === found.id && !r.resolvedAt);
    if (action === "take-down") {
      // The most common reason given, for the host's notice.
      const counts = new Map<ReportReason, number>();
      for (const report of open) counts.set(report.reason, (counts.get(report.reason) ?? 0) + 1);
      const reason = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0];
      found.removed = { at: now, ...(reason && { reason }) };
      for (const report of open) Object.assign(report, { resolvedAt: now, outcome: "taken-down" });
      bump(db.metrics, "taken-down", Date.now());
    } else if (action === "make-pro" || action === "make-free") {
      // Until payments exist, WowLink moves an invitation to the Creator studio (or back) by hand.
      found.plan = action === "make-pro" ? "pro" : "free";
    } else if (action === "restore") {
      delete found.removed;
    } else {
      for (const report of open) Object.assign(report, { resolvedAt: now, outcome: "dismissed" });
    }
    return { ok: true, invitation: forAdmin(db, found) };
  });
}

/** The app's numbers over the last `days` days, and how things stand now. */
export function appNumbers(days: number) {
  return read((db) => {
    const now = Date.now();
    const live = db.experiences.filter(isLive).length;
    return {
      ...summarise(db.metrics, days, now, ["view", "published", "reply"]),
      now: {
        live,
        unpublished: db.experiences.filter((e) => e.status === "unpublished" && !e.removed).length,
        takenDown: db.experiences.filter((e) => e.removed).length,
        pro: db.experiences.filter((e) => planOf(e) === "pro").length,
        replies: db.rsvps.length,
        openReports: db.reports.filter((r) => !r.resolvedAt).length,
      },
    };
  });
}
