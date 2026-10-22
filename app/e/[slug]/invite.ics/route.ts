import { toIcs } from "../../../lib/calendar";
import { getPublished } from "../../../lib/store";

/** The invitation as a calendar file, for Apple Calendar, Outlook and the rest. */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const experience = await getPublished(slug);
  if (!experience) return new Response("This invitation isn’t available.", { status: 404 });
  const url = new URL(`/e/${slug}`, request.url).toString();
  const filename = experience.title.replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "invitation";
  return new Response(toIcs({ ...experience, url, uid: slug }), {
    headers: { "content-type": "text/calendar; charset=utf-8", "content-disposition": `attachment; filename="${filename}.ics"`, "cache-control": "no-store" },
  });
}
