import { isTemplateId, validateDraft } from "../../lib/invitations";
import { allow, clientId } from "../../lib/rate-limit";
import { createExperience } from "../../lib/store";
import { checkAdmin } from "../../lib/admin";
import { proFeaturesIn, proMessage } from "../../lib/plans";

/** Publish a new invitation. Returns its public slug and the private manage key (shown to the creator once). */
export async function POST(request: Request) {
  if (!allow(`publish:${clientId(request)}`, 10, 60 * 60 * 1000)) return Response.json({ error: "You’ve published a lot in the last hour. Try again a little later." }, { status: 429 });
  const body = await request.json().catch(() => null);
  if (!body || !isTemplateId(body.templateId)) return Response.json({ error: "Choose an occasion first." }, { status: 400 });
  const checked = validateDraft(body.draft);
  if (!checked.ok) return Response.json({ error: "A few details are missing.", fields: checked.errors }, { status: 422 });
  // Everything new starts free; WowLink's admin can make one in the Creator studio directly (for a client, say).
  const plan = body.plan === "pro" && checkAdmin(request) === "ok" ? "pro" : "free";
  if (plan === "free") {
    const features = proFeaturesIn(body.templateId, checked.value);
    if (features.length) return Response.json({ error: proMessage(features), pro: features }, { status: 403 });
  }
  const { experience, key } = await createExperience(body.templateId, checked.value, plan);
  return Response.json({ slug: experience.slug, key }, { status: 201 });
}
