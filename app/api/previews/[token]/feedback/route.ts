import { allow, clientId } from "../../../../lib/rate-limit";
import { addPreviewFeedback } from "../../../../lib/store";

/** A client's answer to a preview: { verdict: "approve" | "changes", note? }. */
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!allow(`preview-feedback:${clientId(request)}`, 10, 60 * 60 * 1000)) return Response.json({ error: "That’s a lot of answers. Try again a little later." }, { status: 429 });
  const body = await request.json().catch(() => null);
  if (body?.verdict !== "approve" && body?.verdict !== "changes") return Response.json({ error: "Say whether it looks good." }, { status: 400 });
  const note = typeof body.note === "string" ? body.note.replace(/\s+/g, " ").trim().slice(0, 1000) : "";
  if (body.verdict === "changes" && !note) return Response.json({ error: "Say what you’d like changed." }, { status: 422 });
  const result = await addPreviewFeedback(token, body.verdict, note);
  return result.ok ? Response.json({ ok: true }, { status: 201 }) : Response.json({ error: "This preview isn’t available any more." }, { status: 404 });
}
