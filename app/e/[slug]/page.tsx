import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatInvitationDate, getInvitationTemplate } from "../../lib/invitations";
import { getPublished } from "../../lib/store";
import { GuestExperience } from "../../ui/guest-experience";

// Always read the latest version: hosts can edit or unpublish at any time.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const experience = await getPublished((await params).slug);
  if (!experience) return { title: "Invitation not found — WowLink", robots: { index: false, follow: false } };
  const description = `${formatInvitationDate(experience.date, true)} · ${experience.venue}`;
  // A share link isn't private, but it shouldn't turn up in search results either.
  return { title: `${experience.title} — you’re invited`, description, robots: { index: false, follow: false }, openGraph: { title: `${experience.title} — you’re invited`, description } };
}

export default async function PublishedInvitation({ params }: Props) {
  const experience = await getPublished((await params).slug);
  if (!experience) notFound();
  const { slug, templateId, ...draft } = experience;
  return <GuestExperience template={getInvitationTemplate(templateId)} draft={draft} mode="live" slug={slug}/>;
}
