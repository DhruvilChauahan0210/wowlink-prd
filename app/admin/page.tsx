"use client";

import { useCallback, useEffect, useState, type CSSProperties, type FormEvent } from "react";
import Link from "next/link";
import { getInvitationTemplate, formatInvitationDate, formatShortDay, invitationTemplates } from "../lib/invitations";
import { SHARE_CHANNELS } from "../lib/insights";
import { REASON_TEXT } from "../lib/reports";
import type { AdminInvitation, Moderation, appNumbers } from "../lib/store";
import { WowLinkBrand } from "../ui/brand";

/*
 * WowLink's own admin: reports to look at, taking an invitation down (or back up), and the app's numbers. Opened
 * with the admin key (WOWLINK_ADMIN_KEY on the server), kept for this browser tab only.
 */

const KEY = "wowlink:admin-key";
type Numbers = Awaited<ReturnType<typeof appNumbers>> & { days: number };

/** An admin call: its data, or null with why (429 when too many wrong keys were tried from here). */
async function request<T>(key: string, path: string, init: RequestInit = {}): Promise<{ data: T | null; status: number }> {
  const response = await fetch(`/api/admin${path}`, { ...init, headers: { "content-type": "application/json", authorization: `Bearer ${key}` }, cache: "no-store" }).catch(() => null);
  return { data: response?.ok ? ((await response.json()) as T) : null, status: response?.status ?? 0 };
}
const call = async <T,>(key: string, path: string, init: RequestInit = {}) => (await request<T>(key, path, init)).data;

export default function AdminPage() {
  const [key, setKey] = useState("");
  const [typed, setTyped] = useState("");
  const [wrong, setWrong] = useState<"" | "key" | "locked">("");
  // Announced to screen readers: what the last action did.
  const [message, setMessage] = useState("");
  const [reported, setReported] = useState<AdminInvitation[] | null>(null);
  const [numbers, setNumbers] = useState<Numbers | null>(null);
  const [days, setDays] = useState(30);
  const [lookup, setLookup] = useState("");
  const [found, setFound] = useState<AdminInvitation | null | "none">(null);

  // The key is checked with one request (each wrong one counts towards the lockout), then the numbers are fetched.
  const load = useCallback(async (k: string, d: number) => {
    const reports = await request<{ invitations: AdminInvitation[] }>(k, "/reports");
    if (!reports.data) return reports.status;
    setReported(reports.data.invitations);
    const nums = await call<Numbers>(k, `/numbers?days=${d}`);
    if (nums) setNumbers(nums);
    return 200;
  }, []);

  useEffect(() => {
    let saved = "";
    try { saved = sessionStorage.getItem(KEY) ?? ""; } catch { /* this tab only */ }
    if (saved) void load(saved, 30).then(status => {
      if (status === 200) setKey(saved);
      else try { sessionStorage.removeItem(KEY); } catch { /* nothing saved */ }
    });
  }, [load]);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    const k = typed.trim();
    const status = await load(k, days);
    if (status === 200) {
      setKey(k);
      setWrong("");
      try { sessionStorage.setItem(KEY, k); } catch { /* this visit only */ }
    } else setWrong(status === 429 ? "locked" : "key");
  }
  function signOut() {
    try { sessionStorage.removeItem(KEY); } catch { /* nothing saved */ }
    setKey(""); setTyped(""); setReported(null); setNumbers(null); setFound(null); setMessage("");
  }

  async function act(slug: string, action: Moderation) {
    const result = await call<{ invitation: AdminInvitation }>(key, `/invitations/${slug}`, { method: "POST", body: JSON.stringify({ action }) });
    if (result && found && found !== "none" && found.slug === slug) setFound(result.invitation);
    await load(key, days);
    if (!result) return setMessage("That didn’t work. Try again.");
    setMessage(`${{ "take-down": "Taken down", restore: "Restored", dismiss: "Reports dismissed" }[action]}: ${result.invitation.title}`);
    // The list re-sorts, so focus goes back to the invitation's own heading.
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-admin-card="${slug}"] h3`)?.focus());
  }
  async function find(event: FormEvent) {
    event.preventDefault();
    const slug = lookup.trim().match(/(?:\/e\/)?([2-9b-df-hjkmnp-tv-zB-DF-HJ-NP-TV-Z]{7})(?:[/?#]|$)/)?.[1];
    const result = slug ? await call<{ invitation: AdminInvitation }>(key, `/invitations/${slug}`) : null;
    setFound(result?.invitation ?? "none");
    setMessage(result ? `Found: ${result.invitation.title}` : "There’s no invitation at that link.");
  }
  async function changeDays(d: number) {
    setDays(d);
    const nums = await call<Numbers>(key, `/numbers?days=${d}`);
    if (nums) setNumbers(nums);
  }

  return <div className="cinema manage-page admin-page">
    <header className="studio-header theme-paper">
      <WowLinkBrand/>
      <span className="studio-header-label">Admin</span>
      <div className="studio-header-actions">{key && <button type="button" className="share-chip" onClick={signOut}>Sign out</button>}</div>
    </header>
    <main className="manage theme-paper">
      {!key ? <section className="sketch-card manage-card admin-sign-in">
        <h1>WowLink admin</h1>
        <form onSubmit={signIn}>
          <div className="studio-field">
            <label htmlFor="admin-key">Admin key</label>
            <input id="admin-key" type="password" autoComplete="current-password" value={typed} onChange={e => { setTyped(e.target.value); setWrong(""); }} aria-invalid={wrong ? true : undefined} aria-describedby={wrong ? "admin-key-error" : undefined}/>
            {wrong && <p className="studio-error" id="admin-key-error" role="alert">{wrong === "locked" ? "Too many wrong tries from here. Try again in an hour." : "That key didn’t open it. (The admin only exists when WOWLINK_ADMIN_KEY is set on the server; on a live site it needs at least 24 characters.)"}</p>}
          </div>
          <button type="submit" className="cin-cta cin-cta-light" disabled={!typed.trim()}>Open</button>
        </form>
      </section> : <>
        <h1 className="studio-sr-only">WowLink admin</h1>
        <section className="sketch-card manage-card" aria-labelledby="reports-heading">
          <h2 id="reports-heading">Reports</h2>
          {!reported?.length ? <p className="manage-muted">No reports yet.</p> : <ul className="admin-list">{reported.map(invitation => <AdminCard key={invitation.slug} invitation={invitation} onAct={act}/>)}</ul>}
        </section>

        <section className="sketch-card manage-card" aria-labelledby="find-heading">
          <h2 id="find-heading">Find an invitation</h2>
          <form className="admin-find" onSubmit={find}>
            <label className="studio-sr-only" htmlFor="admin-find">Invitation link</label>
            <input id="admin-find" value={lookup} placeholder="https://…/e/… or its 7-letter code" onChange={e => setLookup(e.target.value)}/>
            <button type="submit" className="cin-cta cin-cta-outline" disabled={!lookup.trim()}>Find</button>
          </form>
          {found === "none" && <p className="manage-muted">There’s no invitation at that link.</p>}
          {found && found !== "none" && <ul className="admin-list"><AdminCard invitation={found} onAct={act}/></ul>}
        </section>

        {numbers && <section className="sketch-card manage-card" aria-labelledby="numbers-heading">
          <div className="manage-card-head"><h2 id="numbers-heading">Numbers</h2>
            <div className="admin-days" role="group" aria-label="Period">{[7, 30, 90].map(d => <button key={d} type="button" className="share-chip" aria-pressed={days === d} onClick={() => void changeDays(d)}>{d} days</button>)}</div>
          </div>
          <AdminNumbers numbers={numbers}/>
        </section>}
      </>}
      <p className="studio-sr-only" role="status">{message}</p>
    </main>
  </div>;
}

function AdminCard({ invitation, onAct }: { invitation: AdminInvitation; onAct: (slug: string, action: Moderation) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const open = invitation.reports.filter(r => !r.resolvedAt);
  const act = async (action: Moderation) => { setBusy(true); await onAct(invitation.slug, action); setBusy(false); };
  const status = invitation.removed ? "Taken down" : invitation.status === "published" ? "Live" : "Unpublished";
  return <li className="admin-card" data-admin-card={invitation.slug}>
    <div className="admin-card-head">
      <div>
        <span className="mine-kind">{getInvitationTemplate(invitation.templateId).category}</span>
        <h3 tabIndex={-1}><Link href={`/admin/view/${invitation.slug}`}>{invitation.title}</Link></h3>
        <p className="manage-muted">{formatInvitationDate(invitation.date, true)} · {invitation.venue} · made {formatShortDay(invitation.createdAt)} · {invitation.households} personal invitations · {invitation.replies} replies</p>
      </div>
      <span className={`manage-status is-${invitation.removed ? "removed" : invitation.status}`}>{status}</span>
    </div>
    {invitation.reports.length > 0 && <ul className="admin-reports">{invitation.reports.map(report => <li key={report.id} className={report.resolvedAt ? "is-resolved" : ""}>
      <strong>{REASON_TEXT.en[report.reason]}</strong>
      {report.details && <span className="admin-report-details">“{report.details}”</span>}
      <span className="manage-muted">{formatShortDay(report.createdAt)}{report.outcome && ` · ${report.outcome === "taken-down" ? "taken down" : "dismissed"}`}</span>
    </li>)}</ul>}
    <div className="manage-actions">
      {invitation.removed
        ? <button type="button" className="cin-cta cin-cta-outline" disabled={busy} onClick={() => void act("restore")}>Restore</button>
        : <button type="button" className="cin-cta cin-cta-outline admin-take-down" disabled={busy} onClick={() => void act("take-down")}>Take down</button>}
      {open.length > 0 && !invitation.removed && <button type="button" className="share-chip" disabled={busy} onClick={() => void act("dismiss")}>Dismiss {open.length === 1 ? "the report" : `${open.length} reports`}</button>}
      <Link className="share-chip" href={`/admin/view/${invitation.slug}`}>Look at it</Link>
    </div>
  </li>;
}

const GROUPS: { title: string; rows: [string, string][] }[] = [
  { title: "Making", rows: [["occasion", "Occasion pages viewed"], ["sample", "Samples opened"], ["studio", "Studio opened"], ["published", "Published"]] },
  { title: "Guests", rows: [["view", "Invitation visits"], ["visitor", "People"], ["played", "Played the opening"], ["reply", "Replies"], ["via-qr", "Visits from QR codes"]] },
  { title: "Growth", rows: [["attribution", "“Create yours free” clicks"]] },
  { title: "Sharing", rows: SHARE_CHANNELS.map(channel => [`share:${channel}`, { whatsapp: "WhatsApp", copy: "Link copied", native: "Share sheet", qr: "QR code shown", personal: "Personal links sent" }[channel]]) },
  { title: "Published by occasion", rows: invitationTemplates.map(t => [`published:${t.id}`, t.category]) },
  { title: "Safety", rows: [["report", "Reports"], ["taken-down", "Taken down"]] },
];

function AdminNumbers({ numbers }: { numbers: Numbers }) {
  const { totals, now, daily, dates } = numbers;
  return <>
    <dl className="manage-insights">
      <div><dt>Live now</dt><dd>{now.live}</dd><span>{now.unpublished} unpublished · {now.takenDown} taken down</span></div>
      <div><dt>Replies kept</dt><dd>{now.replies}</dd></div>
      <div><dt>Open reports</dt><dd>{now.openReports}</dd></div>
    </dl>
    {(["view", "published"] as const).map(name => {
      const counts = daily[name] ?? [];
      const top = Math.max(1, ...counts);
      return <figure className="manage-chart" key={name}>
        <figcaption>{name === "view" ? "Invitation visits" : "Published"}, by day</figcaption>
        <ol className={dates.length > 30 ? "is-dense" : undefined}>{dates.map((day, i) => <li key={day} style={{ "--bar": `${(counts[i] / top) * 100}%` } as CSSProperties} className={counts[i] ? "" : "is-empty"}><span className="studio-sr-only">{formatShortDay(day)}: {counts[i]}</span></li>)}</ol>
        <div className="manage-chart-axis" aria-hidden="true"><span>{formatShortDay(dates[0])}</span><span>{formatShortDay(dates.at(-1)!)}</span></div>
      </figure>;
    })}
    <div className="admin-groups">{GROUPS.map(group => <section key={group.title} className="admin-number-group">
      <h3>{group.title}</h3>
      <dl className="admin-numbers">{group.rows.map(([name, label]) => <div key={name}><dt>{label}</dt><dd>{totals[name] ?? 0}</dd></div>)}</dl>
    </section>)}</div>
  </>;
}
