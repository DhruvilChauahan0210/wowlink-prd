import { allow, clientId } from "../../../../lib/rate-limit";
import { markOpened } from "../../../../lib/store";

/**
 * A personal link's page reports that its household opened it. The answer is always the same (204), so this
 * can't be used to find out whether a link exists.
 */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await request.json().catch(() => null);
  if (typeof body?.guest === "string" && await allow(`opened:${clientId(request)}`, 30, 10 * 60 * 1000)) await markOpened(slug, body.guest);
  return new Response(null, { status: 204 });
}
