import { isTemplateId, validateDraft } from "../../../lib/invitations";
import { getOwned, updateOwned } from "../../../lib/store";

type Params = { params: Promise<{ slug: string }> };

const keyFrom = (request: Request) => request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ?? "";
const notYours = () => Response.json({ error: "This link isn’t valid for that invitation." }, { status: 404 });

/** The owner's view: the invitation and every RSVP. Needs the manage key. */
export async function GET(request: Request, { params }: Params) {
  const { slug } = await params;
  const owned = await getOwned(slug, keyFrom(request));
  return owned ? Response.json(owned, { headers: { "Cache-Control": "no-store" } }) : notYours();
}

/** Edit the invitation, or publish/unpublish it. Needs the manage key. */
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
  const updated = await updateOwned(slug, keyFrom(request), patch);
  return updated ? Response.json({ experience: updated }) : notYours();
}
