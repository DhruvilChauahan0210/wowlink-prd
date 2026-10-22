import { getGuestView } from "../../../lib/store";
import { shareCard, shareCardSize } from "../../share-card";

// The share preview for a personal link: addressed to the household, with only their celebrations.
export const size = shareCardSize;
export const contentType = "image/png";
export const alt = "A personal invitation made with WowLink";
export const dynamic = "force-dynamic";

export default async function Image({ params }: { params: Promise<{ slug: string; guest: string }> }) {
  const { slug, guest } = await params;
  const found = await getGuestView(slug, guest);
  return shareCard(found?.experience ?? null, found?.guest.name);
}
