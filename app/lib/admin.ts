import { createHash, timingSafeEqual } from "node:crypto";
import { allow, clientId, under } from "./rate-limit";

/*
 * WowLink's own admin (reports, taking invitations down, the app's numbers). It's one secret key (not yet a role on
 * an account), set as WOWLINK_ADMIN_KEY on the server and sent as a Bearer token. Without it set, the admin doesn't
 * exist: every admin route answers 404, the same as a wrong key.
 */

/**
 * On a live site anyone can try keys, so a short one (like "admin") would be guessed: it needs 24 characters or the
 * admin stays off. On your own computer (`npm run dev`) any key will do.
 */
const MIN_LENGTH = process.env.NODE_ENV === "production" ? 24 : 1;
const FAILURES = { limit: 10, windowMs: 60 * 60 * 1000 };
let warned = false;
const digest = (value: string) => createHash("sha256").update(value).digest();

/**
 * Whether the request carries the admin key: "ok", "no" (wrong key, or no admin), or "locked" after ten wrong tries
 * from one address within the hour.
 */
export async function checkAdmin(request: Request): Promise<"ok" | "no" | "locked"> {
  const expected = process.env.WOWLINK_ADMIN_KEY ?? "";
  if (expected.length < MIN_LENGTH) {
    if (expected && !warned) {
      warned = true;
      console.warn(`WOWLINK_ADMIN_KEY is set but shorter than ${MIN_LENGTH} characters, so the admin is off. Make one with: openssl rand -hex 24`);
    }
    return "no";
  }
  const who = `admin-fail:${clientId(request)}`;
  if (!(await under(who, FAILURES.limit, FAILURES.windowMs))) return "locked";
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ?? "";
  if (timingSafeEqual(digest(given), digest(expected))) return "ok";
  await allow(who, FAILURES.limit, FAILURES.windowMs);
  return "no";
}

/** The answer for anything but the right key: 404 (as if there were no admin), or 429 once locked out. */
export async function adminDenied(request: Request): Promise<Response | null> {
  const check = await checkAdmin(request);
  if (check === "ok") return null;
  return check === "locked"
    ? Response.json({ error: "Too many wrong tries. Try again in an hour." }, { status: 429 })
    : Response.json({ error: "Not found." }, { status: 404 });
}
