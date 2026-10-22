import type { Metadata } from "next";
import { formatInvitationDate } from "../lib/invitations";
import type { PublicExperience } from "../lib/store";

// A share link isn't private, but it shouldn't turn up in search results either.
const robots = { index: false, follow: false };

/** Title and share text for an invitation link, as that link shows it. */
export function invitationMetadata(experience: PublicExperience | null, addressee?: string): Metadata {
  if (!experience) return { title: "Invitation not found — WowLink", robots };
  const title = `${experience.title} — you’re invited`;
  const details = experience.pending ? ["Details to follow"] : [formatInvitationDate(experience.date, true), experience.venue];
  const description = [addressee && `For ${addressee}`, ...details].filter(Boolean).join(" · ");
  return { title, description, robots, openGraph: { title, description } };
}
