import { isTemplateId, validateDraft } from "../../../../lib/invitations";
import { keyFrom, notYours } from "../../../../lib/owner";
import { createPreview, ownerPreviews } from "../../../../lib/store";

type Params = { params: Promise<{ slug: string }> };

/** The invitation's client previews, with what each client said. Needs the manage key. */
export async function GET(request: Request, { params }: Params) {
  const previews = await ownerPreviews((await params).slug, keyFrom(request));
  return previews ? Response.json({ previews }, { headers: { "Cache-Control": "no-store" } }) : notYours();
}

/** A preview of the invitation as it's about to change: { templateId, draft }. Creator studio; needs the manage key. */
export async function POST(request: Request, { params }: Params) {
  const body = await request.json().catch(() => null);
  if (!body || !isTemplateId(body.templateId)) return Response.json({ error: "Choose an occasion first." }, { status: 400 });
  const checked = validateDraft(body.draft);
  if (!checked.ok) return Response.json({ error: "A few details are missing.", fields: checked.errors }, { status: 422 });
  const result = await createPreview((await params).slug, keyFrom(request), body.templateId, checked.value);
  if (result.ok) return Response.json({ token: result.token }, { status: 201 });
  return result.reason === "pro" ? Response.json({ error: "Client previews are part of the Creator studio." }, { status: 403 }) : notYours();
}
