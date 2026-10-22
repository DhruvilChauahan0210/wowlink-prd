import { calendarEvents, toIcs } from "../../../lib/calendar";
import { getPublished } from "../../../lib/store";

/**
 * The invitation as a calendar file, for Apple Calendar, Outlook and the rest.
 *   no parameter   every event in the schedule (or the occasion itself if there's no schedule)
 *   ?event=main    just the main occasion
 *   ?event=<id>    one event from the schedule
 */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const experience = await getPublished(slug);
  if (!experience) return new Response("This invitation isn’t available.", { status: 404 });
  const url = new URL(`/e/${slug}`, request.url).toString();
  const which = new URL(request.url).searchParams.get("event");
  const all = calendarEvents(experience, url, slug);
  const events = which === "main"
    ? [{ ...experience, url, uid: slug }]
    : which
      ? all.filter((e) => e.uid === `${slug}-${which}`)
      : all;
  if (!events.length) return new Response("That event isn’t in this invitation.", { status: 404 });
  const filename = experience.title.replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "invitation";
  return new Response(toIcs(events), {
    headers: { "content-type": "text/calendar; charset=utf-8", "content-disposition": `attachment; filename="${filename}.ics"`, "cache-control": "no-store" },
  });
}
