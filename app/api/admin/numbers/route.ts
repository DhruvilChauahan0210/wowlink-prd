import { adminDenied } from "../../../lib/admin";
import { appNumbers } from "../../../lib/store";

/** The app's numbers for the last 7, 30 or 90 days (?days=). Admin only. */
export async function GET(request: Request) {
  const denied = adminDenied(request);
  if (denied) return denied;
  const asked = Number(new URL(request.url).searchParams.get("days"));
  const days = [7, 30, 90].includes(asked) ? asked : 30;
  return Response.json({ days, ...(await appNumbers(days)) }, { headers: { "Cache-Control": "no-store" } });
}
