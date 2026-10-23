"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { HOST_LANG_KEY, HOST_TEXT, hostMessage, type HostText } from "../lib/host-i18n";
import { LANGS, LANG_NAMES, isLang, type Lang } from "../lib/invitations";
import { LANG_KEY } from "../lib/i18n";

/**
 * The host's language: the link's (?lang=), else the one chosen on this device, else the one they read invitations
 * in as a guest, else English. Starts in English on the server and switches once the page is up, so the first render
 * always matches.
 */
export function useHostLang() {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    const fromLink = new URLSearchParams(location.search).get("lang");
    if (isLang(fromLink)) return setLang(fromLink);
    try {
      const saved = localStorage.getItem(HOST_LANG_KEY) ?? localStorage.getItem(LANG_KEY);
      if (isLang(saved)) setLang(saved);
    } catch { /* storage blocked: English */ }
  }, []);
  function choose(next: Lang) {
    setLang(next);
    try { localStorage.setItem(HOST_LANG_KEY, next); } catch { /* this visit only */ }
  }
  const h = HOST_TEXT[lang];
  return { lang, h, choose, message: (text: string) => hostMessage(text, lang) };
}

/** The switches in a host screen's header: one for each other language, each named in its own language. */
export function HostLangSwitch({ h, choose }: { h: HostText; choose: (lang: Lang) => void }) {
  return <span className="inv-langs">{LANGS.filter(other => other !== h.lang).map(other =>
    <button key={other} type="button" className="inv-lang" aria-label={h.useIn[other]} onClick={() => choose(other)}><span lang={other}>{LANG_NAMES[other]}</span></button>)}</span>;
}

/** The host's wording, for components deep in a host screen. */
export const HostTextContext = createContext<HostText>(HOST_TEXT.en);
export const useHostText = () => useContext(HostTextContext);
