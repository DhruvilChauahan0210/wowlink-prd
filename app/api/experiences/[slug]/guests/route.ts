import { keyFrom, notYours } from "../../../../lib/owner";
import { PLAN_LIMITS } from "../../../../lib/plans";
import { addGuest, addGuests } from "../../../../lib/store";

const full = (limit: number) => `All ${limit} replies this invitation can take are in use, counting one kept for each personal invitation.`;
const proOnly = () => Response.json({ error: "Personal invitations are part of the Creator studio." }, { status: 403 });

/**
 * Add personal invitations. Needs the manage key.
 *   { name, events, phone? }   one household
 *   { list, events }           a pasted list, one household per line (optionally "name, WhatsApp number"); all or nothing
 */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await request.json().catch(() => null);
  if (typeof body?.list === "string") {
    const result = await addGuests(slug, keyFrom(request), body);
    if (result.ok) return Response.json({ guests: result.guests, skipped: result.skipped }, { status: 201 });
    if (result.reason === "invalid") return Response.json({ error: "A few details are missing.", fields: result.errors }, { status: 422 });
    if (result.reason === "pro") return proOnly();
    if (result.reason === "full") return Response.json({ error: result.room ? `There’s room for ${result.room} more personal ${result.room === 1 ? "invitation" : "invitations"}. Add fewer at once.` : full(PLAN_LIMITS.pro.replies) }, { status: 409 });
    return notYours();
  }
  const result = await addGuest(slug, keyFrom(request), body);
  if (result.ok) return Response.json({ guest: result.guest }, { status: 201 });
  if (result.reason === "invalid") return Response.json({ error: "A few details are missing.", fields: result.errors }, { status: 422 });
  if (result.reason === "pro") return proOnly();
  if (result.reason === "full") return Response.json({ error: full(PLAN_LIMITS.pro.replies) }, { status: 409 });
  return notYours();
}
