"use client";

import { useEffect, useState } from "react";
import { getInvitationTemplate, initialDraft, invitationTemplates, isLang, readDraft, type InvitationDraft } from "../../lib/invitations";
import { sampleDraft } from "../../lib/samples";
import { freeDraft } from "../../lib/plans";
import { GuestExperience } from "../../ui/guest-experience";

/** A sample of a template (in ?lang=, if given), or (with ?draft=1) the creator's unpublished draft from this device. */
export default function ExperiencePreview() {
  const [templateId, setTemplateId] = useState<string>(invitationTemplates[0].id);
  const [draft, setDraft] = useState<InvitationDraft>(initialDraft(invitationTemplates[0]));
  const [isDraft, setIsDraft] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const selected = getInvitationTemplate(params.get("template"));
    const draftPreview = params.get("draft") === "1";
    setTemplateId(selected.id);
    // A draft here is a new invitation, so a free one: show what publishing it would give guests (no schedule, say).
    const saved = draftPreview ? readDraft(selected.id) : null;
    const lang = params.get("lang");
    setDraft(saved ? freeDraft(saved) : sampleDraft(selected, isLang(lang) ? lang : "en"));
    setIsDraft(draftPreview);
  }, []);

  return <GuestExperience key={templateId} template={getInvitationTemplate(templateId)} draft={draft} mode={isDraft ? "draft" : "template"}/>;
}
