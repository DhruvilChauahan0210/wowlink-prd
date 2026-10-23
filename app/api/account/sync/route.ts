import { currentUser } from "../../../lib/auth";
import { allow } from "../../../lib/rate-limit";
import { syncAccount } from "../../../lib/store";

/**
 * A signed-in host's device: { known: [{ slug, key }] }, the manage keys it has. Invitations among them with no owner
 * yet become the host's; the answer has a key for each of the host's invitations this device can't open yet.
 */
export async function POST(request: Request) {
  const user = await currentUser(request);
  if (!user) return Response.json({ error: "Sign in first.", signIn: true }, { status: 401 });
  if (!(await allow(`account-sync:${user.id}`, 30, 60 * 60 * 1000))) return Response.json({ error: "Try again a little later." }, { status: 429 });
  const body = await request.json().catch(() => null);
  const known = Array.isArray(body?.known)
    ? body.known.filter((k: unknown): k is { slug: string; key: string } => typeof (k as { slug?: unknown })?.slug === "string" && typeof (k as { key?: unknown })?.key === "string").map((k: { slug: string; key: string }) => ({ slug: k.slug.slice(0, 20), key: k.key.slice(0, 100) }))
    : [];
  const { keys } = await syncAccount(user.id, known);
  return Response.json({ keys }, { headers: { "Cache-Control": "no-store" } });
}
