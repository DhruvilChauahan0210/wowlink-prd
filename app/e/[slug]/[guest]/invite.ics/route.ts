import { calendarFile } from "../../../../lib/calendar";
import { getGuestView } from "../../../../lib/store";

/** A personal link's calendar file: only the celebrations that household is invited to. Same parameters as the general one. */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string; guest: string }> }) {
  const { slug, guest } = await params;
  const found = await getGuestView(slug, guest);
  if (!found) return new Response("This invitation isn’t available.", { status: 404 });
  return calendarFile(found.experience, new URL(`/e/${slug}/${guest}`, request.url).toString(), slug, new URL(request.url).searchParams.get("event"));
}
