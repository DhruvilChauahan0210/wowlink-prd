"use client";

import { isGuestPage, sourceOf, type PageMetric, type ShareChannel } from "../lib/insights";
import { ownerKey } from "../lib/invitations";

/*
 * The browser's side of counting (see insights.ts). Only plain counts are sent. A browser remembers, in its own
 * storage, that it has been counted, so a person counts once; the host's own browser (the one holding the manage key)
 * isn't counted at all. Nothing waits on these: if one fails, it's simply not counted.
 */

const post = (url: string, body: object, headers: Record<string, string> = {}) =>
  fetch(url, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body), keepalive: true }).catch(() => undefined);

function ownsIt(slug: string) {
  try { return !!localStorage.getItem(ownerKey(slug)); } catch { return false; }
}

/** True the first time this browser asks with `key` (and remembers it). False when storage is blocked: not counted twice. */
function firstTime(key: string) {
  try {
    if (localStorage.getItem(key)) return false;
    localStorage.setItem(key, "1");
    return true;
  } catch { return false; }
}

// Once per page load, even if React runs an effect twice.
const done = new Set<string>();
const once = (key: string) => !done.has(key) && !!done.add(key);

/** Someone opened an invitation. A visit from the printed QR code (?via=qr) is counted as such, and the tag removed. */
export function countVisit(slug: string, guestId?: string) {
  if (!once(`view:${slug}:${guestId ?? ""}`)) return;
  const url = new URL(location.href);
  const viaQr = url.searchParams.get("via") === "qr";
  if (viaQr) {
    url.searchParams.delete("via");
    history.replaceState(history.state, "", url.pathname + url.search + url.hash);
  }
  if (ownsIt(slug)) return;
  void post(`/api/experiences/${slug}/events`, { type: "view", first: firstTime(`wowlink:seen:${slug}`), ...(viaQr && { via: "qr" }), ...(guestId && { guest: guestId }) });
}

/** Someone played the opening: once per browser. */
export function countPlayed(slug: string) {
  if (ownsIt(slug) || !firstTime(`wowlink:played:${slug}`)) return;
  void post(`/api/experiences/${slug}/events`, { type: "played" });
}

/** A guest followed "Create yours free". */
export function countAttribution(slug: string) {
  if (!ownsIt(slug)) void post(`/api/experiences/${slug}/events`, { type: "attribution" });
}

/**
 * A browser WowLink's own team uses (it has opened the admin page) isn't counted on WowLink's pages, so trying things
 * out doesn't swell the numbers.
 */
const TEAM = "wowlink:team";
export function markTeamBrowser() {
  try { localStorage.setItem(TEAM, "1"); } catch { /* this visit only */ }
}
function isTeam() {
  try { return !!localStorage.getItem(TEAM); } catch { return false; }
}

/** True the first time in this browser session (and remembers it). False when storage is blocked. */
function firstInSession(key: string) {
  try {
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, "1");
    return true;
  } catch { return false; }
}

/** A visit to one of WowLink's own pages: once per browser session, and whether it's this browser's first. */
export function countPage(page: PageMetric) {
  if (!once(`page:${page}`) || isTeam() || !firstInSession(`wowlink:counted:${page}`)) return;
  void post("/api/metrics", { page, first: firstTime(`wowlink:visited:${page}`) });
}

const FROM_INVITATION = "wowlink:from-invitation";

/**
 * Someone on WowLink: counted once per browser session, on the first of its own pages they reach, with where they
 * came from (sourceOf) and whether it's this browser's first visit. Someone who opened an invitation first and then
 * went on to WowLink came from the invitation. The link's ?utm_ tags are read, then taken out of the address bar.
 */
export function countSiteVisit(path: string) {
  // Guests' own pages (an invitation, a client preview, reporting one) are counted as invitation visits instead.
  if (isGuestPage(path) || path.startsWith("/report/")) {
    try { sessionStorage.setItem(FROM_INVITATION, "1"); } catch { /* not counted as from it */ }
    return;
  }
  if (path.startsWith("/admin") || !once("site") || isTeam() || !firstInSession("wowlink:counted:site")) return;
  const url = new URL(location.href);
  let fromInvitation = false;
  try { fromInvitation = !!sessionStorage.getItem(FROM_INVITATION); } catch { /* storage blocked */ }
  const tag = url.searchParams.get("utm_source");
  const from = fromInvitation ? "invitation" : sourceOf(tag, document.referrer, location.host);
  const tags = [...url.searchParams.keys()].filter((name) => name.startsWith("utm_"));
  if (tags.length) {
    for (const name of tags) url.searchParams.delete(name);
    history.replaceState(history.state, "", url.pathname + url.search + url.hash);
  }
  // A new tab opened from one of WowLink's own pages is the same visit (each tab has its own session).
  let sameSite = false;
  try { sameSite = new URL(document.referrer).host === location.host; } catch { /* no referrer */ }
  if (sameSite && !tag && from === "direct") return;
  void post("/api/metrics", { page: "site", from, first: firstTime("wowlink:visited") });
}

/** The host shared their invitation one way or another. */
export function countShare(owner: { slug: string; ownerKey: string }, channel: ShareChannel) {
  void post(`/api/experiences/${owner.slug}/shares`, { channel }, { authorization: `Bearer ${owner.ownerKey}` });
}
