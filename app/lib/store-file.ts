import { promises as fs } from "node:fs";
import path from "node:path";
import type { Backend, Db } from "./store";

/*
 * The store in one JSON file (.data/wowlink.json, git-ignored): used when there's no DATABASE_URL. Fine for one server
 * process and for trying the product out. Every read and write runs through one queue, and writes replace the file
 * atomically, so two requests at once can't interleave or leave a half-written file. Every call gets all the data.
 */

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
    return { experiences: db.experiences ?? [], rsvps: db.rsvps ?? [], retired: db.retired ?? [], reports: db.reports ?? [], metrics: db.metrics ?? {}, upgrades: db.upgrades ?? [], previews: db.previews ?? [] };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { experiences: [], rsvps: [], retired: [], reports: [], metrics: {}, upgrades: [], previews: [] };
    throw error;
  }
}

async function save(db: Db) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2));
  await fs.rename(tmp, FILE);
}

export const fileBackend: Backend = {
  read: (_scope, fn) => serialized(async () => fn(await load())),
  write: (_scope, fn) =>
    serialized(async () => {
      const db = await load();
      const result = fn(db);
      if ((result as { ok?: boolean } | null)?.ok !== false) await save(db);
      return result;
    }),
};
