"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { formatInvitationDate, formatInvitationTime, getInvitationTemplate, initialDraft, invitationTemplates, readDraft, type InvitationDraft } from "../../lib/invitations";
import { MomentMark, WowLinkBrand } from "../../ui/brand";
import { InvitationScene } from "../../ui/invitation-scene";

export default function ExperiencePreview() {
  const [templateId, setTemplateId] = useState("wedding");
  const [draft, setDraft] = useState<InvitationDraft>(initialDraft(invitationTemplates[0]));
  const [opened, setOpened] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [attendance, setAttendance] = useState("Attending");
  const [submitted, setSubmitted] = useState(false);
  const template = getInvitationTemplate(templateId);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const selected = getInvitationTemplate(params.get("template"));
    const draftPreview = params.get("draft") === "1";
    setTemplateId(selected.id);
    setDraft((draftPreview && readDraft(selected.id)) || initialDraft(selected));
    setIsDraft(draftPreview);
  }, []);

  function showDetails() {
    document.getElementById("occasion-details")?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }
  function previewRsvp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return <div className="cinema invitation-page">
    <header className="invitation-header"><WowLinkBrand/><span className="cin-label">{isDraft ? "YOUR DRAFT PREVIEW" : "THE WOWLINK COLLECTION"}<i> / </i>{template.category}</span><Link className="cin-cta cin-cta-outline" href={`/create?template=${templateId}`}>{isDraft ? "Back to your canvas" : "Make it yours"}<span>↗</span></Link></header>
    <main><InvitationScene template={template} draft={draft} opened={opened} onOpen={() => setOpened(true)} onReplay={() => setOpened(false)} onDetails={showDetails}/>
      <section className="inv-details-section" id="occasion-details"><div className="inv-details-heading"><span className="cin-label cin-gold">ALL THE LITTLE DETAILS</span><h2>A day made better<br/><em>with you there.</em></h2><button className="inv-replay-link" onClick={() => { setOpened(false); window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }); }}>Replay the invitation <span>↺</span></button></div><div className="inv-details-grid"><div><span className="cin-label">THE WHEN</span><h3>{formatInvitationDate(draft.date, true)}</h3><p>{formatInvitationTime(draft.time)}</p></div><div><span className="cin-label">THE WHERE</span><h3>{draft.venue || "A place to remember"}</h3><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(draft.venue)}`} target="_blank" rel="noreferrer">Find your way <span>↗</span></a></div></div></section>
      <section className="inv-message-section"><MomentMark/><blockquote>{draft.message || "We would love to share this moment with you."}</blockquote><span className="cin-label">WITH LOVE, {draft.title}</span></section>
      <section className="inv-rsvp-section" aria-labelledby="rsvp-heading"><div><span className="cin-label cin-gold">YOUR PRESENCE IS THE PRESENT</span><h2 id="rsvp-heading">A seat with<br/><em>your name on it.</em></h2><p>A little reply means a lot.<br/>Let us know if you can be part of the day.</p></div><div className="inv-rsvp-card">{submitted ? <div className="inv-rsvp-confirmation" role="status"><MomentMark/><span className="cin-label cin-gold">A LITTLE PREVIEW OF YOUR REPLY</span><h3>{attendance === "Attending" ? "Joyfully, yes." : attendance === "Maybe" ? "A little maybe." : "With you in spirit."}</h3><p>This is a template preview. Your response hasn’t been sent.</p><button className="cin-cta cin-cta-outline" onClick={() => setSubmitted(false)}>Try another response <span>↺</span></button></div> : <form onSubmit={previewRsvp}><fieldset className="inv-attendance"><legend className="cin-label">WILL YOU BE JOINING US?</legend><div>{["Attending", "Maybe", "Not attending"].map(option => <label key={option} className={attendance === option ? "is-selected" : ""}><input type="radio" name="attendance" value={option} checked={attendance === option} onChange={() => setAttendance(option)}/><span>{option}</span></label>)}</div></fieldset><div className="studio-field"><label htmlFor="guest-name">YOUR NAME <span>OPTIONAL</span></label><input id="guest-name" name="guest-name" autoComplete="name" maxLength={100} placeholder="As we know and love you"/></div>{attendance === "Attending" && <div className="studio-field"><label htmlFor="guest-count">HOW MANY OF YOU?</label><input id="guest-count" name="guest-count" type="number" min={1} max={20} defaultValue={1}/></div>}<button type="submit" className="cin-cta cin-cta-light">Preview my reply <span>↗</span></button><p className="inv-rsvp-preview-note">Template preview · Responses won’t be sent.</p></form>}</div></section>
    </main><footer className="invitation-footer"><WowLinkBrand/><span>A little world for your biggest moments.</span><Link href="/templates">Create your own moment <span>↗</span></Link></footer>
  </div>;
}
