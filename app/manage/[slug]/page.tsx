"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatInvitationDate, formatInvitationTime, formatShortDay, langHref, ownerKey, sortSchedule } from "../../lib/invitations";
import type { HostText } from "../../lib/host-i18n";
import { HostLangSwitch, HostTextContext, useHostLang } from "../../ui/host-lang";
import { answerFor } from "../../lib/guests";
import type { Experience, Rsvp } from "../../lib/store";
import { ArtImage, type ArtName } from "../../ui/art";
import { WowLinkBrand } from "../../ui/brand";
import { CopyField, ShareTools } from "../../ui/share-tools";
import { csvName, headcountCsv, repliesCsv } from "../../lib/export";
import { GeneralLinkAudience, GuestList, Headcount, WishesCard, saveCsv } from "./guest-list";
import { Insights } from "./insights";
import { FromGuests } from "./from-guests";
import { AskPro } from "../../ui/ask-pro";
import { linkOf } from "../../lib/aliases";
import { hostMessage } from "../../lib/host-i18n";
import { endsOn, hasEnded, planOf } from "../../lib/plans";
import { REASON_TEXT } from "../../lib/reports";

type Loaded = { experience: Experience; rsvps: Rsvp[]; upgrade?: { status: "open" | "approved" | "declined"; createdAt: string } };
type Problem = "" | "no-key" | "invalid" | "offline";

/*
 * The creator's page for one invitation. Ownership is a private key carried in the link's #fragment
 * (browsers never send fragments to the server). It is remembered on this device and removed from the
 * address bar, then sent as a Bearer token to the API.
 */
export default function ManagePage() {
  const { slug } = useParams<{ slug: string }>();
  const [key, setKey] = useState<string | null>(null);
  const [data, setData] = useState<Loaded | null>(null);
  const [problem, setProblem] = useState<Problem>("");
  const [busy, setBusy] = useState(false);
  const [origin, setOrigin] = useState("");
  // Deleting: asking first, then the deleted invitation's title once it's gone.
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmReply, setConfirmReply] = useState<string | null>(null);
  const [failed, setFailed] = useState<"" | "invitation" | "reply">("");
  const [deleted, setDeleted] = useState<string | null>(null);
  const deletedRef = useRef<HTMLHeadingElement>(null);
  // Focus follows the questions: into each one as it opens, and back to what opened it.
  const deleteToggleRef = useRef<HTMLButtonElement>(null);
  const deleteQuestionRef = useRef<HTMLParagraphElement>(null);
  const replyQuestionRef = useRef<HTMLParagraphElement>(null);
  const repliesHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    setOrigin(location.origin);
    // Also runs when only the #fragment changes (pasting a different manage link doesn't reload the page).
    function readKey() {
      const fromLink = new URLSearchParams(location.hash.slice(1)).get("k");
      if (fromLink) {
        try { localStorage.setItem(ownerKey(slug), fromLink); } catch { /* private mode: keep it for this visit only */ }
        history.replaceState(null, "", location.pathname);
        setProblem("");
        setDeleted(null);
        setKey(fromLink);
        return;
      }
      let saved: string | null = null;
      try { saved = localStorage.getItem(ownerKey(slug)); } catch { /* storage blocked */ }
      if (saved) setKey(saved);
      else setProblem("no-key");
    }
    readKey();
    addEventListener("hashchange", readKey);
    return () => removeEventListener("hashchange", readKey);
  }, [slug]);

  const load = useCallback(async (k: string) => {
    try {
      const response = await fetch(`/api/experiences/${slug}`, { headers: { authorization: `Bearer ${k}` }, cache: "no-store" });
      if (response.status === 404) {
        // Deleted elsewhere, or a key that doesn't fit: don't leave the old page up as if it were still there.
        setData(null);
        return setProblem("invalid");
      }
      if (!response.ok) throw new Error();
      setData(await response.json());
      setProblem("");
    } catch {
      setProblem("offline");
    }
  }, [slug]);

  useEffect(() => { if (key) void load(key); }, [key, load]);

  async function setStatus(status: Experience["status"]) {
    if (!key) return;
    setBusy(true);
    await fetch(`/api/experiences/${slug}`, { method: "PATCH", headers: { "content-type": "application/json", authorization: `Bearer ${key}` }, body: JSON.stringify({ status }) }).catch(() => undefined);
    await load(key);
    setBusy(false);
  }

  async function deleteInvitation() {
    if (!key || !data) return;
    setBusy(true);
    setFailed("");
    const response = await fetch(`/api/experiences/${slug}`, { method: "DELETE", headers: { authorization: `Bearer ${key}` } }).catch(() => null);
    setBusy(false);
    // A 404 for a key that just opened this page means it's already gone: deleted on another device, or by an
    // earlier try whose answer was lost on the way back.
    if (!response?.ok && response?.status !== 404) return setFailed("invitation");
    // It's gone, so this device no longer needs its key (and My invitations stops listing it).
    try { localStorage.removeItem(ownerKey(slug)); } catch { /* nothing saved */ }
    setDeleted(data.experience.title);
    setData(null);
    setKey(null);
  }

  async function removeReply(id: string) {
    if (!key) return;
    setBusy(true);
    setFailed("");
    const response = await fetch(`/api/experiences/${slug}/rsvps/${id}`, { method: "DELETE", headers: { authorization: `Bearer ${key}` } }).catch(() => null);
    // Already gone (removed on another device) is as good as removed. Reloading also shows if the whole invitation went.
    if (response?.ok || response?.status === 404) {
      setConfirmReply(null);
      await load(key);
      repliesHeadingRef.current?.focus();
    } else setFailed("reply");
    setBusy(false);
  }

  function keepReply(id: string) {
    setConfirmReply(null);
    document.getElementById(`remove-reply-${id}`)?.focus();
  }
  function keepInvitation() {
    setConfirmDelete(false);
    deleteToggleRef.current?.focus();
  }

  useEffect(() => { if (deleted) deletedRef.current?.focus(); }, [deleted]);
  useEffect(() => { if (confirmDelete) deleteQuestionRef.current?.focus(); }, [confirmDelete]);
  useEffect(() => { if (confirmReply) replyQuestionRef.current?.focus(); }, [confirmReply]);

  const totals = useMemo(() => {
    const t = { Attending: 0, Maybe: 0, "Not attending": 0, guests: 0, maybeGuests: 0 };
    for (const r of data?.rsvps ?? []) {
      t[r.attendance] += 1;
      if (r.attendance === "Attending") t.guests += r.guestCount;
      if (r.attendance === "Maybe") t.maybeGuests += r.guestCount;
    }
    return t;
  }, [data]);

  const experience = data?.experience;
  const removed = experience?.removed;
  const pro = experience ? planOf(experience) === "pro" : false;
  // A free invitation comes down 30 days after the occasion.
  const ends = experience ? endsOn(experience) : null;
  const ended = !!experience && hasEnded(experience);
  const live = experience?.status === "published" && !removed;
  const schedule = sortSchedule(experience?.events ?? []);
  const owner = key ? { slug, ownerKey: key } : null;
  const reload = useCallback(async () => { if (key) await load(key); }, [key, load]);
  const guestName = (id?: string) => experience?.guests.find(g => g.id === id)?.name;
  const { lang, h, choose } = useHostLang();
  const when = (iso: string) => lang !== "en"
    ? `${formatShortDay(iso, lang)}, ${new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })}`
    : new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

  return <HostTextContext.Provider value={h}><div className="cinema manage-page" lang={lang}>
    <header className="studio-header theme-paper">
      <WowLinkBrand/>
      <span className="studio-header-label">{h.yourInvitation}</span>
      <div className="studio-header-actions"><HostLangSwitch h={h} choose={choose}/><Link className="studio-fullscreen" href="/mine">{h.myInvitations}</Link>{experience && !removed && <Link className="cin-cta cin-cta-light studio-save" href={`/create?edit=${slug}`}>{h.editInStudio}</Link>}</div>
    </header>
    <main className="manage theme-paper">
      {problem === "no-key" && <Notice h={h} title={h.noKeyTitle}>{h.noKeyBody[0]} <b>#</b> {h.noKeyBody[1]}</Notice>}
      {problem === "invalid" && <Notice h={h} title={h.invalidTitle}>{h.invalidBody}</Notice>}
      {problem === "offline" && <Notice h={h} title={h.offlineTitle} action={key ? <button className="cin-cta cin-cta-outline" onClick={() => void load(key)}>{h.tryAgain}</button> : null}>{h.offlineBody}</Notice>}
      {deleted !== null && <section className="sketch-card manage-card manage-notice" role="status">
        <h1 ref={deletedRef} tabIndex={-1}>{h.deletedTitle}</h1>
        <p>{h.deletedBody(deleted)}</p>
        <div className="manage-actions"><Link className="cin-cta cin-cta-light" href="/mine">{h.myInvitations}</Link><Link className="cin-text-link" href="/templates">{h.makeNew} <span aria-hidden="true">→</span></Link></div>
      </section>}
      {!data && !problem && deleted === null && <p className="manage-loading">{h.opening}</p>}

      {experience && data && <>
        <section className="manage-hero">
          <div className="cin-print manage-print"><span className="cin-photo"><ArtImage name={experience.templateId as ArtName} fit="slice"/></span></div>
          <div>
            <span className={`manage-status is-${removed ? "removed" : experience.status}`}>{removed ? h.takenDown : live ? h.live : h.unpublished}</span> <span className={`manage-plan${pro ? " is-pro" : ""}`}>{pro ? h.proBadge : h.freeBadge}</span>
            <h1>{experience.title}</h1>
            <p>{formatInvitationDate(experience.date, true, lang)}{experience.time && ` · ${formatInvitationTime(experience.time, lang)}`} · {experience.venue}</p>
            {ends && <p className={ended ? "manage-warn" : "manage-muted manage-ends"}>{ended ? h.endedFree(formatInvitationDate(ends, true, lang)) : h.upUntil(formatInvitationDate(ends, true, lang))} {!ended && <Link href="/pricing">{h.seePlans}</Link>}</p>}
          </div>
        </section>

        {removed && <section className="sketch-card manage-card manage-taken-down" aria-labelledby="taken-down-heading">
          <h2 id="taken-down-heading">{h.takenDownTitle}</h2>
          <p>{h.takenDownBody(removed.reason ? REASON_TEXT[lang][removed.reason] : "")}</p>
        </section>}

        <section className="sketch-card manage-card" aria-labelledby="share-heading">
          <h2 id="share-heading">{h.shareIt}</h2>
          {live ? <ShareTools url={`${origin}/e/${linkOf(experience)}`} title={experience.title} lang={experience.language} ui={lang} owner={owner ?? undefined}/> : <p className="manage-muted">{removed ? h.takenDownShare : h.unpublishedNote}</p>}
          {owner && schedule.length > 1 && <GeneralLinkAudience owner={owner} experience={experience} onSaved={reload}/>}
          {!removed && (pro ? owner && <CustomLink h={h} owner={owner} experience={experience} onSaved={reload}/> : <ProNote h={h} text={h.proAlias}/>)}
        </section>

        {!pro && !removed && owner && <section className="sketch-card manage-card" id="creator-studio" aria-labelledby="creator-studio-heading">
          <h2 id="creator-studio-heading">{h.proBadge}</h2>
          <AskPro h={h} owner={owner} upgrade={data.upgrade} onSent={reload}/>
        </section>}

        <section className="sketch-card manage-card" aria-labelledby="insights-heading">
          <h2 id="insights-heading">{h.insightsHeading}</h2>
          <Insights experience={experience} rsvps={data.rsvps} pro={pro}/>
        </section>

        <section className="sketch-card manage-card" aria-labelledby="guests-heading">
          <h2 id="guests-heading">{h.personalInvitations}</h2>
          {!pro ? <ProNote h={h} text={h.proPersonal}/> : owner && <GuestList owner={owner} origin={origin} experience={experience} rsvps={data.rsvps} onChanged={reload}/>}
        </section>

        <section className="sketch-card manage-card" aria-labelledby="replies-heading">
          <div className="manage-card-head"><h2 id="replies-heading" ref={repliesHeadingRef} tabIndex={-1}>{h.repliesHeading}</h2><button className="inv-replay-link" onClick={() => key && void load(key)}>{h.refresh}</button></div>
          {experience.rsvp === false && <p className="manage-warn">{h.repliesOff}</p>}
          <dl className="manage-totals">
            <div><dt>{h.coming}</dt><dd>{totals.Attending}</dd><span>{h.guestsInAll(totals.guests)}</span></div>
            <div><dt>{h.maybe}</dt><dd>{totals.Maybe}</dd>{totals.maybeGuests > 0 && <span>{h.people(totals.maybeGuests)}</span>}</div>
            <div><dt>{h.cantMakeIt}</dt><dd>{totals["Not attending"]}</dd></div>
          </dl>
          {schedule.length > 0 && <Headcount experience={experience} rsvps={data.rsvps}/>}
          {data.rsvps.length ? <div className="manage-table-wrap"><table className="manage-table manage-replies">
            {schedule.length > 0 && <caption className="manage-caption">{h.everyReply}</caption>}
            <thead><tr><th scope="col">{h.colName}</th><th scope="col">{h.colReply}</th><th scope="col">{h.colGuests}</th>{schedule.length > 0 && <th scope="col">{h.colCelebrations}</th>}<th scope="col">{h.colWhen}</th><th scope="col"><span className="studio-sr-only">{h.colRemove}</span></th></tr></thead>
            <tbody>{data.rsvps.map(r => {
              const household = guestName(r.guestId);
              const who = r.name || household || h.aReply;
              const asking = confirmReply === r.id;
              return <Fragment key={r.id}><tr className={asking ? "is-asking" : undefined}>
                <td>{r.name || household || <span className="manage-muted">{h.noName}</span>}{household && r.name && <span className="manage-via">{h.forHousehold(household)}</span>}</td>
                <td><span className={`manage-reply is-${r.attendance.replace(" ", "-").toLowerCase()}`}>{h.attendance[r.attendance]}</span></td>
                <td>{r.attendance === "Not attending" ? "–" : r.guestCount}</td>
                {schedule.length > 0 && <td><ul className="manage-answers">{schedule.map(e => {
                  const answer = answerFor(r, e.id);
                  if (!answer) return null;
                  const mark = answer.attendance === "Attending" ? "✓" : answer.attendance === "Maybe" ? "?" : "✗";
                  return <li key={e.id} className={`is-${answer.attendance.replace(" ", "-").toLowerCase()}`}><span aria-hidden="true">{mark}</span> {e.name}{answer.attendance !== "Not attending" && answer.guestCount !== r.guestCount ? ` (${answer.guestCount})` : ""}<span className="studio-sr-only">: {h.attendance[answer.attendance]}</span></li>;
                })}</ul></td>}
                <td>{when(r.updatedAt ?? r.createdAt)}</td>
                <td><button type="button" id={`remove-reply-${r.id}`} className="manage-row-action" aria-label={h.removeReplyFor(who)} aria-expanded={asking} disabled={busy} onClick={() => { setFailed(""); setConfirmReply(asking ? null : r.id); }}>{h.remove}</button></td>
              </tr>
              {asking && <tr className="manage-row-confirm"><td colSpan={schedule.length > 0 ? 6 : 5}><div className="manage-confirm" role="group" aria-label={h.removeReplyFor(who)}>
                <p ref={replyQuestionRef} tabIndex={-1}>{h.removeReplyConfirm(!!household, !!r.wish)}</p>
                <button type="button" className="cin-cta cin-cta-outline" disabled={busy} onClick={() => void removeReply(r.id)}>{h.remove}</button>
                <button type="button" className="share-chip" onClick={() => keepReply(r.id)}>{h.keepIt}</button>
                {failed === "reply" && <p className="studio-error" role="alert">{h.deleteFailed}</p>}
              </div></td></tr>}</Fragment>;
            })}</tbody>
          </table></div> : <p className="manage-muted">{h.noRepliesYet}</p>}
          {data.rsvps.length > 0 && !pro && <ProNote h={h} text={h.proDownloads}/>}
          {data.rsvps.length > 0 && pro && <div className="manage-downloads"><span>{h.download}</span>
            <button type="button" className="share-chip" onClick={() => saveCsv(csvName(experience.title, "replies"), repliesCsv(data))}>{h.everyReplyCsv}</button>
            {schedule.length > 0 && <button type="button" className="share-chip" onClick={() => saveCsv(csvName(experience.title, "headcount"), headcountCsv(data))}>{h.headcountCsv}</button>}
          </div>}
        </section>

        {(experience.askDiet || (pro && (experience.askSong || experience.poll))) && <section className="sketch-card manage-card" aria-labelledby="extras-heading">
          <h2 id="extras-heading">{h.fromGuests}</h2>
          <FromGuests experience={experience} rsvps={data.rsvps} pro={pro}/>
        </section>}

        <section className="sketch-card manage-card" aria-labelledby="wishes-heading">
          <h2 id="wishes-heading">{h.wishesHeading}</h2>
          {owner && <WishesCard owner={owner} experience={experience} rsvps={data.rsvps} onChanged={reload} pro={pro}/>}
        </section>

        <section className="sketch-card manage-card" aria-labelledby="private-heading">
          <h2 id="private-heading">{h.privateHeading}</h2>
          <p className="manage-muted">{h.privateBody}</p>
          {key && <CopyField value={`${origin}/manage/${slug}#k=${key}`} label={h.copyManageLink} ui={lang}/>}
          {!removed && <div className="manage-actions">
            {live
              ? <button className="cin-cta cin-cta-outline" disabled={busy} onClick={() => void setStatus("unpublished")}>{h.unpublish}</button>
              : <button className="cin-cta cin-cta-light" disabled={busy} onClick={() => void setStatus("published")}>{h.publishAgain}</button>}
            <span className="manage-muted">{h.unpublishNote(live)}</span>
          </div>}
          {pro && <Link className="cin-text-link manage-privacy-link" href={`/create?copy=${slug}`}>{h.makeAnother} <span aria-hidden="true">→</span></Link>}
          <Link className="cin-text-link manage-privacy-link" href={langHref("/privacy", lang)}>{h.privacyLink} <span aria-hidden="true">→</span></Link>
        </section>

        <section className="sketch-card manage-card manage-delete" aria-labelledby="delete-heading">
          <h2 id="delete-heading">{h.deleteHeading}</h2>
          <p className="manage-muted">{h.deleteBody}</p>
          <div className="manage-actions"><button type="button" ref={deleteToggleRef} className="cin-cta cin-cta-outline" aria-expanded={confirmDelete} onClick={() => { setFailed(""); setConfirmDelete(!confirmDelete); }}>{h.deleteInvitation}</button></div>
          {confirmDelete && <div className="manage-confirm" role="group" aria-labelledby="delete-heading">
            <p ref={deleteQuestionRef} tabIndex={-1}>{h.deleteConfirm(data.rsvps.length, experience.guests.length)}</p>
            {data.rsvps.length > 0 && <button type="button" className="share-chip" onClick={() => saveCsv(csvName(experience.title, "replies"), repliesCsv(data))}>{h.downloadRepliesFirst}</button>}
            <button type="button" className="cin-cta cin-cta-outline manage-delete-confirm" disabled={busy} onClick={() => void deleteInvitation()}>{h.deleteForGood}</button>
            <button type="button" className="share-chip" onClick={keepInvitation}>{h.keepIt}</button>
          </div>}
          {failed === "invitation" && <p className="studio-error" role="alert">{h.deleteFailed}</p>}
        </section>
      </>}
    </main>
  </div></HostTextContext.Provider>;
}

/** A feature this invitation's plan doesn't include, and where to read about the Creator studio. */
function ProNote({ text, h }: { text: string; h: HostText }) {
  return <p className="studio-pro-note"><span className="studio-pro-badge">{h.proBadge}</span> {text} <a href="#creator-studio">{h.askPro}</a></p>;
}

/** The invitation's custom link (Creator studio). Earlier ones keep working. */
function CustomLink({ h, owner, experience, onSaved }: { h: HostText; owner: { slug: string; ownerKey: string }; experience: Experience; onSaved: () => Promise<void> }) {
  const [value, setValue] = useState(experience.aliases?.[0] ?? "");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setStatus("");
    const response = await fetch(`/api/experiences/${owner.slug}/alias`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${owner.ownerKey}` }, body: JSON.stringify({ alias: value }) }).catch(() => null);
    const body = (await response?.json().catch(() => null)) as { error?: string; aliases?: string[] } | null;
    if (!response?.ok) return setError(body?.error ? hostMessage(body.error, h.lang) : h.offlineBody);
    setValue(body?.aliases?.[0] ?? value);
    setStatus(h.linkSaved);
    await onSaved();
  }
  return <form className="manage-custom-link" onSubmit={save}>
    <label htmlFor="custom-link">{h.customLinkLabel}</label>
    <p className="studio-help" id="custom-link-hint">{h.customLinkHint}</p>
    <div className="manage-custom-link-row"><span aria-hidden="true">/e/</span><input id="custom-link" value={value} maxLength={40} placeholder="isha-kabir" autoCapitalize="none" autoCorrect="off" spellCheck={false} onChange={e => setValue(e.target.value)} aria-describedby={error ? "custom-link-error" : "custom-link-hint"} aria-invalid={error ? true : undefined}/><button type="submit" className="cin-cta cin-cta-outline" disabled={!value.trim()}>{h.saveLink}</button></div>
    {error && <p className="studio-error" id="custom-link-error" role="alert">{error}</p>}
    <p className="share-status" role="status">{status}</p>
  </form>;
}

function Notice({ h, title, action, children }: { h: HostText; title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <section className="sketch-card manage-card manage-notice" role="alert"><h1>{title}</h1><p>{children}</p>{action}<Link className="cin-text-link" href="/templates">{h.makeNew} <span aria-hidden="true">→</span></Link></section>;
}
