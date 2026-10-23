import { createHash, randomBytes, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { answersFor, isGuestId, repliesUsed, validateGuest, validateGuestList, validatePublicEvents, viewFor, type AudienceView, type ByEvent, type EventFilter, type Guest, type GuestErrors } from "./guests";
import { INVITATION_DAYS, METRIC_DAYS, bump, dayKey, emptyStats, summarise, trimDays, type InvitationStats, type Metrics, type PageMetric, type ShareChannel, type Source } from "./insights";
import { LIMITS, draftOf, type Attendance, type InvitationDraft, type Lang, type TemplateId } from "./invitations";
import type { Removal, Report, ReportReason } from "./reports";
import { cleanExtras, type Diet } from "./extras";
import { freeDraft, hasEnded, planOf, proFeaturesIn, repliesLimit, type Plan, type ProFeature } from "./plans";
import { ALIAS_LIMITS, aliasError, tidyAlias } from "./aliases";
import { fileBackend } from "./store-file";
import { LinkTaken, pgBackend } from "./store-pg";

/*
 * Where published invitations and RSVPs live, and the rules for changing them.
 *
 * Every rule below works on a `Db`: plain objects, the same whichever place keeps them.
 * - Without DATABASE_URL: one JSON file (store-file.ts, .data/wowlink.json, git-ignored). Fine for one server
 *   process and for trying the product out. Every read and write runs through one queue.
 * - With DATABASE_URL: Postgres on Supabase (store-pg.ts). Each call loads only what its `Scope` names, runs the
 *   same rule inside a transaction that locks the invitation, and saves only what changed.
 * Owners prove themselves with a random manage key. Only its SHA-256 hash is stored.
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
  /** Custom links (aliases.ts), the current one first. Earlier ones keep working, so links already shared don't break. */
  aliases?: string[];
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

/**
 * `keyHash`: the manage key given when it was published; `keyHashes`: keys given since to its host's other devices
 * (signed in). `ownerId`: the account that published it (or added it later), when accounts are on.
 */
export type StoredExperience = Experience & { keyHash: string; keyHashes?: string[]; ownerId?: string };
/** `retired`: the slugs of deleted invitations, so an old link shared on WhatsApp never opens someone else's. Nothing else of them is kept. */
/** A host asking WowLink to move their invitation to the Creator studio (until payments exist). */
export type UpgradeRequest = { id: string; experienceId: string; note: string; contact: string; createdAt: string; status: "open" | "approved" | "declined"; decidedAt?: string };
/** A client preview: the invitation as a planner is about to change it, at its own link, with the client's replies. */
export type Preview = { token: string; experienceId: string; templateId: TemplateId; draft: InvitationDraft; createdAt: string; expiresAt: string; feedback: PreviewFeedback[] };
export type PreviewFeedback = { verdict: "approve" | "changes"; note: string; at: string };
export type Db = { experiences: StoredExperience[]; rsvps: Rsvp[]; retired: string[]; reports: Report[]; metrics: Metrics; upgrades: UpgradeRequest[]; previews: Preview[] };

/** The other parts of the data that belong to an invitation, loaded only when a call needs them. */
export type Part = "rsvps" | "reports" | "upgrades" | "previews";
/**
 * What a call needs: the invitation at a link (its slug exactly, else a custom link), by its exact slug (owners; with
 * `owners`, also every other invitation of its host), by a preview's token or a request's id, nothing yet (a new
 * invitation; with `owner`, that host's others), a host's invitations, only the app's numbers, or everything (the
 * admin's lists). `probe`: links to check against every other invitation's, for a new custom link.
 */
export type Scope = ({ link: string } | { slug: string; owners?: true } | { token: string } | { upgradeId: string } | { create: true; owner?: string } | { owner: string } | { metricsOnly: true } | { all: true; metrics?: true }) & { with?: Part[]; probe?: string[] };
export type Backend = { read<T>(scope: Scope, fn: (db: Db) => T): Promise<T>; write<T>(scope: Scope, fn: (db: Db) => T): Promise<T> };

// Invitations saved before schedules, guest lists or languages existed: none of the first two, and English.
const withDefaults = (e: StoredExperience): StoredExperience => ({ ...e, events: e.events ?? [], guests: e.guests ?? [], publicEvents: e.publicEvents ?? "all", language: e.language ?? "en", showWishes: e.showWishes ?? false });
const normalized = (db: Db) => {
  db.experiences = db.experiences.map(withDefaults);
  return db;
};
function backend(): Backend {
  if (process.env.DATABASE_URL) return pgBackend;
  // Vercel's servers don't keep files: without a database every change would quietly disappear.
  if (process.env.VERCEL) throw new Error("Set DATABASE_URL: on Vercel the data has to be in the database.");
  return fileBackend;
}

const read = <T>(scope: Scope, fn: (db: Db) => T) => backend().read(scope, (db) => fn(normalized(db)));
/** Run a change. Results with `ok: false` changed nothing, so nothing is saved for them. */
const write = <T>(scope: Scope, fn: (db: Db) => T) => backend().write(scope, (db) => fn(normalized(db)));

// ---------- keys and slugs ----------

const hash = (key: string) => createHash("sha256").update(key).digest("hex");

function keyMatches(stored: string, key: string) {
  const a = Buffer.from(stored, "hex");
  const b = Buffer.from(hash(key), "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Whether a key opens this invitation: the one from publishing, or one given to another of its host's devices. */
const ownsKey = (e: StoredExperience, key: string) => !!key && [e.keyHash, ...(e.keyHashes ?? [])].some((stored) => keyMatches(stored, key));
/** The most device keys an invitation keeps besides its first; the oldest goes when another device signs in. */
const DEVICE_KEYS = 10;

// No vowels, and no look-alikes (0/O, 1/l/I), so slugs never spell words and read well aloud.
const SLUG_ALPHABET = "23456789bcdfghjkmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ";
/** A fresh id, unlike any in `taken` even ignoring case (custom links are lowercase): `taken` holds lowercase ids. */
function newSlug(taken: Set<string>, length = 7) {
  for (;;) {
    const slug = Array.from({ length }, () => SLUG_ALPHABET[randomInt(SLUG_ALPHABET.length)]).join("");
    if (!taken.has(slug.toLowerCase())) return slug;
  }
}


/** The most wishes an invitation shows (the latest ones). */
const SHOWN_WISHES = 30;
/**
 * The wishes on show, latest first. Only the name the writer typed goes with each: never a household's name from
 * the host's list, which would reveal who else is invited.
 */
const publicWishes = (db: Db, e: Experience): PublicWish[] | null =>
  !e.showWishes || planOf(e) !== "pro" ? null : db.rsvps
    .filter((r) => r.experienceId === e.id && r.wish && !r.wishHidden)
    .sort((a, b) => (b.updatedAt ?? b.createdAt).localeCompare(a.updatedAt ?? a.createdAt))
    .slice(0, SHOWN_WISHES)
    .map((r) => ({ name: r.name, text: r.wish! }));
/** The invitation as one link shows it: only the fields a guest may see, and only their celebrations. */
// A free invitation never shows the Creator studio's parts, whatever is stored.
const toPublic = (db: Db, e: Experience, filter: EventFilter): PublicExperience => ({ slug: e.slug, templateId: e.templateId, ...viewFor(planOf(e) === "pro" ? draftOf(e) : freeDraft(draftOf(e)), filter), wishes: publicWishes(db, e) });
const strip = ({ keyHash: _keyHash, keyHashes: _keyHashes, ownerId: _ownerId, ...experience }: StoredExperience): Experience => experience;
/** What guests can reach: published, and not taken down. */
const isLive = (e: Experience) => e.status === "published" && !e.removed && !hasEnded(e);
/** The invitation at a link, whatever its state: its slug exactly, or else one of its custom links (lowercase). */
const findAt = (db: Db, link: string) => db.experiences.find((e) => e.slug === link) ?? db.experiences.find((e) => e.aliases?.includes(link.toLowerCase()));
/** The live invitation at a link. */
const findLive = (db: Db, link: string) => {
  const found = findAt(db, link);
  return found && isLive(found) ? found : undefined;
};
/** Every link that's been given out: slugs, custom links, and those of deleted invitations. Compared in lowercase. */
const takenLinks = (db: Db) => new Set([...db.experiences.flatMap((e) => [e.slug, ...(e.aliases ?? [])]), ...db.retired].map((l) => l.toLowerCase()));

// ---------- experiences ----------

/** Whether a host already has a live free invitation, other than `except`: the free plan has one at a time. */
const hasLiveFree = (db: Db, ownerId: string, except?: string) => db.experiences.some((e) => e.ownerId === ownerId && e.id !== except && isLive(e) && planOf(e) === "free");

type CreateResult = { ok: true; experience: Experience; key: string } | { ok: false; reason: "limit" };

/** Publish a new invitation, for `ownerId` when accounts are on. A host's free plan has one live invitation. */
export async function createExperience(templateId: TemplateId, draft: InvitationDraft, plan: Plan = "free", ownerId?: string): Promise<CreateResult> {
  // Postgres only learns that a new slug is taken when saving it (the odds are tiny): then it tries another.
  for (let tries = 1; ; tries++) {
    try {
      return await createOnce(templateId, draft, plan, ownerId);
    } catch (error) {
      if (!(error instanceof LinkTaken) || tries >= 5) throw error;
    }
  }
}

function createOnce(templateId: TemplateId, draft: InvitationDraft, plan: Plan, ownerId?: string) {
  return write({ create: true, owner: ownerId }, (db): CreateResult => {
    if (ownerId && plan === "free" && hasLiveFree(db, ownerId)) return { ok: false, reason: "limit" };
    const key = randomBytes(24).toString("base64url");
    const now = new Date().toISOString();
    bump(db.metrics, "published", Date.now());
    bump(db.metrics, `published:${templateId}`, Date.now());
    const stored: StoredExperience = {
      ...draft,
      id: randomUUID(),
      slug: newSlug(takenLinks(db)),
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
      ...(ownerId && { ownerId }),
    };
    db.experiences.push(stored);
    return { ok: true, experience: strip(stored), key };
  });
}

/** The general link's view of a published invitation, or null if it doesn't exist or has been unpublished. */
export function getPublished(slug: string) {
  return read({ link: slug, with: ["rsvps"] }, (db) => {
    const found = findLive(db, slug);
    return found ? toPublic(db, found, found.publicEvents) : null;
  });
}

/** The slug of the live invitation at a link (a custom link included), or null: one name per invitation, for limits. */
export function liveSlug(link: string) {
  return read({ link }, (db) => findLive(db, link)?.slug ?? null);
}

/** A personal link's view: only that household's celebrations, who it's for, and their reply so far. */
export function getGuestView(slug: string, guestId: string) {
  return read({ link: slug, with: ["rsvps"] }, (db): GuestView | null => {
    if (!isGuestId(guestId)) return null;
    const found = findLive(db, slug);
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
  return read({ slug, with: ["rsvps", "upgrades"] }, (db) => {
    const found = db.experiences.find((e) => e.slug === slug);
    if (!found || !ownsKey(found, key)) return null;
    const latest = (r: Rsvp) => r.updatedAt ?? r.createdAt;
    const rsvps = db.rsvps.filter((r) => r.experienceId === found.id).sort((a, b) => latest(b).localeCompare(latest(a)));
    const upgrade = db.upgrades.filter((u) => u.experienceId === found.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    return { experience: strip(found), rsvps, ...(upgrade && { upgrade: { status: upgrade.status, createdAt: upgrade.createdAt } }) };
  });
}

type Patch = { templateId?: TemplateId; draft?: InvitationDraft; status?: Experience["status"]; publicEvents?: unknown; showWishes?: boolean };
type UpdateResult = { ok: true; experience: Experience } | { ok: false; reason: "not-yours" | "invalid" | "removed" | "limit" } | { ok: false; reason: "pro"; features: ProFeature[] };

/** Edit an invitation. `publicEvents` is checked here, against the schedule as it is after this edit. */
export function updateOwned(slug: string, key: string, patch: Patch) {
  return write({ slug, owners: true }, (db): UpdateResult => {
    const found = db.experiences.find((e) => e.slug === slug);
    if (!found || !ownsKey(found, key)) return { ok: false, reason: "not-yours" };
    // A taken-down invitation can't be put back in front of guests (its host can still delete it).
    if (found.removed && patch.status === "published") return { ok: false, reason: "removed" };
    // Putting a free invitation back in front of guests (publishing it again, or moving its day forward after it
    // ended) needs room in its host's free plan.
    if (found.ownerId && planOf(found) === "free" && !isLive(found)) {
      const after = { ...found, ...patch.draft, status: patch.status ?? found.status };
      if (isLive(after) && hasLiveFree(db, found.ownerId, found.id)) return { ok: false, reason: "limit" };
    }
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
    if (patch.showWishes && planOf(found) === "free") return { ok: false, reason: "pro", features: ["wishes"] };
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
  return write({ slug, with: ["rsvps", "reports", "upgrades", "previews"] }, (db): { ok: true; replies: number } | { ok: false } => {
    const index = db.experiences.findIndex((e) => e.slug === slug);
    if (index < 0 || !ownsKey(db.experiences[index], key)) return { ok: false };
    const [gone] = db.experiences.splice(index, 1);
    const before = db.rsvps.length;
    db.rsvps = db.rsvps.filter((r) => r.experienceId !== gone.id);
    db.reports = db.reports.filter((r) => r.experienceId !== gone.id);
    db.retired.push(gone.slug, ...(gone.aliases ?? []));
    db.upgrades = db.upgrades.filter((u) => u.experienceId !== gone.id);
    db.previews = db.previews.filter((p) => p.experienceId !== gone.id);
    return { ok: true, replies: before - db.rsvps.length };
  });
}

// ---------- personal invitations (owner only) ----------

type GuestResult = { ok: true; guest: Guest } | { ok: false; reason: "not-yours" | "missing" | "full" | "pro" } | { ok: false; reason: "invalid"; errors: GuestErrors };

const rsvpsOf = (db: Db, experience: Experience) => db.rsvps.filter((r) => r.experienceId === experience.id);
/** A fresh link id, never one this invitation has used before (a removed household's id must not come back). */
const newGuestId = (db: Db, experience: Experience) => newSlug(new Set([...experience.guests.map((g) => g.id), ...rsvpsOf(db, experience).flatMap((r) => (r.guestId ? [r.guestId] : []))].map((id) => id.toLowerCase())), 8);

export function addGuest(slug: string, key: string, input: unknown) {
  return write({ slug, with: ["rsvps"] }, (db): GuestResult => {
    const found = db.experiences.find((e) => e.slug === slug);
    if (!found || !ownsKey(found, key)) return { ok: false, reason: "not-yours" };
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
  return write({ slug, with: ["rsvps"] }, (db): GuestListResult => {
    const found = db.experiences.find((e) => e.slug === slug);
    if (!found || !ownsKey(found, key)) return { ok: false, reason: "not-yours" };
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
  return write({ slug, with: ["rsvps"] }, (db): GuestResult => {
    const found = db.experiences.find((e) => e.slug === slug);
    if (!found || !ownsKey(found, key)) return { ok: false, reason: "not-yours" };
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
  return write({ link: slug }, (db): { ok: boolean } => {
    if (!isGuestId(guestId)) return { ok: false };
    const found = findLive(db, slug);
    const guest = found?.guests.find((g) => g.id === guestId);
    if (!guest) return { ok: false };
    return { ok: opened(guest, Date.now()) };
  });
}

/** Their link stops working and their reply is removed with it, so the headcount only has people still invited. */
export function removeGuest(slug: string, key: string, guestId: string) {
  return write({ slug, with: ["rsvps"] }, (db): { ok: true } | { ok: false; reason: "not-yours" | "missing" } => {
    const found = db.experiences.find((e) => e.slug === slug);
    if (!found || !ownsKey(found, key)) return { ok: false, reason: "not-yours" };
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
  return write({ link: slug, with: ["rsvps"] }, (db): RsvpResult => {
    const found = findLive(db, slug);
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
  return write({ slug, with: ["rsvps"] }, (db): { ok: true } | { ok: false; reason: "not-yours" | "missing" } => {
    const found = db.experiences.find((e) => e.slug === slug);
    if (!found || !ownsKey(found, key)) return { ok: false, reason: "not-yours" };
    const index = db.rsvps.findIndex((r) => r.experienceId === found.id && r.id === rsvpId);
    if (index < 0) return { ok: false, reason: "missing" };
    db.rsvps.splice(index, 1);
    return { ok: true };
  });
}

/** Hide a wish from the invitation, or show it again. Owner only. */
export function setWishHidden(slug: string, key: string, rsvpId: string, hidden: boolean) {
  return write({ slug, with: ["rsvps"] }, (db): { ok: true } | { ok: false; reason: "not-yours" | "missing" } => {
    const found = db.experiences.find((e) => e.slug === slug);
    if (!found || !ownsKey(found, key)) return { ok: false, reason: "not-yours" };
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
  return write({ link: slug }, (db): { ok: boolean } => {
    const found = findLive(db, slug);
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
  return write({ link: slug }, (db): { ok: boolean } => {
    const found = findLive(db, slug);
    if (!found) return { ok: false };
    statsOf(found).played += 1;
    bump(db.metrics, "played", Date.now());
    return { ok: true };
  });
}

/** A guest followed "Create yours free" from an invitation: how WowLink spreads. */
export function recordAttribution(slug: string) {
  return write({ link: slug }, (db): { ok: boolean } => {
    if (!findLive(db, slug)) return { ok: false };
    bump(db.metrics, "attribution", Date.now());
    return { ok: true };
  });
}

/** The host shared their invitation (or a personal link) one way or another. Owner only. */
export function recordShare(slug: string, key: string, channel: ShareChannel) {
  return write({ slug }, (db): { ok: boolean } => {
    const found = db.experiences.find((e) => e.slug === slug);
    if (!found || !ownsKey(found, key) || found.removed) return { ok: false };
    const stats = statsOf(found);
    stats.shares[channel] = (stats.shares[channel] ?? 0) + 1;
    bump(db.metrics, `share:${channel}`, Date.now());
    return { ok: true };
  });
}

/** A visit to one of WowLink's own pages (the studio, a sample, an occasion's page); `first` from this browser ever. */
export function recordPageView(page: PageMetric, first = false) {
  return write({ metricsOnly: true }, (db) => {
    bump(db.metrics, page, Date.now());
    if (first) bump(db.metrics, `${page}-visitor`, Date.now());
    return { ok: true };
  });
}

/** A visit to WowLink itself (its first page in a browser session), where it came from, and whether it's this browser's first. */
export function recordSiteVisit(from: Source, first: boolean) {
  return write({ metricsOnly: true }, (db) => {
    const now = Date.now();
    bump(db.metrics, "site", now);
    bump(db.metrics, `from:${from}`, now);
    if (first) bump(db.metrics, "site-visitor", now);
    return { ok: true };
  });
}

/** Counts about WowLink rather than an invitation or a page: hosts signing in (and new accounts), feedback sent. */
export type AppCount = "signin" | "signup" | "feedback";
export function recordCounts(...names: AppCount[]) {
  return write({ metricsOnly: true }, (db) => {
    for (const name of names) bump(db.metrics, name, Date.now());
    return { ok: true };
  });
}

// ---------- reports and taking down (WowLink's admin) ----------

/** The most open reports one invitation keeps, so it can't be flooded: newer ones replace the oldest. */
const OPEN_REPORTS_MAX = 50;

export function addReport(slug: string, reason: ReportReason, details: string) {
  return write({ link: slug, with: ["reports"] }, (db): { ok: true } | { ok: false; reason: "missing" } => {
    const found = findLive(db, slug);
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
  return read({ all: true, with: ["rsvps", "reports"] }, (db) => {
    const reported = db.experiences.filter((e) => db.reports.some((r) => r.experienceId === e.id)).map((e) => forAdmin(db, e));
    const open = (i: AdminInvitation) => i.reports.filter((r) => !r.resolvedAt).length;
    return reported.sort((a, b) => open(b) - open(a) || b.reports[0].createdAt.localeCompare(a.reports[0].createdAt));
  });
}

/** An invitation by its slug or one of its custom links (what a report or a guest would have). */
export function adminInvitation(link: string) {
  return read({ link, with: ["rsvps", "reports"] }, (db) => {
    const found = findAt(db, link);
    return found ? forAdmin(db, found) : null;
  });
}

/** The invitation as its general link shows guests, whatever its state: for the admin to look at before deciding. */
export function adminView(link: string) {
  return read({ link, with: ["rsvps"] }, (db) => {
    const found = findAt(db, link);
    return found ? toPublic(db, found, "all") : null;
  });
}

export type Moderation = "take-down" | "restore" | "dismiss" | "make-pro" | "make-free";

/** Take an invitation down (its open reports count as acted on), put it back, or dismiss its open reports. */
export function moderate(link: string, action: Moderation) {
  return write({ link, with: ["rsvps", "reports"] }, (db): { ok: true; invitation: AdminInvitation } | { ok: false } => {
    const found = findAt(db, link);
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
  return read({ all: true, metrics: true, with: ["rsvps", "reports"] }, (db) => {
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

// ---------- custom links (Creator studio) ----------

type AliasResult = { ok: true; aliases: string[] } | { ok: false; reason: "not-yours" | "pro" } | { ok: false; reason: "invalid" | "taken"; error: string };

/** Give an invitation a custom link. Its earlier custom links keep working (up to a few), so shared links don't break. */
const TAKEN = "That link is taken. Try another.";

export async function setAlias(slug: string, key: string, input: string): Promise<AliasResult> {
  try {
    return await saveAlias(slug, key, input);
  } catch (error) {
    // Someone else took it at the same moment.
    if (error instanceof LinkTaken) return { ok: false, reason: "taken", error: TAKEN };
    throw error;
  }
}

function saveAlias(slug: string, key: string, input: string) {
  return write({ slug, probe: [tidyAlias(input)] }, (db): AliasResult => {
    const found = db.experiences.find((e) => e.slug === slug);
    if (!found || !ownsKey(found, key)) return { ok: false, reason: "not-yours" };
    if (planOf(found) !== "pro") return { ok: false, reason: "pro" };
    const alias = tidyAlias(input);
    const error = aliasError(alias);
    if (error) return { ok: false, reason: "invalid", error };
    const mine = new Set([found.slug, ...(found.aliases ?? [])].map((l) => l.toLowerCase()));
    if (!mine.has(alias) && takenLinks(db).has(alias)) return { ok: false, reason: "taken", error: TAKEN };
    const aliases = [alias, ...(found.aliases ?? []).filter((a) => a !== alias)];
    found.aliases = aliases.slice(0, ALIAS_LIMITS.kept);
    // The oldest stops working, but nobody else may take it: guests may still have it.
    db.retired.push(...aliases.slice(ALIAS_LIMITS.kept));
    return { ok: true, aliases: found.aliases };
  });
}

// ---------- asking for the Creator studio ----------

export function requestUpgrade(slug: string, key: string, note: string, contact: string) {
  return write({ slug, with: ["upgrades"] }, (db): { ok: true } | { ok: false; reason: "not-yours" | "already" } => {
    const found = db.experiences.find((e) => e.slug === slug);
    if (!found || !ownsKey(found, key)) return { ok: false, reason: "not-yours" };
    if (planOf(found) === "pro") return { ok: false, reason: "already" };
    // One open request per invitation: asking again updates it.
    const open = db.upgrades.find((u) => u.experienceId === found.id && u.status === "open");
    if (open) Object.assign(open, { note, contact, createdAt: new Date().toISOString() });
    else db.upgrades.push({ id: randomUUID(), experienceId: found.id, note, contact, createdAt: new Date().toISOString(), status: "open" });
    bump(db.metrics, "upgrade-request", Date.now());
    return { ok: true };
  });
}

export type AdminUpgrade = UpgradeRequest & { invitation: Pick<Experience, "slug" | "title" | "templateId" | "date"> & { plan: Plan } };

/** Requests for the admin: open ones first (oldest first), then the latest decided ones. */
export function upgradeRequests() {
  return read({ all: true, with: ["upgrades"] }, (db) => {
    const withInvitation = (u: UpgradeRequest): AdminUpgrade | null => {
      const e = db.experiences.find((x) => x.id === u.experienceId);
      return e ? { ...u, invitation: { slug: e.slug, title: e.title, templateId: e.templateId, date: e.date, plan: planOf(e) } } : null;
    };
    const open = db.upgrades.filter((u) => u.status === "open").sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const decided = db.upgrades.filter((u) => u.status !== "open").sort((a, b) => (b.decidedAt ?? "").localeCompare(a.decidedAt ?? "")).slice(0, 30);
    return [...open, ...decided].map(withInvitation).filter((u): u is AdminUpgrade => !!u);
  });
}

/** Approve (the invitation moves to the Creator studio) or decline a request. */
export function decideUpgrade(id: string, approve: boolean) {
  return write({ upgradeId: id }, (db): { ok: boolean } => {
    const request = db.upgrades.find((u) => u.id === id);
    const found = request && db.experiences.find((e) => e.id === request.experienceId);
    if (!request || !found) return { ok: false };
    Object.assign(request, { status: approve ? "approved" : "declined", decidedAt: new Date().toISOString() });
    if (approve) found.plan = "pro";
    return { ok: true };
  });
}

// ---------- client previews (Creator studio) ----------

const PREVIEW_DAYS = 14;
const PREVIEWS_KEPT = 5;
/** How long an expired preview (and what the client said) stays for the planner to look back on. */
const PREVIEW_KEPT_DAYS = 60;
/** A preview's client may see it only while its invitation is in the Creator studio and hasn't been taken down. */
const previewable = (e: StoredExperience | undefined): e is StoredExperience => !!e && !e.removed && planOf(e) === "pro";

/** A preview of the invitation as the planner is about to change it, at its own link for the client. */
export function createPreview(slug: string, key: string, templateId: TemplateId, draft: InvitationDraft) {
  return write({ slug, with: ["previews"] }, (db): { ok: true; token: string } | { ok: false; reason: "not-yours" | "pro" | "removed" } => {
    const found = db.experiences.find((e) => e.slug === slug);
    if (!found || !ownsKey(found, key)) return { ok: false, reason: "not-yours" };
    if (found.removed) return { ok: false, reason: "removed" };
    if (planOf(found) !== "pro") return { ok: false, reason: "pro" };
    const now = Date.now();
    db.previews = db.previews.filter((p) => Date.parse(p.expiresAt) + PREVIEW_KEPT_DAYS * 86_400_000 > now);
    const token = randomBytes(9).toString("base64url");
    db.previews.push({ token, experienceId: found.id, templateId, draft, createdAt: new Date(now).toISOString(), expiresAt: new Date(now + PREVIEW_DAYS * 86_400_000).toISOString(), feedback: [] });
    // Only the latest few are kept.
    const mine = db.previews.filter((p) => p.experienceId === found.id);
    for (const old of mine.slice(0, Math.max(0, mine.length - PREVIEWS_KEPT))) db.previews.splice(db.previews.indexOf(old), 1);
    return { ok: true, token };
  });
}

/** The invitation's previews and what the client said, latest first. Owner only. */
export function ownerPreviews(slug: string, key: string) {
  return read({ slug, with: ["previews"] }, (db) => {
    const found = db.experiences.find((e) => e.slug === slug);
    if (!found || !ownsKey(found, key)) return null;
    return db.previews.filter((p) => p.experienceId === found.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(({ token, createdAt, expiresAt, feedback }) => ({ token, createdAt, expiresAt, feedback }));
  });
}

type ClientPreview = { expired: false; templateId: TemplateId; view: AudienceView; feedback: PreviewFeedback | null } | { expired: true; language: Lang };

/**
 * A preview as its client sees it: an expired one shows only that it has ended. Null when there's no such preview, or
 * its invitation was deleted, taken down or is no longer in the Creator studio.
 */
export function getPreview(token: string) {
  return read({ token }, (db): ClientPreview | null => {
    const preview = db.previews.find((p) => p.token === token);
    if (!preview || !previewable(db.experiences.find((e) => e.id === preview.experienceId))) return null;
    if (Date.parse(preview.expiresAt) < Date.now()) return { expired: true, language: preview.draft.language ?? "en" };
    return { expired: false, templateId: preview.templateId, view: viewFor(preview.draft, "all"), feedback: preview.feedback.at(-1) ?? null };
  });
}

/** The client's answer to a preview: it looks good, or what to change. */
export function addPreviewFeedback(token: string, verdict: PreviewFeedback["verdict"], note: string) {
  return write({ token }, (db): { ok: boolean } => {
    const preview = db.previews.find((p) => p.token === token);
    if (!preview || Date.parse(preview.expiresAt) < Date.now() || !previewable(db.experiences.find((e) => e.id === preview.experienceId))) return { ok: false };
    preview.feedback = [...preview.feedback, { verdict, note, at: new Date().toISOString() }].slice(-20);
    return { ok: true };
  });
}

// ---------- accounts ----------

/**
 * A signed-in host and this device: invitations whose key the device has and that have no owner yet become theirs,
 * and the device gets a key of its own for each of their invitations it doesn't have one for. Returns those keys.
 */
export async function syncAccount(ownerId: string, known: { slug: string; key: string }[]) {
  for (const { slug, key } of known.slice(0, 50)) {
    await write({ slug }, (db): { ok: boolean } => {
      const found = db.experiences.find((e) => e.slug === slug);
      if (!found || found.ownerId || !ownsKey(found, key)) return { ok: false };
      found.ownerId = ownerId;
      return { ok: true };
    });
  }
  return write({ owner: ownerId }, (db) => {
    const working = new Set(known.filter(({ slug, key }) => db.experiences.some((e) => e.slug === slug && ownsKey(e, key))).map((k) => k.slug));
    const keys: { slug: string; key: string }[] = [];
    for (const e of db.experiences) {
      if (e.ownerId !== ownerId || working.has(e.slug)) continue;
      const key = randomBytes(24).toString("base64url");
      e.keyHashes = [...(e.keyHashes ?? []), hash(key)].slice(-DEVICE_KEYS);
      keys.push({ slug: e.slug, key });
    }
    return { ok: keys.length > 0, keys };
  });
}

