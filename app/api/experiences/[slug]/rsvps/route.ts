import { ATTENDANCE, LIMITS, type Attendance } from "../../../../lib/invitations";
import { allow, clientId } from "../../../../lib/rate-limit";
import { addRsvp } from "../../../../lib/store";

/**
 * A guest's reply. No account needed; guarded by a honeypot field and rate limits.
 *   events   the celebrations they ticked        shown   the celebrations their page showed
 *   counts   party size per celebration, when it differs     guest   set when replying from a personal link
 */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "Something went wrong. Please try again." }, { status: 400 });
  // Bots fill in every field; people never see this one. Pretend it worked.
  if (typeof body.website === "string" && body.website.trim()) return Response.json({ ok: true }, { status: 201 });
  const guestId = typeof body.guest === "string" && body.guest ? body.guest.slice(0, 40) : undefined;
  // A personal link is limited per household, not per network: one cousin often replies for several families from
  // one phone, and relatives at a gathering share an address. The general link is limited per address.
  const limitKey = guestId ? `rsvp:${slug}:guest:${guestId}` : `rsvp:${clientId(request)}:${slug}`;
  if (!allow(limitKey, 5, 10 * 60 * 1000)) return Response.json({ error: "That’s a lot of replies in a row. Please wait a few minutes." }, { status: 429 });
  if (!ATTENDANCE.includes(body.attendance)) return Response.json({ error: "Let us know if you’re coming." }, { status: 422 });
  const attendance = body.attendance as Attendance;
  const name = typeof body.name === "string" ? body.name.trim().slice(0, LIMITS.guestName) : "";
  const count = Number(body.guestCount);
  const guestCount = attendance === "Not attending" ? 0 : Number.isInteger(count) && count >= 1 && count <= LIMITS.guests ? count : 1;
  const result = await addRsvp(slug, { name, attendance, guestCount, events: body.events, shown: body.shown, counts: body.counts, guestId });
  if (result.ok) return Response.json({ ok: true, updated: result.updated }, { status: result.updated ? 200 : 201 });
  switch (result.reason) {
    case "invalid": return Response.json({ error: result.error }, { status: 422 });
    case "full": return Response.json({ error: "This invitation isn’t taking more replies. Please contact the hosts directly." }, { status: 409 });
    case "guest": return Response.json({ error: "This personal link isn’t active any more. Please ask the hosts for a new one." }, { status: 404 });
    default: return Response.json({ error: "This invitation isn’t available any more." }, { status: 404 });
  }
}
