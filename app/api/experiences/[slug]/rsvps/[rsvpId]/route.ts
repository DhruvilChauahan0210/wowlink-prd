import { keyFrom, notYours } from "../../../../../lib/owner";
import { removeRsvp, setWishHidden } from "../../../../../lib/store";

type Params = { params: Promise<{ slug: string; rsvpId: string }> };
const noSuchReply = () => Response.json({ error: "That reply isn’t there any more." }, { status: 404 });

/** Hide a reply's wish from the invitation, or show it again: { hidden: boolean }. Needs the manage key. */
export async function PATCH(request: Request, { params }: Params) {
  const { slug, rsvpId } = await params;
  const body = await request.json().catch(() => null);
  if (typeof body?.hidden !== "boolean") return Response.json({ error: "Say whether to hide it." }, { status: 400 });
  const result = await setWishHidden(slug, keyFrom(request), rsvpId, body.hidden);
  if (result.ok) return Response.json({ ok: true });
  return result.reason === "missing" ? Response.json({ error: "That wish isn’t there any more." }, { status: 404 }) : notYours();
}

/** Delete one reply, with its wish (when a guest asks to be taken off, say). Needs the manage key. */
export async function DELETE(request: Request, { params }: Params) {
  const { slug, rsvpId } = await params;
  const result = await removeRsvp(slug, keyFrom(request), rsvpId);
  if (result.ok) return Response.json({ ok: true });
  return result.reason === "missing" ? noSuchReply() : notYours();
}
