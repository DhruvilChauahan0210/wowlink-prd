import { adminDenied } from "../../../../../lib/admin";
import { adminView } from "../../../../../lib/store";

/** The invitation as guests see it on the general link, even if it's unpublished or taken down. Admin only. */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const denied = await adminDenied(request);
  if (denied) return denied;
  const view = await adminView((await params).slug);
  return view ? Response.json({ view }, { headers: { "Cache-Control": "no-store" } }) : Response.json({ error: "There’s no invitation at that link." }, { status: 404 });
}
