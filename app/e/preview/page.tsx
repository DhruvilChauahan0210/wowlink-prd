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
    <header className="invitation-header theme-paper"><WowLinkBrand/><span className="invitation-context">{isDraft ? "Draft preview" : "Template preview"}<i aria-hidden="true">·</i>{template.category}</span><Link className="cin-cta cin-cta-outline" href={`/create?template=${templateId}`}>{isDraft ? "Back to editor" : "Make it yours"}</Link></header>
    <main><InvitationScene template={template} draft={draft} opened={opened} onOpen={() => setOpened(true)} onReplay={() => setOpened(false)} onDetails={showDetails}/>
      <section className="inv-details-section theme-paper" id="occasion-details"><div className="inv-details-heading"><h2>Save the <span className="scribble">date</span></h2><button className="inv-replay-link" onClick={() => { setOpened(false); window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }); }}>Replay the invitation</button></div><div className="inv-details-grid"><div><span className="inv-detail-label">When</span><h3>{formatInvitationDate(draft.date, true)}</h3><p>{formatInvitationTime(draft.time)}</p></div><div><span className="inv-detail-label">Where</span><h3>{draft.venue || "A place to remember"}</h3><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(draft.venue)}`} target="_blank" rel="noreferrer">Open in Maps <span aria-hidden="true">→</span></a></div></div></section>
      <section className="inv-message-section theme-dark"><MomentMark/><blockquote>{draft.message || "We would love to share this moment with you."}</blockquote><span className="inv-message-sign">With love, {draft.title}</span></section>
      <section className="inv-rsvp-section theme-paper" aria-labelledby="rsvp-heading"><div><h2 id="rsvp-heading">Will you be there?</h2><p>A quick reply means a lot. Let us know if you can be part of the day.</p></div><div className="inv-rsvp-card">{submitted ? <div className="inv-rsvp-confirmation" role="status"><MomentMark/><span className="inv-confirm-label">Reply preview</span><h3>{attendance === "Attending" ? "Joyfully, yes." : attendance === "Maybe" ? "A little maybe." : "With you in spirit."}</h3><p>This is a template preview. Your response hasn’t been sent.</p><button className="cin-cta cin-cta-outline" onClick={() => setSubmitted(false)}>Try another response</button></div> : <form onSubmit={previewRsvp}><fieldset className="inv-attendance"><legend>Will you be joining us?</legend><div>{["Attending", "Maybe", "Not attending"].map(option => <label key={option} className={attendance === option ? "is-selected" : ""}><input type="radio" name="attendance" value={option} checked={attendance === option} onChange={() => setAttendance(option)}/><span>{option}</span></label>)}</div></fieldset><div className="studio-field"><label htmlFor="guest-name">Your name <span>Optional</span></label><input id="guest-name" name="guest-name" autoComplete="name" maxLength={100} placeholder="As we know and love you"/></div>{attendance === "Attending" && <div className="studio-field"><label htmlFor="guest-count">How many guests?</label><input id="guest-count" name="guest-count" type="number" min={1} max={20} defaultValue={1}/></div>}<button type="submit" className="cin-cta cin-cta-light">Preview my reply</button><p className="inv-rsvp-preview-note">Template preview · Responses won’t be sent.</p></form>}</div></section>
    </main><footer className="invitation-footer"><WowLinkBrand/><span>Made with love, shared with one link.</span><Link href="/templates">Create your own <span aria-hidden="true">→</span></Link></footer>
  </div>;
}
