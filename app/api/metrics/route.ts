import { isPageMetric } from "../../lib/insights";
import { allow, clientId } from "../../lib/rate-limit";
import { recordPageView } from "../../lib/store";

/** A visit to one of WowLink's own pages, from the browser: { page: "studio" | "sample" | "occasion" }. Always 204. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (isPageMetric(body?.page) && allow(`metrics:${clientId(request)}`, 30, 10 * 60 * 1000)) await recordPageView(body.page);
  return new Response(null, { status: 204 });
}
