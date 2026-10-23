import { database } from "./store-pg";

/*
 * Server errors, so someone finds out before a guest says so: every uncaught error in a page or route
 * (instrumentation.ts) is noted here, shown on the admin page, and counted by /api/health, which the live-site check
 * (.github/workflows/health.yml) calls. Only where and what: no request bodies, no query strings, nobody's details.
 * In the database when there is one (the latest few hundred), otherwise in this server's memory.
 */

export type ServerError = { at: string; method: string; path: string; message: string; digest: string | null };

const KEPT = 300;
const g = globalThis as typeof globalThis & { __wowlinkErrors?: ServerError[] };
const memory = (g.__wowlinkErrors ??= []);

export async function recordError(error: Omit<ServerError, "at">) {
  const sql = database();
  if (!sql) {
    memory.unshift({ ...error, at: new Date().toISOString() });
    memory.splice(50);
    return;
  }
  await sql`insert into wowlink.errors (method, path, message, digest) values (${error.method}, ${error.path}, ${error.message}, ${error.digest})`;
  if (Math.random() < 0.05) await sql`delete from wowlink.errors where id < (select min(id) from (select id from wowlink.errors order by id desc limit ${KEPT}) kept)`;
}

/** The latest errors, newest first. */
export async function recentErrors(limit = 50): Promise<ServerError[]> {
  const sql = database();
  if (!sql) return memory.slice(0, limit);
  const rows = await sql<{ at: Date; method: string; path: string; message: string; digest: string | null }[]>`select at, method, path, message, digest from wowlink.errors order by id desc limit ${limit}`;
  return rows.map((r) => ({ ...r, at: r.at.toISOString() }));
}

/** How many errors in the last `ms`. */
export async function errorsSince(ms: number) {
  const sql = database();
  const since = new Date(Date.now() - ms);
  if (!sql) return memory.filter((e) => new Date(e.at) > since).length;
  const [{ count }] = await sql<{ count: number }[]>`select count(*)::int as count from wowlink.errors where at > ${since}`;
  return count;
}
