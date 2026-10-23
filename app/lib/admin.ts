import { createHash, timingSafeEqual } from "node:crypto";
import { currentUser } from "./auth";
import { allow, clientId, under } from "./rate-limit";

/*
 * WowLink's own admin (reports, taking invitations down, the app's numbers). An admin is a Google account listed in
 * WOWLINK_ADMINS (emails, comma-separated), signed in as usual; nothing to share or leak. A key (WOWLINK_ADMIN_KEY,
 * sent as a Bearer token) also opens it, for `npm run dev` and the tests; a live site needn't have one. Anyone else
 * gets 404 from every admin route, as if there were no admin.
 */

/** Whether this email is one of WowLink's admins. */
export const isAdminEmail = (email: string) => !!email && (process.env.WOWLINK_ADMINS ?? "").split(",").map((e) => e.trim().toLowerCase()).includes(email.toLowerCase());

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
  const user = await currentUser(request);
  if (user && isAdminEmail(user.email)) return "ok";
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
  // No key at all (a signed-in host who isn't an admin, say) isn't a wrong try.
  if (!given) return "no";
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
