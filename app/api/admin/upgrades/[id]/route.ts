import { adminDenied } from "../../../../lib/admin";
import { decideUpgrade } from "../../../../lib/store";

/** { action: "approve" | "decline" }. Approving moves the invitation to the Creator studio. Admin only. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = adminDenied(request);
  if (denied) return denied;
  const body = await request.json().catch(() => null);
  if (body?.action !== "approve" && body?.action !== "decline") return Response.json({ error: "Approve or decline." }, { status: 400 });
  const result = await decideUpgrade((await params).id, body.action === "approve");
  return result.ok ? Response.json({ ok: true }) : Response.json({ error: "That request isn’t there any more." }, { status: 404 });
}
