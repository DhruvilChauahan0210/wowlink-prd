import type { Lang } from "./invitations";

/** Where a host's chosen language for WowLink's own screens is kept on their device (host-lang.tsx reads it). */
export const HOST_LANG_KEY = "wowlink:host-lang";

/**
 * A guest who goes on to make their own invitation keeps reading in their language: remember it for the studio,
 * unless this device already chose one.
 */
export function carryLangToStudio(lang: Lang) {
  try {
    if (lang !== "en" && !localStorage.getItem(HOST_LANG_KEY)) localStorage.setItem(HOST_LANG_KEY, lang);
  } catch { /* storage blocked: the studio starts in English */ }
}
