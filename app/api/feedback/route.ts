import { FEEDBACK_LIMITS, isMood } from "../../lib/feedback";
import { saveFeedback } from "../../lib/feedback-store";
import { allow, clientId } from "../../lib/rate-limit";
import { recordCounts } from "../../lib/store";

/** Feedback from the Feedback button: { message, mood?, page?, contact? }. Read on the admin page. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  // Bots fill in the hidden field; thank them and keep nothing.
  if (typeof body?.website === "string" && body.website.trim()) return Response.json({ ok: true }, { status: 201 });
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (message.length < 2) return Response.json({ error: "Write a few words first." }, { status: 400 });
  if (message.length > FEEDBACK_LIMITS.message) return Response.json({ error: `Keep it under ${FEEDBACK_LIMITS.message} characters.` }, { status: 400 });
  if (!await allow(`feedback:${clientId(request)}`, 5, 60 * 60 * 1000)) return Response.json({ error: "You’ve sent a few already. Thank you! Try again in an hour." }, { status: 429 });
  // Just the page's path, never its query (which can hold a manage key or a preview link).
  const page = typeof body.page === "string" ? body.page.split(/[?#]/)[0].slice(0, FEEDBACK_LIMITS.page) : "";
  const contact = typeof body.contact === "string" ? body.contact.replace(/\s+/g, " ").trim().slice(0, FEEDBACK_LIMITS.contact) : "";
  await saveFeedback({ message, mood: isMood(body.mood) ? body.mood : null, page: page.startsWith("/") ? page : "/", contact: contact || null });
  await recordCounts("feedback").catch(() => undefined);
  return Response.json({ ok: true }, { status: 201 });
}
