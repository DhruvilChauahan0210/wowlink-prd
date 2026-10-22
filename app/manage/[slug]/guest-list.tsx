"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { LIMITS, formatEventDay, formatShortDay, sortSchedule, type ScheduleItem } from "../../lib/invitations";
import { answerFor, invitedTo, missingEvents, repliesUsed, tallyByEvent, type EventFilter, type Guest } from "../../lib/guests";
import { csvName, invitationsCsv } from "../../lib/export";
import { MESSAGES } from "../../lib/i18n";
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

/** "+91 98250 12345" for an Indian mobile, "+447700900123" otherwise. */
export const showPhone = (phone: string) => (/^91\d{10}$/.test(phone) ? `+91 ${phone.slice(2, 7)} ${phone.slice(7)}` : `+${phone}`);
/** A WhatsApp message link: straight to their chat when there's a number, otherwise WhatsApp asks who to send it to. */
const whatsApp = (text: string, phone?: string) => `https://wa.me/${phone ?? ""}?text=${encodeURIComponent(text)}`;
const listOf = (names: string[]) => (names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`);

/** Hand a spreadsheet to the browser as a download. */
export function saveCsv(fileName: string, csv: string) {
  const link = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })), download: fileName });
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

/** "Every celebration", or the chosen ones by name. */
export function celebrationsLabel(filter: EventFilter, schedule: ScheduleItem[]) {
  if (filter === "all") return "Every celebration";
  const names = sortSchedule(schedule).filter(e => filter.includes(e.id)).map(e => e.name);
  return names.length ? names.join(" · ") : "No celebrations yet";
}

/** Every celebration (including any added later), or only the ticked ones. */
export function CelebrationPicker({ schedule, value, onChange, legend, error }: { schedule: ScheduleItem[]; value: EventFilter; onChange: (next: EventFilter) => void; legend: string; error?: string }) {
  const id = useId();
  const sorted = sortSchedule(schedule);
  const some = value !== "all";
  return <fieldset className="manage-picker" aria-describedby={error ? `${id}-error` : undefined}>
    <legend>{legend}</legend>
    <div className="manage-picker-modes">
      <label className={!some ? "is-selected" : ""}><input type="radio" name={`${id}-mode`} checked={!some} onChange={() => onChange("all")}/><span>Every celebration</span></label>
      <label className={some ? "is-selected" : ""}><input type="radio" name={`${id}-mode`} checked={some} onChange={() => onChange(sorted.map(e => e.id))}/><span>Only some</span></label>
    </div>
    {!some && <p className="manage-muted manage-picker-note">Including any you add to the schedule later.</p>}
    {some && <ul className="manage-picker-list">{sorted.map(item => {
      const on = value.includes(item.id);
      return <li key={item.id}><label className={on ? "is-ticked" : ""}>
        <input type="checkbox" checked={on} onChange={() => onChange(on ? value.filter(x => x !== item.id) : [...value, item.id])}/>
        <span>{item.name}</span> <small>{formatEventDay(item.date)}</small>
      </label></li>;
    })}</ul>}
    {error && <p className="studio-error" id={`${id}-error`}>{error}</p>}
  </fieldset>;
}

/** What the general link (the one shared in groups) shows. */
export function GeneralLinkAudience({ owner, experience, onSaved }: { owner: Owner; experience: Experience; onSaved: () => Promise<void> }) {
  const [value, setValue] = useState<EventFilter>(experience.publicEvents);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const missing = missingEvents(experience.publicEvents, experience.events);
  const changed = JSON.stringify(value) !== JSON.stringify(experience.publicEvents);

  async function save() {
    if (value !== "all" && !value.length) return setError("Pick at least one celebration for the general link.");
    setBusy(true);
    setError("");
    try {
      await ownerCall(owner, "", "PATCH", { publicEvents: value });
      await onSaved();
      setMessage("Saved. The general link shows this now.");
    } catch (failure) {
      setError((failure as Error).message);
    }
    setBusy(false);
  }

  return <div className="manage-audience">
    <CelebrationPicker schedule={experience.events} value={value} onChange={next => { setValue(next); setMessage(""); setError(""); }} legend="The general link shows" error={error}/>
    {missing.length > 0 && <p className="manage-warn">{missing.length === 1 ? "One celebration it showed was" : `${missing.length} celebrations it showed were`} removed from the schedule. Check what it shows.</p>}
    <div className="manage-audience-actions">
      {changed && <button type="button" className="cin-cta cin-cta-light" disabled={busy} onClick={() => void save()}>Save</button>}
      <span className="share-status" role="status">{message}</span>
    </div>
  </div>;
}

/** The numbers a caterer needs: for each celebration, who's coming, who might, who can't, and who hasn't said. */
export function Headcount({ experience, rsvps }: { experience: Experience; rsvps: Rsvp[] }) {
  const rows = tallyByEvent(experience.events, rsvps, experience.guests);
  const replies = (n: number) => `${n} ${n === 1 ? "reply" : "replies"}`;
  return <div className="manage-table-wrap"><table className="manage-table manage-headcount">
    <caption className="manage-caption">Headcount by celebration</caption>
    <thead><tr><th scope="col">Celebration</th><th scope="col">Coming</th><th scope="col">Maybe</th><th scope="col">Can’t make it</th>{experience.guests.length > 0 && <th scope="col">Yet to reply</th>}</tr></thead>
    <tbody>{rows.map(row => <tr key={row.event.id}>
      <th scope="row"><span className="manage-headcount-name">{row.event.name}</span><span className="manage-muted">{formatEventDay(row.event.date)}</span></th>
      <td><b className="manage-big">{row.coming}</b> {row.coming === 1 ? "person" : "people"}<span className="manage-muted">{replies(row.comingReplies)}</span></td>
      <td>{row.maybeReplies ? <>{row.maybe} {row.maybe === 1 ? "person" : "people"}<span className="manage-muted">{replies(row.maybeReplies)}</span></> : "–"}</td>
      <td>{row.cant ? replies(row.cant) : "–"}</td>
      {experience.guests.length > 0 && <td>{row.waiting ? `${row.waiting} ${row.waiting === 1 ? "invitation" : "invitations"}` : "–"}</td>}
    </tr>)}</tbody>
  </table></div>;
}

/** Personal invitations: add one, then copy or send its link. */
export function GuestList({ owner, origin, experience, rsvps, onChanged }: { owner: Owner; origin: string; experience: Experience; rsvps: Rsvp[]; onChanged: () => Promise<void> }) {
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
        setStatus(`Added ${guests.length} ${guests.length === 1 ? "invitation" : "invitations"}.${skipped.length ? ` ${listOf(skipped)} ${skipped.length === 1 ? "was" : "were"} already on your list.` : ""}`);
        setList("");
      } else {
        await ownerCall(owner, "/guests", "POST", { name, events, phone });
        await onChanged();
        setStatus(`Added ${name.trim()}. Copy their link or send it on WhatsApp.`);
        setName("");
        setPhone("");
      }
      setEvents("all");
    } catch (failure) {
      setErrors(errorsFrom(failure));
    }
    setBusy(false);
  }

  return <>
    <p className="manage-muted">Send each household its own link. It opens with their name on it{schedule.length > 1 ? " and shows only the celebrations you pick for them" : ""}, and you’ll see who hasn’t replied yet.</p>
    {!full ? <form className="manage-guest-add" onSubmit={add}>
      <div className="manage-picker-modes manage-add-modes" role="radiogroup" aria-label="How to add">
        <label className={!many ? "is-selected" : ""}><input type="radio" name="add-mode" checked={!many} onChange={() => { setMany(false); setErrors({}); }}/><span>One household</span></label>
        <label className={many ? "is-selected" : ""}><input type="radio" name="add-mode" checked={many} onChange={() => { setMany(true); setErrors({}); }}/><span>Paste a list</span></label>
      </div>
      {many ? <div className="studio-field">
        <label htmlFor="new-guest-list">Households, one per line</label>
        <p className="inv-field-hint" id="new-guest-list-hint">Put a WhatsApp number after a name to send their link straight to their chat, like “the Patel family, 98250 12345”. Anyone already on your list is skipped.</p>
        <textarea id="new-guest-list" rows={7} value={list} placeholder={"the Patel family, 98250 12345\nKakaji & Kaki\nરમેશભાઈ પટેલ પરિવાર"} onChange={e => edit(setList)(e.target.value)} aria-describedby={errors.list ? "new-guest-list-error new-guest-list-hint" : "new-guest-list-hint"} aria-invalid={errors.list ? true : undefined}/>
        {errors.list && <p className="studio-error" id="new-guest-list-error">{errors.list}</p>}
      </div> : <>
        <div className="studio-field">
          <label htmlFor="new-guest-name">Who’s it for?</label>
          <p className="inv-field-hint" id="new-guest-hint">Write it as you’d address the envelope, like “the Patel family”.</p>
          <input id="new-guest-name" value={name} maxLength={LIMITS.guestLabel} placeholder="the Patel family" onChange={e => edit(setName)(e.target.value)} aria-describedby={errors.name ? "new-guest-error new-guest-hint" : "new-guest-hint"} aria-invalid={errors.name ? true : undefined}/>
          {errors.name && <p className="studio-error" id="new-guest-error">{errors.name}</p>}
        </div>
        <div className="studio-field">
          <label htmlFor="new-guest-phone">WhatsApp number <span>Optional</span></label>
          <input id="new-guest-phone" type="tel" inputMode="tel" autoComplete="off" value={phone} placeholder="98250 12345" onChange={e => edit(setPhone)(e.target.value)} aria-describedby={errors.phone ? "new-guest-phone-error" : undefined} aria-invalid={errors.phone ? true : undefined}/>
          {errors.phone && <p className="studio-error" id="new-guest-phone-error">{errors.phone}</p>}
        </div>
      </>}
      {schedule.length > 1 && <CelebrationPicker schedule={schedule} value={events} onChange={edit(setEvents)} legend={many ? "Which celebrations, for everyone on this list?" : "Which celebrations?"} error={errors.events}/>}
      {errors.form && !errors.name && !errors.events && !errors.phone && !errors.list && <p className="studio-error" role="alert">{errors.form}</p>}
      <button type="submit" className="cin-cta cin-cta-light" disabled={busy}>{!many ? "Add invitation" : lines ? `Add ${lines} ${lines === 1 ? "invitation" : "invitations"}` : "Add invitations"}</button>
    </form> : <p className="manage-warn">All {LIMITS.rsvpsPerEvent} replies on the free plan are in use, so there’s no room for another personal invitation.</p>}
    <p className="share-status" role="status">{status}</p>
    {experience.guests.length > 0 && <p className="manage-guest-summary">{experience.guests.filter(g => g.openedAt).length} of {experience.guests.length} opened · {experience.guests.filter(g => rsvps.some(r => r.guestId === g.id)).length} replied</p>}
    {experience.guests.length > 0 && <ul className="manage-guests">{[...experience.guests].reverse().map(guest => <GuestRow key={guest.id} owner={owner} origin={origin} guest={guest} experience={experience} reply={rsvps.find(r => r.guestId === guest.id)} onChanged={onChanged}/>)}</ul>}
    {experience.guests.length > 0 && <div className="manage-downloads"><span>Download</span><button type="button" className="share-chip" onClick={() => saveCsv(csvName(experience.title, "invitations"), invitationsCsv({ experience, rsvps }, origin))}>The list, with links (CSV)</button></div>}
    <p className="manage-limit">{used} of {LIMITS.rsvpsPerEvent} replies on the free plan{experience.guests.length ? ", counting one kept for each personal invitation" : ""}.</p>
  </>;
}

/** Celebrations on their invitation that they haven't answered for (all of them, if they haven't replied). */
const unansweredBy = (reply: Rsvp | undefined, guest: Guest, schedule: ScheduleItem[]) => sortSchedule(schedule).filter(e => invitedTo(guest.events, e.id) && (!reply || !answerFor(reply, e.id)));

function replyStatus(reply: Rsvp | undefined, unanswered: ScheduleItem[], guest: Guest) {
  // Before a reply, whether they've opened it is what tells the host to wait or to nudge.
  if (!reply) return guest.lastOpenedAt ? { tone: "opened", text: `Opened ${formatShortDay(guest.lastOpenedAt)} · no reply yet` } : { tone: "waiting", text: "Not opened yet" };
  const base = reply.attendance === "Attending" ? `Coming · ${reply.guestCount} ${reply.guestCount === 1 ? "person" : "people"}` : reply.attendance === "Maybe" ? "Maybe" : "Can’t make it";
  return { tone: reply.attendance.replace(" ", "-").toLowerCase(), text: unanswered.length ? `${base} · not yet answered for the ${listOf(unanswered.map(e => e.name))}` : base };
}

function GuestRow({ owner, origin, guest, experience, reply, onChanged }: { owner: Owner; origin: string; guest: Guest; experience: Experience; reply?: Rsvp; onChanged: () => Promise<void> }) {
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
  const status = replyStatus(reply, unanswered, guest);
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
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard blocked: show the link so it can be copied by hand.
      setShowUrl(true);
    }
  }

  if (mode === "edit") return <li className="manage-guest is-editing">
    <form onSubmit={event => { event.preventDefault(); void run(() => ownerCall(owner, `/guests/${guest.id}`, "PATCH", { name, events, phone })); }}>
      <div className="studio-field">
        <label htmlFor={`${id}-name`}>Who’s it for?</label>
        <input id={`${id}-name`} value={name} maxLength={LIMITS.guestLabel} onChange={e => setName(e.target.value)} aria-invalid={errors.name ? true : undefined} aria-describedby={errors.name ? `${id}-error` : undefined}/>
        {errors.name && <p className="studio-error" id={`${id}-error`}>{errors.name}</p>}
      </div>
      <div className="studio-field">
        <label htmlFor={`${id}-phone`}>WhatsApp number <span>Optional</span></label>
        <input id={`${id}-phone`} type="tel" inputMode="tel" autoComplete="off" value={phone} placeholder="98250 12345" onChange={e => setPhone(e.target.value)} aria-invalid={errors.phone ? true : undefined} aria-describedby={errors.phone ? `${id}-phone-error` : undefined}/>
        {errors.phone && <p className="studio-error" id={`${id}-phone-error`}>{errors.phone}</p>}
      </div>
      {schedule.length > 1 && <CelebrationPicker schedule={schedule} value={events} onChange={setEvents} legend="Which celebrations?" error={errors.events}/>}
      {errors.form && !errors.name && !errors.events && !errors.phone && <p className="studio-error" role="alert">{errors.form}</p>}
      <div className="manage-guest-buttons"><button type="submit" className="cin-cta cin-cta-light" disabled={busy}>Save</button><button type="button" className="share-chip" onClick={() => { setMode("view"); setName(guest.name); setPhone(guest.phone ? showPhone(guest.phone) : ""); setEvents(guest.events); setErrors({}); }}>Cancel</button></div>
    </form>
  </li>;

  return <li className="manage-guest">
    <div className="manage-guest-head">
      <h3>{guest.name}</h3>
      <span className={`manage-guest-status is-${status.tone}`}>{status.text}</span>
    </div>
    {(schedule.length > 1 || guest.phone) && <p className="manage-guest-events">{[schedule.length > 1 && celebrationsLabel(guest.events, schedule), guest.phone && showPhone(guest.phone)].filter(Boolean).join(" · ")}</p>}
    {(missing.length > 0 || seesNothing) && <p className="manage-warn">{seesNothing ? "Every celebration picked for them was removed from the schedule, so their link says “details to follow”. Edit to pick again." : "A celebration picked for them was removed from the schedule. Edit to check theirs."}</p>}
    {mode === "remove" ? <div className="manage-confirm" role="group" aria-label={`Remove ${guest.name}`}>
      <p>Remove this invitation? Their link stops working{reply ? " and their reply is removed from your counts" : ""}.</p>
      <button type="button" className="cin-cta cin-cta-outline" disabled={busy} onClick={() => void run(() => ownerCall(owner, `/guests/${guest.id}`, "DELETE"))}>Remove</button>
      <button type="button" className="share-chip" onClick={() => setMode("view")}>Keep it</button>
    </div> : mode === "relink" ? <div className="manage-confirm" role="group" aria-label={`New link for ${guest.name}`}>
      <p>Make a new link? The old one stops working. Use this if their link was forwarded further than you meant. {reply ? "Their reply moves to the new link." : ""}</p>
      <button type="button" className="cin-cta cin-cta-outline" disabled={busy} onClick={() => void run(() => ownerCall(owner, `/guests/${guest.id}`, "PATCH", { newLink: true }))}>Make a new link</button>
      <button type="button" className="share-chip" onClick={() => setMode("view")}>Cancel</button>
    </div> : <div className="manage-guest-actions">
      <button type="button" className="share-chip" onClick={() => void copy()} aria-label={`Copy link for ${guest.name}`}>{copied ? "Copied!" : "Copy link"}</button>
      <a className="share-chip" href={whatsApp(message, guest.phone)} target="_blank" rel="noreferrer" aria-label={`Send ${guest.name} their link on WhatsApp`}>WhatsApp</a>
      {reminder && <a className="share-chip" href={whatsApp(reminder, guest.phone)} target="_blank" rel="noreferrer" aria-label={`Remind ${guest.name} on WhatsApp`}>Remind</a>}
      <a className="share-chip" href={`/e/${experience.slug}/${guest.id}?preview=1`} target="_blank" rel="noreferrer" aria-label={`Preview the invitation for ${guest.name}`}>Preview</a>
      <button type="button" className="share-chip" onClick={() => setMode("edit")} aria-label={`Edit the invitation for ${guest.name}`}>Edit</button>
      <button type="button" className="share-chip" onClick={() => setMode("relink")} aria-label={`Make a new link for ${guest.name}`}>New link</button>
      <button type="button" className="share-chip" onClick={() => setMode("remove")} aria-label={`Remove the invitation for ${guest.name}`}>Remove</button>
    </div>}
    {showUrl && <div className="share-url"><label className="studio-sr-only" htmlFor={`${id}-url`}>Link for {guest.name}</label><input id={`${id}-url`} readOnly value={url} autoFocus onFocus={e => e.currentTarget.select()}/></div>}
    {errors.form && <p className="studio-error" role="alert">{errors.form}</p>}
  </li>;
}

/** Guests' wishes: all of them for the host, and a choice of which (if any) the invitation shows. */
export function WishesCard({ owner, experience, rsvps, onChanged }: { owner: Owner; experience: Experience; rsvps: Rsvp[]; onChanged: () => Promise<void> }) {
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
      Show them on the invitation
    </label>
    <p className="manage-muted">{show ? "Guests see the latest 30 as notes under the reply form, with the name each writer typed. Hide any you’d rather keep to yourself." : "Only you can see them. Guests are told so when they write one."}</p>
    {error && <p className="studio-error" role="alert">{error}</p>}
    {withWishes.length ? <ul className="manage-wishes">{withWishes.map(r => {
      const from = [r.name, household(r.guestId) && `for ${household(r.guestId)}`].filter(Boolean).join(" ") || "No name given";
      return <li key={r.id} className={`manage-wish${r.wishHidden ? " is-hidden" : ""}`}>
        <blockquote>{r.wish}</blockquote>
        <div className="manage-wish-meta">
          <span>— {from}</span>
          {r.wishHidden && <span className="manage-wish-hidden">Hidden from the invitation</span>}
          <button type="button" className="share-chip" disabled={busy} onClick={() => void run(() => ownerCall(owner, `/rsvps/${r.id}`, "PATCH", { hidden: !r.wishHidden }))} aria-label={`${r.wishHidden ? "Show" : "Hide"} the wish from ${from}${r.wishHidden ? " on" : " from"} the invitation`}>{r.wishHidden ? "Show on the invitation" : "Hide from the invitation"}</button>
        </div>
      </li>;
    })}</ul> : <p className="manage-muted">No wishes yet. Guests can leave one when they reply.</p>}
  </>;
}
