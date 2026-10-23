"use client";

import { useEffect, useMemo, useState } from "react";
import { getInvitationTemplate, initialDraft, type TemplateId } from "../../lib/invitations";
import { InvitationScene } from "../../ui/invitation-scene";
import { countPage } from "../../ui/counting";

/** The sample invitation, opening for real, so visitors can try the ritual before making their own. */
export function OccasionDemo({ id }: { id: TemplateId }) {
  const template = getInvitationTemplate(id);
  const draft = useMemo(() => initialDraft(template), [template]);
  const [opened, setOpened] = useState(false);
  useEffect(() => countPage("occasion"), []);
  return <div className="studio-canvas-frame occasion-canvas">
    <InvitationScene template={template} draft={draft} compact opened={opened} onOpen={() => setOpened(true)} onReplay={() => setOpened(false)}/>
  </div>;
}
