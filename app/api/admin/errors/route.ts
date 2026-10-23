import { adminDenied } from "../../../lib/admin";
import { recentErrors } from "../../../lib/errors";

/** The latest server errors, newest first. Admin only. */
export async function GET(request: Request) {
  const denied = await adminDenied(request);
  if (denied) return denied;
  return Response.json({ errors: await recentErrors(30) }, { headers: { "Cache-Control": "no-store" } });
}
