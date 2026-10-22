"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { draftKey, getInvitationTemplate, initialDraft, invitationTemplates, ownerKey, readDraft, validateDraft, type DraftErrors, type InvitationDraft } from "../lib/invitations";
import { WowLinkBrand } from "../ui/brand";
import { Art } from "../ui/art";
import { InvitationScene } from "../ui/invitation-scene";
import { CopyField, ShareTools } from "../ui/share-tools";

/** A published invitation this browser can edit: its public slug and private manage key. */
type Owned = { slug: string; key: string };

export default function CreatePage() {
  const [templateId, setTemplateId] = useState<string>("wedding");
  const [draft, setDraft] = useState<InvitationDraft>(initialDraft(invitationTemplates[0]));
  const [opened, setOpened] = useState(false);
  const [ready, setReady] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState("Your canvas is ready");
  const [mobilePanel, setMobilePanel] = useState<"edit" | "preview">("edit");
  const [owned, setOwned] = useState<Owned | null>(null);
  const [errors, setErrors] = useState<DraftErrors>({});
  const [publishing, setPublishing] = useState(false);
  const [origin, setOrigin] = useState("");
  const drafts = useRef<Record<string, InvitationDraft>>({});
  const dialog = useRef<HTMLDialogElement>(null);
  const template = getInvitationTemplate(templateId);

  useEffect(() => {
    setOrigin(location.origin);
    const params = new URLSearchParams(location.search);
    const edit = params.get("edit");
    if (edit) {
      void openPublished(edit);
      return;
    }
    const selected = getInvitationTemplate(params.get("template"));
    const saved = readDraft(selected.id);
    setTemplateId(selected.id);
    setDraft(saved ?? initialDraft(selected));
    setStatus(saved ? "Saved draft restored from this device" : "Your canvas is ready");
    setReady(true);
  }, []);

  async function openPublished(slug: string) {
    let key: string | null = null;
    try { key = localStorage.getItem(ownerKey(slug)); } catch { /* storage blocked */ }
    if (!key) {
      setStatus("To edit a published invitation, open its private manage link on this device first.");
      setReady(true);
      return;
    }
    try {
      const response = await fetch(`/api/experiences/${slug}`, { headers: { authorization: `Bearer ${key}` }, cache: "no-store" });
      if (!response.ok) throw new Error();
      const { experience } = await response.json();
      setTemplateId(experience.templateId);
      setDraft({ title: experience.title, date: experience.date, time: experience.time, venue: experience.venue, message: experience.message });
      setOwned({ slug, key });
      setStatus("Editing your live invitation. Changes reach guests when you press Update.");
    } catch {
      setStatus("Couldn’t open that invitation. Check your connection and try again.");
    }
    setReady(true);
  }

  function update<K extends keyof InvitationDraft>(key: K, value: InvitationDraft[K]) {
    setDraft(current => ({ ...current, [key]: value }));
    setErrors(current => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
    setDirty(true);
    setStatus(owned ? "Changes not live yet. Press Update." : "Unsaved changes");
  }

  function changeTemplate(id: string) {
    if (id === templateId) return;
    drafts.current[templateId] = draft;
    const selected = getInvitationTemplate(id);
    setTemplateId(id);
    // A live invitation keeps its details when you try another drawing; a fresh draft picks up per-occasion drafts.
    if (!owned) setDraft(drafts.current[id] ?? readDraft(id) ?? initialDraft(selected));
    setOpened(false);
    setDirty(true);
    setStatus(owned ? "Changes not live yet. Press Update." : "Unsaved changes");
    if (!owned) history.replaceState(null, "", `/create?template=${id}`);
  }

  function saveDraft() {
    try {
      localStorage.setItem(draftKey(templateId), JSON.stringify(draft));
      if (!owned) setDirty(false);
      setStatus(owned ? "Saved on this device. Press Update to make it live." : "Saved on this device");
      return true;
    } catch {
      setStatus("This browser couldn’t save the draft. Keep this tab open and try again.");
      return false;
    }
  }

  async function publish() {
    const checked = validateDraft(draft);
    if (!checked.ok) {
      setErrors(checked.errors);
      setStatus("A few details are missing before this can go live.");
      setMobilePanel("edit");
      requestAnimationFrame(() => document.getElementById(Object.keys(checked.errors)[0])?.focus());
      return;
    }
    setErrors({});
    setPublishing(true);
    setStatus(owned ? "Updating your invitation…" : "Publishing…");
    try {
      const response = await fetch(owned ? `/api/experiences/${owned.slug}` : "/api/experiences", {
        method: owned ? "PATCH" : "POST",
        headers: { "content-type": "application/json", ...(owned ? { authorization: `Bearer ${owned.key}` } : {}) },
        body: JSON.stringify({ templateId, draft: checked.value, ...(owned ? { status: "published" } : {}) }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (body.fields) setErrors(body.fields);
        throw new Error(body.error);
      }
      const mine = owned ?? { slug: body.slug as string, key: body.key as string };
      if (!owned) {
        try { localStorage.setItem(ownerKey(mine.slug), mine.key); } catch { /* the manage link in the dialog still works */ }
        setOwned(mine);
        history.replaceState(null, "", `/create?edit=${mine.slug}`);
      }
      setDirty(false);
      setStatus(owned ? "Updated. Guests see your changes now." : "Published! Share it whenever you’re ready.");
      dialog.current?.showModal();
    } catch (failure) {
      setStatus((failure as Error).message || "Couldn’t publish. Check your connection and try again.");
    }
    setPublishing(false);
  }

  const fieldError = (key: keyof InvitationDraft) => errors[key] ? <p className="studio-error" id={`${key}-error`}>{errors[key]}</p> : null;
  const described = (key: keyof InvitationDraft) => errors[key] ? { "aria-invalid": true, "aria-describedby": `${key}-error` } : {};

  return <div className="cinema studio-page" aria-busy={!ready}>
    <header className="studio-header theme-paper">
      <WowLinkBrand/>
      <span className="studio-header-label">{owned ? "Editing a live invitation" : "Creator studio"}</span>
      <div className="studio-header-actions">
        {owned
          ? <Link className="studio-fullscreen" href={`/manage/${owned.slug}`}>Replies</Link>
          : <Link className="studio-fullscreen" href={`/e/preview?template=${templateId}&draft=1`} target="_blank" rel="noreferrer" onClick={event => { if (!saveDraft()) event.preventDefault(); }}>Full preview</Link>}
        <button className="cin-cta cin-cta-outline studio-save studio-save-draft" onClick={saveDraft} disabled={!ready}>Save draft</button>
        <button className="cin-cta cin-cta-light studio-save" onClick={() => void publish()} disabled={!ready || publishing}>{publishing ? (owned ? "Updating…" : "Publishing…") : owned ? "Update" : "Publish"}</button>
      </div>
    </header>
    <div className="studio-mobile-tabs theme-paper" role="tablist" aria-label="Editor view"><button role="tab" aria-selected={mobilePanel === "edit"} aria-controls="studio-edit" onClick={() => setMobilePanel("edit")}>Details</button><button role="tab" aria-selected={mobilePanel === "preview"} aria-controls="studio-live" onClick={() => setMobilePanel("preview")}>Preview</button></div>
    <main className={`studio-grid studio-show-${mobilePanel}`}>
      <section className="studio-edit-panel theme-paper" id="studio-edit" aria-label="Invitation settings">
        <Link className="studio-back" href={owned ? `/manage/${owned.slug}` : "/templates"}>{owned ? "← Back to your invitation" : "← All templates"}</Link>
        <div className="studio-intro"><h1>Make it <span className="scribble">yours</span></h1><p>Edit the details and see your invitation update live.</p></div>
        <fieldset className="studio-fieldset"><legend>Occasion</legend><div className="studio-template-grid">{invitationTemplates.map(item => <button key={item.id} type="button" className={`studio-template${templateId === item.id ? " is-selected" : ""}`} onClick={() => changeTemplate(item.id)} aria-pressed={templateId === item.id}><Art name={item.id} fit="slice" decorative/><span>{item.name}</span><i aria-hidden="true">{templateId === item.id ? "✓" : ""}</i></button>)}</div></fieldset>
        <fieldset className="studio-fieldset"><legend>Details</legend>
          <div className="studio-field"><label htmlFor="title">Names or occasion title</label><input id="title" value={draft.title} maxLength={80} placeholder="Aarav & Meera" onChange={event => update("title", event.target.value)} {...described("title")}/>{fieldError("title")}</div>
          <div className="studio-field-row">
            <div className="studio-field"><label htmlFor="date">Date</label><input id="date" type="date" value={draft.date} onChange={event => update("date", event.target.value)} {...described("date")}/>{fieldError("date")}</div>
            <div className="studio-field"><label htmlFor="time">Time</label><input id="time" type="time" value={draft.time} onChange={event => update("time", event.target.value)} {...described("time")}/>{fieldError("time")}</div>
          </div>
          <div className="studio-field"><label htmlFor="venue">Venue</label><input id="venue" value={draft.venue} maxLength={140} placeholder="Venue name, city" onChange={event => update("venue", event.target.value)} {...described("venue")}/>{fieldError("venue")}</div>
        </fieldset>
        <fieldset className="studio-fieldset studio-message-field"><legend>Message to guests</legend><div className="studio-field"><label className="studio-sr-only" htmlFor="message">Your message to guests</label><textarea id="message" rows={4} value={draft.message} maxLength={500} placeholder="A few words for the people you’re inviting…" onChange={event => update("message", event.target.value)} {...described("message")}/><span className="studio-character-count">{draft.message.length} / 500</span>{fieldError("message")}</div></fieldset>
        <div className="studio-save-status" role="status"><i className={dirty ? "is-dirty" : ""}/><span>{status}</span></div>
        <p className="studio-storage-note">{owned ? <>Live at <a href={`/e/${owned.slug}`} target="_blank" rel="noreferrer">{origin.replace(/^https?:\/\//, "")}/e/{owned.slug}</a>. Drafts are also kept on this device.</> : "Drafts are saved on this device. Publish to get a link you can share."}</p>
      </section>
      <aside className="studio-preview-panel theme-paper" id="studio-live" aria-label="Live invitation preview"><div className="studio-preview-inner"><div className="studio-preview-toolbar"><span className="studio-live"><i/>Live preview</span><button onClick={() => setOpened(false)} aria-label="Replay invitation reveal">Replay</button></div><div className="studio-canvas-frame"><InvitationScene template={template} draft={draft} compact opened={opened} onOpen={() => setOpened(true)} onReplay={() => setOpened(false)}/></div><div className="studio-preview-bottom"><span>{template.category}</span><span>tap the drawing to try it</span></div></div></aside>
    </main>

    <dialog ref={dialog} className="publish-dialog" aria-labelledby="publish-title">
      {owned && <div className="sketch-card publish-card">
        <span className="cin-note">it’s live!</span>
        <h2 id="publish-title">Your invitation is ready to share</h2>
        <ShareTools url={`${origin}/e/${owned.slug}`} title={draft.title}/>
        <div className="publish-private">
          <h3>Your private manage link</h3>
          <p>Open it to see replies and make changes from any device. Anyone with it can edit, so keep it to yourself.</p>
          <CopyField value={`${origin}/manage/${owned.slug}#k=${owned.key}`} label="Copy manage link"/>
        </div>
        <div className="publish-actions">
          <Link className="cin-cta cin-cta-outline" href={`/manage/${owned.slug}`}>See replies</Link>
          <button type="button" className="cin-cta cin-cta-light" onClick={() => dialog.current?.close()}>Keep editing</button>
        </div>
      </div>}
    </dialog>
  </div>;
}
