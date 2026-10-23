"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { EVENT_NAMES, LIMITS, SCHEDULE_PRESETS, draftKey, getInvitationTemplate, initialDraft, invitationTemplates, newEventId, ownerKey, presetEvent, readDraft, scheduleItemError, validateDraft, type DraftErrors, type InvitationDraft, type ScheduleItem } from "../lib/invitations";
import { WowLinkBrand } from "../ui/brand";
import { ArtImage } from "../ui/art";
import { InvitationScene } from "../ui/invitation-scene";
import { CopyField, ShareTools } from "../ui/share-tools";
import type { Experience, Rsvp } from "../lib/store";

const LANGUAGE_CHOICES = [["en", "English"], ["gu", "ગુજરાતી"]] as const;

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
  // After a failed publish, show what's wrong next to each schedule entry (and keep showing it until fixed).
  const [checkEvents, setCheckEvents] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [origin, setOrigin] = useState("");
  const drafts = useRef<Record<string, InvitationDraft>>({});
  const dialog = useRef<HTMLDialogElement>(null);
  // For a live invitation: the celebrations guests can see now, and how many replies and personal invitations
  // depend on each. Re-adding one by name brings back the same celebration, so its answers still count.
  const published = useRef<ScheduleItem[]>([]);
  const usage = useRef<Record<string, { replies: number; invitations: number }>>({});
  const [removed, setRemoved] = useState<{ item: ScheduleItem; replies: number; invitations: number } | null>(null);
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
      const { experience, rsvps } = (await response.json()) as { experience: Experience; rsvps: Rsvp[] };
      setTemplateId(experience.templateId);
      setDraft({ title: experience.title, date: experience.date, time: experience.time, venue: experience.venue, message: experience.message, events: experience.events ?? [], language: experience.language ?? "en", thanks: experience.thanks ?? "" });
      published.current = experience.events ?? [];
      usage.current = Object.fromEntries(published.current.map(e => [e.id, {
        replies: rsvps.filter(r => r.byEvent && Object.hasOwn(r.byEvent, e.id)).length,
        invitations: (experience.guests ?? []).filter(g => g.events !== "all" && g.events.includes(e.id)).length,
      }]));
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

  function setEvents(next: (events: ScheduleItem[]) => ScheduleItem[]) {
    setDraft(current => ({ ...current, events: next(current.events) }));
    setErrors(current => {
      if (!current.events) return current;
      const rest = { ...current };
      delete rest.events;
      return rest;
    });
    setDirty(true);
    setStatus(owned ? "Changes not live yet. Press Update." : "Unsaved changes");
  }
  const updateEvent = (id: string, patch: Partial<ScheduleItem>) => setEvents(events => events.map(e => (e.id === id ? { ...e, ...patch } : e)));
  function addEvent(name: string) {
    // A live celebration removed a moment ago comes back as itself, not as a new one with no replies.
    const before = name ? published.current.find(e => e.name.trim().toLowerCase() === name.toLowerCase() && !draft.events.some(d => d.id === e.id)) : undefined;
    const item = before ? { ...before } : name ? presetEvent(template, name, draft) : { id: newEventId(), name: "", date: draft.date, time: "", venue: "" };
    setEvents(events => [...events, item]);
    if (removed?.item.id === item.id) setRemoved(null);
    if (!name) requestAnimationFrame(() => document.getElementById(`event-${item.id}-name`)?.focus());
  }
  function removeEvent(item: ScheduleItem) {
    setEvents(events => events.filter(e => e.id !== item.id));
    const used = usage.current[item.id];
    setRemoved(used && (used.replies || used.invitations) ? { item, ...used } : null);
  }
  function putBack() {
    if (!removed) return;
    setEvents(events => [...events, removed.item]);
    setRemoved(null);
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
      setCheckEvents(true);
      setStatus("A few details are missing before this can go live.");
      setMobilePanel("edit");
      const first = Object.keys(checked.errors)[0];
      const badEvent = draft.events.find(item => scheduleItemError(item));
      requestAnimationFrame(() => document.getElementById(first === "events" && badEvent ? `event-${badEvent.id}-name` : first)?.focus());
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
      published.current = checked.value.events;
      setRemoved(null);
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
        <fieldset className="studio-fieldset"><legend>Occasion</legend><div className="studio-template-grid">{invitationTemplates.map(item => <button key={item.id} type="button" className={`studio-template${templateId === item.id ? " is-selected" : ""}`} onClick={() => changeTemplate(item.id)} aria-pressed={templateId === item.id}><ArtImage name={item.id} fit="slice"/><span>{item.name}</span><i aria-hidden="true">{templateId === item.id ? "✓" : ""}</i></button>)}</div></fieldset>
        <fieldset className="studio-fieldset"><legend>Details</legend>
          <div className="studio-field"><label htmlFor="title">Names or occasion title</label><input id="title" value={draft.title} maxLength={80} placeholder="Aarav & Meera" onChange={event => update("title", event.target.value)} {...described("title")}/>{fieldError("title")}</div>
          <div className="studio-field-row">
            <div className="studio-field"><label htmlFor="date">Date</label><input id="date" type="date" value={draft.date} onChange={event => update("date", event.target.value)} {...described("date")}/>{fieldError("date")}</div>
            <div className="studio-field"><label htmlFor="time">Time</label><input id="time" type="time" value={draft.time} onChange={event => update("time", event.target.value)} {...described("time")}/>{fieldError("time")}</div>
          </div>
          <div className="studio-field"><label htmlFor="venue">Venue</label><input id="venue" value={draft.venue} maxLength={140} placeholder="Venue name, city" onChange={event => update("venue", event.target.value)} {...described("venue")}/>{fieldError("venue")}</div>
        </fieldset>
        <fieldset className="studio-fieldset studio-schedule" id="events">
          <legend>Schedule <span className="studio-legend-note">optional</span></legend>
          <p className="studio-help">{template.id === "wedding" ? "Several events? Add each one, from the mehndi to the reception. Guests get a timeline and can save every date." : "More than one event? Add each one and guests get a timeline."}</p>
          {draft.events.map((item, index) => {
            const problem = checkEvents ? scheduleItemError(item) : "";
            const label = item.name.trim() || `event ${index + 1}`;
            return <div className="studio-event" key={item.id}>
              <div className="studio-event-head"><span>{item.name.trim() || `Event ${index + 1}`}</span><button type="button" className="studio-event-remove" onClick={() => removeEvent(item)} aria-label={`Remove ${label} from the schedule`}>remove</button></div>
              <div className="studio-field"><label htmlFor={`event-${item.id}-name`}>What’s happening</label><input id={`event-${item.id}-name`} list="event-names" value={item.name} maxLength={LIMITS.eventName} placeholder="Mehndi" onChange={event => updateEvent(item.id, { name: event.target.value })} aria-invalid={problem ? true : undefined} aria-describedby={problem ? `event-${item.id}-error` : undefined}/></div>
              <div className="studio-field-row">
                <div className="studio-field"><label htmlFor={`event-${item.id}-date`}>Date</label><input id={`event-${item.id}-date`} type="date" value={item.date} onChange={event => updateEvent(item.id, { date: event.target.value })}/></div>
                <div className="studio-field"><label htmlFor={`event-${item.id}-time`}>Time <span>Optional</span></label><input id={`event-${item.id}-time`} type="time" value={item.time} onChange={event => updateEvent(item.id, { time: event.target.value })}/></div>
              </div>
              <div className="studio-field"><label htmlFor={`event-${item.id}-venue`}>Venue <span>If different</span></label><input id={`event-${item.id}-venue`} value={item.venue} maxLength={LIMITS.venue} placeholder={draft.venue || "Venue name, city"} onChange={event => updateEvent(item.id, { venue: event.target.value })}/></div>
              {problem && <p className="studio-error" id={`event-${item.id}-error`}>{problem}</p>}
            </div>;
          })}
          {removed && <div className="studio-removed" role="status">
            <p>Removed the {removed.item.name || "event"}. {[removed.replies && `${removed.replies} ${removed.replies === 1 ? "reply" : "replies"}`, removed.invitations && `${removed.invitations} personal ${removed.invitations === 1 ? "invitation" : "invitations"}`].filter(Boolean).join(" and ")} {removed.replies + removed.invitations === 1 ? "includes" : "include"} it. They won’t count for it once you press Update.</p>
            <button type="button" className="share-chip" onClick={putBack}>Put it back</button>
          </div>}
          {draft.events.length < LIMITS.events && <div className="studio-event-add">
            {(SCHEDULE_PRESETS[template.id] ?? []).filter(preset => !draft.events.some(e => e.name.trim().toLowerCase() === preset.name.toLowerCase())).map(preset => <button type="button" className="share-chip" key={preset.name} onClick={() => addEvent(preset.name)}>+ {preset.name}</button>)}
            <button type="button" className="share-chip" onClick={() => addEvent("")}>+ Add an event</button>
          </div>}
          {fieldError("events")}
          <datalist id="event-names">{EVENT_NAMES.map(name => <option key={name} value={name}/>)}</datalist>
        </fieldset>
        <fieldset className="studio-fieldset">
          <legend>Language <span className="studio-legend-note">for guests</span></legend>
          <p className="studio-help">The language the invitation opens in. Guests can switch between Gujarati and English themselves.</p>
          <div className="studio-language" role="radiogroup" aria-label="Language for guests">
            {LANGUAGE_CHOICES.map(([value, label]) => <label key={value} className={(draft.language ?? "en") === value ? "is-selected" : ""} lang={value}><input type="radio" name="language" checked={(draft.language ?? "en") === value} onChange={() => update("language", value)}/><span>{label}</span></label>)}
          </div>
        </fieldset>
        <fieldset className="studio-fieldset studio-message-field"><legend>Message to guests</legend><div className="studio-field"><label className="studio-sr-only" htmlFor="message">Your message to guests</label><textarea id="message" rows={4} value={draft.message} maxLength={500} placeholder="A few words for the people you’re inviting…" onChange={event => update("message", event.target.value)} {...described("message")}/><span className="studio-character-count">{draft.message.length} / 500</span>{fieldError("message")}</div>
          <div className="studio-field studio-thanks-field"><label htmlFor="thanks">After the day <span>Optional</span></label><p className="studio-help">Once it’s all over, the invitation turns into a thank-you. Write the note guests will see then.</p><textarea id="thanks" rows={3} value={draft.thanks ?? ""} maxLength={500} placeholder="Thank you for the love, the blessings, and for being there…" onChange={event => update("thanks", event.target.value)} {...described("thanks")}/><span className="studio-character-count">{(draft.thanks ?? "").length} / 500</span>{fieldError("thanks")}</div>
        </fieldset>
        <div className="studio-save-status" role="status"><i className={dirty ? "is-dirty" : ""}/><span>{status}</span></div>
        <p className="studio-storage-note">{owned ? <>Live at <a href={`/e/${owned.slug}`} target="_blank" rel="noreferrer">{origin.replace(/^https?:\/\//, "")}/e/{owned.slug}</a>. Drafts are also kept on this device.</> : "Drafts are saved on this device. Publish to get a link you can share."}</p>
      </section>
      <aside className="studio-preview-panel theme-paper" id="studio-live" aria-label="Live invitation preview"><div className="studio-preview-inner"><div className="studio-preview-toolbar"><span className="studio-live"><i/>Live preview</span><button onClick={() => setOpened(false)} aria-label="Replay invitation reveal">Replay</button></div><div className="studio-canvas-frame"><InvitationScene template={template} draft={draft} compact opened={opened} onOpen={() => setOpened(true)} onReplay={() => setOpened(false)}/></div><div className="studio-preview-bottom"><span>{template.category}</span><span>tap the drawing to try it</span></div></div></aside>
    </main>

    <dialog ref={dialog} className="publish-dialog" aria-labelledby="publish-title">
      {owned && <div className="sketch-card publish-card">
        <span className="cin-note">it’s live!</span>
        <h2 id="publish-title">Your invitation is ready to share</h2>
        <ShareTools url={`${origin}/e/${owned.slug}`} title={draft.title} lang={draft.language}/>
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
