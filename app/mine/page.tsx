"use client";

import { useCallback, useEffect, useId, useState } from "react";
import Link from "next/link";
import { draftKey, formatInvitationDate, getInvitationTemplate, invitationTemplates, ownerKey, readDraft, type InvitationDraft, type TemplateId } from "../lib/invitations";
import type { Experience, Rsvp } from "../lib/store";
import { ArtImage, type ArtName } from "../ui/art";
import { WowLinkBrand } from "../ui/brand";

/*
 * Every invitation this device can manage: the ones whose private manage key is saved here (the studio saves it on
 * publishing, and opening a manage link saves it too), and unpublished drafts. There are no accounts yet, so the
 * page also offers a backup of the manage links, and a way to add invitations from a link or a backup.
 */

type Owned = { slug: string; key: string; state: "loading" | "ok" | "gone" | "offline"; experience?: Experience; rsvps?: Rsvp[] };

const OWNER_PREFIX = ownerKey("");
/** Manage links in any text: a pasted link, several, or a whole backup file. */
const MANAGE_LINK = /\/manage\/([2-9b-df-hjkmnp-tv-zB-DF-HJ-NP-TV-Z]{7})#k=([\w-]{20,})/g;

function savedKeys() {
  const found: { slug: string; key: string }[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const name = localStorage.key(i);
      const key = name?.startsWith(OWNER_PREFIX) ? localStorage.getItem(name) : null;
      if (name && key) found.push({ slug: name.slice(OWNER_PREFIX.length), key });
    }
  } catch { /* storage blocked: nothing saved here */ }
  return found;
}

function savedDrafts() {
  return invitationTemplates.flatMap(template => {
    const draft = readDraft(template.id);
    return draft ? [{ templateId: template.id as TemplateId, draft }] : [];
  });
}

const today = () => new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10);
/** Coming up soonest first, then the ones that have passed, most recent first. */
function byDate(a: Owned, b: Owned) {
  const [x, y] = [a.experience?.date ?? "", b.experience?.date ?? ""];
  const [xPast, yPast] = [x < today(), y < today()];
  if (xPast !== yPast) return xPast ? 1 : -1;
  return xPast ? y.localeCompare(x) : x.localeCompare(y);
}

export default function MyInvitations() {
  const [owned, setOwned] = useState<Owned[] | null>(null);
  const [drafts, setDrafts] = useState<{ templateId: TemplateId; draft: InvitationDraft }[]>([]);
  const [origin, setOrigin] = useState("");
  const [paste, setPaste] = useState("");
  const [status, setStatus] = useState("");
  const pasteId = useId();

  const load = useCallback(async () => {
    const keys = savedKeys();
    setOwned(keys.map(k => ({ ...k, state: "loading" })));
    setDrafts(savedDrafts());
    const results = await Promise.all(keys.map(async ({ slug, key }): Promise<Owned> => {
      try {
        const response = await fetch(`/api/experiences/${slug}`, { headers: { authorization: `Bearer ${key}` }, cache: "no-store" });
        if (response.status === 404) return { slug, key, state: "gone" };
        if (!response.ok) throw new Error();
        const { experience, rsvps } = (await response.json()) as { experience: Experience; rsvps: Rsvp[] };
        return { slug, key, state: "ok", experience, rsvps };
      } catch {
        return { slug, key, state: "offline" };
      }
    }));
    setOwned(results.sort(byDate));
  }, []);

  useEffect(() => {
    setOrigin(location.origin);
    void load();
  }, [load]);

  function forget(slug: string) {
    try { localStorage.removeItem(ownerKey(slug)); } catch { /* nothing to do */ }
    setOwned(now => now?.filter(o => o.slug !== slug) ?? null);
  }
  function discardDraft(templateId: TemplateId) {
    try { localStorage.removeItem(draftKey(templateId)); } catch { /* nothing to do */ }
    setDrafts(now => now.filter(d => d.templateId !== templateId));
  }

  function addFromText(text: string) {
    const links = [...text.matchAll(MANAGE_LINK)];
    if (!links.length) return setStatus("There’s no manage link in that. A manage link has /manage/ and #k= in it.");
    const known = new Set(savedKeys().map(k => k.slug));
    let added = 0;
    try {
      for (const [, slug, key] of links) {
        if (!known.has(slug)) added++;
        localStorage.setItem(ownerKey(slug), key);
      }
    } catch {
      return setStatus("This browser won’t save them (private browsing?). Open each manage link instead.");
    }
    setPaste("");
    setStatus(added ? `Added ${added} ${added === 1 ? "invitation" : "invitations"}.` : "Those are already here.");
    void load();
  }

  async function addFromFile(file: File | undefined) {
    if (file) addFromText(await file.text());
  }

  function saveBackup() {
    const list = (owned ?? []).filter(o => o.state === "ok" || o.state === "offline");
    const lines = [
      "WowLink: your invitations",
      "Keep this file private. Anyone with these links can edit your invitations and see every reply.",
      "To use them on another phone or computer, open a link, or paste this whole file at " + `${origin}/mine` + ".",
      "",
      ...list.flatMap(o => [`${o.experience ? `${o.experience.title} (${formatInvitationDate(o.experience.date, true)})` : o.slug}`, `${origin}/manage/${o.slug}#k=${o.key}`, ""]),
    ];
    const link = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" })), download: "wowlink-manage-links.txt" });
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    setStatus("Saved. Keep the file somewhere safe and private.");
  }

  const ready = owned !== null;
  const usable = (owned ?? []).filter(o => o.state !== "gone");

  return <div className="cinema manage-page mine-page">
    <header className="studio-header theme-paper">
      <WowLinkBrand/>
      <span className="studio-header-label">My invitations</span>
      <div className="studio-header-actions"><Link className="cin-cta cin-cta-light studio-save" href="/templates">New invitation</Link></div>
    </header>
    <main className="manage theme-paper">
      <section className="mine-intro">
        <h1>My <span className="scribble">invitations</span></h1>
        <p className="manage-muted">Everything you can manage from this device. There are no accounts yet: an invitation is yours through its private manage link, which is saved here when you publish or open it.</p>
      </section>

      {!ready && <p className="manage-loading">Finding your invitations…</p>}
      {ready && !owned.length && !drafts.length && <section className="sketch-card manage-card mine-empty">
        <h2>Nothing here yet</h2>
        <p className="manage-muted">Invitations you publish on this device show up here. Made one somewhere else? Add it below with its manage link.</p>
        <Link className="cin-cta cin-cta-light" href="/templates">Make your first invitation</Link>
      </section>}

      {ready && owned.length > 0 && <ul className="mine-list">{owned.map(o => <li key={o.slug} className="sketch-card mine-item">
        {o.experience && <Link className="cin-print mine-print" href={`/manage/${o.slug}`} tabIndex={-1} aria-hidden="true"><span className="cin-photo"><ArtImage name={o.experience.templateId as ArtName} fit="slice"/></span></Link>}
        <div className="mine-body">
          {o.state === "loading" && <p className="manage-muted">Loading…</p>}
          {o.state === "ok" && o.experience && <>
            <span className="mine-kind">{getInvitationTemplate(o.experience.templateId).category}</span>
            <h2><Link href={`/manage/${o.slug}`}>{o.experience.title}</Link></h2>
            <p className="manage-muted">{formatInvitationDate(o.experience.date, true)} · <span className={`manage-status is-${o.experience.status}`}>{o.experience.status === "published" ? "Live" : "Unpublished"}</span></p>
            <p className="mine-counts">{summary(o.rsvps ?? [], o.experience)}</p>
            <div className="mine-actions">
              <Link className="share-chip" href={`/manage/${o.slug}`}>Replies &amp; guests</Link>
              {o.experience.status === "published" && <a className="share-chip" href={`/e/${o.slug}`} target="_blank" rel="noreferrer">Open</a>}
              <Link className="share-chip" href={`/create?edit=${o.slug}`}>Edit</Link>
            </div>
          </>}
          {o.state === "gone" && <>
            <h2 className="mine-gone-title">An invitation that’s no longer here</h2>
            <p className="manage-muted">The link saved on this device doesn’t open anything any more ({o.slug}).</p>
            <button type="button" className="share-chip" onClick={() => forget(o.slug)}>Forget it on this device</button>
          </>}
          {o.state === "offline" && <>
            <h2 className="mine-gone-title">Couldn’t load {o.slug}</h2>
            <p className="manage-muted">Check your connection and try again.</p>
            <button type="button" className="share-chip" onClick={() => void load()}>Try again</button>
          </>}
        </div>
      </li>)}</ul>}

      {drafts.length > 0 && <section className="sketch-card manage-card" aria-labelledby="drafts-heading">
        <h2 id="drafts-heading">Drafts on this device</h2>
        <ul className="mine-drafts">{drafts.map(({ templateId, draft }) => <li key={templateId}>
          <div><strong>{draft.title || "Untitled"}</strong><span className="manage-muted">{getInvitationTemplate(templateId).category} · not published yet</span></div>
          <Link className="share-chip" href={`/create?template=${templateId}`}>Keep editing</Link>
          <button type="button" className="share-chip" onClick={() => discardDraft(templateId)} aria-label={`Discard the ${getInvitationTemplate(templateId).category.toLowerCase()} draft`}>Discard</button>
        </li>)}</ul>
      </section>}

      <section className="sketch-card manage-card" aria-labelledby="backup-heading">
        <h2 id="backup-heading">Keep them safe</h2>
        <p className="manage-muted">Your manage links are only saved in this browser. Save a copy, or add an invitation you made somewhere else.</p>
        {usable.length > 0 && <div className="mine-backup"><button type="button" className="cin-cta cin-cta-outline" onClick={saveBackup}>Save my manage links</button><span className="manage-muted">A small text file. Keep it private: anyone with it can edit your invitations.</span></div>}
        <div className="studio-field mine-add">
          <label htmlFor={pasteId}>Add from a manage link or a backup</label>
          <textarea id={pasteId} rows={3} value={paste} placeholder={`${origin || "https://…"}/manage/…#k=…`} onChange={e => { setPaste(e.target.value); setStatus(""); }}/>
          <div className="mine-add-actions">
            <button type="button" className="cin-cta cin-cta-light" onClick={() => addFromText(paste)} disabled={!paste.trim()}>Add</button>
            <label className="share-chip mine-file">Or choose the backup file<input type="file" accept=".txt,text/plain" onChange={e => { void addFromFile(e.target.files?.[0]); e.target.value = ""; }}/></label>
          </div>
        </div>
        <p className="share-status" role="status">{status}</p>
      </section>
    </main>
  </div>;
}

/** "12 replies · 38 coming", or how many households have a personal invitation and no reply yet. */
function summary(rsvps: Rsvp[], experience: Experience) {
  if (!rsvps.length) return experience.guests.length ? `No replies yet · ${experience.guests.length} personal ${experience.guests.length === 1 ? "invitation" : "invitations"} sent` : "No replies yet";
  const coming = rsvps.filter(r => r.attendance === "Attending").reduce((n, r) => n + r.guestCount, 0);
  const waiting = experience.guests.filter(g => !rsvps.some(r => r.guestId === g.id)).length;
  return [`${rsvps.length} ${rsvps.length === 1 ? "reply" : "replies"}`, `${coming} coming`, waiting && `${waiting} yet to reply`].filter(Boolean).join(" · ");
}
