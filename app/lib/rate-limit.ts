/*
 * A small in-memory, sliding-window rate limiter for the publishing and RSVP endpoints.
 * It lives in one server process, which matches the local file store; a hosted setup would move this
 * to something shared (the database or a cache).
 */

const g = globalThis as typeof globalThis & { __wowlinkHits?: Map<string, number[]> };
const hits: Map<string, number[]> = (g.__wowlinkHits ??= new Map<string, number[]>());

/** Returns true if this key has made fewer than `limit` requests in the last `windowMs`. */
export function allow(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  return true;
}

/** Best-effort client identifier from the request. */
export function clientId(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}
