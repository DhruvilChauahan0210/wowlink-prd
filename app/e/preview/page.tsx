"use client";

import { useEffect, useState } from "react";
import { getInvitationTemplate, initialDraft, invitationTemplates, readDraft, type InvitationDraft } from "../../lib/invitations";
import { GuestExperience } from "../../ui/guest-experience";

/** A sample of a template, or (with ?draft=1) the creator's unpublished draft from this device. */
export default function ExperiencePreview() {
  const [templateId, setTemplateId] = useState<string>(invitationTemplates[0].id);
  const [draft, setDraft] = useState<InvitationDraft>(initialDraft(invitationTemplates[0]));
  const [isDraft, setIsDraft] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const selected = getInvitationTemplate(params.get("template"));
    const draftPreview = params.get("draft") === "1";
    setTemplateId(selected.id);
    setDraft((draftPreview && readDraft(selected.id)) || initialDraft(selected));
    setIsDraft(draftPreview);
  }, []);

  return <GuestExperience key={templateId} template={getInvitationTemplate(templateId)} draft={draft} mode={isDraft ? "draft" : "template"}/>;
}
