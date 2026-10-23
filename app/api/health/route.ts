import { errorsSince } from "../../lib/errors";
import { forgetOldCounts } from "../../lib/rate-limit";
import { database } from "../../lib/store-pg";

/*
 * Whether the site is well, for the live-site check (.github/workflows/health.yml): the database answers, and how many
 * server errors there were in the last hour. Counts only, never what they were (that's on the admin page).
 */

export const dynamic = "force-dynamic";

export async function GET() {
  const sql = database();
  let db: "ok" | "down" | "none" = "none";
  if (sql) db = await sql`select 1`.then(() => "ok" as const, () => "down" as const);
  // Housekeeping the privacy page promises: old rate-limit counts (with internet addresses) go after two days.
  if (db === "ok") await forgetOldCounts().catch(() => undefined);
  const errorsLastHour = db === "down" ? null : await errorsSince(60 * 60 * 1000).catch(() => null);
  const ok = db !== "down";
  return Response.json({ ok, db, errorsLastHour }, { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
