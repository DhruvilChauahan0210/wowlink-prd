import { isTemplateId, validateDraft } from "../../../lib/invitations";
import { keyFrom, notYours } from "../../../lib/owner";
import { getOwned, updateOwned } from "../../../lib/store";

type Params = { params: Promise<{ slug: string }> };

/** The owner's view: the invitation, its guest list and every RSVP. Needs the manage key. */
export async function GET(request: Request, { params }: Params) {
  const { slug } = await params;
  const owned = await getOwned(slug, keyFrom(request));
  return owned ? Response.json(owned, { headers: { "Cache-Control": "no-store" } }) : notYours();
}

/** Edit the invitation, publish/unpublish it, choose what the general link shows, or show guests’ wishes. Needs the manage key. */
export async function PATCH(request: Request, { params }: Params) {
  const { slug } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "Nothing to update." }, { status: 400 });
  const patch: Parameters<typeof updateOwned>[2] = {};
  if (body.templateId !== undefined) {
    if (!isTemplateId(body.templateId)) return Response.json({ error: "Choose an occasion first." }, { status: 400 });
    patch.templateId = body.templateId;
  }
  if (body.draft !== undefined) {
    const checked = validateDraft(body.draft);
    if (!checked.ok) return Response.json({ error: "A few details are missing.", fields: checked.errors }, { status: 422 });
    patch.draft = checked.value;
  }
  if (body.status !== undefined) {
    if (body.status !== "published" && body.status !== "unpublished") return Response.json({ error: "Unknown status." }, { status: 400 });
    patch.status = body.status;
  }
  if (body.publicEvents !== undefined) patch.publicEvents = body.publicEvents;
  if (body.showWishes !== undefined) {
    if (typeof body.showWishes !== "boolean") return Response.json({ error: "Unknown setting." }, { status: 400 });
    patch.showWishes = body.showWishes;
  }
  const result = await updateOwned(slug, keyFrom(request), patch);
  if (result.ok) return Response.json({ experience: result.experience });
  return result.reason === "invalid" ? Response.json({ error: "Pick at least one celebration for the general link." }, { status: 422 }) : notYours();
}
