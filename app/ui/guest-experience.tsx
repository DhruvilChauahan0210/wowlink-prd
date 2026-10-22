"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ATTENDANCE, LIMITS, formatEventDay, formatInvitationDate, formatInvitationTime, sortSchedule, type Attendance, type InvitationDraft, type InvitationTemplate } from "../lib/invitations";
import { calendarEvents, daysUntil, eventStartMs, googleCalendarUrl, toIcs } from "../lib/calendar";
import { MomentMark, WowLinkBrand } from "./brand";
import { Bowl, Diya, Flower, Leaf, Note, Ring, Star } from "./doodles";
import { InvitationScene } from "./invitation-scene";

type Props = {
  template: InvitationTemplate;
  draft: InvitationDraft;
  /** template: browsing a sample · draft: the creator previewing their own · live: a guest on a published link */
  mode: "template" | "draft" | "live";
  slug?: string;
};

const smooth = () => (matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth") as ScrollBehavior;
const REPLY_TITLE: Record<Attendance, string> = { Attending: "Joyfully, yes.", Maybe: "A little maybe.", "Not attending": "With you in spirit." };
const maps = (place: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`;

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

/** "17 days to go", worked out on India's calendar. Rendered only in the browser so it never disagrees with the server. */
function Countdown({ date, time }: { date: string; time: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const tick = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(tick);
  }, []);
  if (now === null || !hasDate(date)) return null;
  const days = daysUntil(date, now);
  const start = eventStartMs(date, time);
  let count: number | null = null;
  let label: string;
  if (days > 1) {
    count = days;
    label = "days to go";
  } else if (days === 1) label = "Tomorrow!";
  else if (days === 0) {
    const hours = Math.ceil((start - now) / 3_600_000);
    label = time && hours > 0 ? (hours === 1 ? "Today, within the hour!" : `Today, in ${hours} hours`) : time ? "Happening now!" : "It’s today!";
  } else label = "This day has passed. Thank you for being part of it.";
  return <p className="inv-countdown">{count !== null && <span className="inv-countdown-n">{count}</span>}<span>{label}</span></p>;
}

/** Everything a guest sees: the opening, the details, the message and the RSVP. */
export function GuestExperience({ template, draft, mode, slug }: Props) {
  const live = mode === "live";
  const [opened, setOpened] = useState(false);
  const [attendance, setAttendance] = useState<Attendance>("Attending");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  const [pageUrl, setPageUrl] = useState<string | undefined>();
  useEffect(() => { if (live) setPageUrl(location.origin + location.pathname); }, [live]);

  // Previews have no server route for the calendar file, so build it here and hand it over as a download.
  function downloadIcs(events: Parameters<typeof toIcs>[0] = draft) {
    const blob = new Blob([toIcs(events)], { type: "text/calendar;charset=utf-8" });
    const link = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "invitation.ics" });
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  async function reply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!live || !slug) return setState("done");
    const form = new FormData(event.currentTarget);
    setState("sending");
    setError("");
    try {
      const response = await fetch(`/api/experiences/${slug}/rsvps`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ attendance, name: form.get("guest-name"), guestCount: Number(form.get("guest-count") ?? 1), website: form.get("website") }),
      });
      if (!response.ok) throw new Error(((await response.json().catch(() => null)) as { error?: string } | null)?.error ?? "");
      setState("done");
    } catch (failure) {
      setError((failure as Error).message || "Your reply didn’t go through. Check your connection and try again.");
      setState("idle");
    }
  }

  return <div className="cinema invitation-page">
    <header className="invitation-header theme-paper">
      <WowLinkBrand/>
      {!live && <span className="invitation-context">{mode === "draft" ? "Draft preview" : "Template preview"}<i aria-hidden="true">·</i>{template.category}</span>}
      <Link className="cin-cta cin-cta-outline" href={`/create?template=${template.id}`}>{mode === "draft" ? "Back to editor" : live ? "Make your own" : "Make it yours"}</Link>
    </header>
    <main>
      <InvitationScene template={template} draft={draft} opened={opened} onOpen={() => setOpened(true)} onReplay={() => setOpened(false)} onDetails={() => document.getElementById("occasion-details")?.scrollIntoView({ behavior: smooth() })}/>
      <section className="inv-details-section theme-paper" id="occasion-details">
        <div className="inv-details-heading"><h2>Save the <span className="scribble">date</span></h2><Countdown date={draft.date} time={draft.time}/><button className="inv-replay-link" onClick={() => { setOpened(false); window.scrollTo({ top: 0, behavior: smooth() }); }}>Replay the invitation</button></div>
        <div className="inv-details-grid">
          <div><span className="inv-detail-label">When</span><h3>{formatInvitationDate(draft.date, true)}</h3><p>{formatInvitationTime(draft.time)}</p>
            {hasDate(draft.date) && <div className="inv-calendar"><span>Add to calendar</span><a href={googleCalendarUrl({ ...draft, url: pageUrl })} target="_blank" rel="noreferrer">Google</a>{live && slug ? <a href={`/e/${slug}/invite.ics${draft.events.length ? "?event=main" : ""}`}>Apple / Outlook</a> : <button type="button" onClick={() => downloadIcs()}>Apple / Outlook</button>}</div>}
          </div>
          <div><span className="inv-detail-label">Where</span><h3>{draft.venue || "A place to remember"}</h3>{draft.venue && <a href={maps(draft.venue)} target="_blank" rel="noreferrer">Open in Maps <span aria-hidden="true">→</span></a>}</div>
        </div>
      </section>
      {draft.events.length > 0 && <section className="inv-schedule-section theme-paper" aria-labelledby="schedule-heading">
        <div className="inv-schedule-head">
          <h2 id="schedule-heading">The <span className="scribble">celebrations</span></h2>
          {live && slug
            ? <a className="cin-text-link" href={`/e/${slug}/invite.ics`}>Add every event to your calendar <span aria-hidden="true">→</span></a>
            : <button type="button" className="cin-text-link" onClick={() => downloadIcs(calendarEvents(draft))}>Add every event to your calendar <span aria-hidden="true">→</span></button>}
        </div>
        <ol className="inv-timeline">
          {sortSchedule(draft.events).map(item => {
            const venue = item.venue || draft.venue;
            const entry = { title: `${item.name} · ${draft.title}`, date: item.date, time: item.time, venue, message: draft.message, url: pageUrl };
            return <li key={item.id} className="inv-timeline-item">
              <span className="inv-timeline-mark" aria-hidden="true"><EventDoodle name={item.name}/></span>
              <span className="inv-timeline-day">{formatEventDay(item.date)}</span>
              <h3>{item.name}</h3>
              <p>{[formatInvitationTime(item.time) || "All day", venue].filter(Boolean).join(" · ")}</p>
              <div className="inv-calendar">
                <a href={googleCalendarUrl(entry)} target="_blank" rel="noreferrer" aria-label={`Add the ${item.name} to Google Calendar`}>Google</a>
                {live && slug
                  ? <a href={`/e/${slug}/invite.ics?event=${item.id}`} aria-label={`Add the ${item.name} to Apple or Outlook calendar`}>Apple / Outlook</a>
                  : <button type="button" onClick={() => downloadIcs([entry])} aria-label={`Add the ${item.name} to Apple or Outlook calendar`}>Apple / Outlook</button>}
                {item.venue && item.venue !== draft.venue && <a href={maps(item.venue)} target="_blank" rel="noreferrer" aria-label={`Map for the ${item.name}`}>Map</a>}
              </div>
            </li>;
          })}
        </ol>
      </section>}
      <section className="inv-message-section theme-dark"><MomentMark/><blockquote>{draft.message || "We would love to share this moment with you."}</blockquote><span className="inv-message-sign">With love, {draft.title}</span></section>
      <section className="inv-rsvp-section theme-paper" aria-labelledby="rsvp-heading">
        <div><h2 id="rsvp-heading">Will you be there?</h2><p>A quick reply means a lot. Let us know if you can be part of the day.</p></div>
        <div className="inv-rsvp-card">
          {state === "done" ? <div className="inv-rsvp-confirmation" role="status">
            <MomentMark/>
            <span className="inv-confirm-label">{live ? "Reply sent" : "Reply preview"}</span>
            <h3>{REPLY_TITLE[attendance]}</h3>
            <p>{live ? `Your reply is on its way to ${draft.title}. Thank you!` : "This is a preview. Your response hasn’t been sent."}</p>
            <button className="cin-cta cin-cta-outline" onClick={() => setState("idle")}>{live ? "Reply for someone else" : "Try another response"}</button>
          </div> : <form onSubmit={reply}>
            <fieldset className="inv-attendance"><legend>Will you be joining us?</legend><div>{ATTENDANCE.map(option => <label key={option} className={attendance === option ? "is-selected" : ""}><input type="radio" name="attendance" value={option} checked={attendance === option} onChange={() => setAttendance(option)}/><span>{option}</span></label>)}</div></fieldset>
            <div className="studio-field"><label htmlFor="guest-name">Your name <span>Optional</span></label><input id="guest-name" name="guest-name" autoComplete="name" maxLength={LIMITS.guestName} placeholder="As we know and love you"/></div>
            {attendance === "Attending" && <div className="studio-field"><label htmlFor="guest-count">How many guests?</label><input id="guest-count" name="guest-count" type="number" min={1} max={LIMITS.guests} defaultValue={1}/></div>}
            <div className="inv-honeypot" aria-hidden="true"><label htmlFor="website">Leave this empty</label><input id="website" name="website" tabIndex={-1} autoComplete="off"/></div>
            {error && <p className="inv-rsvp-error" role="alert">{error}</p>}
            <button type="submit" className="cin-cta cin-cta-light" disabled={state === "sending"}>{live ? (state === "sending" ? "Sending…" : "Send my reply") : "Preview my reply"}</button>
            {!live && <p className="inv-rsvp-preview-note">Preview · Responses won’t be sent.</p>}
          </form>}
        </div>
      </section>
    </main>
    <footer className="invitation-footer"><WowLinkBrand/><span>{live ? "Made with WowLink" : "Made with love, shared with one link."}</span><Link href="/templates">Create yours free <span aria-hidden="true">→</span></Link></footer>
  </div>;
}
