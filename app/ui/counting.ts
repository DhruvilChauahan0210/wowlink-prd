"use client";

import type { PageMetric, ShareChannel } from "../lib/insights";
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

/** A visit to one of WowLink's own pages: once per browser session. */
export function countPage(page: PageMetric) {
  if (!once(`page:${page}`)) return;
  try {
    if (sessionStorage.getItem(`wowlink:counted:${page}`)) return;
    sessionStorage.setItem(`wowlink:counted:${page}`, "1");
  } catch { return; }
  void post("/api/metrics", { page });
}

/** The host shared their invitation one way or another. */
export function countShare(owner: { slug: string; ownerKey: string }, channel: ShareChannel) {
  void post(`/api/experiences/${owner.slug}/shares`, { channel }, { authorization: `Bearer ${owner.ownerKey}` });
}
