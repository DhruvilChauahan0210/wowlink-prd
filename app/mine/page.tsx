"use client";

import { useCallback, useEffect, useId, useState } from "react";
import Link from "next/link";
import { draftKey, formatInvitationDate, getInvitationTemplate, invitationTemplates, ownerKey, readDraft, type InvitationDraft, type TemplateId } from "../lib/invitations";
import type { Experience, Rsvp } from "../lib/store";
import { ArtImage, type ArtName } from "../ui/art";
import { WowLinkBrand } from "../ui/brand";
import type { HostText } from "../lib/host-i18n";
import { HostLangSwitch, useHostLang } from "../ui/host-lang";
import { hasEnded, planOf } from "../lib/plans";
import { savedKeys, signOut, syncAccount, useAccount } from "../ui/account";
import { SignIn } from "../ui/sign-in";
import { SiteFooter } from "../ui/site-footer";

/*
 * Every invitation this device can manage: the ones whose private manage key is saved here (the studio saves it on
 * publishing, and opening a manage link saves it too), and unpublished drafts. Signed in, the account's invitations
 * come to this device too (and this device's join the account). The page also offers a backup of the manage links,
 * and a way to add invitations from a link or a backup.
 */

type Owned = { slug: string; key: string; state: "loading" | "ok" | "gone" | "offline"; experience?: Experience; rsvps?: Rsvp[] };

/** Manage links in any text: a pasted link, several, or a whole backup file. */
const MANAGE_LINK = /\/manage\/([2-9b-df-hjkmnp-tv-zB-DF-HJ-NP-TV-Z]{7})#k=([\w-]{20,})/g;

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
  // Kept as a function of the wording, so it follows the host's language if they switch.
  const [status, setStatus] = useState<(h: HostText) => string>(() => () => "");
  const pasteId = useId();
  const { lang, h, choose } = useHostLang();
  const account = useAccount();

  const load = useCallback(async () => {
    // Signed in: this device and the account share their invitations first.
    const added = (await account.refresh()).email ? await syncAccount() : [];
    if (added.length) setStatus(() => (t: HostText) => t.accountSynced(added.length));
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
    // account.refresh never changes.
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
    if (!links.length) return setStatus(() => (t: HostText) => t.noLinkFound);
    const known = new Set(savedKeys().map(k => k.slug));
    let added = 0;
    try {
      for (const [, slug, key] of links) {
        if (!known.has(slug)) added++;
        localStorage.setItem(ownerKey(slug), key);
      }
    } catch {
      return setStatus(() => (t: HostText) => t.browserWontSave);
    }
    setPaste("");
    setStatus(() => (t: HostText) => (added ? t.addedInvitations(added) : t.alreadyHere));
    void load();
  }

  async function addFromFile(file: File | undefined) {
    if (file) addFromText(await file.text());
  }

  function saveBackup() {
    const list = (owned ?? []).filter(o => o.state === "ok" || o.state === "offline");
    const lines = [
      ...h.backupLines(origin),
      "",
      ...list.flatMap(o => [`${o.experience ? `${o.experience.title} (${formatInvitationDate(o.experience.date, true, lang)})` : o.slug}`, `${origin}/manage/${o.slug}#k=${o.key}`, ""]),
    ];
    const link = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" })), download: "wowlink-manage-links.txt" });
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    setStatus(() => (t: HostText) => t.backupSaved);
  }

  const ready = owned !== null;
  const usable = (owned ?? []).filter(o => o.state !== "gone");

  const kind = (id: TemplateId) => h.occasionNames[id] ?? getInvitationTemplate(id).category;

  return <div className="cinema manage-page mine-page" lang={lang}>
    <header className="studio-header theme-paper">
      <WowLinkBrand/>
      <span className="studio-header-label">{h.myInvitations}</span>
      <div className="studio-header-actions"><HostLangSwitch h={h} choose={choose}/><Link className="cin-cta cin-cta-light studio-save" href="/templates"><span className="label-long">{h.newInvitation}</span><span className="label-short">{h.newShort}</span></Link></div>
    </header>
    <main className="manage theme-paper">
      <section className="mine-intro">
        <h1>{h.mineHeading[0]} <span className="scribble">{h.mineHeading[1]}</span></h1>
        <p className="manage-muted">{h.mineIntro}</p>
      </section>

      {account.accounts && <section className="sketch-card manage-card mine-account" aria-labelledby="account-heading">
        <h2 id="account-heading">{h.accountHeading}</h2>
        {account.email ? <p className="manage-muted">{h.signedInAs(account.email)} <button type="button" className="share-chip" onClick={() => void signOut().then(() => account.refresh())}>{h.signOut}</button></p>
          : <><p className="manage-muted">{h.accountBody}</p><SignIn h={h} next="/mine"/></>}
      </section>}

      {!ready && <p className="manage-loading">{h.finding}</p>}
      {ready && !owned.length && !drafts.length && <section className="sketch-card manage-card mine-empty">
        <h2>{h.nothingYet}</h2>
        <p className="manage-muted">{h.nothingYetBody}</p>
        <Link className="cin-cta cin-cta-light" href="/templates">{h.makeFirst}</Link>
      </section>}

      {ready && owned.length > 0 && <ul className="mine-list">{owned.map(o => <li key={o.slug} className="sketch-card mine-item">
        {o.experience && <Link className="cin-print mine-print" href={`/manage/${o.slug}`} tabIndex={-1} aria-hidden="true"><span className="cin-photo"><ArtImage name={o.experience.templateId as ArtName} fit="slice"/></span></Link>}
        <div className="mine-body">
          {o.state === "loading" && <p className="manage-muted">{h.loading}</p>}
          {o.state === "ok" && o.experience && <>
            <span className="mine-kind">{kind(o.experience.templateId)}</span>
            <h2><Link href={`/manage/${o.slug}`}>{o.experience.title}</Link></h2>
            <p className="manage-muted">{formatInvitationDate(o.experience.date, true, lang)} · <span className={`manage-status is-${o.experience.removed ? "removed" : o.experience.status}`}>{o.experience.removed ? h.takenDown : o.experience.status !== "published" ? h.unpublished : hasEnded(o.experience) ? h.ended : h.live}</span></p>
            <p className="mine-counts">{summary(o.rsvps ?? [], o.experience, h)}</p>
            <div className="mine-actions">
              <Link className="share-chip" href={`/manage/${o.slug}`}>{h.repliesAndGuests}</Link>
              {o.experience.status === "published" && !o.experience.removed && !hasEnded(o.experience) && <a className="share-chip" href={`/e/${o.slug}`} target="_blank" rel="noreferrer">{h.open}</a>}
              {!o.experience.removed && <Link className="share-chip" href={`/create?edit=${o.slug}`}>{h.edit}</Link>}
              {planOf(o.experience) === "pro" && <Link className="share-chip" href={`/create?copy=${o.slug}`} aria-label={h.copyFor(o.experience.title)}>{h.copyShort}</Link>}
            </div>
          </>}
          {o.state === "gone" && <>
            <h2 className="mine-gone-title">{h.goneTitle}</h2>
            <p className="manage-muted">{h.goneBody(o.slug)}</p>
            <button type="button" className="share-chip" onClick={() => forget(o.slug)}>{h.forget}</button>
          </>}
          {o.state === "offline" && <>
            <h2 className="mine-gone-title">{h.couldntLoad(o.slug)}</h2>
            <p className="manage-muted">{h.offlineBody}</p>
            <button type="button" className="share-chip" onClick={() => void load()}>{h.tryAgain}</button>
          </>}
        </div>
      </li>)}</ul>}

      {drafts.length > 0 && <section className="sketch-card manage-card" aria-labelledby="drafts-heading">
        <h2 id="drafts-heading">{h.draftsHeading}</h2>
        <ul className="mine-drafts">{drafts.map(({ templateId, draft }) => <li key={templateId}>
          <div><strong>{draft.title || h.untitled}</strong><span className="manage-muted">{kind(templateId)} · {h.notPublishedYet}</span></div>
          <Link className="share-chip" href={`/create?template=${templateId}`}>{h.keepEditing}</Link>
          <button type="button" className="share-chip" onClick={() => discardDraft(templateId)} aria-label={h.discardDraft(kind(templateId))}>{h.discard}</button>
        </li>)}</ul>
      </section>}

      <section className="sketch-card manage-card" aria-labelledby="backup-heading">
        <h2 id="backup-heading">{h.keepSafe}</h2>
        <p className="manage-muted">{h.keepSafeBody}</p>
        {usable.length > 0 && <div className="mine-backup"><button type="button" className="cin-cta cin-cta-outline" onClick={saveBackup}>{h.saveLinks}</button><span className="manage-muted">{h.saveLinksNote}</span></div>}
        <div className="studio-field mine-add">
          <label htmlFor={pasteId}>{h.addFrom}</label>
          <textarea id={pasteId} rows={3} value={paste} placeholder={`${origin || "https://…"}/manage/…#k=…`} onChange={e => { setPaste(e.target.value); setStatus(() => () => ""); }}/>
          <div className="mine-add-actions">
            <button type="button" className="cin-cta cin-cta-light" onClick={() => addFromText(paste)} disabled={!paste.trim()}>{h.add}</button>
            <label className="share-chip mine-file">{h.chooseFile}<input type="file" accept=".txt,text/plain" onChange={e => { void addFromFile(e.target.files?.[0]); e.target.value = ""; }}/></label>
          </div>
        </div>
        <p className="share-status" role="status">{status(h)}</p>
      </section>
    </main>
    <SiteFooter lang={lang}/>
  </div>;
}

/** "12 replies · 38 coming", or how many households have a personal invitation and no reply yet. */
function summary(rsvps: Rsvp[], experience: Experience, h: HostText) {
  if (!rsvps.length) return experience.guests.length ? `${h.noRepliesShort} · ${h.sentInvitations(experience.guests.length)}` : h.noRepliesShort;
  const coming = rsvps.filter(r => r.attendance === "Attending").reduce((n, r) => n + r.guestCount, 0);
  const waiting = experience.guests.filter(g => !rsvps.some(r => r.guestId === g.id)).length;
  return [h.replies(rsvps.length), h.comingN(coming), waiting && h.waitingN(waiting)].filter(Boolean).join(" · ");
}
