"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ATTENDANCE, LIMITS, formatInvitationDate, formatInvitationTime, type Attendance, type InvitationDraft, type InvitationTemplate } from "../lib/invitations";
import { MomentMark, WowLinkBrand } from "./brand";
import { InvitationScene } from "./invitation-scene";

type Props = {
  template: InvitationTemplate;
  draft: InvitationDraft;
  /** template: browsing a sample · draft: the creator previewing their own · live: a guest on a published link */
  mode: "template" | "draft" | "live";
  slug?: string;
};

const smooth = () => (matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth") as ScrollBehavior;
const REPLY_TITLE: Record<Attendance, string> = { Attending: "Joyfully, yes.", Maybe: "A little maybe.", "Not attending": "With you in spirit." };

/** Everything a guest sees: the opening, the details, the message and the RSVP. */
export function GuestExperience({ template, draft, mode, slug }: Props) {
  const live = mode === "live";
  const [opened, setOpened] = useState(false);
  const [attendance, setAttendance] = useState<Attendance>("Attending");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  async function reply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!live || !slug) return setState("done");
    const form = new FormData(event.currentTarget);
    setState("sending");
    setError("");
    try {
      const response = await fetch(`/api/experiences/${slug}/rsvps`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ attendance, name: form.get("guest-name"), guestCount: Number(form.get("guest-count") ?? 1), website: form.get("website") }),
      });
      if (!response.ok) throw new Error(((await response.json().catch(() => null)) as { error?: string } | null)?.error ?? "");
      setState("done");
    } catch (failure) {
      setError((failure as Error).message || "Your reply didn’t go through. Check your connection and try again.");
      setState("idle");
    }
  }

  return <div className="cinema invitation-page">
    <header className="invitation-header theme-paper">
      <WowLinkBrand/>
      {!live && <span className="invitation-context">{mode === "draft" ? "Draft preview" : "Template preview"}<i aria-hidden="true">·</i>{template.category}</span>}
      <Link className="cin-cta cin-cta-outline" href={`/create?template=${template.id}`}>{mode === "draft" ? "Back to editor" : live ? "Make your own" : "Make it yours"}</Link>
    </header>
    <main>
      <InvitationScene template={template} draft={draft} opened={opened} onOpen={() => setOpened(true)} onReplay={() => setOpened(false)} onDetails={() => document.getElementById("occasion-details")?.scrollIntoView({ behavior: smooth() })}/>
      <section className="inv-details-section theme-paper" id="occasion-details">
        <div className="inv-details-heading"><h2>Save the <span className="scribble">date</span></h2><button className="inv-replay-link" onClick={() => { setOpened(false); window.scrollTo({ top: 0, behavior: smooth() }); }}>Replay the invitation</button></div>
        <div className="inv-details-grid">
          <div><span className="inv-detail-label">When</span><h3>{formatInvitationDate(draft.date, true)}</h3><p>{formatInvitationTime(draft.time)}</p></div>
          <div><span className="inv-detail-label">Where</span><h3>{draft.venue || "A place to remember"}</h3>{draft.venue && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(draft.venue)}`} target="_blank" rel="noreferrer">Open in Maps <span aria-hidden="true">→</span></a>}</div>
        </div>
      </section>
      <section className="inv-message-section theme-dark"><MomentMark/><blockquote>{draft.message || "We would love to share this moment with you."}</blockquote><span className="inv-message-sign">With love, {draft.title}</span></section>
      <section className="inv-rsvp-section theme-paper" aria-labelledby="rsvp-heading">
        <div><h2 id="rsvp-heading">Will you be there?</h2><p>A quick reply means a lot. Let us know if you can be part of the day.</p></div>
        <div className="inv-rsvp-card">
          {state === "done" ? <div className="inv-rsvp-confirmation" role="status">
            <MomentMark/>
            <span className="inv-confirm-label">{live ? "Reply sent" : "Reply preview"}</span>
            <h3>{REPLY_TITLE[attendance]}</h3>
            <p>{live ? `Your reply is on its way to ${draft.title}. Thank you!` : "This is a preview. Your response hasn’t been sent."}</p>
            <button className="cin-cta cin-cta-outline" onClick={() => setState("idle")}>{live ? "Reply for someone else" : "Try another response"}</button>
          </div> : <form onSubmit={reply}>
            <fieldset className="inv-attendance"><legend>Will you be joining us?</legend><div>{ATTENDANCE.map(option => <label key={option} className={attendance === option ? "is-selected" : ""}><input type="radio" name="attendance" value={option} checked={attendance === option} onChange={() => setAttendance(option)}/><span>{option}</span></label>)}</div></fieldset>
            <div className="studio-field"><label htmlFor="guest-name">Your name <span>Optional</span></label><input id="guest-name" name="guest-name" autoComplete="name" maxLength={LIMITS.guestName} placeholder="As we know and love you"/></div>
            {attendance === "Attending" && <div className="studio-field"><label htmlFor="guest-count">How many guests?</label><input id="guest-count" name="guest-count" type="number" min={1} max={LIMITS.guests} defaultValue={1}/></div>}
            <div className="inv-honeypot" aria-hidden="true"><label htmlFor="website">Leave this empty</label><input id="website" name="website" tabIndex={-1} autoComplete="off"/></div>
            {error && <p className="inv-rsvp-error" role="alert">{error}</p>}
            <button type="submit" className="cin-cta cin-cta-light" disabled={state === "sending"}>{live ? (state === "sending" ? "Sending…" : "Send my reply") : "Preview my reply"}</button>
            {!live && <p className="inv-rsvp-preview-note">Preview · Responses won’t be sent.</p>}
          </form>}
        </div>
      </section>
    </main>
    <footer className="invitation-footer"><WowLinkBrand/><span>{live ? "Made with WowLink" : "Made with love, shared with one link."}</span><Link href="/templates">Create yours free <span aria-hidden="true">→</span></Link></footer>
  </div>;
}
