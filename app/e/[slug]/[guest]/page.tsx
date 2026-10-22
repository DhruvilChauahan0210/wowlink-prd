import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getInvitationTemplate } from "../../../lib/invitations";
import { getGuestView } from "../../../lib/store";
import { GuestExperience } from "../../../ui/guest-experience";
import { invitationMetadata } from "../../metadata";

// Always read the latest version: hosts can edit the invitation or the guest list at any time.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string; guest: string }>; searchParams: Promise<{ preview?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, guest } = await params;
  const found = await getGuestView(slug, guest);
  return invitationMetadata(found?.experience ?? null, found?.guest.name);
}

/**
 * A personal link: addressed to one household, showing only the celebrations they're invited to.
 * `?preview=1` is the host checking it: the same page, but replies aren't sent (harmless if a guest adds it).
 */
export default async function PersonalInvitation({ params, searchParams }: Props) {
  const [{ slug, guest }, { preview }] = await Promise.all([params, searchParams]);
  const found = await getGuestView(slug, guest);
  if (!found) notFound();
  const { experience: { slug: _slug, templateId, wishes, ...view }, reply } = found;
  return <GuestExperience template={getInvitationTemplate(templateId)} draft={view} mode="live" slug={slug} guest={found.guest} reply={reply} wishes={wishes} previewOnly={preview === "1"}/>;
}
