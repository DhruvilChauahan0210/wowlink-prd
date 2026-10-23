"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { ATTENDANCE, LIMITS, formatEventDay, formatInvitationDate, formatInvitationTime, formatShortDay, isLang, sortSchedule, type Attendance, type InvitationTemplate, type Lang, type ScheduleItem } from "../lib/invitations";
import { calendarEvents, dayPhase, daysUntil, eventStartMs, googleCalendarUrl, toIcs, type DayPhase } from "../lib/calendar";
import { answerFor, type AudienceView, type ByEvent } from "../lib/guests";
import { GUEST_TEXT, LANG_KEY, type GuestText } from "../lib/i18n";
import type { PublicWish } from "../lib/store";
import { MomentMark, WowLinkBrand } from "./brand";
import { Bowl, Diya, Flower, Leaf, Note, Ring, Star } from "./doodles";
import { InvitationScene } from "./invitation-scene";

type Reply = { name: string; attendance: Attendance; guestCount: number; byEvent?: ByEvent; wish?: string; at?: string };

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
  /** Guests' wishes the host shows on the invitation; null when the host keeps them private. */
  wishes?: PublicWish[] | null;
};

const smooth = () => (matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth") as ScrollBehavior;
const maps = (place: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`;

/** One line on what a reply said, e.g. "Coming to the Sangeet and Reception · 4 people". */
function describeReply(t: GuestText, attendance: Attendance, chosen: ScheduleItem[], shown: number, countFor: (id: string) => number, party: number) {
  const counts = chosen.map(e => countFor(e.id));
  const same = counts.every(n => n === counts[0]);
  const names = shown > 1 ? chosen.map((e, i) => (same ? e.name : `${e.name} (${counts[i]})`)) : [];
  return t.describe(attendance, names, same ? ` · ${t.people(chosen.length ? counts[0] : party)}` : "");
}

/** A little drawing that fits each kind of event. */
function EventDoodle({ name }: { name: string }) {
  const n = name.toLowerCase();
  if (/mehndi|mehendi|henna|મહેંદી/.test(n)) return <Leaf className="doodle"/>;
  if (/haldi|pithi|turmeric|પીઠી|હલદી/.test(n)) return <Bowl className="doodle"/>;
  if (/sangeet|garba|dandiya|raas|music|dance|સંગીત|ગરબા|રાસ/.test(n)) return <Note className="doodle"/>;
  if (/engage|sagai|ring|roka|સગાઈ/.test(n)) return <Ring className="doodle"/>;
  if (/puja|pooja|ganesh|havan|પૂજા|ગણેશ/.test(n)) return <Diya className="doodle"/>;
  if (/wedding|lagna|lagan|vivah|phera|ceremony|shaadi|લગ્ન|વિવાહ/.test(n)) return <MomentMark className="doodle"/>;
  if (/reception|dinner|party|cocktail|રિસેપ્શન|ભોજન/.test(n)) return <Star className="doodle"/>;
  return <Flower className="doodle"/>;
}

const hasDate = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date);

/**
 * "17 days to go", worked out on India's calendar. Rendered only in the browser so it never disagrees with the server.
 * Once the main day has passed it counts to the next celebration still to come ("Tomorrow: the Reception!").
 */
function Countdown({ date, time, events, t }: { date: string; time: string; events: ScheduleItem[]; t: GuestText }) {
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
  const what = target.name;
  const days = daysUntil(target.date, now);
  const start = eventStartMs(target.date, target.time);
  const c = t.countdown;
  let count: number | null = null;
  let label: string;
  if (days > 1) {
    count = days;
    label = c.days(what);
  } else if (days === 1) label = c.tomorrow(what);
  else if (days === 0) {
    const hours = Math.ceil((start - now) / 3_600_000);
    label = target.time && hours > 0 ? (hours === 1 ? c.withinHour(what) : c.inHours(what, hours)) : target.time ? c.now(what) : c.today(what);
  } else label = c.passed;
  return <p className="inv-countdown">{count !== null && <span className="inv-countdown-n">{count}</span>}<span>{label}</span></p>;
}

/** Everything a guest sees: the opening, the details, the message and the RSVP. */
export function GuestExperience({ template, draft, mode, slug, guest, reply, previewOnly = false, wishes = null }: Props) {
  const live = mode === "live";
  const sends = live && !previewOnly;
  const earlier = sends ? reply ?? null : null;
  const schedule = sortSchedule(draft.events);
  const allIds = schedule.map(e => e.id);
  const [opened, setOpened] = useState(false);

  // The host's language first; on a live link, a guest's own choice (kept on their device) wins once the page is up.
  const [lang, setLang] = useState<Lang>(draft.language ?? "en");
  const t = GUEST_TEXT[lang];
  useEffect(() => {
    if (!live) return setLang(draft.language ?? "en");
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (isLang(saved)) setLang(saved);
    } catch { /* storage blocked: keep the host's choice */ }
  }, [live, draft.language]);
  function switchLanguage() {
    const next = lang === "en" ? "gu" : "en";
    setLang(next);
    if (live) try { localStorage.setItem(LANG_KEY, next); } catch { /* fine: this visit only */ }
  }

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
  const [wish, setWish] = useState(earlier?.wish ?? "");
  // "done" shows the reply. A household that has already replied starts there, so a relative opening a forwarded
  // link sees the family's reply before changing it.
  const [state, setState] = useState<"idle" | "sending" | "done">(earlier ? "done" : "idle");
  const [justSent, setJustSent] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [replied, setReplied] = useState(!!earlier);
  const [sentAt, setSentAt] = useState(earlier?.at);
  const [error, setError] = useState("");
  const [whichError, setWhichError] = useState(false);
  const [pageUrl, setPageUrl] = useState<string | undefined>();
  // On the day and after it, the page changes. Worked out in the browser (it depends on the clock), every minute.
  const [phase, setPhase] = useState<DayPhase>({ phase: "before" });
  useEffect(() => {
    const check = () => setPhase(dayPhase(draft, Date.now()));
    check();
    const tick = setInterval(check, 60_000);
    return () => clearInterval(tick);
  }, [draft]);
  const over = phase.phase === "after";
  const whichRef = useRef<HTMLFieldSetElement>(null);
  const attendanceRef = useRef<HTMLFieldSetElement>(null);
  const focusForm = useRef(false);
  useEffect(() => { if (live) setPageUrl(location.origin + location.pathname); }, [live]);
  // Let the host know the household opened their link. Sent from the browser, so WhatsApp's link preview (which
  // fetches the page but never runs it) doesn't count, and neither does the host's own preview.
  useEffect(() => {
    if (!sends || !guest || !slug) return;
    fetch(`/api/experiences/${slug}/opened`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ guest: guest.id }), keepalive: true }).catch(() => undefined);
  }, [sends, guest, slug]);
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
      setWhichError(true);
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
          wish,
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
      setError((failure as Error).message || t.offline);
      setState("idle");
    }
  }

  function replyAgain() {
    // A personal link changes the household's one reply; the general link starts a fresh one for someone else.
    if (sends && !guest) {
      setName("");
      setWish("");
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
    setWhichError(false);
  };
  // Written from fixed tables on India's calendar, so server and browser render the same text.
  const sentOn = sentAt ? formatShortDay(sentAt, lang) : "";
  const [saveThe, saveWord] = t.saveThe;
  const [pendingThe, pendingWord] = t.pendingHeading;
  const [celebrationsThe, celebrationsWord] = t.celebrationsHeading(!!guest);

  return <div className="cinema invitation-page" lang={lang}>
    <header className="invitation-header theme-paper">
      <WowLinkBrand/>
      {!live && <span className="invitation-context">{mode === "draft" ? "Draft preview" : "Template preview"}<i aria-hidden="true">·</i>{template.category}</span>}
      {previewOnly && <span className="invitation-context">Host preview</span>}
      <div className="invitation-header-actions">
        <button type="button" className="inv-lang" aria-label={t.switchTo} onClick={switchLanguage}><span lang={lang === "en" ? "gu" : "en"}>{lang === "en" ? "ગુજરાતી" : "English"}</span></button>
        <Link className="cin-cta cin-cta-outline" href={`/create?template=${template.id}`}>{mode === "draft" ? "Back to editor" : live ? t.makeYourOwn : "Make it yours"}</Link>
      </div>
    </header>
    <main>
      {previewOnly && guest && <p className="inv-preview-banner" role="note" lang="en">This is how {guest.name} sees their invitation. Replies sent from this preview don’t count.</p>}
      {!draft.pending && phase.phase === "today" && <section className="inv-today theme-paper" aria-labelledby="today-heading">
        <h2 id="today-heading" className="inv-today-label">{t.today}</h2>
        <ul>{phase.items.map((item, i) => <li key={i}>
          <strong>{item.name || draft.title}</strong>
          <span>{item.now ? t.happeningNow : formatInvitationTime(item.time, lang) || t.allDay}</span>
          {item.venue && <span>{item.venue}</span>}
          {item.venue && <a href={maps(item.venue)} target="_blank" rel="noreferrer">{t.directions} <span aria-hidden="true">→</span></a>}
        </li>)}</ul>
      </section>}
      {!draft.pending && over && <p className="inv-after theme-paper" role="note">{t.afterBanner}</p>}
      <InvitationScene template={template} draft={draft} lang={lang} addressee={guest?.name} opened={opened} onOpen={() => setOpened(true)} onReplay={() => setOpened(false)} onDetails={() => document.getElementById("occasion-details")?.scrollIntoView({ behavior: smooth() })}/>
      {draft.pending ? <section className="inv-details-section inv-pending theme-paper" id="occasion-details">
        <h2>{pendingThe} <span className="scribble">{pendingWord}</span></h2>
        <p>{t.pendingBody}</p>
      </section> : <>
        <section className="inv-details-section theme-paper" id="occasion-details">
          <div className="inv-details-heading"><h2>{over ? t.rememberThe[0] : saveThe} <span className="scribble">{over ? t.rememberThe[1] : saveWord}</span></h2>{!over && <Countdown date={draft.date} time={draft.time} events={schedule} t={t}/>}<button className="inv-replay-link" onClick={() => { setOpened(false); window.scrollTo({ top: 0, behavior: smooth() }); }}>{t.replay}</button></div>
          <div className="inv-details-grid">
            <div><span className="inv-detail-label">{t.when}</span><h3>{formatInvitationDate(draft.date, true, lang)}</h3><p>{[mainItem?.name, formatInvitationTime(draft.time, lang)].filter(Boolean).join(" · ")}</p>
              {hasDate(draft.date) && !over && <div className="inv-calendar"><span>{t.addToCalendar}</span><a href={googleCalendarUrl(mainEntry)} target="_blank" rel="noreferrer">Google</a>{base ? <a href={`${base}/invite.ics${schedule.length ? "?event=main" : ""}`}>Apple / Outlook</a> : <button type="button" onClick={() => downloadIcs([mainEntry])}>Apple / Outlook</button>}</div>}
            </div>
            <div><span className="inv-detail-label">{t.where}</span><h3>{draft.venue || t.somewhere}</h3>{draft.venue && <a href={maps(draft.venue)} target="_blank" rel="noreferrer">{t.openInMaps} <span aria-hidden="true">→</span></a>}</div>
          </div>
        </section>
        {showSchedule && <section className="inv-schedule-section theme-paper" aria-labelledby="schedule-heading">
          <div className="inv-schedule-head">
            <h2 id="schedule-heading">{celebrationsThe} <span className="scribble">{celebrationsWord}</span></h2>
            {!over && (base
              ? <a className="cin-text-link" href={`${base}/invite.ics`}>{t.addAll} <span aria-hidden="true">→</span></a>
              : <button type="button" className="cin-text-link" onClick={() => downloadIcs(calendarEvents(draft))}>{t.addAll} <span aria-hidden="true">→</span></button>)}
          </div>
          <ol className="inv-timeline">
            {schedule.map(item => {
              const venue = item.venue || draft.venue;
              const entry = { title: `${item.name} · ${draft.title}`, date: item.date, time: item.time, venue, message: draft.message, url: pageUrl };
              return <li key={item.id} className="inv-timeline-item">
                <span className="inv-timeline-mark" aria-hidden="true"><EventDoodle name={item.name}/></span>
                <span className="inv-timeline-day">{formatEventDay(item.date, lang)}</span>
                <h3>{item.name}</h3>
                <p>{[formatInvitationTime(item.time, lang) || t.allDay, venue].filter(Boolean).join(" · ")}</p>
                {!over && <div className="inv-calendar">
                  <a href={googleCalendarUrl(entry)} target="_blank" rel="noreferrer" aria-label={t.addGoogle(item.name)}>Google</a>
                  {base
                    ? <a href={`${base}/invite.ics?event=${item.id}`} aria-label={t.addApple(item.name)}>Apple / Outlook</a>
                    : <button type="button" onClick={() => downloadIcs([entry])} aria-label={t.addApple(item.name)}>Apple / Outlook</button>}
                  {item.venue && item.venue !== draft.venue && <a href={maps(item.venue)} target="_blank" rel="noreferrer" aria-label={t.mapFor(item.name)}>{t.map}</a>}
                </div>}
              </li>;
            })}
          </ol>
        </section>}
      </>}
      <section className="inv-message-section theme-dark"><MomentMark/><blockquote>{draft.message || t.defaultMessage}</blockquote><span className="inv-message-sign">{t.withLove(draft.title)}</span></section>
      {!draft.pending && over && <section className="inv-thanks-section theme-paper" aria-labelledby="thanks-heading">
        <h2 id="thanks-heading">{t.thanksHeading[0]} <span className="scribble">{t.thanksHeading[1]}</span></h2>
        <p>{draft.thanks || t.thanksDefault}</p>
        <span className="inv-message-sign">{t.withLove(draft.title)}</span>
      </section>}
      {!draft.pending && !over && <section className="inv-rsvp-section theme-paper" aria-labelledby="rsvp-heading">
        <div><h2 id="rsvp-heading">{t.rsvpHeading}</h2><p>{t.rsvpIntro(schedule.length > 1)}</p></div>
        <div className="inv-rsvp-card">
          {state === "done" ? <div className="inv-rsvp-confirmation" role="status">
            <MomentMark/>
            <span className="inv-confirm-label">{!sends ? t.labelPreview : justSent ? (updated ? t.labelUpdated : t.labelSent) : guest ? t.labelFrom(guest.name) : t.labelYours}</span>
            <h3>{t.replyTitle[attendance]}</h3>
            <p className="inv-rsvp-summary">{describeReply(t, attendance, chosen, schedule.length, countFor, party)}</p>
            {sends && guest && !justSent && <p className="inv-rsvp-meta">{t.sentBy(name, sentOn)}</p>}
            {wish.trim() && <p className="inv-rsvp-wish">“{wish.trim()}”</p>}
            {fresh.length > 0 && <p className="inv-rsvp-fresh">{t.fresh(fresh.map(e => e.name))}</p>}
            <p>{!sends ? t.notSent : justSent ? t.thanks(draft.title) : t.canChange}</p>
            <button className="cin-cta cin-cta-outline" onClick={replyAgain}>{!sends ? t.again.preview : guest ? t.again.personal : t.again.general}</button>
          </div> : <form onSubmit={send}>
            <fieldset className="inv-attendance" ref={attendanceRef}><legend>{t.joining}</legend><div>{ATTENDANCE.map(option => <label key={option} className={attendance === option ? "is-selected" : ""}><input type="radio" name="attendance" value={option} checked={attendance === option} onChange={() => { setAttendance(option); setWhichError(false); setError(""); }}/><span>{t.attendance[option]}</span></label>)}</div></fieldset>
            {askWhich && <fieldset className="inv-which" ref={whichRef} aria-describedby={whichError ? "which-error" : undefined}>
              <legend>{t.which(attendance === "Maybe")}</legend>
              <ul>{schedule.map(item => {
                const on = ticked.includes(item.id);
                return <li key={item.id}><label className={on ? "is-ticked" : ""}>
                  <input type="checkbox" name="events" value={item.id} checked={on} onChange={() => toggle(item.id)}/>
                  <span className="inv-which-box" aria-hidden="true"/>
                  <span className="inv-which-text"><span className="inv-which-name">{item.name}</span><span className="inv-which-day">{[formatEventDay(item.date, lang), formatInvitationTime(item.time, lang)].filter(Boolean).join(" · ")}</span></span>
                  <span className="inv-which-mark" aria-hidden="true"><EventDoodle name={item.name}/></span>
                </label></li>;
              })}</ul>
              {whichError && <p className="inv-rsvp-error" id="which-error" role="alert">{t.tickOne}</p>}
            </fieldset>}
            {attendance !== "Not attending" && <div className="inv-party">
              {splitCounts ? <fieldset className="inv-counts">
                <legend>{t.perCelebration(attendance === "Maybe")}</legend>
                {chosen.map(item => <div className="studio-field" key={item.id}>
                  <label htmlFor={`count-${item.id}`}>{item.name}</label>
                  <input id={`count-${item.id}`} type="number" inputMode="numeric" min={1} max={LIMITS.guests} value={counts[item.id] ?? count} onChange={e => setCounts(now => ({ ...now, [item.id]: e.target.value }))}/>
                </div>)}
              </fieldset> : <div className="studio-field">
                <label htmlFor="guest-count">{t.countLabel(attendance, !!guest, schedule.length > 1)}</label>
                {guest && <p className="inv-field-hint" id="guest-count-hint">{t.everyoneFrom(guest.name)}</p>}
                <input id="guest-count" name="guest-count" type="number" inputMode="numeric" min={1} max={LIMITS.guests} value={count} onChange={e => setCount(e.target.value)} aria-describedby={guest ? "guest-count-hint" : undefined}/>
              </div>}
              {askWhich && chosen.length > 1 && <button type="button" className="inv-text-button" aria-expanded={splitCounts} onClick={() => setPerEvent(!perEvent)}>{t.splitToggle(splitCounts)}</button>}
            </div>}
            <div className="studio-field"><label htmlFor="guest-name">{t.yourName} <span>{t.optional}</span></label><input id="guest-name" name="guest-name" autoComplete="name" maxLength={LIMITS.guestName} placeholder={t.namePlaceholder(!!guest)} value={name} onChange={e => setName(e.target.value)}/></div>
            <div className="studio-field inv-wish-field">
              <label htmlFor="guest-wish">{t.wishLabel} <span>{t.optional}</span></label>
              <p className="inv-field-hint" id="guest-wish-hint">{t.wishHint(wishes !== null)}</p>
              <textarea id="guest-wish" name="guest-wish" rows={3} maxLength={LIMITS.wish} placeholder={t.wishPlaceholder} value={wish} onChange={e => setWish(e.target.value)} aria-describedby="guest-wish-hint"/>
            </div>
            <div className="inv-honeypot" aria-hidden="true"><label htmlFor="website">Leave this empty</label><input id="website" name="website" tabIndex={-1} autoComplete="off"/></div>
            {error && <p className="inv-rsvp-error" role="alert">{error}</p>}
            <button type="submit" className="cin-cta cin-cta-light" disabled={state === "sending"}>{sends ? (state === "sending" ? t.sending : replied ? t.update : t.send) : t.previewSubmit}</button>
            {!sends && <p className="inv-rsvp-preview-note">{t.previewNote}</p>}
          </form>}
        </div>
      </section>}
      {!draft.pending && wishes && wishes.length > 0 && <section className="inv-wishes-section theme-paper" aria-labelledby="wishes-heading">
        <h2 id="wishes-heading">{t.wishesHeading[0]} <span className="scribble">{t.wishesHeading[1]}</span></h2>
        <ul className="inv-wishes">{wishes.map((w, i) => <li key={i} className="inv-wish"><p>{w.text}</p><span>— {w.name || t.aGuest}</span></li>)}</ul>
      </section>}
    </main>
    <footer className="invitation-footer"><WowLinkBrand/><span>{live ? t.madeWith : "Made with love, shared with one link."}</span><Link href="/templates">{t.createYours} <span aria-hidden="true">→</span></Link></footer>
  </div>;
}
