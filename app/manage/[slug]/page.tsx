"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatInvitationDate, formatInvitationTime, formatShortDay, ownerKey, sortSchedule } from "../../lib/invitations";
import type { HostText } from "../../lib/host-i18n";
import { HostLangSwitch, HostTextContext, useHostLang } from "../../ui/host-lang";
import { answerFor } from "../../lib/guests";
import type { Experience, Rsvp } from "../../lib/store";
import { ArtImage, type ArtName } from "../../ui/art";
import { WowLinkBrand } from "../../ui/brand";
import { CopyField, ShareTools } from "../../ui/share-tools";
import { csvName, headcountCsv, repliesCsv } from "../../lib/export";
import { GeneralLinkAudience, GuestList, Headcount, WishesCard, saveCsv } from "./guest-list";

type Loaded = { experience: Experience; rsvps: Rsvp[] };
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

  useEffect(() => {
    setOrigin(location.origin);
    // Also runs when only the #fragment changes (pasting a different manage link doesn't reload the page).
    function readKey() {
      const fromLink = new URLSearchParams(location.hash.slice(1)).get("k");
      if (fromLink) {
        try { localStorage.setItem(ownerKey(slug), fromLink); } catch { /* private mode: keep it for this visit only */ }
        history.replaceState(null, "", location.pathname);
        setProblem("");
        setData(null);
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
      if (response.status === 404) return setProblem("invalid");
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
  const live = experience?.status === "published";
  const schedule = sortSchedule(experience?.events ?? []);
  const owner = key ? { slug, ownerKey: key } : null;
  const reload = useCallback(async () => { if (key) await load(key); }, [key, load]);
  const guestName = (id?: string) => experience?.guests.find(g => g.id === id)?.name;
  const { lang, h, toggle } = useHostLang();
  const when = (iso: string) => lang === "gu"
    ? `${formatShortDay(iso, "gu")}, ${new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })}`
    : new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

  return <HostTextContext.Provider value={h}><div className="cinema manage-page" lang={lang}>
    <header className="studio-header theme-paper">
      <WowLinkBrand/>
      <span className="studio-header-label">{h.yourInvitation}</span>
      <div className="studio-header-actions"><HostLangSwitch h={h} toggle={toggle}/><Link className="studio-fullscreen" href="/mine">{h.myInvitations}</Link>{experience && <Link className="cin-cta cin-cta-light studio-save" href={`/create?edit=${slug}`}>{h.editInStudio}</Link>}</div>
    </header>
    <main className="manage theme-paper">
      {problem === "no-key" && <Notice h={h} title={h.noKeyTitle}>{h.noKeyBody[0]} <b>#</b> {h.noKeyBody[1]}</Notice>}
      {problem === "invalid" && <Notice h={h} title={h.invalidTitle}>{h.invalidBody}</Notice>}
      {problem === "offline" && <Notice h={h} title={h.offlineTitle} action={key ? <button className="cin-cta cin-cta-outline" onClick={() => void load(key)}>{h.tryAgain}</button> : null}>{h.offlineBody}</Notice>}
      {!data && !problem && <p className="manage-loading">{h.opening}</p>}

      {experience && data && <>
        <section className="manage-hero">
          <div className="cin-print manage-print"><span className="cin-photo"><ArtImage name={experience.templateId as ArtName} fit="slice"/></span></div>
          <div>
            <span className={`manage-status is-${experience.status}`}>{live ? h.live : h.unpublished}</span>
            <h1>{experience.title}</h1>
            <p>{formatInvitationDate(experience.date, true, lang)}{experience.time && ` · ${formatInvitationTime(experience.time, lang)}`} · {experience.venue}</p>
          </div>
        </section>

        <section className="sketch-card manage-card" aria-labelledby="share-heading">
          <h2 id="share-heading">{h.shareIt}</h2>
          {live ? <ShareTools url={`${origin}/e/${slug}`} title={experience.title} lang={experience.language} ui={lang}/> : <p className="manage-muted">{h.unpublishedNote}</p>}
          {owner && schedule.length > 1 && <GeneralLinkAudience owner={owner} experience={experience} onSaved={reload}/>}
        </section>

        <section className="sketch-card manage-card" aria-labelledby="guests-heading">
          <h2 id="guests-heading">{h.personalInvitations}</h2>
          {owner && <GuestList owner={owner} origin={origin} experience={experience} rsvps={data.rsvps} onChanged={reload}/>}
        </section>

        <section className="sketch-card manage-card" aria-labelledby="replies-heading">
          <div className="manage-card-head"><h2 id="replies-heading">{h.repliesHeading}</h2><button className="inv-replay-link" onClick={() => key && void load(key)}>{h.refresh}</button></div>
          <dl className="manage-totals">
            <div><dt>{h.coming}</dt><dd>{totals.Attending}</dd><span>{h.guestsInAll(totals.guests)}</span></div>
            <div><dt>{h.maybe}</dt><dd>{totals.Maybe}</dd>{totals.maybeGuests > 0 && <span>{h.people(totals.maybeGuests)}</span>}</div>
            <div><dt>{h.cantMakeIt}</dt><dd>{totals["Not attending"]}</dd></div>
          </dl>
          {schedule.length > 0 && <Headcount experience={experience} rsvps={data.rsvps}/>}
          {data.rsvps.length ? <div className="manage-table-wrap"><table className="manage-table manage-replies">
            {schedule.length > 0 && <caption className="manage-caption">{h.everyReply}</caption>}
            <thead><tr><th scope="col">{h.colName}</th><th scope="col">{h.colReply}</th><th scope="col">{h.colGuests}</th>{schedule.length > 0 && <th scope="col">{h.colCelebrations}</th>}<th scope="col">{h.colWhen}</th></tr></thead>
            <tbody>{data.rsvps.map(r => {
              const household = guestName(r.guestId);
              return <tr key={r.id}>
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
              </tr>;
            })}</tbody>
          </table></div> : <p className="manage-muted">{h.noRepliesYet}</p>}
          {data.rsvps.length > 0 && <div className="manage-downloads"><span>{h.download}</span>
            <button type="button" className="share-chip" onClick={() => saveCsv(csvName(experience.title, "replies"), repliesCsv(data))}>{h.everyReplyCsv}</button>
            {schedule.length > 0 && <button type="button" className="share-chip" onClick={() => saveCsv(csvName(experience.title, "headcount"), headcountCsv(data))}>{h.headcountCsv}</button>}
          </div>}
        </section>

        <section className="sketch-card manage-card" aria-labelledby="wishes-heading">
          <h2 id="wishes-heading">{h.wishesHeading}</h2>
          {owner && <WishesCard owner={owner} experience={experience} rsvps={data.rsvps} onChanged={reload}/>}
        </section>

        <section className="sketch-card manage-card" aria-labelledby="private-heading">
          <h2 id="private-heading">{h.privateHeading}</h2>
          <p className="manage-muted">{h.privateBody}</p>
          {key && <CopyField value={`${origin}/manage/${slug}#k=${key}`} label={h.copyManageLink} ui={lang}/>}
          <div className="manage-actions">
            {live
              ? <button className="cin-cta cin-cta-outline" disabled={busy} onClick={() => void setStatus("unpublished")}>{h.unpublish}</button>
              : <button className="cin-cta cin-cta-light" disabled={busy} onClick={() => void setStatus("published")}>{h.publishAgain}</button>}
            <span className="manage-muted">{h.unpublishNote(live)}</span>
          </div>
        </section>
      </>}
    </main>
  </div></HostTextContext.Provider>;
}

function Notice({ h, title, action, children }: { h: HostText; title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <section className="sketch-card manage-card manage-notice" role="alert"><h1>{title}</h1><p>{children}</p>{action}<Link className="cin-text-link" href="/templates">{h.makeNew} <span aria-hidden="true">→</span></Link></section>;
}
