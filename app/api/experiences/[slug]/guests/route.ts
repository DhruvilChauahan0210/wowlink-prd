import { LIMITS } from "../../../../lib/invitations";
import { keyFrom, notYours } from "../../../../lib/owner";
import { addGuest } from "../../../../lib/store";

/** Add a personal invitation: who it's for and which celebrations it shows. Needs the manage key. */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await request.json().catch(() => null);
  const result = await addGuest(slug, keyFrom(request), body);
  if (result.ok) return Response.json({ guest: result.guest }, { status: 201 });
  if (result.reason === "invalid") return Response.json({ error: "A few details are missing.", fields: result.errors }, { status: 422 });
  if (result.reason === "full") return Response.json({ error: `The free plan has ${LIMITS.rsvpsPerEvent} replies, and each personal invitation keeps one for its household. They’re all in use.` }, { status: 409 });
  return notYours();
}
