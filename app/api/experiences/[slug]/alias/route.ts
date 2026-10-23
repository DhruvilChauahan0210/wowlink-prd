import { keyFrom, notYours } from "../../../../lib/owner";
import { allow } from "../../../../lib/rate-limit";
import { setAlias } from "../../../../lib/store";

/** Give the invitation a custom link: { alias: "isha-kabir" }. Creator studio; needs the manage key. */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await request.json().catch(() => null);
  if (typeof body?.alias !== "string") return Response.json({ error: "Write the link you’d like." }, { status: 400 });
  // Every link given up stays retired for good, so a host can't churn through names.
  if (!await allow(`alias:${slug}`, 10, 24 * 60 * 60 * 1000)) return Response.json({ error: "That’s a lot of new links for one day. Try again tomorrow." }, { status: 429 });
  const result = await setAlias(slug, keyFrom(request), body.alias.slice(0, 200));
  if (result.ok) return Response.json({ aliases: result.aliases });
  if (result.reason === "pro") return Response.json({ error: "A custom link is part of the Creator studio." }, { status: 403 });
  if (result.reason === "invalid") return Response.json({ error: result.error }, { status: 422 });
  if (result.reason === "taken") return Response.json({ error: result.error }, { status: 409 });
  return notYours();
}
