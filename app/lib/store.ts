import { createHash, randomBytes, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
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
};
export type Rsvp = { id: string; experienceId: string; name: string; attendance: Attendance; guestCount: number; createdAt: string };
/** What a guest is allowed to see. */
export type PublicExperience = Pick<Experience, "slug" | "templateId" | "title" | "date" | "time" | "venue" | "message">;

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

async function load(): Promise<Db> {
  try {
    const db = JSON.parse(await fs.readFile(FILE, "utf8")) as Db;
    return { experiences: db.experiences ?? [], rsvps: db.rsvps ?? [] };
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
const write = <T>(fn: (db: Db) => T) =>
  serialized(async () => {
    const db = await load();
    const result = fn(db);
    await save(db);
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
function newSlug(taken: Set<string>) {
  for (;;) {
    const slug = Array.from({ length: 7 }, () => SLUG_ALPHABET[randomInt(SLUG_ALPHABET.length)]).join("");
    if (!taken.has(slug)) return slug;
  }
}

const toPublic = ({ slug, templateId, title, date, time, venue, message }: Experience): PublicExperience => ({ slug, templateId, title, date, time, venue, message });
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
      keyHash: hash(key),
    };
    db.experiences.push(stored);
    return { experience: strip(stored), key };
  });
}

/** The guest view of a published invitation, or null if it doesn't exist or has been unpublished. */
export function getPublished(slug: string) {
  return read((db) => {
    const found = db.experiences.find((e) => e.slug === slug && e.status === "published");
    return found ? toPublic(found) : null;
  });
}

/** The full invitation and its RSVPs, but only for whoever holds its manage key. */
export function getOwned(slug: string, key: string) {
  return read((db) => {
    const found = db.experiences.find((e) => e.slug === slug);
    if (!found || !keyMatches(found.keyHash, key)) return null;
    const rsvps = db.rsvps.filter((r) => r.experienceId === found.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { experience: strip(found), rsvps };
  });
}

export function updateOwned(slug: string, key: string, patch: { templateId?: TemplateId; draft?: InvitationDraft; status?: Experience["status"] }) {
  return write((db) => {
    const found = db.experiences.find((e) => e.slug === slug);
    if (!found || !keyMatches(found.keyHash, key)) return null;
    if (patch.templateId) found.templateId = patch.templateId;
    if (patch.draft) Object.assign(found, patch.draft);
    if (patch.status) found.status = patch.status;
    found.updatedAt = new Date().toISOString();
    return strip(found);
  });
}

// ---------- RSVPs ----------

export function addRsvp(slug: string, input: { name: string; attendance: Attendance; guestCount: number }) {
  return write((db): { ok: true } | { ok: false; reason: "missing" | "full" } => {
    const found = db.experiences.find((e) => e.slug === slug && e.status === "published");
    if (!found) return { ok: false, reason: "missing" };
    if (db.rsvps.filter((r) => r.experienceId === found.id).length >= LIMITS.rsvpsPerEvent) return { ok: false, reason: "full" };
    db.rsvps.push({ id: randomUUID(), experienceId: found.id, ...input, createdAt: new Date().toISOString() });
    return { ok: true };
  });
}
