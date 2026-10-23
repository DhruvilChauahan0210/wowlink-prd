import { adminDenied } from "../../../../lib/admin";
import { markFeedback } from "../../../../lib/feedback-store";

/** { action: "done" | "reopen" }: mark a note as dealt with, or open it again. Admin only. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminDenied(request);
  if (denied) return denied;
  const body = await request.json().catch(() => null);
  if (body?.action !== "done" && body?.action !== "reopen") return Response.json({ error: "Done or reopen." }, { status: 400 });
  return await markFeedback((await params).id, body.action === "done")
    ? Response.json({ ok: true })
    : Response.json({ error: "That note isn’t there any more." }, { status: 404 });
}
