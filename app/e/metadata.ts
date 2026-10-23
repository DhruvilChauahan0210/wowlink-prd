import type { Metadata } from "next";
import { GUEST_TEXT } from "../lib/i18n";
import { formatInvitationDate } from "../lib/invitations";
import type { PublicExperience } from "../lib/store";

// A share link isn't private, but it shouldn't turn up in search results either.
const robots = { index: false, follow: false };

/** Title and share text for an invitation link, as that link shows it, in the invitation's language. */
export function invitationMetadata(experience: PublicExperience | null, addressee?: string): Metadata {
  if (!experience) return { title: "Invitation not found — WowLink", robots };
  const lang = experience.language ?? "en";
  const t = GUEST_TEXT[lang];
  const title = `${experience.title} — ${t.invitedTitle}`;
  const details = experience.pending ? [t.detailsToFollow] : [formatInvitationDate(experience.date, true, lang), experience.venue];
  const description = [addressee && t.addressedTo(addressee), ...details].filter(Boolean).join(" · ");
  return { title, description, robots, openGraph: { title, description } };
}
