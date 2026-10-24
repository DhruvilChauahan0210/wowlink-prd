"use client";

import { useEffect, useMemo, useState } from "react";
import { getInvitationTemplate, type Lang, type TemplateId } from "../../lib/invitations";
import { sampleDraft } from "../../lib/samples";
import { InvitationScene } from "../../ui/invitation-scene";
import { countPage } from "../../ui/counting";

/** The sample invitation, opening for real in the page's language, so visitors can try the ritual before making their own. */
export function OccasionDemo({ id, lang = "en" }: { id: TemplateId; lang?: Lang }) {
  const template = getInvitationTemplate(id);
  const draft = useMemo(() => sampleDraft(template, lang), [template, lang]);
  const [opened, setOpened] = useState(false);
  useEffect(() => countPage("occasion"), []);
  return <div className="studio-canvas-frame occasion-canvas">
    <InvitationScene template={template} draft={draft} compact opened={opened} onOpen={() => setOpened(true)} onReplay={() => setOpened(false)}/>
  </div>;
}
