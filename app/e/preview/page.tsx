"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { templates, Brand } from "../../components";

export default function ExperiencePreview() {
  const [templateId, setTemplateId] = useState("wedding");
  const [opened, setOpened] = useState(false);
  useEffect(() => { setTemplateId(new URLSearchParams(window.location.search).get("template") ?? "wedding"); }, []);
  const template = templates.find(item => item.id === templateId) ?? templates[0];
  return <main className="guest-page"><div className="guest-top"><Brand /><span>AN INVITATION FOR YOU</span></div><div className={`guest-card art-${template.color}`}><span className="preview-overline">A LITTLE SOMETHING SPECIAL</span><button className={`preview-emoji guest-emoji${opened ? " preview-opened" : ""}`} onClick={() => setOpened(!opened)} aria-label={opened ? "Close invitation" : template.label}>{opened ? "✿" : template.emoji}</button><span className="preview-name">Aarav <i>&</i> Meera</span><span className="preview-invite">INVITE YOU TO CELEBRATE</span><span className="preview-divider"/><span className="preview-date">Sunday, 8 November 2026</span><span className="preview-venue">The Garden House · Surat</span><p className="preview-message">We’d love to celebrate this special day with you.</p><button className="preview-cta" onClick={() => setOpened(!opened)}>{opened ? "See you there!" : template.label} <b>→</b></button></div><section className="guest-details"><div><span className="eyebrow">SAVE THE DATE</span><h1>A day made better<br />with you there.</h1><p>Sunday, 8 November 2026 · 6:00 PM</p><p>The Garden House, Surat</p></div><a className="button button-dark" href="https://maps.google.com/?q=The+Garden+House+Surat" target="_blank" rel="noreferrer">Get directions ↗</a></section><section className="rsvp-box"><span className="eyebrow">KINDLY REPLY</span><h2>Will you be joining us?</h2><div className="rsvp-actions"><button onClick={() => alert("Thanks! RSVP submission will be connected in a later build.")}>Joyfully accept</button><button onClick={() => alert("Thanks! RSVP submission will be connected in a later build.")}>Regretfully decline</button></div></section><footer className="guest-footer"><span>Made with WowLink · <Link href="/templates">Create yours free ↗</Link></span></footer></main>;
}
