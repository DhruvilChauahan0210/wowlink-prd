"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { templates } from "../components";

export default function CreatePage() {
  const [templateId, setTemplateId] = useState("wedding");
  const [title, setTitle] = useState("Aarav & Meera");
  const [date, setDate] = useState("2026-11-08");
  const [venue, setVenue] = useState("The Garden House, Surat");
  const [message, setMessage] = useState("We’d love to celebrate with you.");
  const [opened, setOpened] = useState(false);
  const template = templates.find(item => item.id === templateId) ?? templates[0];

  useEffect(() => {
    const selected = new URLSearchParams(window.location.search).get("template");
    if (selected && templates.some(item => item.id === selected)) setTemplateId(selected);
  }, []);

  const displayDate = date ? new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "Your event date";

  return <main className="editor-shell"><header className="editor-header"><Link className="editor-back" href="/templates">← <span>Templates</span></Link><Link className="brand" href="/"><span className="brand-mark">w</span><span>wowlink</span></Link><span className="draft-status"><i /> Draft saved locally</span></header><div className="editor-layout"><section className="editor-form"><span className="eyebrow">YOUR OCCASION, YOUR WAY</span><h1>Let’s make<br /><em>it yours.</em></h1><p className="editor-lede">A few details are all it takes. Your preview updates as you go.</p><label className="field-label" htmlFor="template">Choose a template</label><select id="template" value={templateId} onChange={event => setTemplateId(event.target.value)}>{templates.map(item => <option value={item.id} key={item.id}>{item.title}</option>)}</select><label className="field-label" htmlFor="title">Names or occasion title</label><input id="title" value={title} onChange={event => setTitle(event.target.value)} placeholder="e.g. Aarav & Meera" /><label className="field-label" htmlFor="date">Date</label><input id="date" type="date" value={date} onChange={event => setDate(event.target.value)} /><label className="field-label" htmlFor="venue">Venue</label><input id="venue" value={venue} onChange={event => setVenue(event.target.value)} placeholder="Venue name" /><label className="field-label" htmlFor="message">A note for your guests</label><textarea id="message" rows={3} value={message} onChange={event => setMessage(event.target.value)} /><button className="button button-dark button-full publish-button" onClick={() => alert("Your draft is ready. Account signup and publishing will be connected in a later build.")}>Save and continue <span>↗</span></button><p className="editor-footnote">You can make changes any time before sharing.</p></section><aside className="editor-preview-wrap"><div className="preview-topline"><span>LIVE PREVIEW</span><span>↗ Opens on mobile</span></div><div className={`experience-preview art-${template.color}`}><span className="preview-overline">A LITTLE SOMETHING SPECIAL</span><button onClick={() => setOpened(!opened)} className={`preview-emoji${opened ? " preview-opened" : ""}`} aria-label={opened ? "Close invitation" : template.label}>{opened ? "✿" : template.emoji}</button><span className="preview-name">{title || "Your names here"}</span><span className="preview-invite">{template.category === "WEDDING" ? "INVITE YOU TO CELEBRATE" : "YOU’RE INVITED TO"}</span><span className="preview-divider"/><span className="preview-date">{displayDate}</span><span className="preview-venue">{venue || "Your venue"}</span><p className="preview-message">{message}</p><button className="preview-cta" onClick={() => setOpened(!opened)}>{opened ? "Lovely, isn’t it?" : template.label} <b>→</b></button><span className="preview-branding">MADE WITH WOWLINK</span></div><p className="preview-hint">↖ Tap the card to try the interaction</p></aside></div></main>;
}
