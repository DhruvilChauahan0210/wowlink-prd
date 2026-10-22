"use client";

import { formatInvitationDate, formatInvitationTime, type InvitationDraft, type InvitationTemplate } from "../lib/invitations";
import { Art, type ArtName } from "./art";
import { Flower, Star } from "./doodles";
import { OPEN_HINT, Opener, ScrollRod } from "./openers";

type Props = {
  template: InvitationTemplate;
  draft: InvitationDraft;
  opened: boolean;
  onOpen: () => void;
  onReplay: () => void;
  onDetails?: () => void;
  compact?: boolean;
};

/*
 * The guest's invitation. Each occasion opens with its own hand-drawn ritual (see openers.tsx),
 * then the illustrated card comes up in its place.
 */
export function InvitationScene({ template, draft, opened, onOpen, onReplay, onDetails, compact = false }: Props) {
  const Title = compact ? "h2" : "h1";
  const long = draft.title.length > 32 ? " is-long" : "";
  const art = template.id as ArtName;
  const city = draft.venue.split(",").at(-1)?.trim() || "Your venue";
  return <section className={`inv-scene inv-${template.id}${opened ? " is-open" : ""}${compact ? " is-compact" : ""}`} aria-label={`${template.category} invitation preview`}>
    <div className="inv-backdrop" aria-hidden="true">
      <Flower className="doodle inv-d1"/><Star className="doodle inv-d2"/><Flower className="doodle inv-d3"/><Star className="doodle inv-d4"/>
    </div>

    <div className="inv-intro" aria-hidden={opened} inert={opened}>
      <span className="inv-overline">{template.eyebrow}</span>
      <Title className={`inv-title${long}`}>{draft.title || "Your occasion"}</Title>
      <span className="inv-date">{formatInvitationDate(draft.date)}<i aria-hidden="true">·</i>{city}</span>
      <Opener name={art} label={template.action} onOpen={onOpen}/>
      <span className="inv-hint">{OPEN_HINT[art]}</span>
    </div>

    <article className="inv-card" aria-hidden={!opened} inert={!opened}>
      {art === "wedding" && <ScrollRod/>}
      <div className="inv-card-art"><Art name={art} drawing={opened}/></div>
      <span className="inv-overline">You make the moment complete</span>
      <h2 className={`inv-title${long}`}>{draft.title || "Your occasion"}</h2>
      {draft.message && <p className="inv-revealed-message">{draft.message}</p>}
      <div className="inv-revealed-details"><span>{formatInvitationDate(draft.date, true)}{draft.time && ` · ${formatInvitationTime(draft.time)}`}</span><span>{draft.venue || "Your venue"}</span></div>
      <button className="cin-cta cin-cta-light inv-open-button" onClick={compact ? onReplay : onDetails}>{compact ? "Watch it again" : "See the details"}</button>
    </article>
  </section>;
}
