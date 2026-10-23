import { adminDenied } from "../../../lib/admin";
import { reportedInvitations } from "../../../lib/store";

/** Every reported invitation, those still to look at first. Admin only. */
export async function GET(request: Request) {
  const denied = await adminDenied(request);
  if (denied) return denied;
  return Response.json({ invitations: await reportedInvitations() }, { headers: { "Cache-Control": "no-store" } });
}
