import { calendarFile } from "../../../lib/calendar";
import { getPublished } from "../../../lib/store";

/**
 * The invitation as a calendar file, for Apple Calendar, Outlook and the rest, with what the general link shows.
 *   no parameter   every event in the schedule (or the occasion itself if there's no schedule)
 *   ?event=main    just the main occasion
 *   ?event=<id>    one event from the schedule
 */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const experience = await getPublished(slug);
  if (!experience) return new Response("This invitation isn’t available.", { status: 404 });
  return calendarFile(experience, new URL(`/e/${slug}`, request.url).toString(), slug, new URL(request.url).searchParams.get("event"));
}
