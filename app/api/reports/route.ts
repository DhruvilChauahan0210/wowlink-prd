import { allow, clientId } from "../../lib/rate-limit";
import { REPORT_DETAILS_MAX, isReportReason } from "../../lib/reports";
import { addReport } from "../../lib/store";

/** Report an invitation: { slug, reason, details? }. Nothing about who sent it is kept. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.slug !== "string") return Response.json({ error: "Which invitation?" }, { status: 400 });
  // Bots fill in the hidden field; thank them and keep nothing.
  if (typeof body.website === "string" && body.website.trim()) return Response.json({ ok: true }, { status: 201 });
  if (!isReportReason(body.reason)) return Response.json({ error: "Pick what’s wrong with it." }, { status: 422 });
  if (!allow(`report:${clientId(request)}`, 5, 60 * 60 * 1000)) return Response.json({ error: "You’ve sent a lot of reports. Try again a little later." }, { status: 429 });
  const details = typeof body.details === "string" ? body.details.replace(/\s+/g, " ").trim().slice(0, REPORT_DETAILS_MAX) : "";
  const result = await addReport(body.slug.slice(0, 20), body.reason, details);
  return result.ok ? Response.json({ ok: true }, { status: 201 }) : Response.json({ error: "This invitation isn’t available any more." }, { status: 404 });
}
