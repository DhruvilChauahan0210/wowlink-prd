"use client";

import { useEffect, useId, useState } from "react";
import QRCode from "qrcode";

type Props = { url: string; title: string };

/** Copy, WhatsApp, the phone's share sheet, and a printable QR code for a published invitation. */
export function ShareTools({ url, title }: Props) {
  const fieldId = useId();
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [qr, setQr] = useState("");
  const [showQr, setShowQr] = useState(false);
  const message = `You’re invited: ${title}\n${url}`;

  useEffect(() => setCanShare(typeof navigator !== "undefined" && "share" in navigator), []);
  useEffect(() => {
    if (!showQr || qr) return;
    QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#241a13", light: "#fbf6ec" } }).then(setQr, () => setQr(""));
  }, [showQr, qr, url]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard can be blocked (insecure origin, permissions); select the field so it can be copied by hand.
      (document.getElementById(fieldId) as HTMLInputElement | null)?.select();
    }
  }

  return <div className="share-tools">
    <div className="share-url">
      <label className="studio-sr-only" htmlFor={fieldId}>Invitation link</label>
      <input id={fieldId} readOnly value={url} onFocus={(event) => event.currentTarget.select()}/>
      <button type="button" className="cin-cta cin-cta-light" onClick={copy}>{copied ? "Copied!" : "Copy link"}</button>
    </div>
    <div className="share-actions">
      <a className="share-chip" href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer">WhatsApp</a>
      {canShare && <button type="button" className="share-chip" onClick={() => navigator.share({ title, text: `You’re invited: ${title}`, url }).catch(() => undefined)}>Share…</button>}
      <button type="button" className="share-chip" aria-expanded={showQr} onClick={() => setShowQr(!showQr)}>{showQr ? "Hide QR code" : "QR code"}</button>
      <a className="share-chip" href={url} target="_blank" rel="noreferrer">Open</a>
    </div>
    <p className="share-status" role="status">{copied ? "Link copied. Paste it anywhere." : ""}</p>
    {showQr && <div className="share-qr">
      {qr ? <span className="share-qr-code" role="img" aria-label={`QR code for ${url}`} dangerouslySetInnerHTML={{ __html: qr }}/> : <span className="share-qr-code is-loading">Drawing your code…</span>}
      {qr && <a className="cin-text-link" download={`wowlink-qr-${title.replace(/[^\w]+/g, "-").toLowerCase()}.svg`} href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(qr)}`}>Download for printing <span aria-hidden="true">→</span></a>}
    </div>}
  </div>;
}

/** A read-only field with a copy button, for links that aren't meant for guests (like the manage link). */
export function CopyField({ value, label }: { value: string; label: string }) {
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
    <button type="button" className="cin-cta cin-cta-outline" onClick={copy}>{copied ? "Copied!" : label}</button>
  </div>;
}
