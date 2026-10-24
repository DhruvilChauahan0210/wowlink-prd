import { shareCardSize, siteCard } from "./e/share-card";

// The share preview for WowLink's own pages that have none of their own (see share-card.tsx).
export const size = shareCardSize;
export const contentType = "image/png";
export const alt = "WowLink: hand-drawn invitations, shared with one link";

export default function Image() {
  return siteCard();
}
