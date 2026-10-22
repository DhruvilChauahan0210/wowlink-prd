"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { draftKey, getInvitationTemplate, initialDraft, invitationTemplates, readDraft, type InvitationDraft } from "../lib/invitations";
import { WowLinkBrand } from "../ui/brand";
import { InvitationScene } from "../ui/invitation-scene";

export default function CreatePage() {
  const [templateId, setTemplateId] = useState("wedding");
  const [draft, setDraft] = useState<InvitationDraft>(initialDraft(invitationTemplates[0]));
  const [opened, setOpened] = useState(false);
  const [ready, setReady] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState("Your canvas is ready");
  const [mobilePanel, setMobilePanel] = useState<"edit" | "preview">("edit");
  const drafts = useRef<Record<string, InvitationDraft>>({});
  const template = getInvitationTemplate(templateId);

  useEffect(() => {
    const selected = getInvitationTemplate(new URLSearchParams(location.search).get("template"));
    const saved = readDraft(selected.id);
    setTemplateId(selected.id);
    setDraft(saved ?? initialDraft(selected));
    setStatus(saved ? "Saved draft restored from this device" : "Your canvas is ready");
    setReady(true);
  }, []);

  function update<K extends keyof InvitationDraft>(key: K, value: InvitationDraft[K]) {
    setDraft(current => ({ ...current, [key]: value }));
    setDirty(true);
    setStatus("Unsaved changes");
  }

  function changeTemplate(id: string) {
    if (id === templateId) return;
    drafts.current[templateId] = draft;
    const selected = getInvitationTemplate(id);
    setTemplateId(id);
    setDraft(drafts.current[id] ?? readDraft(id) ?? initialDraft(selected));
    setOpened(false);
    setDirty(true);
    setStatus("Unsaved changes");
    history.replaceState(null, "", `/create?template=${id}`);
  }

  function saveDraft() {
    try {
      localStorage.setItem(draftKey(templateId), JSON.stringify(draft));
      setDirty(false);
      setStatus("Saved on this device");
      return true;
    } catch {
      setStatus("This browser couldn’t save the draft. Keep this tab open and try again.");
      return false;
    }
  }

  return <div className="cinema studio-page" aria-busy={!ready}>
    <header className="studio-header"><WowLinkBrand/><span className="studio-header-label cin-label">THE CREATOR’S STUDIO</span><div className="studio-header-actions"><Link className="studio-fullscreen" href={`/e/preview?template=${templateId}&draft=1`} target="_blank" rel="noreferrer" onClick={event => { if (!saveDraft()) event.preventDefault(); }}>Full preview <span>↗</span></Link><button className="cin-cta cin-cta-light studio-save" onClick={saveDraft} disabled={!ready}>Save draft <span>↗</span></button></div></header>
    <div className="studio-mobile-tabs" role="tablist" aria-label="Editor view"><button role="tab" aria-selected={mobilePanel === "edit"} aria-controls="studio-edit" onClick={() => setMobilePanel("edit")}>01 / Edit details</button><button role="tab" aria-selected={mobilePanel === "preview"} aria-controls="studio-live" onClick={() => setMobilePanel("preview")}>02 / Live preview</button></div>
    <main className={`studio-grid studio-show-${mobilePanel}`}>
      <section className="studio-edit-panel" id="studio-edit" aria-label="Invitation settings">
        <Link className="studio-back cin-label" href="/templates">← BACK TO THE COLLECTION</Link>
        <div className="studio-intro"><span className="cin-label cin-gold">YOUR OCCASION. YOUR STORY.</span><h1>A little more<br/><em>you.</em></h1><p>Make the details personal.<br/>Watch the feeling come to life.</p></div>
        <fieldset className="studio-fieldset"><legend><span>01</span> CHOOSE YOUR OCCASION</legend><div className="studio-template-grid">{invitationTemplates.map(item => <button key={item.id} type="button" className={`studio-template${templateId === item.id ? " is-selected" : ""}`} onClick={() => changeTemplate(item.id)} aria-pressed={templateId === item.id}><img src={`/media/${item.image}`} alt=""/><span>{item.name}</span><i aria-hidden="true">{templateId === item.id ? "✓" : "↗"}</i></button>)}</div></fieldset>
        <fieldset className="studio-fieldset"><legend><span>02</span> SET THE SCENE</legend><div className="studio-field"><label htmlFor="title">NAMES OR OCCASION TITLE</label><input id="title" value={draft.title} maxLength={80} placeholder="The names at the heart of your day" onChange={event => update("title", event.target.value)}/></div><div className="studio-field-row"><div className="studio-field"><label htmlFor="date">THE DATE</label><input id="date" type="date" value={draft.date} onChange={event => update("date", event.target.value)}/></div><div className="studio-field"><label htmlFor="time">THE TIME</label><input id="time" type="time" value={draft.time} onChange={event => update("time", event.target.value)}/></div></div><div className="studio-field"><label htmlFor="venue">THE PLACE</label><input id="venue" value={draft.venue} maxLength={140} placeholder="Venue name, city" onChange={event => update("venue", event.target.value)}/></div></fieldset>
        <fieldset className="studio-fieldset studio-message-field"><legend><span>03</span> A NOTE FROM THE HEART</legend><div className="studio-field"><label className="studio-sr-only" htmlFor="message">Your message to guests</label><textarea id="message" rows={4} value={draft.message} maxLength={500} placeholder="A few words for the people you love…" onChange={event => update("message", event.target.value)}/><span className="studio-character-count">{draft.message.length} / 500</span></div></fieldset>
        <div className="studio-save-status" role="status"><i className={dirty ? "is-dirty" : ""}/><span>{status}</span></div><p className="studio-storage-note">Drafts are saved on this device. You can return and keep creating.</p>
      </section>
      <aside className="studio-preview-panel" id="studio-live" aria-label="Live invitation preview"><div className="studio-preview-inner"><div className="studio-preview-toolbar"><span className="cin-label"><i/>LIVE CANVAS</span><button onClick={() => setOpened(false)} aria-label="Replay invitation reveal">Replay <span>↺</span></button></div><div className="studio-canvas-frame"><InvitationScene template={template} draft={draft} compact opened={opened} onOpen={() => setOpened(true)} onReplay={() => setOpened(false)}/></div><div className="studio-preview-bottom"><span className="cin-label">{template.category}</span><span>Tap to try the experience <span>↗</span></span></div><div className="studio-preview-caption"><span>YOUR STORY, BEAUTIFULLY TOLD.</span><span>WOWLINK STUDIO / 01</span></div></div></aside>
    </main>
  </div>;
}
