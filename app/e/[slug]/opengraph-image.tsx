import { getPublished } from "../../lib/store";
import { shareCard, shareCardSize } from "../share-card";

// The share preview for the general link (see share-card.tsx).
export const size = shareCardSize;
export const contentType = "image/png";
export const alt = "An invitation made with WowLink";
export const dynamic = "force-dynamic";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  return shareCard(await getPublished((await params).slug));
}
