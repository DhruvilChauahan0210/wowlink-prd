import { isShareChannel } from "../../../../lib/insights";
import { keyFrom, notYours } from "../../../../lib/owner";
import { recordShare } from "../../../../lib/store";

/** The host shared their invitation: { channel: "whatsapp" | "copy" | "native" | "qr" | "personal" }. Needs the manage key. */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await request.json().catch(() => null);
  if (!isShareChannel(body?.channel)) return Response.json({ error: "Unknown way of sharing." }, { status: 400 });
  const result = await recordShare(slug, keyFrom(request), body.channel);
  return result.ok ? new Response(null, { status: 204 }) : notYours();
}
