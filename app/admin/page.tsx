"use client";

import { useCallback, useEffect, useState, type CSSProperties, type FormEvent } from "react";
import Link from "next/link";
import { getInvitationTemplate, formatInvitationDate, formatShortDay, invitationTemplates } from "../lib/invitations";
import { SHARE_CHANNELS, SOURCES, percent } from "../lib/insights";
import { MOOD_EMOJI, type Feedback } from "../lib/feedback";
import { REASON_TEXT } from "../lib/reports";
import type { AdminInvitation, AdminUpgrade, Moderation, appNumbers } from "../lib/store";
import type { ServerError } from "../lib/errors";
import { WowLinkBrand } from "../ui/brand";
import { HOST_TEXT } from "../lib/host-i18n";
import { SignIn } from "../ui/sign-in";
import { signOut as signOutAccount, useAccount } from "../ui/account";
import { markTeamBrowser } from "../ui/counting";
import { SiteFooter } from "../ui/site-footer";

/*
 * WowLink's own admin: feedback, reports to look at, taking an invitation down (or back up), and the app's numbers
 * (with the funnel from a first visit to a reply). The browser it's opened in stops being counted. Opened by
 * signing in with a Google account listed in WOWLINK_ADMINS, or with the admin key (WOWLINK_ADMIN_KEY: `npm run dev`
 * and the tests), which is kept for this browser tab only.
 */

const KEY = "wowlink:admin-key";
type Numbers = Awaited<ReturnType<typeof appNumbers>> & { days: number };

/** An admin call: its data, or null with why (429 when too many wrong keys were tried from here). */
async function request<T>(key: string, path: string, init: RequestInit = {}): Promise<{ data: T | null; status: number }> {
  // Without a key, the signed-in account is what counts.
  const response = await fetch(`/api/admin${path}`, { ...init, headers: { "content-type": "application/json", ...(key && { authorization: `Bearer ${key}` }) }, cache: "no-store" }).catch(() => null);
  return { data: response?.ok ? ((await response.json()) as T) : null, status: response?.status ?? 0 };
}
const call = async <T,>(key: string, path: string, init: RequestInit = {}) => (await request<T>(key, path, init)).data;

export default function AdminPage() {
  const account = useAccount();
  // Open: by the signed-in account (key "") or by a key.
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");
  const [typed, setTyped] = useState("");
  const [wrong, setWrong] = useState<"" | "key" | "locked">("");
  // Announced to screen readers: what the last action did.
  const [message, setMessage] = useState("");
  const [reported, setReported] = useState<AdminInvitation[] | null>(null);
  const [requests, setRequests] = useState<AdminUpgrade[]>([]);
  const [numbers, setNumbers] = useState<Numbers | null>(null);
  const [errors, setErrors] = useState<ServerError[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [days, setDays] = useState(30);
  const [lookup, setLookup] = useState("");
  const [found, setFound] = useState<AdminInvitation | null | "none">(null);

  // The key is checked with one request (each wrong one counts towards the lockout), then the numbers are fetched.
  const load = useCallback(async (k: string, d: number) => {
    const reports = await request<{ invitations: AdminInvitation[] }>(k, "/reports");
    if (!reports.data) return reports.status;
    setReported(reports.data.invitations);
    markTeamBrowser();
    const [nums, upgrades, failures, notes] = await Promise.all([call<Numbers>(k, `/numbers?days=${d}`), call<{ requests: AdminUpgrade[] }>(k, "/upgrades"), call<{ errors: ServerError[] }>(k, "/errors"), call<{ feedback: Feedback[] }>(k, "/feedback")]);
    if (nums) setNumbers(nums);
    if (notes) setFeedback(notes.feedback);
    if (upgrades) setRequests(upgrades.requests);
    if (failures) setErrors(failures.errors);
    return 200;
  }, []);

  // A signed-in admin goes straight in; otherwise a key kept for this tab, if any.
  useEffect(() => {
    if (!account.ready) return;
    if (account.admin) {
      void load("", 30).then(status => { if (status === 200) setOpen(true); });
      return;
    }
    let saved = "";
    try { saved = sessionStorage.getItem(KEY) ?? ""; } catch { /* this tab only */ }
    if (saved) void load(saved, 30).then(status => {
      if (status === 200) {
        setKey(saved);
        setOpen(true);
      } else try { sessionStorage.removeItem(KEY); } catch { /* nothing saved */ }
    });
  }, [load, account.ready, account.admin]);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    const k = typed.trim();
    const status = await load(k, days);
    if (status === 200) {
      setKey(k);
      setOpen(true);
      setWrong("");
      try { sessionStorage.setItem(KEY, k); } catch { /* this visit only */ }
    } else setWrong(status === 429 ? "locked" : "key");
  }
  async function signOut() {
    try { sessionStorage.removeItem(KEY); } catch { /* nothing saved */ }
    if (!key) {
      await signOutAccount();
      await account.refresh();
    }
    setOpen(false); setKey(""); setTyped(""); setReported(null); setNumbers(null); setFound(null); setMessage("");
  }

  async function act(slug: string, action: Moderation) {
    const result = await call<{ invitation: AdminInvitation }>(key, `/invitations/${slug}`, { method: "POST", body: JSON.stringify({ action }) });
    if (result && found && found !== "none" && found.slug === slug) setFound(result.invitation);
    await load(key, days);
    if (!result) return setMessage("That didn’t work. Try again.");
    setMessage(`${{ "take-down": "Taken down", restore: "Restored", dismiss: "Reports dismissed", "make-pro": "Moved to the Creator studio", "make-free": "Moved to the free plan" }[action]}: ${result.invitation.title}`);
    // The list re-sorts, so focus goes back to the invitation's own heading.
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-admin-card="${slug}"] h3`)?.focus());
  }
  async function decide(id: string, action: "approve" | "decline", title: string) {
    const result = await call<{ ok: boolean }>(key, `/upgrades/${id}`, { method: "POST", body: JSON.stringify({ action }) });
    await load(key, days);
    setMessage(result ? `${action === "approve" ? "Moved to the Creator studio" : "Declined"}: ${title}` : "That didn’t work. Try again.");
  }
  async function markNote(note: Feedback) {
    const result = await call<{ ok: boolean }>(key, `/feedback/${note.id}`, { method: "POST", body: JSON.stringify({ action: note.doneAt ? "reopen" : "done" }) });
    const notes = await call<{ feedback: Feedback[] }>(key, "/feedback");
    if (notes) setFeedback(notes.feedback);
    setMessage(result ? (note.doneAt ? "Opened again" : "Marked done") : "That didn’t work. Try again.");
  }
  async function find(event: FormEvent) {
    event.preventDefault();
    // A whole link (the part after /e/, a personal link's household dropped), or just its code or custom link.
    const text = lookup.trim();
    const link = text.match(/\/e\/([^/?#\s]+)/)?.[1] ?? text.replace(/[?#].*$/, "").replace(/\/+$/, "");
    const result = /^[A-Za-z0-9-]{4,40}$/.test(link) ? await call<{ invitation: AdminInvitation }>(key, `/invitations/${link}`) : null;
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
      <div className="studio-header-actions">{open && <button type="button" className="share-chip" onClick={() => void signOut()}>Sign out</button>}</div>
    </header>
    <main className="manage theme-paper">
      {!open ? <section className="sketch-card manage-card admin-sign-in">
        <h1>WowLink admin</h1>
        {account.email && !account.admin && <p className="manage-muted">Signed in as {account.email}, which isn’t an admin account.</p>}
        {account.accounts && !account.email && <><p className="manage-muted">Sign in with an admin’s Google account.</p><SignIn h={HOST_TEXT.en} next="/admin"/></>}
        {account.ready && !account.admin && <details className="admin-key-option" open={!account.accounts}>
        <summary>Use the admin key</summary>
        <form onSubmit={signIn}>
          <div className="studio-field">
            <label htmlFor="admin-key">Admin key</label>
            <input id="admin-key" type="password" autoComplete="current-password" value={typed} onChange={e => { setTyped(e.target.value); setWrong(""); }} aria-invalid={wrong ? true : undefined} aria-describedby={wrong ? "admin-key-error" : undefined}/>
            {wrong && <p className="studio-error" id="admin-key-error" role="alert">{wrong === "locked" ? "Too many wrong tries from here. Try again in an hour." : "That key didn’t open it. (A key only works when WOWLINK_ADMIN_KEY is set on the server; on a live site it needs at least 24 characters.)"}</p>}
          </div>
          <button type="submit" className="cin-cta cin-cta-light" disabled={!typed.trim()}>Open</button>
        </form>
        </details>}
      </section> : <>
        <h1 className="studio-sr-only">WowLink admin</h1>
        <section className="sketch-card manage-card" aria-labelledby="feedback-heading">
          <h2 id="feedback-heading">Feedback{feedback.some(n => !n.doneAt) && <span className="admin-count"> · {feedback.filter(n => !n.doneAt).length} new</span>}</h2>
          {!feedback.length ? <p className="manage-muted">No feedback yet. It comes from the Feedback button on WowLink’s pages.</p> : <ul className="admin-feedback">{feedback.map(note => <li key={note.id} className={note.doneAt ? "is-done" : undefined}>
            <p className="admin-feedback-message">{note.mood && <span className="admin-feedback-mood" title={note.mood}>{MOOD_EMOJI[note.mood]}</span>}{note.message}</p>
            <p className="manage-muted">{new Date(note.at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · from <code>{note.page}</code>{note.contact && <> · <strong>{note.contact}</strong></>}</p>
            <button type="button" className="share-chip" onClick={() => void markNote(note)}>{note.doneAt ? "Open again" : "Mark done"}</button>
          </li>)}</ul>}
        </section>

        <section className="sketch-card manage-card" aria-labelledby="requests-heading">
          <h2 id="requests-heading">Creator studio requests</h2>
          {!requests.length ? <p className="manage-muted">No requests yet.</p> : <ul className="admin-list">{requests.map(request => <li key={request.id} className="admin-card">
            <div className="admin-card-head">
              <div>
                <span className="mine-kind">{getInvitationTemplate(request.invitation.templateId).category}</span>
                <h3><Link href={`/admin/view/${request.invitation.slug}`}>{request.invitation.title}</Link></h3>
                <p className="manage-muted">Asked {formatShortDay(request.createdAt)} · for {formatInvitationDate(request.invitation.date, true)}</p>
              </div>
              <span className={`manage-plan${request.status === "approved" ? " is-pro" : ""}`}>{request.status === "open" ? "Waiting" : request.status === "approved" ? "Approved" : "Declined"}</span>
            </div>
            {(request.note || request.contact) && <ul className="admin-reports"><li>{request.note && <span className="admin-report-details">“{request.note}”</span>}{request.contact && <strong>{request.contact}</strong>}</li></ul>}
            {request.status === "open" && <div className="manage-actions">
              <button type="button" className="cin-cta cin-cta-light" onClick={() => void decide(request.id, "approve", request.invitation.title)}>Approve</button>
              <button type="button" className="share-chip" onClick={() => void decide(request.id, "decline", request.invitation.title)}>Decline</button>
            </div>}
          </li>)}</ul>}
        </section>

        <section className="sketch-card manage-card" aria-labelledby="reports-heading">
          <h2 id="reports-heading">Reports</h2>
          {!reported?.length ? <p className="manage-muted">No reports yet.</p> : <ul className="admin-list">{reported.map(invitation => <AdminCard key={invitation.slug} invitation={invitation} onAct={act}/>)}</ul>}
        </section>

        <section className="sketch-card manage-card" aria-labelledby="find-heading">
          <h2 id="find-heading">Find an invitation</h2>
          <form className="admin-find" onSubmit={find}>
            <label className="studio-sr-only" htmlFor="admin-find">Invitation link</label>
            <input id="admin-find" value={lookup} placeholder="https://…/e/… or its code or custom link" onChange={e => setLookup(e.target.value)}/>
            <button type="submit" className="cin-cta cin-cta-outline" disabled={!lookup.trim()}>Find</button>
          </form>
          {found === "none" && <p className="manage-muted">There’s no invitation at that link.</p>}
          {found && found !== "none" && <ul className="admin-list"><AdminCard invitation={found} onAct={act}/></ul>}
        </section>

        <section className="sketch-card manage-card" aria-labelledby="errors-heading">
          <h2 id="errors-heading">Server errors</h2>
          {!errors.length ? <p className="manage-muted">None recorded.</p> : <ul className="admin-errors">{errors.map((e, i) => <li key={i}>
            <span className="manage-muted">{new Date(e.at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span> <code>{e.method} {e.path}</code>
            <p>{e.message}</p>
          </li>)}</ul>}
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
    <SiteFooter/>
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
      <span><span className={`manage-status is-${invitation.removed ? "removed" : invitation.status}`}>{status}</span> <span className={`manage-plan${invitation.plan === "pro" ? " is-pro" : ""}`}>{invitation.plan === "pro" ? "Creator studio" : "Free plan"}</span></span>
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
      {/* Until payments exist, the Creator studio is given by hand. */}
      <button type="button" className="share-chip" disabled={busy} onClick={() => void act(invitation.plan === "pro" ? "make-free" : "make-pro")}>{invitation.plan === "pro" ? "Move to the free plan" : "Move to the Creator studio"}</button>
    </div>
  </li>;
}

/** Step by step: hosts from a first visit to publishing, guests from opening an invitation to replying. */
const FUNNELS: { title: string; steps: [string, string][] }[] = [
  { title: "Hosts", steps: [["site-visitor", "Visited WowLink"], ["studio-visitor", "Opened the studio"], ["signup", "Made an account"], ["published", "Invitations published"]] },
  { title: "Guests", steps: [["visitor", "Opened an invitation"], ["played", "Played the opening"], ["reply", "Replies"]] },
];
const SOURCE_NAMES: Record<(typeof SOURCES)[number], string> = { instagram: "Instagram", whatsapp: "WhatsApp", youtube: "YouTube", facebook: "Facebook", google: "Google", linkedin: "LinkedIn", x: "X", invitation: "A WowLink invitation", other: "Other sites", direct: "Direct (typed, a bookmark, or an app that doesn’t say)" };

const GROUPS: { title: string; rows: [string, string][] }[] = [
  { title: "Visitors", rows: [["site", "Visits"], ["site-visitor", "New visitors"]] },
  { title: "Accounts", rows: [["signin", "Sign-ins"], ["signup", "New accounts"]] },
  { title: "Making", rows: [["occasion", "Occasion pages viewed"], ["sample", "Samples opened"], ["studio", "Studio opened"], ["studio-visitor", "People who opened the studio"], ["published", "Published"]] },
  { title: "Guests", rows: [["view", "Invitation visits"], ["visitor", "People"], ["played", "Played the opening"], ["reply", "Replies"], ["via-qr", "Visits from QR codes"]] },
  { title: "Growth", rows: [["attribution", "“Create yours free” clicks"]] },
  { title: "Sharing", rows: SHARE_CHANNELS.map(channel => [`share:${channel}`, { whatsapp: "WhatsApp", copy: "Link copied", native: "Share sheet", qr: "QR code shown", personal: "Personal links sent" }[channel]]) },
  { title: "Published by occasion", rows: invitationTemplates.map(t => [`published:${t.id}`, t.category]) },
  { title: "Safety", rows: [["report", "Reports"], ["taken-down", "Taken down"]] },
  { title: "Creator studio", rows: [["upgrade-request", "Requests"]] },
  { title: "Feedback", rows: [["feedback", "Notes sent"]] },
];

function AdminNumbers({ numbers }: { numbers: Numbers }) {
  const { totals, now, daily, dates } = numbers;
  return <>
    <dl className="manage-insights">
      <div><dt>Live now</dt><dd>{now.live}</dd><span>{now.unpublished} unpublished · {now.takenDown} taken down · {now.pro} in the Creator studio</span></div>
      <div><dt>Replies kept</dt><dd>{now.replies}</dd></div>
      <div><dt>Open reports</dt><dd>{now.openReports}</dd></div>
    </dl>
    <div className="admin-funnels">{FUNNELS.map(funnel => {
      const top = Math.max(1, totals[funnel.steps[0][0]] ?? 0);
      return <section key={funnel.title} className="admin-funnel" aria-label={`${funnel.title} funnel`}>
        <h3>{funnel.title}</h3>
        <ol>{funnel.steps.map(([name, label], i) => {
          const n = totals[name] ?? 0;
          const before = i ? totals[funnel.steps[i - 1][0]] ?? 0 : 0;
          return <li key={name} style={{ "--bar": `${Math.min(100, Math.max(n ? 2 : 0, (n / top) * 100))}%` } as CSSProperties}>
            <span className="admin-funnel-label">{label}</span>
            <span className="admin-funnel-count">{n}</span>
            {i > 0 && <span className="admin-funnel-rate">{before ? `${percent(n, before)}% of the step before` : "—"}</span>}
          </li>;
        })}</ol>
      </section>;
    })}</div>
    <p className="manage-muted admin-funnel-note">Visitors, studio openers and guests count once per browser, their first time; the other steps count accounts, invitations and replies. Visits and studio openings from WowLink’s own browsers (where the admin has been opened) don’t count; invitations published from them do.</p>
    <Sources totals={totals}/>
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

/** Where visits came from, most first. */
function Sources({ totals }: { totals: Record<string, number> }) {
  const rows = SOURCES.map(source => [source, totals[`from:${source}`] ?? 0] as const).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  const all = rows.reduce((sum, [, n]) => sum + n, 0);
  return <section className="admin-sources" aria-labelledby="sources-heading">
    <h3 id="sources-heading">Where visits come from</h3>
    {!rows.length ? <p className="manage-muted">No visits counted yet.</p> : <ul>{rows.map(([source, n]) => <li key={source} style={{ "--bar": `${(n / rows[0][1]) * 100}%` } as CSSProperties}>
      <span>{SOURCE_NAMES[source]}</span><span className="admin-funnel-count">{n}</span><span className="admin-funnel-rate">{percent(n, all)}%</span>
    </li>)}</ul>}
    <p className="manage-muted">To tell your own posts apart, add a tag to the link you share: <code>?utm_source=instagram</code>, <code>whatsapp</code>, <code>youtube</code>…</p>
  </section>;
}
