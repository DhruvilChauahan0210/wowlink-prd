import { keyFrom, notYours } from "../../../../lib/owner";
import { allow, clientId } from "../../../../lib/rate-limit";
import { requestUpgrade } from "../../../../lib/store";

const clean = (value: unknown, max: number) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "");

/** Ask WowLink to move this invitation to the Creator studio: { note?, contact? }. Needs the manage key. */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!allow(`upgrade:${clientId(request)}`, 5, 60 * 60 * 1000)) return Response.json({ error: "You’ve asked a few times already. We’ll be in touch." }, { status: 429 });
  const body = await request.json().catch(() => ({}));
  const result = await requestUpgrade(slug, keyFrom(request), clean(body?.note, 500), clean(body?.contact, 120));
  if (result.ok) return Response.json({ ok: true }, { status: 201 });
  if (result.reason === "already") return Response.json({ error: "This invitation is already in the Creator studio." }, { status: 409 });
  return notYours();
}
