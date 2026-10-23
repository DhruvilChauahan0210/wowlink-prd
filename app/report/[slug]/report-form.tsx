"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import type { Lang } from "../../lib/invitations";
import { REASON_TEXT, REPORT_DETAILS_MAX, REPORT_REASONS, REPORT_TEXT, type ReportReason } from "../../lib/reports";

export function ReportForm({ slug, lang, back }: { slug: string; lang: Lang; back: string }) {
  const t = REPORT_TEXT[lang];
  const [reason, setReason] = useState<ReportReason | "">("");
  const [details, setDetails] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  const reasonsRef = useRef<HTMLFieldSetElement>(null);
  const thanksRef = useRef<HTMLHeadingElement>(null);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reason) {
      setError(t.pickReason);
      reasonsRef.current?.querySelector("input")?.focus();
      return;
    }
    setState("sending");
    setError("");
    const website = (new FormData(event.currentTarget).get("website") as string | null) ?? "";
    const response = await fetch("/api/reports", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug, reason, details, website }) }).catch(() => null);
    if (response?.ok) {
      setState("sent");
      requestAnimationFrame(() => thanksRef.current?.focus());
      return;
    }
    setState("idle");
    setError(response?.status === 429 ? t.tooMany : response?.status === 404 ? t.gone : t.failed);
  }

  if (state === "sent") return <section className="report-thanks" role="status">
    <h2 ref={thanksRef} tabIndex={-1}>{t.thanksTitle}</h2>
    <p>{t.thanks}</p>
    <Link className="cin-text-link" href={back}>{t.back} <span aria-hidden="true">→</span></Link>
  </section>;

  return <form className="report-form" onSubmit={send} noValidate>
    <fieldset ref={reasonsRef} aria-describedby={error && !reason ? "report-error" : undefined}>
      <legend>{t.why}</legend>
      {REPORT_REASONS.map(option => <label key={option} className={reason === option ? "is-selected" : ""}>
        <input type="radio" name="reason" value={option} checked={reason === option} onChange={() => { setReason(option); setError(""); }}/>
        <span>{REASON_TEXT[lang][option]}</span>
      </label>)}
    </fieldset>
    <div className="studio-field">
      <label htmlFor="report-details">{t.details} <span>{t.optional}</span></label>
      <p className="inv-field-hint" id="report-details-hint">{t.detailsHint}</p>
      <textarea id="report-details" rows={4} maxLength={REPORT_DETAILS_MAX} value={details} onChange={e => setDetails(e.target.value)} aria-describedby="report-details-hint"/>
    </div>
    <div className="inv-honeypot" aria-hidden="true"><label htmlFor="website">Leave this empty</label><input id="website" name="website" tabIndex={-1} autoComplete="off"/></div>
    {error && <p className="studio-error" id="report-error" role="alert">{error}</p>}
    <p className="report-promise">{t.promise}</p>
    <div className="report-actions">
      <button type="submit" className="cin-cta cin-cta-light" disabled={state === "sending"}>{state === "sending" ? t.sending : t.send}</button>
      <Link className="cin-text-link" href={back}>{t.back}</Link>
    </div>
  </form>;
}
