import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getInvitationTemplate } from "../../lib/invitations";
import { getPreview } from "../../lib/store";
import { ClientPreview } from "./client-preview";

/*
 * A client preview (Creator studio): the invitation as the planner is about to change it, for the client to look at
 * and answer. Not the published invitation: nothing here is counted, and the reply form doesn't send.
 */

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Preview — WowLink", robots: { index: false, follow: false } };

export default async function PreviewPage({ params }: { params: Promise<{ token: string }> }) {
  const preview = await getPreview((await params).token);
  if (!preview) notFound();
  return <ClientPreview token={(await params).token} templateId={preview.templateId} view={preview.view} slug={preview.slug} expired={preview.expired} answered={preview.feedback?.verdict ?? null} template={getInvitationTemplate(preview.templateId)}/>;
}
