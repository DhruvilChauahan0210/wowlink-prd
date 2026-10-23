"use client";

import { useState, type FormEvent } from "react";
import type { AudienceView } from "../../lib/guests";
import { GUEST_TEXT } from "../../lib/i18n";
import type { InvitationTemplate, Lang } from "../../lib/invitations";
import { GuestExperience } from "../../ui/guest-experience";

type Props = { token: string; view: AudienceView; answered: "approve" | "changes" | null; template: InvitationTemplate };

/** A preview that has ended: only that, nothing of the invitation. */
export function PreviewEnded({ lang }: { lang: Lang }) {
  return <div className="cinema theme-paper client-preview-bar" role="region" aria-label={GUEST_TEXT[lang].previewExpired} lang={lang}>
    <p>{GUEST_TEXT[lang].previewExpired}</p>
  </div>;
}

/** The client's look at a preview, and their answer: it looks good, or what to change. */
export function ClientPreview({ token, view, answered, template }: Props) {
  // The bar follows the invitation's language, including when the client switches it.
  const [lang, setLang] = useState<Lang>(view.language ?? "en");
  const t = GUEST_TEXT[lang];
  const [mode, setMode] = useState<"choose" | "changes" | "sending" | "done">(answered ? "done" : "choose");
  const [verdict, setVerdict] = useState<"approve" | "changes" | null>(answered);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  async function send(choice: "approve" | "changes", event?: FormEvent) {
    event?.preventDefault();
    setMode("sending");
    setError("");
    const response = await fetch(`/api/previews/${token}/feedback`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ verdict: choice, note }) }).catch(() => null);
    if (response?.ok) {
      setVerdict(choice);
      setMode("done");
    } else {
      setError(t.offline);
      setMode(choice === "changes" ? "changes" : "choose");
    }
  }

  return <>
    <div className="cinema theme-paper client-preview-bar" role="region" aria-label={t.previewBanner} lang={lang}>
      <p>{t.previewBanner}</p>
      {mode === "done" ? <p className="client-preview-done" role="status">{t.previewThanks} {verdict && t.previewYourAnswer(verdict === "approve")}</p>
        : mode === "changes" || (mode === "sending" && note) ? <form className="client-preview-form" onSubmit={event => void send("changes", event)}>
          <label htmlFor="preview-note">{t.previewChangesLabel}</label>
          <textarea id="preview-note" rows={3} maxLength={1000} value={note} onChange={e => setNote(e.target.value)} required/>
          <div><button type="submit" className="cin-cta cin-cta-light" disabled={mode === "sending" || !note.trim()}>{t.previewSend}</button></div>
        </form>
        : <div className="client-preview-actions"><button type="button" className="cin-cta cin-cta-light" disabled={mode === "sending"} onClick={() => void send("approve")}>{t.previewLooksGood}</button><button type="button" className="cin-cta cin-cta-outline" onClick={() => setMode("changes")}>{t.previewAskChanges}</button></div>}
      {error && <p className="inv-rsvp-error" role="alert">{error}</p>}
    </div>
    {/* No slug: nothing here is counted, and the calendar file comes from this draft, not the published invitation. */}
    <GuestExperience template={template} draft={view} mode="live" previewOnly previewLabel="Preview" onLangChange={setLang}/>
  </>;
}
