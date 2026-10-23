"use client";

import { useEffect, useId, useState } from "react";
import QRCode from "qrcode";
import { HOST_TEXT } from "../lib/host-i18n";
import { MESSAGES } from "../lib/i18n";
import type { Lang } from "../lib/invitations";
import { countShare } from "./counting";

/**
 * `lang`: the invitation's language, for the message guests receive. `ui`: the host's language, for the buttons.
 * `owner`: the invitation's slug and manage key, so the host's insights can count how it was shared.
 */
type Props = { url: string; title: string; lang?: Lang; ui?: Lang; owner?: { slug: string; ownerKey: string } };

/** Copy, WhatsApp, the phone's share sheet, and a printable QR code for a published invitation. */
export function ShareTools({ url, title, lang = "en", ui = "en", owner }: Props) {
  const h = HOST_TEXT[ui];
  const fieldId = useId();
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [qr, setQr] = useState("");
  const [showQr, setShowQr] = useState(false);
  const invited = MESSAGES[lang].invited(title);
  const message = `${invited}\n${url}`;
  // The printed code carries ?via=qr, so visits from it can be counted (the page removes it from the address).
  const qrUrl = `${url}?via=qr`;
  const counted = (channel: Parameters<typeof countShare>[1]) => { if (owner) countShare(owner, channel); };

  useEffect(() => setCanShare(typeof navigator !== "undefined" && "share" in navigator), []);
  useEffect(() => {
    if (!showQr || qr) return;
    QRCode.toString(qrUrl, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#241a13", light: "#fbf6ec" } }).then(setQr, () => setQr(""));
  }, [showQr, qr, qrUrl]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      counted("copy");
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard can be blocked (insecure origin, permissions); select the field so it can be copied by hand.
      (document.getElementById(fieldId) as HTMLInputElement | null)?.select();
    }
  }

  return <div className="share-tools">
    <div className="share-url">
      <label className="studio-sr-only" htmlFor={fieldId}>{h.invitationLink}</label>
      <input id={fieldId} readOnly value={url} onFocus={(event) => event.currentTarget.select()}/>
      <button type="button" className="cin-cta cin-cta-light" onClick={copy}>{copied ? h.copied : h.copyLink}</button>
    </div>
    <div className="share-actions">
      <a className="share-chip" href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer" onClick={() => counted("whatsapp")}>{h.whatsApp}</a>
      {canShare && <button type="button" className="share-chip" onClick={() => navigator.share({ title, text: invited, url }).then(() => counted("native"), () => undefined)}>{h.shareSheet}</button>}
      <button type="button" className="share-chip" aria-expanded={showQr} onClick={() => { if (!showQr) counted("qr"); setShowQr(!showQr); }}>{showQr ? h.hideQr : h.qrCode}</button>
      <a className="share-chip" href={url} target="_blank" rel="noreferrer">{h.open}</a>
    </div>
    <p className="share-status" role="status">{copied ? h.linkCopied : ""}</p>
    {showQr && <div className="share-qr">
      {qr ? <span className="share-qr-code" role="img" aria-label={h.qrFor(url)} dangerouslySetInnerHTML={{ __html: qr }}/> : <span className="share-qr-code is-loading">{h.drawingCode}</span>}
      {qr && <a className="cin-text-link" download={`wowlink-qr-${title.replace(/[^\w]+/g, "-").toLowerCase()}.svg`} href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(qr)}`}>{h.downloadQr} <span aria-hidden="true">→</span></a>}
    </div>}
  </div>;
}

/** A read-only field with a copy button, for links that aren't meant for guests (like the manage link). */
export function CopyField({ value, label, ui = "en" }: { value: string; label: string; ui?: Lang }) {
  const id = useId();
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      (document.getElementById(id) as HTMLInputElement | null)?.select();
    }
  }
  return <div className="share-url">
    <label className="studio-sr-only" htmlFor={id}>{label}</label>
    <input id={id} readOnly value={value} onFocus={(event) => event.currentTarget.select()}/>
    <button type="button" className="cin-cta cin-cta-outline" onClick={copy}>{copied ? HOST_TEXT[ui].copied : label}</button>
  </div>;
}
