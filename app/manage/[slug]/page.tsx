"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatInvitationDate, formatInvitationTime, ownerKey, sortSchedule } from "../../lib/invitations";
import { answerFor } from "../../lib/guests";
import type { Experience, Rsvp } from "../../lib/store";
import { Art, type ArtName } from "../../ui/art";
import { WowLinkBrand } from "../../ui/brand";
import { CopyField, ShareTools } from "../../ui/share-tools";
import { GeneralLinkAudience, GuestList, Headcount } from "./guest-list";

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
  const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

  return <div className="cinema manage-page">
    <header className="studio-header theme-paper">
      <WowLinkBrand/>
      <span className="studio-header-label">Your invitation</span>
      <div className="studio-header-actions">{experience && <Link className="cin-cta cin-cta-light studio-save" href={`/create?edit=${slug}`}>Edit in studio</Link>}</div>
    </header>
    <main className="manage theme-paper">
      {problem === "no-key" && <Notice title="This page needs your private link">Open the manage link you saved when you published. The part after the <b>#</b> is what proves the invitation is yours, so copy the whole link.</Notice>}
      {problem === "invalid" && <Notice title="That link doesn’t open this invitation">The key in this link doesn’t match. Check that you copied the whole manage link.</Notice>}
      {problem === "offline" && <Notice title="Couldn’t load your invitation" action={key ? <button className="cin-cta cin-cta-outline" onClick={() => void load(key)}>Try again</button> : null}>Check your connection and try again.</Notice>}
      {!data && !problem && <p className="manage-loading">Opening your invitation…</p>}

      {experience && data && <>
        <section className="manage-hero">
          <div className="cin-print manage-print"><span className="cin-photo"><Art name={experience.templateId as ArtName} fit="slice" decorative/></span></div>
          <div>
            <span className={`manage-status is-${experience.status}`}>{live ? "Live" : "Unpublished"}</span>
            <h1>{experience.title}</h1>
            <p>{formatInvitationDate(experience.date, true)}{experience.time && ` · ${formatInvitationTime(experience.time)}`} · {experience.venue}</p>
          </div>
        </section>

        <section className="sketch-card manage-card" aria-labelledby="share-heading">
          <h2 id="share-heading">Share it</h2>
          {live ? <ShareTools url={`${origin}/e/${slug}`} title={experience.title}/> : <p className="manage-muted">It’s unpublished, so guests opening the link see “not found”. Publish it again to share.</p>}
          {owner && schedule.length > 1 && <GeneralLinkAudience owner={owner} experience={experience} onSaved={reload}/>}
        </section>

        <section className="sketch-card manage-card" aria-labelledby="guests-heading">
          <h2 id="guests-heading">Personal invitations</h2>
          {owner && <GuestList owner={owner} origin={origin} experience={experience} rsvps={data.rsvps} onChanged={reload}/>}
        </section>

        <section className="sketch-card manage-card" aria-labelledby="replies-heading">
          <div className="manage-card-head"><h2 id="replies-heading">Replies</h2><button className="inv-replay-link" onClick={() => key && void load(key)}>Refresh</button></div>
          <dl className="manage-totals">
            <div><dt>Coming</dt><dd>{totals.Attending}</dd><span>{totals.guests} {totals.guests === 1 ? "guest" : "guests"} in all</span></div>
            <div><dt>Maybe</dt><dd>{totals.Maybe}</dd>{totals.maybeGuests > 0 && <span>{totals.maybeGuests} {totals.maybeGuests === 1 ? "person" : "people"}</span>}</div>
            <div><dt>Can’t make it</dt><dd>{totals["Not attending"]}</dd></div>
          </dl>
          {schedule.length > 0 && <Headcount experience={experience} rsvps={data.rsvps}/>}
          {data.rsvps.length ? <div className="manage-table-wrap"><table className="manage-table manage-replies">
            {schedule.length > 0 && <caption className="manage-caption">Every reply</caption>}
            <thead><tr><th scope="col">Name</th><th scope="col">Reply</th><th scope="col">Guests</th>{schedule.length > 0 && <th scope="col">Celebrations</th>}<th scope="col">When</th></tr></thead>
            <tbody>{data.rsvps.map(r => {
              const household = guestName(r.guestId);
              return <tr key={r.id}>
                <td>{r.name || household || <span className="manage-muted">No name given</span>}{household && r.name && <span className="manage-via">for {household}</span>}</td>
                <td><span className={`manage-reply is-${r.attendance.replace(" ", "-").toLowerCase()}`}>{r.attendance}</span></td>
                <td>{r.attendance === "Not attending" ? "–" : r.guestCount}</td>
                {schedule.length > 0 && <td><ul className="manage-answers">{schedule.map(e => {
                  const answer = answerFor(r, e.id);
                  if (!answer) return null;
                  const mark = answer.attendance === "Attending" ? "✓" : answer.attendance === "Maybe" ? "?" : "✗";
                  return <li key={e.id} className={`is-${answer.attendance.replace(" ", "-").toLowerCase()}`}><span aria-hidden="true">{mark}</span> {e.name}{answer.attendance !== "Not attending" && answer.guestCount !== r.guestCount ? ` (${answer.guestCount})` : ""}<span className="studio-sr-only">: {answer.attendance}</span></li>;
                })}</ul></td>}
                <td>{when(r.updatedAt ?? r.createdAt)}</td>
              </tr>;
            })}</tbody>
          </table></div> : <p className="manage-muted">No replies yet. Share the link and they’ll show up here.</p>}
        </section>

        <section className="sketch-card manage-card" aria-labelledby="private-heading">
          <h2 id="private-heading">Keep this page private</h2>
          <p className="manage-muted">Anyone with your manage link can edit this invitation and see every reply. Save it somewhere safe to open this page from another device.</p>
          {key && <CopyField value={`${origin}/manage/${slug}#k=${key}`} label="Copy manage link"/>}
          <div className="manage-actions">
            {live
              ? <button className="cin-cta cin-cta-outline" disabled={busy} onClick={() => void setStatus("unpublished")}>Unpublish</button>
              : <button className="cin-cta cin-cta-light" disabled={busy} onClick={() => void setStatus("published")}>Publish again</button>}
            <span className="manage-muted">{live ? "Unpublishing hides it from guests. Replies are kept." : "Your replies are kept."}</span>
          </div>
        </section>
      </>}
    </main>
  </div>;
}

function Notice({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <section className="sketch-card manage-card manage-notice" role="alert"><h1>{title}</h1><p>{children}</p>{action}<Link className="cin-text-link" href="/templates">Make a new invitation <span aria-hidden="true">→</span></Link></section>;
}
