import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getInvitationTemplate } from "../../lib/invitations";
import { getPreview } from "../../lib/store";
import { ClientPreview, PreviewEnded } from "./client-preview";

/*
 * A client preview (Creator studio): the invitation as the planner is about to change it, for the client to look at
 * and answer. Not the published invitation: nothing here is counted, and the reply form doesn't send.
 */

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Preview — WowLink", robots: { index: false, follow: false } };

export default async function PreviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const preview = await getPreview(token);
  if (!preview) notFound();
  // An ended preview shows nothing of the invitation.
  if (preview.expired) return <PreviewEnded lang={preview.language}/>;
  return <ClientPreview token={token} view={preview.view} answered={preview.feedback?.verdict ?? null} template={getInvitationTemplate(preview.templateId)}/>;
}
