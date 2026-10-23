import { allow, clientId } from "../../../../lib/rate-limit";
import { recordAttribution, recordPlayed, recordVisit } from "../../../../lib/store";

/**
 * What an invitation's page reports once it's running in a browser (so link previews never count):
 * - { type: "view", first, via?: "qr", guest? }: someone opened it; `first` if this browser hadn't before.
 * - { type: "played" }: they played the opening (sent once per browser).
 * - { type: "attribution" }: they followed "Create yours free".
 * The answer is always the same (204), so this can't be used to find out whether an invitation exists.
 */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await request.json().catch(() => null);
  if (!body || !await allow(`events:${clientId(request)}`, 60, 10 * 60 * 1000)) return new Response(null, { status: 204 });
  if (body.type === "view") await recordVisit(slug, { first: body.first === true, viaQr: body.via === "qr", guestId: typeof body.guest === "string" ? body.guest : undefined });
  else if (body.type === "played") await recordPlayed(slug);
  else if (body.type === "attribution") await recordAttribution(slug);
  return new Response(null, { status: 204 });
}
