import { database } from "./store-pg";

/*
 * Rate limits for publishing, replies, reports and the admin key. With a database (DATABASE_URL) the counts live in
 * Postgres, so every server sees the same ones (on Vercel each request may land on a different server): a fixed
 * window per key, one row per key and window. Without one, they're kept in this server process's memory, a sliding
 * window, which suits the local file store.
 */

// Each key keeps its own window, so tidying up for a 10-minute limit never forgets an hour-long one.
type Entry = { windowMs: number; times: number[] };
const g = globalThis as typeof globalThis & { __wowlinkHits?: Map<string, Entry> };
const hits: Map<string, Entry> = (g.__wowlinkHits ??= new Map<string, Entry>());

const recent = (key: string, windowMs: number, now: number) => (hits.get(key)?.times ?? []).filter((t) => now - t < windowMs);

function allowInMemory(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const times = recent(key, windowMs, now);
  if (times.length >= limit) {
    hits.set(key, { windowMs, times });
    return false;
  }
  times.push(now);
  hits.set(key, { windowMs, times });
  if (hits.size > 5000) for (const [k, entry] of hits) if (!entry.times.some((t) => now - t < entry.windowMs)) hits.delete(k);
  return true;
}

const windowOf = (windowMs: number) => Math.floor(Date.now() / windowMs) * windowMs;

/** Counts this request, and says whether this key is still within `limit` requests per `windowMs`. */
export async function allow(key: string, limit: number, windowMs: number) {
  const sql = database();
  if (!sql) return allowInMemory(key, limit, windowMs);
  const [{ count }] = await sql<{ count: number }[]>`insert into wowlink.rate_limits (key, window_start, count) values (${key}, ${windowOf(windowMs)}, 1)
    on conflict (key, window_start) do update set count = wowlink.rate_limits.count + 1 returning count`;
  // Now and then, windows long over go.
  if (Math.random() < 0.01) await sql`delete from wowlink.rate_limits where window_start < ${Date.now() - 2 * 86_400_000}`;
  return count <= limit;
}

/** Whether this key is still under `limit` in its current window, without counting this as a request. */
export async function under(key: string, limit: number, windowMs: number) {
  const sql = database();
  if (!sql) return recent(key, windowMs, Date.now()).length < limit;
  const rows = await sql<{ count: number }[]>`select count from wowlink.rate_limits where key = ${key} and window_start = ${windowOf(windowMs)}`;
  return (rows[0]?.count ?? 0) < limit;
}

/** Best-effort client identifier from the request. */
export function clientId(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}
