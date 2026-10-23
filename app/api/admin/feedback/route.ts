import { adminDenied } from "../../../lib/admin";
import { feedbackList } from "../../../lib/feedback-store";

/** The latest feedback: open notes first, then done ones. Admin only. */
export async function GET(request: Request) {
  const denied = await adminDenied(request);
  if (denied) return denied;
  return Response.json({ feedback: await feedbackList() }, { headers: { "Cache-Control": "no-store" } });
}
