import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getInvitationTemplate } from "../../lib/invitations";
import { getPublished } from "../../lib/store";
import { GuestExperience } from "../../ui/guest-experience";
import { invitationMetadata } from "../metadata";

// Always read the latest version: hosts can edit or unpublish at any time.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return invitationMetadata(await getPublished((await params).slug));
}

/** The general link: the celebrations the host chose to show everyone. */
export default async function PublishedInvitation({ params }: Props) {
  const experience = await getPublished((await params).slug);
  if (!experience) notFound();
  const { slug, templateId, ...view } = experience;
  return <GuestExperience template={getInvitationTemplate(templateId)} draft={view} mode="live" slug={slug}/>;
}
