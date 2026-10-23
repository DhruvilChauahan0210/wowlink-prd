import { isTemplateId, validateDraft } from "../../lib/invitations";
import { allow, clientId } from "../../lib/rate-limit";
import { createExperience } from "../../lib/store";
import { checkAdmin } from "../../lib/admin";
import { FREE_LIMIT_MESSAGE, proFeaturesIn, proMessage } from "../../lib/plans";
import { accountsOn, currentUser, signInFirst } from "../../lib/auth";

/**
 * Publish a new invitation. Returns its public slug and the private manage key (shown to the creator once). With
 * accounts on, the host must be signed in, and it becomes theirs.
 */
export async function POST(request: Request) {
  if (!await allow(`publish:${clientId(request)}`, 10, 60 * 60 * 1000)) return Response.json({ error: "You’ve published a lot in the last hour. Try again a little later." }, { status: 429 });
  const body = await request.json().catch(() => null);
  if (!body || !isTemplateId(body.templateId)) return Response.json({ error: "Choose an occasion first." }, { status: 400 });
  const checked = validateDraft(body.draft);
  if (!checked.ok) return Response.json({ error: "A few details are missing.", fields: checked.errors }, { status: 422 });
  // Everything new starts free; WowLink's admin can make one in the Creator studio directly (for a client, say).
  const plan = body.plan === "pro" && (await checkAdmin(request)) === "ok" ? "pro" : "free";
  if (plan === "free") {
    const features = proFeaturesIn(body.templateId, checked.value);
    if (features.length) return Response.json({ error: proMessage(features), pro: features }, { status: 403 });
  }
  // Everyone signs in first, except the admin publishing straight into the Creator studio for a client: that one has
  // no owner until the client adds it to their account (with its manage link).
  const user = plan === "free" ? await currentUser(request) : null;
  if (accountsOn() && plan === "free" && !user) return signInFirst();
  const result = await createExperience(body.templateId, checked.value, plan, user?.id);
  if (!result.ok) return Response.json({ error: FREE_LIMIT_MESSAGE, limit: true }, { status: 403 });
  return Response.json({ slug: result.experience.slug, key: result.key }, { status: 201 });
}
