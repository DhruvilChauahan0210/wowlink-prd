/*
 * A small in-memory, sliding-window rate limiter for the publishing and RSVP endpoints.
 * It lives in one server process, which matches the local file store; a hosted setup would move this
 * to something shared (the database or a cache).
 */

// Each key keeps its own window, so tidying up for a 10-minute limit never forgets an hour-long one.
type Entry = { windowMs: number; times: number[] };
const g = globalThis as typeof globalThis & { __wowlinkHits?: Map<string, Entry> };
const hits: Map<string, Entry> = (g.__wowlinkHits ??= new Map<string, Entry>());

const recent = (key: string, windowMs: number, now: number) => (hits.get(key)?.times ?? []).filter((t) => now - t < windowMs);

/** Returns true if this key has made fewer than `limit` requests in the last `windowMs`. */
export function allow(key: string, limit: number, windowMs: number) {
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

/** Whether this key is still under `limit` in the last `windowMs`, without counting this as a request. */
export function under(key: string, limit: number, windowMs: number) {
  return recent(key, windowMs, Date.now()).length < limit;
}

/** Best-effort client identifier from the request. */
export function clientId(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}
