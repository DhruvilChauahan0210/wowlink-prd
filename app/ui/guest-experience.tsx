"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { ATTENDANCE, LIMITS, formatEventDay, formatInvitationDate, formatInvitationTime, sortSchedule, type Attendance, type InvitationTemplate, type ScheduleItem } from "../lib/invitations";
import { calendarEvents, daysUntil, eventStartMs, googleCalendarUrl, toIcs } from "../lib/calendar";
import { answerFor, type AudienceView, type ByEvent } from "../lib/guests";
import { MomentMark, WowLinkBrand } from "./brand";
import { Bowl, Diya, Flower, Leaf, Note, Ring, Star } from "./doodles";
import { InvitationScene } from "./invitation-scene";

type Reply = { name: string; attendance: Attendance; guestCount: number; byEvent?: ByEvent; at?: string };

type Props = {
  template: InvitationTemplate;
  /** The invitation as this link shows it (a personal link only has that household's celebrations). */
  draft: AudienceView;
  /** template: browsing a sample · draft: the creator previewing their own · live: a guest on a published link */
  mode: "template" | "draft" | "live";
  slug?: string;
  /** Set on a personal link: who it's for. */
  guest?: { id: string; name: string };
  /** A personal link's reply so far, if the household has replied. */
  reply?: Reply | null;
  /** A host checking a personal link: everything as the guest sees it, but replies aren't sent. */
  previewOnly?: boolean;
};

const smooth = () => (matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth") as ScrollBehavior;
const REPLY_TITLE: Record<Attendance, string> = { Attending: "Joyfully, yes.", Maybe: "A little maybe.", "Not attending": "With you in spirit." };
const maps = (place: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`;
const people = (n: number) => `${n} ${n === 1 ? "person" : "people"}`;

/** "Mehndi", "Mehndi and Sangeet", "Mehndi, Sangeet and Reception" */
const listOf = (names: string[]) => (names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`);

/** One line on what a reply said, e.g. "Coming to the Sangeet and Reception · 4 people". */
function describeReply(attendance: Attendance, chosen: ScheduleItem[], shown: number, countFor: (id: string) => number, party: number) {
  if (attendance === "Not attending") return "Can’t make it this time.";
  const counts = chosen.map(e => countFor(e.id));
  const same = counts.every(n => n === counts[0]);
  const names = shown > 1 && chosen.length ? listOf(chosen.map((e, i) => (same ? e.name : `${e.name} (${counts[i]})`))) : "";
  const size = same ? ` · ${people(chosen.length ? counts[0] : party)}` : "";
  if (attendance === "Maybe") return names ? `A maybe for the ${names}${size}.` : `A maybe${size}.`;
  return names ? `Coming to the ${names}${size}.` : `Coming${size}.`;
}

/** A little drawing that fits each kind of event. */
function EventDoodle({ name }: { name: string }) {
  const n = name.toLowerCase();
  if (/mehndi|mehendi|henna/.test(n)) return <Leaf className="doodle"/>;
  if (/haldi|pithi|turmeric/.test(n)) return <Bowl className="doodle"/>;
  if (/sangeet|garba|dandiya|raas|music|dance/.test(n)) return <Note className="doodle"/>;
  if (/engage|sagai|ring|roka/.test(n)) return <Ring className="doodle"/>;
  if (/puja|pooja|ganesh|havan/.test(n)) return <Diya className="doodle"/>;
  if (/wedding|lagna|lagan|vivah|phera|ceremony|shaadi/.test(n)) return <MomentMark className="doodle"/>;
  if (/reception|dinner|party|cocktail/.test(n)) return <Star className="doodle"/>;
  return <Flower className="doodle"/>;
}

const hasDate = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date);

/**
 * "17 days to go", worked out on India's calendar. Rendered only in the browser so it never disagrees with the server.
 * Once the main day has passed it counts to the next celebration still to come ("Tomorrow: the Reception!").
 */
function Countdown({ date, time, events }: { date: string; time: string; events: ScheduleItem[] }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const tick = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(tick);
  }, []);
  if (now === null || !hasDate(date)) return null;
  let target = { date, time, name: "" };
  if (daysUntil(date, now) < 0) {
    const next = events.find(e => hasDate(e.date) && daysUntil(e.date, now) >= 0);
    if (next) target = next;
  }
  const what = target.name ? `the ${target.name}` : "";
  const days = daysUntil(target.date, now);
  const start = eventStartMs(target.date, target.time);
  let count: number | null = null;
  let label: string;
  if (days > 1) {
    count = days;
    label = what ? `days to ${what}` : "days to go";
  } else if (days === 1) label = what ? `Tomorrow: ${what}!` : "Tomorrow!";
  else if (days === 0) {
    const hours = Math.ceil((start - now) / 3_600_000);
    const today = what ? `Today: ${what}` : "Today";
    label = target.time && hours > 0 ? (hours === 1 ? `${today}, within the hour!` : `${today}, in ${hours} hours`) : target.time ? (what ? `Happening now: ${what}!` : "Happening now!") : what ? `${today}!` : "It’s today!";
  } else label = "This day has passed. Thank you for being part of it.";
  return <p className="inv-countdown">{count !== null && <span className="inv-countdown-n">{count}</span>}<span>{label}</span></p>;
}

/** Everything a guest sees: the opening, the details, the message and the RSVP. */
export function GuestExperience({ template, draft, mode, slug, guest, reply, previewOnly = false }: Props) {
  const live = mode === "live";
  const sends = live && !previewOnly;
  const earlier = sends ? reply ?? null : null;
  const schedule = sortSchedule(draft.events);
  const allIds = schedule.map(e => e.id);
  const [opened, setOpened] = useState(false);

  // The form, seeded from the household's reply when there is one. It keeps its values between sends.
  const [attendance, setAttendance] = useState<Attendance>(earlier?.attendance ?? "Attending");
  const [ticked, setTicked] = useState<string[]>(() => {
    if (!earlier || earlier.attendance === "Not attending") return allIds;
    // What they said yes (or maybe) to, plus anything added since that they haven't answered yet.
    const picked = allIds.filter(id => answerFor(earlier, id)?.attendance !== "Not attending");
    return picked.length ? picked : allIds;
  });
  const [count, setCount] = useState(String(earlier?.guestCount || 1));
  const [counts, setCounts] = useState<Record<string, string>>(() => Object.fromEntries(Object.entries(earlier?.byEvent ?? {}).filter(([, a]) => a.guestCount > 0).map(([id, a]) => [id, String(a.guestCount)])));
  const [perEvent, setPerEvent] = useState(() => new Set(Object.values(counts)).size > 1);
  const [name, setName] = useState(earlier?.name ?? "");
  // "done" shows the reply. A household that has already replied starts there, so a relative opening a forwarded
  // link sees the family's reply before changing it.
  const [state, setState] = useState<"idle" | "sending" | "done">(earlier ? "done" : "idle");
  const [justSent, setJustSent] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [replied, setReplied] = useState(!!earlier);
  const [sentAt, setSentAt] = useState(earlier?.at);
  const [error, setError] = useState("");
  const [whichError, setWhichError] = useState("");
  const [pageUrl, setPageUrl] = useState<string | undefined>();
  const whichRef = useRef<HTMLFieldSetElement>(null);
  const attendanceRef = useRef<HTMLFieldSetElement>(null);
  const focusForm = useRef(false);
  useEffect(() => { if (live) setPageUrl(location.origin + location.pathname); }, [live]);
  useEffect(() => {
    if (state !== "idle" || !focusForm.current) return;
    focusForm.current = false;
    attendanceRef.current?.querySelector<HTMLInputElement>("input:checked")?.focus();
  }, [state]);

  // Calendar files come from this link's own route, so a personal link's only hold their celebrations.
  const base = live && slug ? (guest ? `/e/${slug}/${guest.id}` : `/e/${slug}`) : null;
  const mainItem = draft.mainEventId ? schedule.find(e => e.id === draft.mainEventId) : undefined;
  const mainEntry = mainItem ? { title: `${mainItem.name} · ${draft.title}`, date: draft.date, time: draft.time, venue: draft.venue, message: draft.message, url: pageUrl } : { ...draft, url: pageUrl };
  // With one celebration in view, "Save the date" already says it all.
  const showSchedule = schedule.length > 1 || (schedule.length === 1 && !mainItem);

  const askWhich = attendance !== "Not attending" && schedule.length > 1;
  const chosen = askWhich ? schedule.filter(e => ticked.includes(e.id)) : attendance === "Not attending" ? [] : schedule;
  const splitCounts = perEvent && askWhich && chosen.length > 1;
  const party = Math.min(LIMITS.guests, Math.max(1, Number(count) || 1));
  const countFor = (id: string) => (splitCounts ? Math.min(LIMITS.guests, Math.max(1, Number(counts[id] ?? count) || 1)) : party);
  // Celebrations added to their invitation since the household replied.
  const fresh = earlier?.byEvent && !justSent ? schedule.filter(e => !Object.hasOwn(earlier.byEvent!, e.id)) : [];

  // Previews have no server route for the calendar file, so build it here and hand it over as a download.
  function downloadIcs(events: Parameters<typeof toIcs>[0]) {
    const blob = new Blob([toIcs(events)], { type: "text/calendar;charset=utf-8" });
    const link = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "invitation.ics" });
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (askWhich && !chosen.length) {
      setWhichError("Tick at least one celebration, or choose Not attending.");
      whichRef.current?.querySelector("input")?.focus();
      return;
    }
    if (!sends || !slug) {
      setJustSent(true);
      return setState("done");
    }
    const form = new FormData(event.currentTarget);
    setState("sending");
    try {
      const response = await fetch(`/api/experiences/${slug}/rsvps`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          attendance,
          name,
          guestCount: splitCounts ? Math.max(...chosen.map(e => countFor(e.id))) : party,
          events: chosen.map(e => e.id),
          shown: allIds,
          ...(splitCounts && { counts: Object.fromEntries(chosen.map(e => [e.id, countFor(e.id)])) }),
          guest: guest?.id,
          website: form.get("website"),
        }),
      });
      const result = (await response.json().catch(() => null)) as { error?: string; updated?: boolean } | null;
      if (!response.ok) throw new Error(result?.error ?? "");
      setUpdated(!!result?.updated);
      setReplied(!!guest);
      setSentAt(new Date().toISOString());
      setJustSent(true);
      setState("done");
    } catch (failure) {
      setError((failure as Error).message || "Your reply didn’t go through. Check your connection and try again.");
      setState("idle");
    }
  }

  function replyAgain() {
    // A personal link changes the household's one reply; the general link starts a fresh one for someone else.
    if (sends && !guest) {
      setName("");
      setCount("1");
      setCounts({});
      setPerEvent(false);
    }
    setJustSent(false);
    focusForm.current = true;
    setState("idle");
  }

  const toggle = (id: string) => {
    setTicked(now => (now.includes(id) ? now.filter(x => x !== id) : [...now, id]));
    setWhichError("");
  };
  const countLabel = attendance === "Maybe" ? "How many of you might come?" : guest ? "How many of you are coming, in all?" : schedule.length > 1 ? "How many of you are coming?" : "How many guests?";
  // India time on both server and browser, so the first render matches wherever either one is.
  const sentOn = sentAt ? new Date(sentAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" }) : "";

  return <div className="cinema invitation-page">
    <header className="invitation-header theme-paper">
      <WowLinkBrand/>
      {!live && <span className="invitation-context">{mode === "draft" ? "Draft preview" : "Template preview"}<i aria-hidden="true">·</i>{template.category}</span>}
      {previewOnly && <span className="invitation-context">Host preview</span>}
      <Link className="cin-cta cin-cta-outline" href={`/create?template=${template.id}`}>{mode === "draft" ? "Back to editor" : live ? "Make your own" : "Make it yours"}</Link>
    </header>
    <main>
      {previewOnly && guest && <p className="inv-preview-banner" role="note">This is how {guest.name} sees their invitation. Replies sent from this preview don’t count.</p>}
      <InvitationScene template={template} draft={draft} addressee={guest?.name} opened={opened} onOpen={() => setOpened(true)} onReplay={() => setOpened(false)} onDetails={() => document.getElementById("occasion-details")?.scrollIntoView({ behavior: smooth() })}/>
      {draft.pending ? <section className="inv-details-section inv-pending theme-paper" id="occasion-details">
        <h2>Details to <span className="scribble">follow</span></h2>
        <p>The hosts are updating the details of your invitation. Please check back soon.</p>
      </section> : <>
        <section className="inv-details-section theme-paper" id="occasion-details">
          <div className="inv-details-heading"><h2>Save the <span className="scribble">date</span></h2><Countdown date={draft.date} time={draft.time} events={schedule}/><button className="inv-replay-link" onClick={() => { setOpened(false); window.scrollTo({ top: 0, behavior: smooth() }); }}>Replay the invitation</button></div>
          <div className="inv-details-grid">
            <div><span className="inv-detail-label">When</span><h3>{formatInvitationDate(draft.date, true)}</h3><p>{[mainItem?.name, formatInvitationTime(draft.time)].filter(Boolean).join(" · ")}</p>
              {hasDate(draft.date) && <div className="inv-calendar"><span>Add to calendar</span><a href={googleCalendarUrl(mainEntry)} target="_blank" rel="noreferrer">Google</a>{base ? <a href={`${base}/invite.ics${schedule.length ? "?event=main" : ""}`}>Apple / Outlook</a> : <button type="button" onClick={() => downloadIcs([mainEntry])}>Apple / Outlook</button>}</div>}
            </div>
            <div><span className="inv-detail-label">Where</span><h3>{draft.venue || "A place to remember"}</h3>{draft.venue && <a href={maps(draft.venue)} target="_blank" rel="noreferrer">Open in Maps <span aria-hidden="true">→</span></a>}</div>
          </div>
        </section>
        {showSchedule && <section className="inv-schedule-section theme-paper" aria-labelledby="schedule-heading">
          <div className="inv-schedule-head">
            <h2 id="schedule-heading">{guest ? "Your" : "The"} <span className="scribble">celebrations</span></h2>
            {base
              ? <a className="cin-text-link" href={`${base}/invite.ics`}>Add every event to your calendar <span aria-hidden="true">→</span></a>
              : <button type="button" className="cin-text-link" onClick={() => downloadIcs(calendarEvents(draft))}>Add every event to your calendar <span aria-hidden="true">→</span></button>}
          </div>
          <ol className="inv-timeline">
            {schedule.map(item => {
              const venue = item.venue || draft.venue;
              const entry = { title: `${item.name} · ${draft.title}`, date: item.date, time: item.time, venue, message: draft.message, url: pageUrl };
              return <li key={item.id} className="inv-timeline-item">
                <span className="inv-timeline-mark" aria-hidden="true"><EventDoodle name={item.name}/></span>
                <span className="inv-timeline-day">{formatEventDay(item.date)}</span>
                <h3>{item.name}</h3>
                <p>{[formatInvitationTime(item.time) || "All day", venue].filter(Boolean).join(" · ")}</p>
                <div className="inv-calendar">
                  <a href={googleCalendarUrl(entry)} target="_blank" rel="noreferrer" aria-label={`Add the ${item.name} to Google Calendar`}>Google</a>
                  {base
                    ? <a href={`${base}/invite.ics?event=${item.id}`} aria-label={`Add the ${item.name} to Apple or Outlook calendar`}>Apple / Outlook</a>
                    : <button type="button" onClick={() => downloadIcs([entry])} aria-label={`Add the ${item.name} to Apple or Outlook calendar`}>Apple / Outlook</button>}
                  {item.venue && item.venue !== draft.venue && <a href={maps(item.venue)} target="_blank" rel="noreferrer" aria-label={`Map for the ${item.name}`}>Map</a>}
                </div>
              </li>;
            })}
          </ol>
        </section>}
      </>}
      <section className="inv-message-section theme-dark"><MomentMark/><blockquote>{draft.message || "We would love to share this moment with you."}</blockquote><span className="inv-message-sign">With love, {draft.title}</span></section>
      {!draft.pending && <section className="inv-rsvp-section theme-paper" aria-labelledby="rsvp-heading">
        <div><h2 id="rsvp-heading">Will you be there?</h2><p>{schedule.length > 1 ? "A quick reply means a lot. Let us know which celebrations you can be part of." : "A quick reply means a lot. Let us know if you can be part of the day."}</p></div>
        <div className="inv-rsvp-card">
          {state === "done" ? <div className="inv-rsvp-confirmation" role="status">
            <MomentMark/>
            <span className="inv-confirm-label">{!sends ? "Reply preview" : justSent ? (updated ? "Reply updated" : "Reply sent") : guest ? `Reply from ${guest.name}` : "Your reply"}</span>
            <h3>{REPLY_TITLE[attendance]}</h3>
            <p className="inv-rsvp-summary">{describeReply(attendance, chosen, schedule.length, countFor, party)}</p>
            {sends && guest && !justSent && <p className="inv-rsvp-meta">{name ? `Sent by ${name}` : "Sent"}{sentOn && ` on ${sentOn}`}. It’s one reply for everyone on this invitation.</p>}
            {fresh.length > 0 && <p className="inv-rsvp-fresh">New since then: the {listOf(fresh.map(e => e.name))}. Let them know if you can come.</p>}
            <p>{!sends ? "This is a preview. Your response hasn’t been sent." : justSent ? `Your reply is on its way to ${draft.title}. Thank you!` : "Plans change, so you can update it any time."}</p>
            <button className="cin-cta cin-cta-outline" onClick={replyAgain}>{!sends ? "Try another response" : guest ? "Change the reply" : "Reply for someone else"}</button>
          </div> : <form onSubmit={send}>
            <fieldset className="inv-attendance" ref={attendanceRef}><legend>Will you be joining us?</legend><div>{ATTENDANCE.map(option => <label key={option} className={attendance === option ? "is-selected" : ""}><input type="radio" name="attendance" value={option} checked={attendance === option} onChange={() => { setAttendance(option); setWhichError(""); setError(""); }}/><span>{option}</span></label>)}</div></fieldset>
            {askWhich && <fieldset className="inv-which" ref={whichRef} aria-describedby={whichError ? "which-error" : undefined}>
              <legend>{attendance === "Maybe" ? "Which might you make it to?" : "Which will you come to?"}</legend>
              <ul>{schedule.map(item => {
                const on = ticked.includes(item.id);
                return <li key={item.id}><label className={on ? "is-ticked" : ""}>
                  <input type="checkbox" name="events" value={item.id} checked={on} onChange={() => toggle(item.id)}/>
                  <span className="inv-which-box" aria-hidden="true"/>
                  <span className="inv-which-text"><span className="inv-which-name">{item.name}</span><span className="inv-which-day">{[formatEventDay(item.date), formatInvitationTime(item.time)].filter(Boolean).join(" · ")}</span></span>
                  <span className="inv-which-mark" aria-hidden="true"><EventDoodle name={item.name}/></span>
                </label></li>;
              })}</ul>
              {whichError && <p className="inv-rsvp-error" id="which-error" role="alert">{whichError}</p>}
            </fieldset>}
            {attendance !== "Not attending" && <div className="inv-party">
              {splitCounts ? <fieldset className="inv-counts">
                <legend>{attendance === "Maybe" ? "How many of you might come to each?" : "How many of you, for each?"}</legend>
                {chosen.map(item => <div className="studio-field" key={item.id}>
                  <label htmlFor={`count-${item.id}`}>{item.name}</label>
                  <input id={`count-${item.id}`} type="number" inputMode="numeric" min={1} max={LIMITS.guests} value={counts[item.id] ?? count} onChange={e => setCounts(now => ({ ...now, [item.id]: e.target.value }))}/>
                </div>)}
              </fieldset> : <div className="studio-field">
                <label htmlFor="guest-count">{countLabel}</label>
                {guest && <p className="inv-field-hint" id="guest-count-hint">Everyone from {guest.name}, including you.</p>}
                <input id="guest-count" name="guest-count" type="number" inputMode="numeric" min={1} max={LIMITS.guests} value={count} onChange={e => setCount(e.target.value)} aria-describedby={guest ? "guest-count-hint" : undefined}/>
              </div>}
              {askWhich && chosen.length > 1 && <button type="button" className="inv-text-button" aria-expanded={splitCounts} onClick={() => setPerEvent(!perEvent)}>{splitCounts ? "Same number for every celebration" : "Not everyone coming to everything?"}</button>}
            </div>}
            <div className="studio-field"><label htmlFor="guest-name">Your name <span>Optional</span></label><input id="guest-name" name="guest-name" autoComplete="name" maxLength={LIMITS.guestName} placeholder={guest ? "Who’s replying?" : "As we know and love you"} value={name} onChange={e => setName(e.target.value)}/></div>
            <div className="inv-honeypot" aria-hidden="true"><label htmlFor="website">Leave this empty</label><input id="website" name="website" tabIndex={-1} autoComplete="off"/></div>
            {error && <p className="inv-rsvp-error" role="alert">{error}</p>}
            <button type="submit" className="cin-cta cin-cta-light" disabled={state === "sending"}>{sends ? (state === "sending" ? "Sending…" : replied ? "Update the reply" : "Send my reply") : "Preview my reply"}</button>
            {!sends && <p className="inv-rsvp-preview-note">Preview · Responses won’t be sent.</p>}
          </form>}
        </div>
      </section>}
    </main>
    <footer className="invitation-footer"><WowLinkBrand/><span>{live ? "Made with WowLink" : "Made with love, shared with one link."}</span><Link href="/templates">Create yours free <span aria-hidden="true">→</span></Link></footer>
  </div>;
}
