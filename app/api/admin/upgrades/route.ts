import { adminDenied } from "../../../lib/admin";
import { upgradeRequests } from "../../../lib/store";

/** Requests for the Creator studio: open ones first. Admin only. */
export async function GET(request: Request) {
  const denied = await adminDenied(request);
  if (denied) return denied;
  return Response.json({ requests: await upgradeRequests() }, { headers: { "Cache-Control": "no-store" } });
}
