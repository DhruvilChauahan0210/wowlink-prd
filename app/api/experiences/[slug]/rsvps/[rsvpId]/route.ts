import { keyFrom, notYours } from "../../../../../lib/owner";
import { setWishHidden } from "../../../../../lib/store";

/** Hide a reply's wish from the invitation, or show it again: { hidden: boolean }. Needs the manage key. */
export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string; rsvpId: string }> }) {
  const { slug, rsvpId } = await params;
  const body = await request.json().catch(() => null);
  if (typeof body?.hidden !== "boolean") return Response.json({ error: "Say whether to hide it." }, { status: 400 });
  const result = await setWishHidden(slug, keyFrom(request), rsvpId, body.hidden);
  if (result.ok) return Response.json({ ok: true });
  return result.reason === "missing" ? Response.json({ error: "That wish isn’t there any more." }, { status: 404 }) : notYours();
}
