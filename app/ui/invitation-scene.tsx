"use client";

import { formatInvitationDate, formatInvitationTime, type InvitationDraft, type InvitationTemplate } from "../lib/invitations";
import { MomentMark } from "./brand";

type Props = {
  template: InvitationTemplate;
  draft: InvitationDraft;
  opened: boolean;
  onOpen: () => void;
  onReplay: () => void;
  onDetails?: () => void;
  compact?: boolean;
};

export function InvitationScene({ template, draft, opened, onOpen, onReplay, onDetails, compact = false }: Props) {
  const Title = compact ? "h2" : "h1";
  return <section className={`inv-scene inv-${template.id}${opened ? " is-open" : ""}${compact ? " is-compact" : ""}`} aria-label={`${template.category} invitation preview`}>
    <img className="inv-scene-image" src={`/media/${template.image}`} alt="" fetchPriority={compact ? "auto" : "high"}/>
    <div className="inv-scene-shade"/>
    <div className="inv-reveal-panel inv-panel-left" aria-hidden="true"/><div className="inv-reveal-panel inv-panel-right" aria-hidden="true"/>
    {template.id === "opening" && <div className="inv-ribbon" aria-hidden="true"><span/><span/><MomentMark/></div>}
    {template.id === "garba" && <svg className="inv-mandala" viewBox="0 0 300 300" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <ellipse key={index} cx="150" cy="99" rx="20" ry="62" fill="none" stroke="currentColor" strokeWidth=".7" transform={`rotate(${index * 30} 150 150)`}/>)}<circle cx="150" cy="150" r="133" fill="none" stroke="currentColor" strokeWidth=".7"/></svg>}
    <div className="inv-content inv-intro" aria-hidden={opened} inert={opened}>
      <span className="cin-label inv-overline">{template.eyebrow}</span>
      <MomentMark className="inv-symbol"/>
      <Title className={`inv-title${draft.title.length > 32 ? " is-long" : ""}`}>{draft.title || "Your occasion"}</Title>
      <span className="inv-date">{formatInvitationDate(draft.date)} <i>·</i> {draft.venue.split(",").at(-1)?.trim() || "Your venue"}</span>
      <button className="cin-cta inv-open-button" onClick={onOpen}>{template.action}<span>↗</span></button>
      <span className="inv-made-with cin-label">A MOMENT MADE WITH WOWLINK</span>
    </div>
    <div className="inv-content inv-revealed" aria-hidden={!opened} inert={!opened}>
      <span className="cin-label inv-overline">YOU MAKE THE MOMENT COMPLETE</span>
      <MomentMark className="inv-symbol"/>
      <h2 className={`inv-title${draft.title.length > 32 ? " is-long" : ""}`}>{draft.title || "Your occasion"}</h2>
      <p className="inv-revealed-message">{draft.message}</p>
      <div className="inv-revealed-details"><span>{formatInvitationDate(draft.date, true)}{draft.time && ` · ${formatInvitationTime(draft.time)}`}</span><span>{draft.venue || "Your venue"}</span></div>
      <button className="cin-cta inv-open-button" onClick={compact ? onReplay : onDetails}>{compact ? "Replay the reveal" : "Explore the details"}<span>{compact ? "↺" : "↓"}</span></button>
    </div>
    <div className="inv-scene-corners" aria-hidden="true"><span/><span/><span/><span/></div>
  </section>;
}
