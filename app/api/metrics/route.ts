import { isPageMetric, isSource } from "../../lib/insights";
import { allow, clientId } from "../../lib/rate-limit";
import { recordPageView, recordSiteVisit } from "../../lib/store";

/**
 * A visit to WowLink, from the browser: { page: "studio" | "sample" | "occasion", first? }, or { page: "site", from,
 * first? } for the first of its pages in a session and where it came from. `first`: this browser's first. Always 204.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const page = body?.page;
  if ((page === "site" || isPageMetric(page)) && await allow(`metrics:${clientId(request)}`, 30, 10 * 60 * 1000)) {
    const first = body.first === true;
    if (page === "site") await recordSiteVisit(isSource(body.from) ? body.from : "other", first);
    else await recordPageView(page, first);
  }
  return new Response(null, { status: 204 });
}
