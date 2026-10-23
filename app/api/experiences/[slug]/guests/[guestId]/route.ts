import { keyFrom, notYours } from "../../../../../lib/owner";
import { removeGuest, updateGuest } from "../../../../../lib/store";

type Params = { params: Promise<{ slug: string; guestId: string }> };
const noSuchGuest = () => Response.json({ error: "That personal invitation isn’t there any more." }, { status: 404 });

/** Rename a personal invitation or change its celebrations. Needs the manage key. */
export async function PATCH(request: Request, { params }: Params) {
  const { slug, guestId } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "Nothing to update." }, { status: 400 });
  const result = await updateGuest(slug, keyFrom(request), guestId, body);
  if (result.ok) return Response.json({ guest: result.guest });
  if (result.reason === "invalid") return Response.json({ error: "A few details are missing.", fields: result.errors }, { status: 422 });
  return result.reason === "missing" ? noSuchGuest() : notYours();
}

/** Remove a personal invitation; its link stops working and its reply is removed with it. Needs the manage key. */
export async function DELETE(request: Request, { params }: Params) {
  const { slug, guestId } = await params;
  const result = await removeGuest(slug, keyFrom(request), guestId);
  if (result.ok) return Response.json({ ok: true });
  return result.reason === "missing" ? noSuchGuest() : notYours();
}
