import { createHash, timingSafeEqual } from "node:crypto";
import { allow, clientId, under } from "./rate-limit";

/*
 * WowLink's own admin (reports, taking invitations down, the app's numbers). There are no accounts yet, so it's one
 * secret key, set as WOWLINK_ADMIN_KEY on the server and sent as a Bearer token. Without it set, the admin doesn't
 * exist: every admin route answers 404, the same as a wrong key.
 */

const MIN_LENGTH = 24;
const FAILURES = { limit: 10, windowMs: 60 * 60 * 1000 };
const digest = (value: string) => createHash("sha256").update(value).digest();

/**
 * Whether the request carries the admin key: "ok", "no" (wrong key, or no admin), or "locked" after ten wrong tries
 * from one address within the hour.
 */
export function checkAdmin(request: Request): "ok" | "no" | "locked" {
  const expected = process.env.WOWLINK_ADMIN_KEY ?? "";
  if (expected.length < MIN_LENGTH) return "no";
  const who = `admin-fail:${clientId(request)}`;
  if (!under(who, FAILURES.limit, FAILURES.windowMs)) return "locked";
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ?? "";
  if (timingSafeEqual(digest(given), digest(expected))) return "ok";
  allow(who, FAILURES.limit, FAILURES.windowMs);
  return "no";
}

/** The answer for anything but the right key: 404 (as if there were no admin), or 429 once locked out. */
export function adminDenied(request: Request): Response | null {
  const check = checkAdmin(request);
  if (check === "ok") return null;
  return check === "locked"
    ? Response.json({ error: "Too many wrong tries. Try again in an hour." }, { status: 429 })
    : Response.json({ error: "Not found." }, { status: 404 });
}
