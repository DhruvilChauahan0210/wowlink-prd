"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { draftKey, getInvitationTemplate, initialDraft, invitationTemplates, readDraft, type InvitationDraft } from "../lib/invitations";
import { WowLinkBrand } from "../ui/brand";
import { Art } from "../ui/art";
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
    <header className="studio-header theme-paper"><WowLinkBrand/><span className="studio-header-label">Creator studio</span><div className="studio-header-actions"><Link className="studio-fullscreen" href={`/e/preview?template=${templateId}&draft=1`} target="_blank" rel="noreferrer" onClick={event => { if (!saveDraft()) event.preventDefault(); }}>Full preview</Link><button className="cin-cta cin-cta-light studio-save" onClick={saveDraft} disabled={!ready}>Save draft</button></div></header>
    <div className="studio-mobile-tabs theme-paper" role="tablist" aria-label="Editor view"><button role="tab" aria-selected={mobilePanel === "edit"} aria-controls="studio-edit" onClick={() => setMobilePanel("edit")}>Details</button><button role="tab" aria-selected={mobilePanel === "preview"} aria-controls="studio-live" onClick={() => setMobilePanel("preview")}>Preview</button></div>
    <main className={`studio-grid studio-show-${mobilePanel}`}>
      <section className="studio-edit-panel theme-paper" id="studio-edit" aria-label="Invitation settings">
        <Link className="studio-back" href="/templates">← All templates</Link>
        <div className="studio-intro"><h1>Make it <span className="scribble">yours</span></h1><p>Edit the details and see your invitation update live.</p></div>
        <fieldset className="studio-fieldset"><legend>Occasion</legend><div className="studio-template-grid">{invitationTemplates.map(item => <button key={item.id} type="button" className={`studio-template${templateId === item.id ? " is-selected" : ""}`} onClick={() => changeTemplate(item.id)} aria-pressed={templateId === item.id}><Art name={item.id} fit="slice" decorative/><span>{item.name}</span><i aria-hidden="true">{templateId === item.id ? "✓" : ""}</i></button>)}</div></fieldset>
        <fieldset className="studio-fieldset"><legend>Details</legend><div className="studio-field"><label htmlFor="title">Names or occasion title</label><input id="title" value={draft.title} maxLength={80} placeholder="Aarav & Meera" onChange={event => update("title", event.target.value)}/></div><div className="studio-field-row"><div className="studio-field"><label htmlFor="date">Date</label><input id="date" type="date" value={draft.date} onChange={event => update("date", event.target.value)}/></div><div className="studio-field"><label htmlFor="time">Time</label><input id="time" type="time" value={draft.time} onChange={event => update("time", event.target.value)}/></div></div><div className="studio-field"><label htmlFor="venue">Venue</label><input id="venue" value={draft.venue} maxLength={140} placeholder="Venue name, city" onChange={event => update("venue", event.target.value)}/></div></fieldset>
        <fieldset className="studio-fieldset studio-message-field"><legend>Message to guests</legend><div className="studio-field"><label className="studio-sr-only" htmlFor="message">Your message to guests</label><textarea id="message" rows={4} value={draft.message} maxLength={500} placeholder="A few words for the people you’re inviting…" onChange={event => update("message", event.target.value)}/><span className="studio-character-count">{draft.message.length} / 500</span></div></fieldset>
        <div className="studio-save-status" role="status"><i className={dirty ? "is-dirty" : ""}/><span>{status}</span></div><p className="studio-storage-note">Drafts are saved on this device. You can return and keep creating.</p>
      </section>
      <aside className="studio-preview-panel theme-paper" id="studio-live" aria-label="Live invitation preview"><div className="studio-preview-inner"><div className="studio-preview-toolbar"><span className="studio-live"><i/>Live preview</span><button onClick={() => setOpened(false)} aria-label="Replay invitation reveal">Replay</button></div><div className="studio-canvas-frame"><InvitationScene template={template} draft={draft} compact opened={opened} onOpen={() => setOpened(true)} onReplay={() => setOpened(false)}/></div><div className="studio-preview-bottom"><span>{template.category}</span><span>tap the drawing to try it</span></div></div></aside>
    </main>
  </div>;
}
