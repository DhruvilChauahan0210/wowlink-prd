"use client";

import { useId, useState, type FormEvent } from "react";
import Link from "next/link";
import { hostMessage, type HostText } from "../lib/host-i18n";
import { dayKey } from "../lib/insights";
import { formatInvitationDate } from "../lib/invitations";

type Upgrade = { status: "open" | "approved" | "declined"; createdAt: string };

/**
 * A free invitation's way into the Creator studio: a short request to WowLink (until payments exist), with a note
 * and, if the host wants a reply, how to reach them. Shows where an earlier request stands.
 */
export function AskPro({ h, owner, upgrade, onSent }: { h: HostText; owner: { slug: string; ownerKey: string }; upgrade?: Upgrade; onSent: () => void }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [contact, setContact] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  async function send(event: FormEvent) {
    event.preventDefault();
    setState("sending");
    setError("");
    const response = await fetch(`/api/experiences/${owner.slug}/upgrade`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${owner.ownerKey}` }, body: JSON.stringify({ note, contact }) }).catch(() => null);
    if (response?.ok) {
      setState("sent");
      onSent();
      return;
    }
    const body = (await response?.json().catch(() => null)) as { error?: string } | null;
    setError(body?.error ? hostMessage(body.error, h.lang) : h.offlineBody);
    setState("idle");
  }

  if (state === "sent") return <p className="manage-muted" role="status">{h.askProSent}</p>;
  if (upgrade?.status === "open") return <p className="manage-muted">{h.askProPending(formatInvitationDate(dayKey(Date.parse(upgrade.createdAt)), true, h.lang))}</p>;
  return <>
    <p className="manage-muted">{upgrade?.status === "declined" ? `${h.askProDeclined} ` : ""}{h.askProBody} <Link href="/pricing">{h.seePlans}</Link></p>
    {!open ? <div className="manage-actions"><button type="button" className="cin-cta cin-cta-light" onClick={() => setOpen(true)}>{h.askPro}</button></div> : <form className="ask-pro-form" onSubmit={send}>
      <div className="studio-field"><label htmlFor={`${id}-note`}>{h.askProNote} <span>{h.optional}</span></label><textarea id={`${id}-note`} rows={3} maxLength={500} value={note} onChange={e => setNote(e.target.value)}/></div>
      <div className="studio-field"><label htmlFor={`${id}-contact`}>{h.askProContact} <span>{h.optional}</span></label><p className="studio-help" id={`${id}-contact-hint`}>{h.askProContactHint}</p><input id={`${id}-contact`} maxLength={120} autoComplete="off" value={contact} onChange={e => setContact(e.target.value)} aria-describedby={`${id}-contact-hint`}/></div>
      {error && <p className="studio-error" role="alert">{error}</p>}
      <div className="manage-guest-buttons"><button type="submit" className="cin-cta cin-cta-light" disabled={state === "sending"}>{h.askProSend}</button><button type="button" className="share-chip" onClick={() => setOpen(false)}>{h.cancel}</button></div>
    </form>}
  </>;
}
