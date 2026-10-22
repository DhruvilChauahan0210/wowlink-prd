import { ATTENDANCE, LIMITS, type Attendance } from "../../../../lib/invitations";
import { allow, clientId } from "../../../../lib/rate-limit";
import { addRsvp } from "../../../../lib/store";

/** A guest's reply. No account needed; guarded by a honeypot field and a per-guest rate limit. */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "Something went wrong. Please try again." }, { status: 400 });
  // Bots fill in every field; people never see this one. Pretend it worked.
  if (typeof body.website === "string" && body.website.trim()) return Response.json({ ok: true }, { status: 201 });
  if (!allow(`rsvp:${clientId(request)}:${slug}`, 5, 10 * 60 * 1000)) return Response.json({ error: "That’s a lot of replies in a row. Please wait a few minutes." }, { status: 429 });
  if (!ATTENDANCE.includes(body.attendance)) return Response.json({ error: "Let us know if you’re coming." }, { status: 422 });
  const attendance = body.attendance as Attendance;
  const name = typeof body.name === "string" ? body.name.trim().slice(0, LIMITS.guestName) : "";
  const count = Number(body.guestCount);
  const guestCount = attendance === "Attending" ? (Number.isInteger(count) && count >= 1 && count <= LIMITS.guests ? count : 1) : 0;
  const result = await addRsvp(slug, { name, attendance, guestCount });
  if (result.ok) return Response.json({ ok: true }, { status: 201 });
  return result.reason === "full"
    ? Response.json({ error: "This invitation isn’t taking more replies. Please contact the hosts directly." }, { status: 409 })
    : Response.json({ error: "This invitation isn’t available any more." }, { status: 404 });
}
