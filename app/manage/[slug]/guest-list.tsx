"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { LIMITS, formatEventDay, formatShortDay, sortSchedule, type ScheduleItem } from "../../lib/invitations";
import { answerFor, invitedTo, missingEvents, repliesUsed, tallyByEvent, type EventFilter, type Guest } from "../../lib/guests";
import { csvName, invitationsCsv } from "../../lib/export";
import { MESSAGES } from "../../lib/i18n";
import { hostMessage, type HostText } from "../../lib/host-i18n";
import { useHostText } from "../../ui/host-lang";
import { countShare } from "../../ui/counting";
import type { Experience, Rsvp } from "../../lib/store";

/*
 * The host's side of personal invitations: who gets their own link and which celebrations it shows,
 * what the general link shows, and the headcount for each celebration.
 */

type Owner = { slug: string; ownerKey: string };
type Errors = { name?: string; events?: string; phone?: string; list?: string; form?: string };

/** Call an owner endpoint. Resolves to the JSON body, or throws an Error carrying field errors. */
async function ownerCall<T = unknown>(owner: Owner, path: string, method: string, body?: object): Promise<T> {
  const response = await fetch(`/api/experiences/${owner.slug}${path}`, {
    method,
    headers: { "content-type": "application/json", authorization: `Bearer ${owner.ownerKey}` },
    body: body ? JSON.stringify(body) : undefined,
  }).catch(() => null);
  const data = (await response?.json().catch(() => null)) as ({ error?: string; fields?: Errors } & T) | null;
  if (!response?.ok) throw Object.assign(new Error(data?.error ?? "Couldn’t save that. Check your connection and try again."), { fields: data?.fields ?? {} });
  return data as T;
}
const errorsFrom = (failure: unknown): Errors => ({ ...(failure as { fields?: Errors }).fields, form: (failure as Error).message });
/** Field and server messages arrive in English; show them in the host's language. */
const useTranslate = () => { const h = useHostText(); return (message?: string) => (message ? hostMessage(message, h.lang) : ""); };

/** "+91 98250 12345" for an Indian mobile, "+447700900123" otherwise. */
export const showPhone = (phone: string) => (/^91\d{10}$/.test(phone) ? `+91 ${phone.slice(2, 7)} ${phone.slice(7)}` : `+${phone}`);
/** A WhatsApp message link: straight to their chat when there's a number, otherwise WhatsApp asks who to send it to. */
const whatsApp = (text: string, phone?: string) => `https://wa.me/${phone ?? ""}?text=${encodeURIComponent(text)}`;

/** Hand a spreadsheet to the browser as a download. */
export function saveCsv(fileName: string, csv: string) {
  const link = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })), download: fileName });
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

/** "Every celebration", or the chosen ones by name. */
export function celebrationsLabel(filter: EventFilter, schedule: ScheduleItem[], h: HostText) {
  if (filter === "all") return h.everyCelebration;
  const names = sortSchedule(schedule).filter(e => filter.includes(e.id)).map(e => e.name);
  return names.length ? names.join(" · ") : h.noCelebrationsYet;
}

/** Every celebration (including any added later), or only the ticked ones. */
export function CelebrationPicker({ schedule, value, onChange, legend, error }: { schedule: ScheduleItem[]; value: EventFilter; onChange: (next: EventFilter) => void; legend: string; error?: string }) {
  const id = useId();
  const h = useHostText();
  const tr = useTranslate();
  const sorted = sortSchedule(schedule);
  const some = value !== "all";
  return <fieldset className="manage-picker" aria-describedby={error ? `${id}-error` : undefined}>
    <legend>{legend}</legend>
    <div className="manage-picker-modes">
      <label className={!some ? "is-selected" : ""}><input type="radio" name={`${id}-mode`} checked={!some} onChange={() => onChange("all")}/><span>{h.everyCelebration}</span></label>
      <label className={some ? "is-selected" : ""}><input type="radio" name={`${id}-mode`} checked={some} onChange={() => onChange(sorted.map(e => e.id))}/><span>{h.onlySome}</span></label>
    </div>
    {!some && <p className="manage-muted manage-picker-note">{h.includingLater}</p>}
    {some && <ul className="manage-picker-list">{sorted.map(item => {
      const on = value.includes(item.id);
      return <li key={item.id}><label className={on ? "is-ticked" : ""}>
        <input type="checkbox" checked={on} onChange={() => onChange(on ? value.filter(x => x !== item.id) : [...value, item.id])}/>
        <span>{item.name}</span> <small>{formatEventDay(item.date, h.lang)}</small>
      </label></li>;
    })}</ul>}
    {error && <p className="studio-error" id={`${id}-error`}>{tr(error)}</p>}
  </fieldset>;
}

/** What the general link (the one shared in groups) shows. */
export function GeneralLinkAudience({ owner, experience, onSaved }: { owner: Owner; experience: Experience; onSaved: () => Promise<void> }) {
  const h = useHostText();
  const tr = useTranslate();
  const [value, setValue] = useState<EventFilter>(experience.publicEvents);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const missing = missingEvents(experience.publicEvents, experience.events);
  const changed = JSON.stringify(value) !== JSON.stringify(experience.publicEvents);

  async function save() {
    if (value !== "all" && !value.length) return setError(h.pickOneForGeneral);
    setBusy(true);
    setError("");
    try {
      await ownerCall(owner, "", "PATCH", { publicEvents: value });
      await onSaved();
      setMessage(h.generalSaved);
    } catch (failure) {
      setError((failure as Error).message);
    }
    setBusy(false);
  }

  return <div className="manage-audience">
    <CelebrationPicker schedule={experience.events} value={value} onChange={next => { setValue(next); setMessage(""); setError(""); }} legend={h.generalLinkShows} error={tr(error)}/>
    {missing.length > 0 && <p className="manage-warn">{h.generalMissing(missing.length)}</p>}
    <div className="manage-audience-actions">
      {changed && <button type="button" className="cin-cta cin-cta-light" disabled={busy} onClick={() => void save()}>{h.save}</button>}
      <span className="share-status" role="status">{message}</span>
    </div>
  </div>;
}

/** The numbers a caterer needs: for each celebration, who's coming, who might, who can't, and who hasn't said. */
export function Headcount({ experience, rsvps }: { experience: Experience; rsvps: Rsvp[] }) {
  const h = useHostText();
  const rows = tallyByEvent(experience.events, rsvps, experience.guests);
  const people = (n: number) => h.people(n).replace(/^\d+ /, "");
  return <div className="manage-table-wrap"><table className="manage-table manage-headcount">
    <caption className="manage-caption">{h.headcountCaption}</caption>
    <thead><tr><th scope="col">{h.colCelebration}</th><th scope="col">{h.coming}</th><th scope="col">{h.maybe}</th><th scope="col">{h.cantMakeIt}</th>{experience.guests.length > 0 && <th scope="col">{h.colYetToReply}</th>}</tr></thead>
    <tbody>{rows.map(row => <tr key={row.event.id}>
      <th scope="row"><span className="manage-headcount-name">{row.event.name}</span><span className="manage-muted">{formatEventDay(row.event.date, h.lang)}</span></th>
      <td><b className="manage-big">{row.coming}</b> {people(row.coming)}<span className="manage-muted">{h.replies(row.comingReplies)}</span></td>
      <td>{row.maybeReplies ? <>{h.people(row.maybe)}<span className="manage-muted">{h.replies(row.maybeReplies)}</span></> : "–"}</td>
      <td>{row.cant ? h.replies(row.cant) : "–"}</td>
      {experience.guests.length > 0 && <td>{row.waiting ? h.invitations(row.waiting) : "–"}</td>}
    </tr>)}</tbody>
  </table></div>;
}

/** Personal invitations: add one, then copy or send its link. */
export function GuestList({ owner, origin, experience, rsvps, onChanged }: { owner: Owner; origin: string; experience: Experience; rsvps: Rsvp[]; onChanged: () => Promise<void> }) {
  const h = useHostText();
  const tr = useTranslate();
  const schedule = experience.events;
  const [many, setMany] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [list, setList] = useState("");
  const [events, setEvents] = useState<EventFilter>("all");
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const used = repliesUsed(rsvps, experience.guests);
  const full = used >= LIMITS.rsvpsPerEvent || experience.guests.length >= LIMITS.guestList;
  const lines = list.split(/\r?\n/).filter(line => line.trim()).length;
  const edit = <T,>(set: (value: T) => void) => (value: T) => { set(value); setErrors({}); setStatus(""); };

  async function add(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      if (many) {
        const { guests, skipped } = await ownerCall<{ guests: Guest[]; skipped: string[] }>(owner, "/guests", "POST", { list, events });
        await onChanged();
        setStatus(h.addedMany(guests.length, skipped));
        setList("");
      } else {
        await ownerCall(owner, "/guests", "POST", { name, events, phone });
        await onChanged();
        setStatus(h.addedOne(name.trim()));
        setName("");
        setPhone("");
      }
      setEvents("all");
    } catch (failure) {
      setErrors(errorsFrom(failure));
    }
    setBusy(false);
  }

  // Taken down: the links can't open, so nothing can be added or sent.
  const closed = !!experience.removed;
  return <>
    <p className="manage-muted">{closed ? h.takenDownShare : h.guestsIntro(schedule.length > 1)}</p>
    {!closed && (!full ? <form className="manage-guest-add" onSubmit={add}>
      <div className="manage-picker-modes manage-add-modes" role="radiogroup" aria-label={h.howToAdd}>
        <label className={!many ? "is-selected" : ""}><input type="radio" name="add-mode" checked={!many} onChange={() => { setMany(false); setErrors({}); }}/><span>{h.oneHousehold}</span></label>
        <label className={many ? "is-selected" : ""}><input type="radio" name="add-mode" checked={many} onChange={() => { setMany(true); setErrors({}); }}/><span>{h.pasteList}</span></label>
      </div>
      {many ? <div className="studio-field">
        <label htmlFor="new-guest-list">{h.listLabel}</label>
        <p className="inv-field-hint" id="new-guest-list-hint">{h.listHint}</p>
        <textarea id="new-guest-list" rows={7} value={list} placeholder={"the Patel family, 98250 12345\nKakaji & Kaki\nરમેશભાઈ પટેલ પરિવાર"} onChange={e => edit(setList)(e.target.value)} aria-describedby={errors.list ? "new-guest-list-error new-guest-list-hint" : "new-guest-list-hint"} aria-invalid={errors.list ? true : undefined}/>
        {errors.list && <p className="studio-error" id="new-guest-list-error">{tr(errors.list)}</p>}
      </div> : <>
        <div className="studio-field">
          <label htmlFor="new-guest-name">{h.whoFor}</label>
          <p className="inv-field-hint" id="new-guest-hint">{h.whoForHint}</p>
          <input id="new-guest-name" value={name} maxLength={LIMITS.guestLabel} placeholder={h.householdPlaceholder} onChange={e => edit(setName)(e.target.value)} aria-describedby={errors.name ? "new-guest-error new-guest-hint" : "new-guest-hint"} aria-invalid={errors.name ? true : undefined}/>
          {errors.name && <p className="studio-error" id="new-guest-error">{tr(errors.name)}</p>}
        </div>
        <div className="studio-field">
          <label htmlFor="new-guest-phone">{h.whatsAppNumber} <span>{h.optional}</span></label>
          <input id="new-guest-phone" type="tel" inputMode="tel" autoComplete="off" value={phone} placeholder="98250 12345" onChange={e => edit(setPhone)(e.target.value)} aria-describedby={errors.phone ? "new-guest-phone-error" : undefined} aria-invalid={errors.phone ? true : undefined}/>
          {errors.phone && <p className="studio-error" id="new-guest-phone-error">{tr(errors.phone)}</p>}
        </div>
      </>}
      {schedule.length > 1 && <CelebrationPicker schedule={schedule} value={events} onChange={edit(setEvents)} legend={h.whichCelebrations(many)} error={errors.events}/>}
      {errors.form && !errors.name && !errors.events && !errors.phone && !errors.list && <p className="studio-error" role="alert">{tr(errors.form)}</p>}
      <button type="submit" className="cin-cta cin-cta-light" disabled={busy}>{h.addInvitation(lines, many)}</button>
    </form> : <p className="manage-warn">{h.noRoom(LIMITS.rsvpsPerEvent)}</p>)}
    <p className="share-status" role="status">{status}</p>
    {experience.guests.length > 0 && <p className="manage-guest-summary">{h.openedSummary(experience.guests.filter(g => g.openedAt).length, experience.guests.length, experience.guests.filter(g => rsvps.some(r => r.guestId === g.id)).length)}</p>}
    {experience.guests.length > 0 && <ul className="manage-guests">{[...experience.guests].reverse().map(guest => <GuestRow key={guest.id} owner={owner} origin={origin} guest={guest} experience={experience} reply={rsvps.find(r => r.guestId === guest.id)} onChanged={onChanged}/>)}</ul>}
    {experience.guests.length > 0 && <div className="manage-downloads"><span>{h.download}</span><button type="button" className="share-chip" onClick={() => saveCsv(csvName(experience.title, "invitations"), invitationsCsv({ experience, rsvps }, origin))}>{h.listCsv}</button></div>}
    <p className="manage-limit">{h.planLimit(used, LIMITS.rsvpsPerEvent, experience.guests.length > 0)}</p>
  </>;
}

/** Celebrations on their invitation that they haven't answered for (all of them, if they haven't replied). */
const unansweredBy = (reply: Rsvp | undefined, guest: Guest, schedule: ScheduleItem[]) => sortSchedule(schedule).filter(e => invitedTo(guest.events, e.id) && (!reply || !answerFor(reply, e.id)));

function replyStatus(reply: Rsvp | undefined, unanswered: ScheduleItem[], guest: Guest, h: HostText) {
  // Before a reply, whether they've opened it is what tells the host to wait or to nudge.
  if (!reply) return guest.lastOpenedAt ? { tone: "opened", text: h.openedNoReply(formatShortDay(guest.lastOpenedAt, h.lang)) } : { tone: "waiting", text: h.notOpened };
  const base = reply.attendance === "Attending" ? h.comingPeople(reply.guestCount) : reply.attendance === "Maybe" ? h.maybe : h.cantMakeIt;
  return { tone: reply.attendance.replace(" ", "-").toLowerCase(), text: unanswered.length ? `${base}${h.notAnsweredFor(unanswered.map(e => e.name))}` : base };
}

function GuestRow({ owner, origin, guest, experience, reply, onChanged }: { owner: Owner; origin: string; guest: Guest; experience: Experience; reply?: Rsvp; onChanged: () => Promise<void> }) {
  const h = useHostText();
  const tr = useTranslate();
  const [mode, setMode] = useState<"view" | "edit" | "remove" | "relink">("view");
  const [name, setName] = useState(guest.name);
  const [phone, setPhone] = useState(guest.phone ? showPhone(guest.phone) : "");
  const [events, setEvents] = useState<EventFilter>(guest.events);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const id = useId();
  const schedule = experience.events;
  const url = `${origin}/e/${experience.slug}/${guest.id}`;
  const missing = missingEvents(guest.events, schedule);
  const seesNothing = guest.events !== "all" && schedule.length > 0 && !schedule.some(e => invitedTo(guest.events, e.id));
  const unanswered = seesNothing ? [] : unansweredBy(reply, guest, schedule);
  const status = replyStatus(reply, unanswered, guest, h);
  const words = MESSAGES[experience.language ?? "en"];
  const message = words.personal(guest.name, experience.title, url);
  // A nudge for households that haven't answered (or haven't answered for a celebration added since).
  const reminder = !seesNothing && (!reply || unanswered.length > 0)
    ? words.reminder(guest.name, experience.title, reply ? unanswered.map(e => e.name) : null, url)
    : "";

  async function run(task: () => Promise<unknown>) {
    setBusy(true);
    setErrors({});
    try {
      await task();
      await onChanged();
      setMode("view");
    } catch (failure) {
      setErrors(errorsFrom(failure));
    }
    setBusy(false);
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      countShare(owner, "personal");
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard blocked: show the link so it can be copied by hand.
      setShowUrl(true);
    }
  }

  if (mode === "edit") return <li className="manage-guest is-editing">
    <form onSubmit={event => { event.preventDefault(); void run(() => ownerCall(owner, `/guests/${guest.id}`, "PATCH", { name, events, phone })); }}>
      <div className="studio-field">
        <label htmlFor={`${id}-name`}>{h.whoFor}</label>
        <input id={`${id}-name`} value={name} maxLength={LIMITS.guestLabel} onChange={e => setName(e.target.value)} aria-invalid={errors.name ? true : undefined} aria-describedby={errors.name ? `${id}-error` : undefined}/>
        {errors.name && <p className="studio-error" id={`${id}-error`}>{tr(errors.name)}</p>}
      </div>
      <div className="studio-field">
        <label htmlFor={`${id}-phone`}>{h.whatsAppNumber} <span>{h.optional}</span></label>
        <input id={`${id}-phone`} type="tel" inputMode="tel" autoComplete="off" value={phone} placeholder="98250 12345" onChange={e => setPhone(e.target.value)} aria-invalid={errors.phone ? true : undefined} aria-describedby={errors.phone ? `${id}-phone-error` : undefined}/>
        {errors.phone && <p className="studio-error" id={`${id}-phone-error`}>{tr(errors.phone)}</p>}
      </div>
      {schedule.length > 1 && <CelebrationPicker schedule={schedule} value={events} onChange={setEvents} legend={h.whichCelebrations(false)} error={errors.events}/>}
      {errors.form && !errors.name && !errors.events && !errors.phone && <p className="studio-error" role="alert">{tr(errors.form)}</p>}
      <div className="manage-guest-buttons"><button type="submit" className="cin-cta cin-cta-light" disabled={busy}>{h.save}</button><button type="button" className="share-chip" onClick={() => { setMode("view"); setName(guest.name); setPhone(guest.phone ? showPhone(guest.phone) : ""); setEvents(guest.events); setErrors({}); }}>{h.cancel}</button></div>
    </form>
  </li>;

  return <li className="manage-guest">
    <div className="manage-guest-head">
      <h3>{guest.name}</h3>
      <span className={`manage-guest-status is-${status.tone}`}>{status.text}</span>
    </div>
    {(schedule.length > 1 || guest.phone) && <p className="manage-guest-events">{[schedule.length > 1 && celebrationsLabel(guest.events, schedule, h), guest.phone && showPhone(guest.phone)].filter(Boolean).join(" · ")}</p>}
    {(missing.length > 0 || seesNothing) && <p className="manage-warn">{seesNothing ? h.seesNothing : h.someMissing}</p>}
    {mode === "remove" ? <div className="manage-confirm" role="group" aria-label={h.removeGroup(guest.name)}>
      <p>{h.removeConfirm(!!reply)}</p>
      <button type="button" className="cin-cta cin-cta-outline" disabled={busy} onClick={() => void run(() => ownerCall(owner, `/guests/${guest.id}`, "DELETE"))}>{h.remove}</button>
      <button type="button" className="share-chip" onClick={() => setMode("view")}>{h.keepIt}</button>
    </div> : mode === "relink" ? <div className="manage-confirm" role="group" aria-label={h.relinkGroup(guest.name)}>
      <p>{h.relinkConfirm(!!reply)}</p>
      <button type="button" className="cin-cta cin-cta-outline" disabled={busy} onClick={() => void run(() => ownerCall(owner, `/guests/${guest.id}`, "PATCH", { newLink: true }))}>{h.makeNewLink}</button>
      <button type="button" className="share-chip" onClick={() => setMode("view")}>{h.cancel}</button>
    </div> : <div className="manage-guest-actions">
      {!experience.removed && <>
      <button type="button" className="share-chip" onClick={() => void copy()} aria-label={h.copyLinkFor(guest.name)}>{copied ? h.copied : h.copyLink}</button>
      <a className="share-chip" href={whatsApp(message, guest.phone)} target="_blank" rel="noreferrer" aria-label={h.sendOnWhatsApp(guest.name)} onClick={() => countShare(owner, "personal")}>{h.whatsApp}</a>
      {reminder && <a className="share-chip" href={whatsApp(reminder, guest.phone)} target="_blank" rel="noreferrer" aria-label={h.remindOnWhatsApp(guest.name)} onClick={() => countShare(owner, "personal")}>{h.remind}</a>}
      <a className="share-chip" href={`/e/${experience.slug}/${guest.id}?preview=1`} target="_blank" rel="noreferrer" aria-label={h.previewFor(guest.name)}>{h.preview}</a>
      </>}
      <button type="button" className="share-chip" onClick={() => setMode("edit")} aria-label={h.editFor(guest.name)}>{h.edit}</button>
      {!experience.removed && <button type="button" className="share-chip" onClick={() => setMode("relink")} aria-label={h.newLinkFor(guest.name)}>{h.newLink}</button>}
      <button type="button" className="share-chip" onClick={() => setMode("remove")} aria-label={h.removeFor(guest.name)}>{h.remove}</button>
    </div>}
    {showUrl && <div className="share-url"><label className="studio-sr-only" htmlFor={`${id}-url`}>{h.linkFor(guest.name)}</label><input id={`${id}-url`} readOnly value={url} autoFocus onFocus={e => e.currentTarget.select()}/></div>}
    {errors.form && <p className="studio-error" role="alert">{tr(errors.form)}</p>}
  </li>;
}

/** Guests' wishes: all of them for the host, and a choice of which (if any) the invitation shows. */
export function WishesCard({ owner, experience, rsvps, onChanged }: { owner: Owner; experience: Experience; rsvps: Rsvp[]; onChanged: () => Promise<void> }) {
  const h = useHostText();
  const tr = useTranslate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // The switch moves as soon as it's pressed, and moves back if saving fails.
  const [show, setShow] = useState(experience.showWishes);
  useEffect(() => setShow(experience.showWishes), [experience.showWishes]);
  const withWishes = rsvps.filter(r => r.wish);
  const household = (id?: string) => experience.guests.find(g => g.id === id)?.name;

  async function run(task: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await task();
      await onChanged();
    } catch (failure) {
      setError((failure as Error).message);
    }
    setBusy(false);
  }

  return <>
    <label className="manage-wishes-toggle">
      <input type="checkbox" checked={show} disabled={busy} onChange={e => {
        const next = e.target.checked;
        setShow(next);
        void run(() => ownerCall(owner, "", "PATCH", { showWishes: next }).catch(failure => { setShow(!next); throw failure; }));
      }}/>
      {h.showWishes}
    </label>
    <p className="manage-muted">{h.wishesNote(show)}</p>
    {error && <p className="studio-error" role="alert">{tr(error)}</p>}
    {withWishes.length ? <ul className="manage-wishes">{withWishes.map(r => {
      const from = [r.name, household(r.guestId) && h.forHousehold(household(r.guestId)!)].filter(Boolean).join(" ") || h.noName;
      return <li key={r.id} className={`manage-wish${r.wishHidden ? " is-hidden" : ""}`}>
        <blockquote>{r.wish}</blockquote>
        <div className="manage-wish-meta">
          <span>— {from}</span>
          {r.wishHidden && <span className="manage-wish-hidden">{h.wishHidden}</span>}
          <button type="button" className="share-chip" disabled={busy} onClick={() => void run(() => ownerCall(owner, `/rsvps/${r.id}`, "PATCH", { hidden: !r.wishHidden }))} aria-label={h.wishToggleLabel(!!r.wishHidden, from)}>{r.wishHidden ? h.showWish : h.hideWish}</button>
        </div>
      </li>;
    })}</ul> : <p className="manage-muted">{h.noWishes}</p>}
  </>;
}
