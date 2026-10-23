"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { HOST_LANG_KEY, HOST_TEXT, hostMessage, type HostText } from "../lib/host-i18n";
import { isLang, type Lang } from "../lib/invitations";

/**
 * The host's language: English until they choose, then remembered on this device. Starts in English on the server
 * and switches once the page is up, so the first render always matches.
 */
export function useHostLang() {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HOST_LANG_KEY);
      if (isLang(saved)) setLang(saved);
    } catch { /* storage blocked: English */ }
  }, []);
  function toggle() {
    const next: Lang = lang === "en" ? "gu" : "en";
    setLang(next);
    try { localStorage.setItem(HOST_LANG_KEY, next); } catch { /* this visit only */ }
  }
  const h = HOST_TEXT[lang];
  return { lang, h, toggle, message: (text: string) => hostMessage(text, lang) };
}

/** The switch in a host screen's header, named in the language it switches to. */
export function HostLangSwitch({ h, toggle }: { h: HostText; toggle: () => void }) {
  return <button type="button" className="inv-lang" aria-label={h.switchLabel} onClick={toggle}><span lang={h.lang === "en" ? "gu" : "en"}>{h.switchTo}</span></button>;
}

/** The host's wording, for components deep in a host screen. */
export const HostTextContext = createContext<HostText>(HOST_TEXT.en);
export const useHostText = () => useContext(HostTextContext);
