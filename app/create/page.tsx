"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { EVENT_NAMES, LANGS, draftOf, formatShortDay, LANG_NAMES, LIMITS, SCHEDULE_PRESETS, draftKey, getInvitationTemplate, initialDraft, invitationTemplates, newEventId, ownerKey, presetEvent, readDraft, scheduleItemError, validateDraft, type DraftErrors, type InvitationDraft, type ScheduleItem } from "../lib/invitations";
import { WowLinkBrand } from "../ui/brand";
import { ArtImage } from "../ui/art";
import { InvitationScene } from "../ui/invitation-scene";
import { countPage } from "../ui/counting";
import { CopyField, ShareTools } from "../ui/share-tools";
import { HostLangSwitch, useHostLang } from "../ui/host-lang";
import { hostMessage, type HostText } from "../lib/host-i18n";
import { OCCASION_TONES, PALETTES, PALETTE_IDS, type PaletteId } from "../lib/palette";
import { STARTER_OCCASIONS, freeDraft, planOf, type Plan } from "../lib/plans";
import { EXTRA_LIMITS } from "../lib/extras";
import { cleanBrand, type Brand } from "../lib/brand";
import { SignIn } from "../ui/sign-in";
import { syncAccount } from "../ui/account";

/** Where a planner's brand kit is kept on their device. */
const BRAND_KIT_KEY = "wowlink:brand-kit";
type OwnerPreview = { token: string; createdAt: string; expiresAt: string; feedback: { verdict: "approve" | "changes"; note: string; at: string }[] };
import type { Experience, Rsvp } from "../lib/store";

const LANGUAGE_CHOICES = LANGS.map(lang => [lang, LANG_NAMES[lang]] as const);

/** A published invitation this browser can edit: its public slug and private manage key. */
type Owned = { slug: string; key: string; plan?: Plan };

export default function CreatePage() {
  const [templateId, setTemplateId] = useState<string>("wedding");
  const [draft, setDraft] = useState<InvitationDraft>(initialDraft(invitationTemplates[0]));
  const [opened, setOpened] = useState(false);
  const [ready, setReady] = useState(false);
  const [dirty, setDirty] = useState(false);
  const { lang, h, choose, message } = useHostLang();
  // Kept as a function of the wording, so it follows the host's language if they switch.
  const [status, setStatus] = useState<(h: HostText) => string>(() => (t: HostText) => t.canvasReady);
  const [mobilePanel, setMobilePanel] = useState<"edit" | "preview">("edit");
  const [owned, setOwned] = useState<Owned | null>(null);
  // Taken down by WowLink after a report: it opens, but can't be updated.
  const [takenDown, setTakenDown] = useState(false);
  // The planner's brand kit, saved on this device; and the client previews of an invitation in the Creator studio.
  const [kit, setKit] = useState<Brand | null>(null);
  const [kitStatus, setKitStatus] = useState("");
  const [previews, setPreviews] = useState<OwnerPreview[]>([]);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [errors, setErrors] = useState<DraftErrors>({});
  // After a failed publish, show what's wrong next to each schedule entry (and keep showing it until fixed).
  const [checkEvents, setCheckEvents] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [origin, setOrigin] = useState("");
  const drafts = useRef<Record<string, InvitationDraft>>({});
  const dialog = useRef<HTMLDialogElement>(null);
  // Publishing needs an account (when the site has them): asked for at Publish, so anyone can try the studio first.
  // Back from signing in (?publish=1), the draft is published straight away.
  const signInDialog = useRef<HTMLDialogElement>(null);
  const publishOnReady = useRef(false);
  // For a live invitation: the celebrations guests can see now, and how many replies and personal invitations
  // depend on each. Re-adding one by name brings back the same celebration, so its answers still count.
  const published = useRef<ScheduleItem[]>([]);
  const usage = useRef<Record<string, { replies: number; invitations: number }>>({});
  const [removed, setRemoved] = useState<{ item: ScheduleItem; replies: number; invitations: number } | null>(null);
  const template = getInvitationTemplate(templateId);
  // New invitations are free; an invitation already in the Creator studio keeps everything.
  const pro = owned ? planOf(owned) === "pro" : false;
  // What guests will get: a free invitation without the Creator studio's parts.
  const shown = pro ? draft : freeDraft(draft);

  useEffect(() => {
    try { setKit(cleanBrand(JSON.parse(localStorage.getItem(BRAND_KIT_KEY) ?? "null"))); } catch { /* no kit */ }
  }, []);
  useEffect(() => {
    if (!owned || !pro) return;
    const load = () => fetch(`/api/experiences/${owned.slug}/previews`, { headers: { authorization: `Bearer ${owned.key}` }, cache: "no-store" })
      .then(r => (r.ok ? r.json() : { previews: [] })).then((b: { previews: OwnerPreview[] }) => setPreviews(b.previews)).catch(() => undefined);
    void load();
    // The client may answer while the planner is elsewhere: check again on coming back.
    addEventListener("focus", load);
    return () => removeEventListener("focus", load);
  }, [owned, pro]);

  useEffect(() => {
    setOrigin(location.origin);
    countPage("studio");
    const params = new URLSearchParams(location.search);
    const edit = params.get("edit");
    if (edit) {
      void openPublished(edit);
      return;
    }
    const copy = params.get("copy");
    if (copy) {
      void copyPublished(copy);
      return;
    }
    const selected = getInvitationTemplate(params.get("template"));
    const saved = readDraft(selected.id);
    setTemplateId(selected.id);
    setDraft(saved ?? initialDraft(selected));
    setStatus(() => (t: HostText) => (saved ? t.draftRestored : t.canvasReady));
    if (saved && params.get("publish") === "1") {
      publishOnReady.current = true;
      history.replaceState(null, "", `/create?template=${selected.id}`);
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready || !publishOnReady.current) return;
    publishOnReady.current = false;
    void publish();
    // publish reads the draft just restored; it runs once.
  }, [ready]);

  /** This device's manage key for an invitation; signed in, one from the account if the device has none yet. */
  async function keyFor(slug: string) {
    const saved = () => { try { return localStorage.getItem(ownerKey(slug)); } catch { return null; } };
    if (saved()) return saved();
    await syncAccount();
    return saved();
  }

  /** "Make another like this": a new invitation starting from one of yours (its drawing, colours, words and schedule; not its guests or replies). */
  async function copyPublished(slug: string) {
    const key = await keyFor(slug);
    try {
      if (!key) throw new Error();
      const response = await fetch(`/api/experiences/${slug}`, { headers: { authorization: `Bearer ${key}` }, cache: "no-store" });
      if (!response.ok) throw new Error();
      const { experience } = (await response.json()) as { experience: Experience };
      // Copying is the Creator studio's.
      if (planOf(experience) !== "pro") throw Object.assign(new Error(), { pro: true });
      setTemplateId(experience.templateId);
      const copied = draftOf(experience);
      setDraft({ ...copied, events: copied.events.map(e => ({ ...e, id: newEventId() })) });
      setDirty(true);
      setStatus(() => (t: HostText) => t.copiedFrom(experience.title));
      history.replaceState(null, "", `/create?template=${experience.templateId}`);
    } catch (failure) {
      const fallback = getInvitationTemplate(null);
      setDraft(readDraft(fallback.id) ?? initialDraft(fallback));
      setStatus(() => (t: HostText) => ((failure as { pro?: boolean }).pro ? t.proCopy : t.couldntCopy));
    }
    setReady(true);
  }

  async function openPublished(slug: string) {
    const key = await keyFor(slug);
    if (!key) {
      setStatus(() => (t: HostText) => t.needManageLink);
      setReady(true);
      return;
    }
    try {
      const response = await fetch(`/api/experiences/${slug}`, { headers: { authorization: `Bearer ${key}` }, cache: "no-store" });
      if (!response.ok) throw new Error();
      const { experience, rsvps } = (await response.json()) as { experience: Experience; rsvps: Rsvp[] };
      setTemplateId(experience.templateId);
      setDraft(draftOf(experience));
      published.current = experience.events ?? [];
      usage.current = Object.fromEntries(published.current.map(e => [e.id, {
        replies: rsvps.filter(r => r.byEvent && Object.hasOwn(r.byEvent, e.id)).length,
        invitations: (experience.guests ?? []).filter(g => g.events !== "all" && g.events.includes(e.id)).length,
      }]));
      setOwned({ slug, key, plan: planOf(experience) });
      setTakenDown(!!experience.removed);
      setStatus(() => (t: HostText) => (experience.removed ? t.studioTakenDown : t.editingLive));
    } catch {
      setStatus(() => (t: HostText) => t.couldntOpen);
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
    setStatus(() => (t: HostText) => (takenDown ? t.studioTakenDown : owned ? t.notLiveYet : t.unsaved));
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
    setStatus(() => (t: HostText) => (takenDown ? t.studioTakenDown : owned ? t.notLiveYet : t.unsaved));
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
    setStatus(() => (t: HostText) => (takenDown ? t.studioTakenDown : owned ? t.notLiveYet : t.unsaved));
    if (!owned) history.replaceState(null, "", `/create?template=${id}`);
  }

  function saveDraft() {
    try {
      localStorage.setItem(draftKey(templateId), JSON.stringify(draft));
      if (!owned) setDirty(false);
      setStatus(() => (t: HostText) => t.savedHere(!!owned));
      return true;
    } catch {
      setStatus(() => (t: HostText) => t.couldntSave);
      return false;
    }
  }

  function readLogo(file: File | undefined) {
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return setErrors(now => ({ ...now, brand: "The logo must be a PNG, JPEG or WebP image." }));
    if (file.size > 150_000) return setErrors(now => ({ ...now, brand: "The logo must be under 150 KB." }));
    const reader = new FileReader();
    reader.onload = () => update("brand", { ...(draft.brand ?? { name: "", signoff: "", logo: "" }), logo: String(reader.result) });
    reader.readAsDataURL(file);
  }
  function saveKit() {
    if (!draft.brand) return;
    try {
      localStorage.setItem(BRAND_KIT_KEY, JSON.stringify(draft.brand));
      setKit(draft.brand);
      setKitStatus(h.brandKitSaved);
    } catch { setKitStatus(h.couldntSave); }
  }
  async function sharePreview() {
    if (!owned) return;
    const checked = validateDraft(draft);
    if (!checked.ok) {
      setErrors(checked.errors);
      setStatus(() => (t: HostText) => t.missingDetails);
      return;
    }
    setPreviewBusy(true);
    const response = await fetch(`/api/experiences/${owned.slug}/previews`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${owned.key}` }, body: JSON.stringify({ templateId, draft: checked.value }) }).catch(() => null);
    if (response?.ok) {
      const list = await fetch(`/api/experiences/${owned.slug}/previews`, { headers: { authorization: `Bearer ${owned.key}` }, cache: "no-store" }).then(r => r.json()).catch(() => ({ previews: [] }));
      setPreviews(list.previews);
    } else {
      const body = await response?.json().catch(() => null);
      setStatus(() => (t: HostText) => (body?.error ? hostMessage(body.error, t.lang) : t.previewFailed));
    }
    setPreviewBusy(false);
  }

  async function publish() {
    const checked = validateDraft(draft);
    if (!checked.ok) {
      setErrors(checked.errors);
      setCheckEvents(true);
      setStatus(() => (t: HostText) => t.missingDetails);
      setMobilePanel("edit");
      const first = Object.keys(checked.errors)[0];
      const badEvent = draft.events.find(item => scheduleItemError(item));
      requestAnimationFrame(() => document.getElementById(first === "events" && badEvent ? `event-${badEvent.id}-name` : first)?.focus());
      return;
    }
    if (!pro && !STARTER_OCCASIONS.includes(template.id)) {
      setStatus(() => (t: HostText) => t.proOccasion);
      return;
    }
    setErrors({});
    setPublishing(true);
    setStatus(() => (t: HostText) => (owned ? t.updatingStatus : t.publishing));
    try {
      const response = await fetch(owned ? `/api/experiences/${owned.slug}` : "/api/experiences", {
        method: owned ? "PATCH" : "POST",
        headers: { "content-type": "application/json", ...(owned ? { authorization: `Bearer ${owned.key}` } : {}) },
        body: JSON.stringify({ templateId, draft: pro ? checked.value : freeDraft(checked.value), ...(owned ? { status: "published" } : {}) }),
      });
      const body = await response.json().catch(() => ({}));
      if (response.status === 401 && body.signIn) {
        setStatus(() => (t: HostText) => t.signInToPublish);
        signInDialog.current?.showModal();
        setPublishing(false);
        return;
      }
      if (!response.ok) {
        if (body.fields) setErrors(body.fields);
        throw new Error(body.error);
      }
      const mine: Owned = owned ?? { slug: body.slug as string, key: body.key as string, plan: "free" };
      if (!owned) {
        try { localStorage.setItem(ownerKey(mine.slug), mine.key); } catch { /* the manage link in the dialog still works */ }
        setOwned(mine);
        history.replaceState(null, "", `/create?edit=${mine.slug}`);
      }
      published.current = checked.value.events;
      setRemoved(null);
      setDirty(false);
      setStatus(() => (t: HostText) => t.publishedStatus(!!owned));
      dialog.current?.showModal();
    } catch (failure) {
      const text = (failure as Error).message;
      setStatus(() => (t: HostText) => (text ? hostMessage(text, t.lang) : t.couldntPublish));
    }
    setPublishing(false);
  }

  const customColour = /^#[0-9a-f]{6}$/i.test(draft.palette ?? "") ? draft.palette! : "";
  // A free invitation can ask for the Creator studio from its manage page; a new one is published free first.
  const proNote = (text: string) => <p className="studio-pro-note"><span className="studio-pro-badge">{h.proBadge}</span> {text} {owned ? <Link href={`/manage/${owned.slug}#creator-studio`}>{h.askPro}</Link> : <>{h.askProPublishFirst} <Link href="/pricing">{h.seePlans}</Link></>}</p>;
  const fieldError = (key: keyof InvitationDraft) => errors[key] ? <p className="studio-error" id={`${key}-error`}>{message(errors[key]!)}</p> : null;
  const described = (key: keyof InvitationDraft) => errors[key] ? { "aria-invalid": true, "aria-describedby": `${key}-error` } : {};

  return <div className="cinema studio-page" aria-busy={!ready} lang={lang}>
    <header className="studio-header theme-paper">
      <WowLinkBrand/>
      <span className="studio-header-label">{takenDown ? h.takenDown : h.studioLabel(!!owned)}</span>
      <div className="studio-header-actions">
        <HostLangSwitch h={h} choose={choose}/>
        {owned
          ? <Link className="studio-fullscreen" href={`/manage/${owned.slug}`}>{h.repliesLink}</Link>
          : <Link className="studio-fullscreen" href={`/e/preview?template=${templateId}&draft=1`} target="_blank" rel="noreferrer" onClick={event => { if (!saveDraft()) event.preventDefault(); }}>{h.fullPreview}</Link>}
        <button className="cin-cta cin-cta-outline studio-save studio-save-draft" onClick={saveDraft} disabled={!ready}>{h.saveDraft}</button>
        <button className="cin-cta cin-cta-light studio-save" onClick={() => void publish()} disabled={!ready || publishing || takenDown}>{publishing ? (owned ? h.updating : h.publishing) : owned ? h.update : h.publish}</button>
      </div>
    </header>
    <div className="studio-mobile-tabs theme-paper" role="tablist" aria-label={h.editorView}><button role="tab" aria-selected={mobilePanel === "edit"} aria-controls="studio-edit" onClick={() => setMobilePanel("edit")}>{h.detailsTab}</button><button role="tab" aria-selected={mobilePanel === "preview"} aria-controls="studio-live" onClick={() => setMobilePanel("preview")}>{h.previewTab}</button></div>
    <main className={`studio-grid studio-show-${mobilePanel}`}>
      <section className="studio-edit-panel theme-paper" id="studio-edit" aria-label={h.settingsLabel}>
        <Link className="studio-back" href={owned ? `/manage/${owned.slug}` : "/templates"}>{owned ? h.backToInvitation : h.allTemplates}</Link>
        <div className="studio-intro"><h1>{h.makeIt[0]} <span className="scribble">{h.makeIt[1]}</span></h1><p>{h.makeItBody}</p></div>
        <fieldset className="studio-fieldset"><legend>{h.occasion}</legend><div className="studio-template-grid">{invitationTemplates.map(item => <button key={item.id} type="button" className={`studio-template${templateId === item.id ? " is-selected" : ""}`} onClick={() => changeTemplate(item.id)} aria-pressed={templateId === item.id}><ArtImage name={item.id} fit="slice"/><span>{h.occasionNames[item.id] ?? item.name}</span><i aria-hidden="true">{templateId === item.id ? "✓" : ""}</i>{!pro && !STARTER_OCCASIONS.includes(item.id) && <b className="studio-pro-badge studio-template-pro">{h.proBadge}</b>}</button>)}</div></fieldset>
        <fieldset className="studio-fieldset"><legend>{h.details}</legend>
          <div className="studio-field"><label htmlFor="title">{h.titleLabel}</label><input id="title" value={draft.title} maxLength={80} placeholder="Aarav & Meera" onChange={event => update("title", event.target.value)} {...described("title")}/>{fieldError("title")}</div>
          <div className="studio-field-row">
            <div className="studio-field"><label htmlFor="date">{h.date}</label><input id="date" type="date" value={draft.date} onChange={event => update("date", event.target.value)} {...described("date")}/>{fieldError("date")}</div>
            <div className="studio-field"><label htmlFor="time">{h.time}</label><input id="time" type="time" value={draft.time} onChange={event => update("time", event.target.value)} {...described("time")}/>{fieldError("time")}</div>
          </div>
          <div className="studio-field"><label htmlFor="venue">{h.venue}</label><input id="venue" value={draft.venue} maxLength={140} placeholder={h.venuePlaceholder} onChange={event => update("venue", event.target.value)} {...described("venue")}/>{fieldError("venue")}</div>
          <div className="studio-field"><label htmlFor="mapUrl">{h.mapLabel} <span>{h.optional}</span></label><p className="studio-help" id="mapUrl-help">{h.mapHelp}</p><input id="mapUrl" type="url" inputMode="url" value={draft.mapUrl ?? ""} maxLength={400} placeholder="https://maps.app.goo.gl/…" onChange={event => update("mapUrl", event.target.value)} {...described("mapUrl")}/>{fieldError("mapUrl")}</div>
        </fieldset>
        <fieldset className="studio-fieldset">
          <legend>{h.onInvitation}</legend>
          <label className="studio-switch"><input type="checkbox" checked={draft.rsvp !== false} onChange={event => update("rsvp", event.target.checked)} aria-describedby="rsvp-help"/><span>{h.askToReply}</span></label>
          <p className="studio-help studio-switch-help" id="rsvp-help">{h.askToReplyHelp(draft.rsvp !== false)}</p>
          <label className="studio-switch"><input type="checkbox" checked={draft.countdown !== false} onChange={event => update("countdown", event.target.checked)}/><span>{h.showCountdown}</span></label>
          {draft.rsvp !== false && <>
            <label className="studio-switch"><input type="checkbox" checked={!!draft.askDiet} onChange={event => update("askDiet", event.target.checked)} aria-describedby="diet-help"/><span>{h.askDiet}</span></label>
            <p className="studio-help studio-switch-help" id="diet-help">{h.askDietHelp}</p>
          </>}
          {pro ? <>
            {draft.rsvp !== false && <>
              <label className="studio-switch"><input type="checkbox" checked={!!draft.askSong} onChange={event => update("askSong", event.target.checked)} aria-describedby="song-help"/><span>{h.askSong}</span></label>
              <p className="studio-help studio-switch-help" id="song-help">{h.askSongHelp}</p>
              {draft.poll ? <div className="studio-poll" role="group" aria-label={h.addPoll}>
                <div className="studio-field"><label htmlFor="poll-question">{h.pollQuestion}</label><input id="poll-question" value={draft.poll.question} maxLength={EXTRA_LIMITS.pollQuestion} placeholder={h.pollQuestionPlaceholder} onChange={event => update("poll", { ...draft.poll!, question: event.target.value })} {...described("poll")}/></div>
                {draft.poll.options.map((option, i) => <div className="studio-field" key={i}><label htmlFor={`poll-option-${i}`}>{h.pollOption(i + 1)}</label><input id={`poll-option-${i}`} value={option} maxLength={EXTRA_LIMITS.pollOption} onChange={event => update("poll", { ...draft.poll!, options: draft.poll!.options.map((o, j) => (j === i ? event.target.value : o)) })}/></div>)}
                <div className="manage-guest-buttons">
                  {draft.poll.options.length < EXTRA_LIMITS.pollOptions && <button type="button" className="share-chip" onClick={() => update("poll", { ...draft.poll!, options: [...draft.poll!.options, ""] })}>{h.pollAddOption}</button>}
                  <button type="button" className="share-chip" onClick={() => update("poll", null)}>{h.pollRemove}</button>
                </div>
                {fieldError("poll")}
              </div> : <button type="button" className="share-chip studio-poll-add" onClick={() => update("poll", { question: "", options: ["", ""] })}>{h.addPoll}</button>}
            </>}
            <label className="studio-switch"><input type="checkbox" checked={draft.attribution !== false} onChange={event => update("attribution", event.target.checked)}/><span>{h.showAttribution}</span></label>
          </> : proNote(h.proSongPoll)}
        </fieldset>
        <fieldset className="studio-fieldset studio-schedule" id="events">
          <legend>{h.schedule} <span className="studio-legend-note">{h.scheduleNote}</span></legend>
          {!pro ? proNote(h.proSchedule) : <>
          <p className="studio-help">{h.scheduleHelp(template.id === "wedding")}</p>
          {draft.events.map((item, index) => {
            const problem = checkEvents ? message(scheduleItemError(item)) : "";
            const label = item.name.trim() || h.eventFallbackLower(index + 1);
            return <div className="studio-event" key={item.id}>
              <div className="studio-event-head"><span>{item.name.trim() || h.eventFallback(index + 1)}</span><button type="button" className="studio-event-remove" onClick={() => removeEvent(item)} aria-label={h.removeEventLabel(label)}>{h.removeEvent}</button></div>
              <div className="studio-field"><label htmlFor={`event-${item.id}-name`}>{h.whatsHappening}</label><input id={`event-${item.id}-name`} list="event-names" value={item.name} maxLength={LIMITS.eventName} placeholder="Mehndi" onChange={event => updateEvent(item.id, { name: event.target.value })} aria-invalid={problem ? true : undefined} aria-describedby={problem ? `event-${item.id}-error` : undefined}/></div>
              <div className="studio-field-row">
                <div className="studio-field"><label htmlFor={`event-${item.id}-date`}>{h.date}</label><input id={`event-${item.id}-date`} type="date" value={item.date} onChange={event => updateEvent(item.id, { date: event.target.value })}/></div>
                <div className="studio-field"><label htmlFor={`event-${item.id}-time`}>{h.time} <span>{h.optional}</span></label><input id={`event-${item.id}-time`} type="time" value={item.time} onChange={event => updateEvent(item.id, { time: event.target.value })}/></div>
              </div>
              <div className="studio-field"><label htmlFor={`event-${item.id}-venue`}>{h.venue} <span>{h.ifDifferent}</span></label><input id={`event-${item.id}-venue`} value={item.venue} maxLength={LIMITS.venue} placeholder={draft.venue || h.venuePlaceholder} onChange={event => updateEvent(item.id, { venue: event.target.value })}/></div>
              {problem && <p className="studio-error" id={`event-${item.id}-error`}>{problem}</p>}
            </div>;
          })}
          {removed && <div className="studio-removed" role="status">
            <p>{h.removedNote(removed.item.name, removed.replies, removed.invitations)}</p>
            <button type="button" className="share-chip" onClick={putBack}>{h.putBack}</button>
          </div>}
          {draft.events.length < LIMITS.events && <div className="studio-event-add">
            {(SCHEDULE_PRESETS[template.id] ?? []).filter(preset => !draft.events.some(e => e.name.trim().toLowerCase() === preset.name.toLowerCase())).map(preset => <button type="button" className="share-chip" key={preset.name} onClick={() => addEvent(preset.name)}>+ {preset.name}</button>)}
            <button type="button" className="share-chip" onClick={() => addEvent("")}>{h.addEvent}</button>
          </div>}
          {fieldError("events")}
          <datalist id="event-names">{EVENT_NAMES.map(name => <option key={name} value={name}/>)}</datalist>
          </>}
        </fieldset>
        <fieldset className="studio-fieldset">
          <legend>{h.colours}</legend>
          {!pro ? proNote(h.proColours) : <>
          <p className="studio-help">{h.coloursHelp}</p>
          <div className="studio-palette">
            <div className="studio-palette-swatches" role="radiogroup" aria-label={h.colours}>
              <label className={!draft.palette ? "is-selected" : ""} title={h.occasionColours}><input type="radio" name="palette" checked={!draft.palette} onChange={() => update("palette", "")} aria-label={h.occasionColours}/><span className="swatch is-own" style={{ "--swatch": OCCASION_TONES[template.id] } as CSSProperties}/></label>
              {PALETTE_IDS.map(id => <label key={id} className={draft.palette === id ? "is-selected" : ""} title={h.paletteNames[id]}><input type="radio" name="palette" checked={draft.palette === id} onChange={() => update("palette", id)} aria-label={h.paletteNames[id]}/><span className="swatch" style={{ "--swatch": PALETTES[id].tone } as CSSProperties}/></label>)}
            </div>
            <label className={`studio-own-colour${customColour ? " is-selected" : ""}`}><input type="color" value={customColour || "#7a3fb5"} onChange={event => update("palette", event.target.value.toLowerCase())} aria-label={h.ownColour}/><span>{h.ownColour}</span></label>
          </div>
          <p className="studio-palette-name" aria-live="polite">{!draft.palette ? h.occasionColours : customColour ? "" : h.paletteNames[draft.palette as PaletteId]}</p>
          </>}
        </fieldset>
        <fieldset className="studio-fieldset">
          <legend>{h.brandHeading}</legend>
          {!pro ? proNote(h.proBrand) : <>
            <p className="studio-help">{h.brandHelp}</p>
            {draft.brand ? <div className="studio-brand">
              <div className="studio-field"><label htmlFor="brand-name">{h.brandName}</label><input id="brand-name" value={draft.brand.name} maxLength={60} onChange={event => update("brand", { ...draft.brand!, name: event.target.value })} {...described("brand")}/></div>
              <div className="studio-field"><label htmlFor="brand-signoff">{h.brandSignoff} <span>{h.optional}</span></label><input id="brand-signoff" value={draft.brand.signoff} maxLength={120} placeholder={h.brandSignoffPlaceholder} onChange={event => update("brand", { ...draft.brand!, signoff: event.target.value })}/></div>
              <div className="studio-field">
                <span className="studio-brand-label">{h.brandLogo} <span>{h.optional}</span></span>
                {draft.brand.logo
                  ? <div className="studio-brand-logo">{/* eslint-disable-next-line @next/next/no-img-element -- the planner's own logo, as a data URL */}<img src={draft.brand.logo} alt=""/><button type="button" className="share-chip" onClick={() => update("brand", { ...draft.brand!, logo: "" })}>{h.brandRemoveLogo}</button></div>
                  : <label className="share-chip studio-brand-upload">{h.brandLogo}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => { readLogo(event.target.files?.[0]); event.target.value = ""; }}/></label>}
                <p className="studio-help">{h.brandLogoHint}</p>
              </div>
              {fieldError("brand")}
              <div className="manage-guest-buttons"><button type="button" className="share-chip" onClick={saveKit}>{h.brandSaveKit}</button><button type="button" className="share-chip" onClick={() => update("brand", null)}>{h.brandRemove}</button></div>
              <p className="share-status" role="status">{kitStatus}</p>
            </div> : <div className="manage-guest-buttons"><button type="button" className="share-chip" onClick={() => update("brand", kit ?? { name: "", signoff: "", logo: "" })}>{kit ? h.brandUseKit : h.brandAdd}</button></div>}
          </>}
        </fieldset>
        <fieldset className="studio-fieldset">
          <legend>{h.language} <span className="studio-legend-note">{h.forGuests}</span></legend>
          <p className="studio-help">{h.languageHelp}</p>
          <div className="studio-language" role="radiogroup" aria-label={h.languageGroup}>
            {LANGUAGE_CHOICES.map(([value, label]) => <label key={value} className={(draft.language ?? "en") === value ? "is-selected" : ""} lang={value}><input type="radio" name="language" checked={(draft.language ?? "en") === value} onChange={() => update("language", value)}/><span>{label}</span></label>)}
          </div>
        </fieldset>
        <fieldset className="studio-fieldset studio-message-field"><legend>{h.messageLegend}</legend><div className="studio-field"><label className="studio-sr-only" htmlFor="message">{h.messageLabel}</label><textarea id="message" rows={4} value={draft.message} maxLength={500} placeholder={h.messagePlaceholder} onChange={event => update("message", event.target.value)} {...described("message")}/><span className="studio-character-count">{draft.message.length} / 500</span>{fieldError("message")}</div>
          <div className="studio-field studio-thanks-field"><label htmlFor="thanks">{h.thanksLabel} <span>{h.optional}</span></label><p className="studio-help">{h.thanksHelp}</p><textarea id="thanks" rows={3} value={draft.thanks ?? ""} maxLength={500} placeholder={h.thanksPlaceholder} onChange={event => update("thanks", event.target.value)} {...described("thanks")}/><span className="studio-character-count">{(draft.thanks ?? "").length} / 500</span>{fieldError("thanks")}</div>
        </fieldset>
        {owned && !takenDown && <fieldset className="studio-fieldset">
          <legend>{h.previewHeading}</legend>
          {!pro ? proNote(h.proPreview) : <>
            <p className="studio-help">{h.previewHelp}</p>
            <button type="button" className="share-chip" disabled={previewBusy} onClick={() => void sharePreview()}>{h.previewCreate}</button>
            {previews[0] && (() => {
              const latest = previews[0];
              const url = `${origin}/p/${latest.token}`;
              const answer = latest.feedback.at(-1);
              return <div className="studio-client-preview">
                <CopyField value={url} label={h.copyLink} ui={lang}/>
                <a className="share-chip" href={`https://wa.me/?text=${encodeURIComponent(h.previewMessage(draft.title, url))}`} target="_blank" rel="noreferrer">{h.previewOnWhatsApp}</a>
                <p className="manage-muted">{h.previewExpires(formatShortDay(latest.expiresAt, lang))} {!answer ? h.previewWaiting : answer.verdict === "approve" ? h.previewApproved(formatShortDay(answer.at, lang)) : h.previewChanges(formatShortDay(answer.at, lang), answer.note)}</p>
              </div>;
            })()}
          </>}
        </fieldset>}
        <div className="studio-save-status" role="status"><i className={dirty ? "is-dirty" : ""}/><span>{status(h)}</span></div>
        <p className="studio-storage-note">{owned && !takenDown ? <>{h.liveAt} <a href={`/e/${owned.slug}`} target="_blank" rel="noreferrer">{origin.replace(/^https?:\/\//, "")}/e/{owned.slug}</a>. {h.draftsAlsoKept}</> : h.draftsSaved}</p>
      </section>
      <aside className="studio-preview-panel theme-paper" id="studio-live" aria-label={h.livePreviewLabel}><div className="studio-preview-inner"><div className="studio-preview-toolbar"><span className="studio-live"><i/>{h.livePreview}</span><button onClick={() => setOpened(false)} aria-label={h.replayLabel}>{h.replay}</button></div><div className="studio-canvas-frame"><InvitationScene template={template} draft={shown} compact opened={opened} onOpen={() => setOpened(true)} onReplay={() => setOpened(false)}/></div><div className="studio-preview-bottom"><span>{h.occasionNames[template.id] ?? template.category}</span><span>{h.tapToTry}</span></div></div></aside>
    </main>

    <dialog ref={dialog} className="publish-dialog" aria-labelledby="publish-title">
      {owned && <div className="sketch-card publish-card">
        <span className="cin-note">{h.itsLive}</span>
        <h2 id="publish-title">{h.readyToShare}</h2>
        <ShareTools url={`${origin}/e/${owned.slug}`} title={draft.title} lang={draft.language} ui={lang} owner={{ slug: owned.slug, ownerKey: owned.key }}/>
        <div className="publish-private">
          <h3>{h.privateLink}</h3>
          <p>{h.privateLinkBody} <Link href="/mine">{h.myInvitations}</Link>.</p>
          <CopyField value={`${origin}/manage/${owned.slug}#k=${owned.key}`} label={h.copyManageLink} ui={lang}/>
        </div>
        <div className="publish-actions">
          <Link className="cin-cta cin-cta-outline" href={`/manage/${owned.slug}`}>{h.seeReplies}</Link>
          <button type="button" className="cin-cta cin-cta-light" onClick={() => dialog.current?.close()}>{h.keepEditing}</button>
        </div>
      </div>}
    </dialog>

    <dialog ref={signInDialog} className="publish-dialog" aria-labelledby="sign-in-title">
      <div className="sketch-card publish-card">
        <h2 id="sign-in-title">{h.signInToPublish}</h2>
        <p className="manage-muted">{h.signInToPublishBody}</p>
        {/* Back from Google, the studio opens the draft saveDraft kept, and publishes it. */}
        <SignIn h={h} next={`/create?template=${templateId}&publish=1`} beforeLeaving={() => saveDraft()}/>
        <div className="publish-actions"><button type="button" className="share-chip" onClick={() => signInDialog.current?.close()}>{h.cancel}</button></div>
      </div>
    </dialog>
  </div>;
}
