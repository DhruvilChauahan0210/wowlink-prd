"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { FEEDBACK_LIMITS, MOOD_EMOJI, MOODS, type Mood } from "../lib/feedback";
import { isLang, type Lang } from "../lib/invitations";

/*
 * The Feedback button on WowLink's own pages (not on a guest's invitation, a client preview or the admin): a short
 * note, how it's going, and a way to reply if they'd like one, read on the admin page. In the page's language.
 */

const HIDDEN = /^\/(e|p|report|admin)(\/|$)/;

const TEXT: Record<Lang, { button: string; title: string; intro: string; how: string; moods: Record<Mood, string>; message: string; placeholder: string; contact: string; fromAccount: string; privacy: string; send: string; sending: string; close: string; thanks: string; thanksMore: string; short: string; busy: string; failed: string }> = {
  en: {
    button: "Feedback",
    title: "Tell us what you think",
    intro: "WowLink is new, and you’re one of the first to try it. What’s working, what’s confusing, what’s missing?",
    how: "How’s it going?",
    moods: { love: "Love it", okay: "It’s okay", confused: "It’s confusing" },
    message: "Your note",
    placeholder: "What should we fix or add?",
    contact: "Email or phone, if you’d like a reply",
    fromAccount: "From your account. Clear it if you’d rather not hear back.",
    privacy: "We keep what you write here and the page you’re on. Nothing else.",
    send: "Send",
    sending: "Sending…",
    close: "Close",
    thanks: "Thank you!",
    thanksMore: "We read every note.",
    short: "Write a few words first.",
    busy: "You’ve sent a few already. Thank you! Try again in an hour.",
    failed: "That didn’t send. Try again in a moment.",
  },
  gu: {
    button: "પ્રતિભાવ",
    title: "આપનો અભિપ્રાય જણાવો",
    intro: "WowLink નવું છે, અને આપ તેને અજમાવનારા પહેલા લોકોમાંના એક છો. શું સારું લાગ્યું, શું ગૂંચવણભર્યું લાગ્યું, શું ખૂટે છે?",
    how: "કેવું લાગે છે?",
    moods: { love: "ખૂબ ગમ્યું", okay: "ઠીક છે", confused: "ગૂંચવણ લાગે છે" },
    message: "આપનો સંદેશ",
    placeholder: "અમે શું સુધારીએ કે ઉમેરીએ?",
    contact: "જવાબ જોઈએ તો ઇમેઇલ કે ફોન",
    fromAccount: "આપના એકાઉન્ટમાંથી. જવાબ ન જોઈતો હોય તો તેને કાઢી નાખો.",
    privacy: "અમે ફક્ત આપ અહીં લખો તે અને આપ જે પાના પર છો તે રાખીએ છીએ. બીજું કંઈ નહીં.",
    send: "મોકલો",
    sending: "મોકલી રહ્યા છીએ…",
    close: "બંધ કરો",
    thanks: "આભાર!",
    thanksMore: "અમે દરેક સંદેશ વાંચીએ છીએ.",
    short: "પહેલાં થોડા શબ્દો લખો.",
    busy: "આપે ઘણા સંદેશ મોકલ્યા છે, આભાર! એક કલાક પછી ફરી પ્રયત્ન કરો.",
    failed: "મોકલાયું નહીં. થોડી વારમાં ફરી પ્રયત્ન કરો.",
  },
  hi: {
    button: "फ़ीडबैक",
    title: "अपनी राय बताइए",
    intro: "WowLink नया है, और आप इसे आज़माने वाले पहले लोगों में से हैं। क्या अच्छा लगा, क्या उलझन भरा लगा, क्या कमी है?",
    how: "कैसा लग रहा है?",
    moods: { love: "बहुत पसंद आया", okay: "ठीक है", confused: "उलझन हो रही है" },
    message: "आपका संदेश",
    placeholder: "हम क्या सुधारें या जोड़ें?",
    contact: "जवाब चाहिए तो ईमेल या फ़ोन",
    fromAccount: "आपके अकाउंट से। जवाब नहीं चाहिए तो इसे हटा दें।",
    privacy: "हम सिर्फ़ वही रखते हैं जो आप यहाँ लिखते हैं, और आप किस पेज पर हैं। और कुछ नहीं।",
    send: "भेजें",
    sending: "भेज रहे हैं…",
    close: "बंद करें",
    thanks: "धन्यवाद!",
    thanksMore: "हम हर संदेश पढ़ते हैं।",
    short: "पहले कुछ शब्द लिखिए।",
    busy: "आपने कई संदेश भेजे हैं, धन्यवाद! एक घंटे बाद फिर कोशिश करें।",
    failed: "भेजा नहीं जा सका। थोड़ी देर में फिर कोशिश करें।",
  },
};

/** The page's language: the one its own frame says (host pages mark theirs), else English. */
function pageLang(): Lang {
  const lang = document.querySelector<HTMLElement>(".cinema[lang]")?.lang;
  return isLang(lang) ? lang : "en";
}

export function FeedbackButton() {
  const path = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const thanks = useRef<HTMLHeadingElement>(null);
  // The account's email is offered once; cleared, it stays cleared.
  const asked = useRef(false);
  const [accountEmail, setAccountEmail] = useState("");
  const [lang, setLang] = useState<Lang>("en");
  const [mood, setMood] = useState<Mood | null>(null);
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [state, setState] = useState<"writing" | "sending" | "sent">("writing");
  const [error, setError] = useState<"" | "short" | "busy" | "failed">("");
  const hidden = !path || HIDDEN.test(path);
  // The page's language as it changes: host pages switch theirs once they're up, or when the host picks another.
  useEffect(() => {
    if (hidden) return;
    let frame = 0;
    const update = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => setLang(pageLang())); };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["lang"] });
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [hidden, path]);
  // Once sent, the thanks takes focus, so it's read out.
  useEffect(() => { if (state === "sent") thanks.current?.focus(); }, [state]);
  if (hidden) return null;
  const t = TEXT[lang];

  function open() {
    if (state === "sent") setState("writing");
    setError("");
    dialog.current?.showModal();
    // A signed-in host can be answered at their account's email: filled in once, said so, theirs to change or clear.
    if (asked.current) return;
    asked.current = true;
    void fetch("/api/account", { cache: "no-store" }).then((r) => r.json()).then((body) => {
      const email = body?.user?.email;
      if (typeof email !== "string") return;
      setAccountEmail(email);
      setContact((now) => now || email);
    }).catch(() => undefined);
  }
  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (message.trim().length < 2) return setError("short");
    const website = (new FormData(event.currentTarget).get("website") as string | null) ?? "";
    setState("sending");
    setError("");
    const response = await fetch("/api/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message, mood, contact, page: path, website }) }).catch(() => null);
    if (response?.status === 201) {
      setState("sent");
      setMessage("");
      setMood(null);
    } else {
      setState("writing");
      setError(response?.status === 429 ? "busy" : response?.status === 400 ? "short" : "failed");
    }
  }

  return <div className="cinema feedback">
    <button type="button" className="feedback-button theme-paper" aria-haspopup="dialog" onClick={open}>
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5C8 4.6 15 4.4 20 5.2c.6 3.2.6 6.8 0 9.6-3.2.6-6 .7-8.6.6L7 19.4l.4-4.2c-1.2-.1-2.3-.2-3.4-.4-.6-3.1-.6-6.3 0-9.3Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M8.5 10.2h7M8.5 12.8h4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
      <span>{t.button}</span>
    </button>
    <dialog ref={dialog} className="feedback-dialog theme-paper" aria-labelledby="feedback-title" lang={lang} onClick={(e) => { if (e.target === dialog.current) dialog.current?.close(); }}>
      <div className="sketch-card feedback-card">
        {state === "sent" ? <div className="feedback-sent">
          <h2 id="feedback-title" ref={thanks} tabIndex={-1} aria-describedby="feedback-thanks">{t.thanks}</h2>
          <p id="feedback-thanks">{t.thanksMore}</p>
          <button type="button" className="cin-cta cin-cta-light" onClick={() => dialog.current?.close()}>{t.close}</button>
        </div> : <form onSubmit={send} noValidate>
          <h2 id="feedback-title">{t.title}</h2>
          <p className="feedback-intro">{t.intro}</p>
          <fieldset className="feedback-moods">
            <legend>{t.how}</legend>
            {MOODS.map((m) => <label key={m}><input type="radio" name="feedback-mood" value={m} checked={mood === m} onChange={() => setMood(m)}/><span aria-hidden="true">{MOOD_EMOJI[m]}</span> {t.moods[m]}</label>)}
          </fieldset>
          <div className="studio-field">
            <label htmlFor="feedback-message">{t.message}</label>
            <textarea id="feedback-message" rows={4} maxLength={FEEDBACK_LIMITS.message} placeholder={t.placeholder} value={message} onChange={(e) => { setMessage(e.target.value); setError(""); }} aria-invalid={error === "short" || undefined} aria-describedby={error ? "feedback-error" : undefined}/>
          </div>
          <div className="studio-field">
            <label htmlFor="feedback-contact">{t.contact}</label>
            <input id="feedback-contact" type="text" inputMode="email" autoComplete="email" maxLength={FEEDBACK_LIMITS.contact} value={contact} onChange={(e) => setContact(e.target.value)} aria-describedby={accountEmail && contact === accountEmail ? "feedback-from-account" : undefined}/>
            {accountEmail && contact === accountEmail && <p className="feedback-from-account" id="feedback-from-account">{t.fromAccount}</p>}
          </div>
          <div className="inv-honeypot" aria-hidden="true"><label htmlFor="feedback-website">Leave this empty</label><input id="feedback-website" name="website" tabIndex={-1} autoComplete="off"/></div>
          {error && <p className="studio-error" id="feedback-error" role="alert">{t[error]}</p>}
          <p className="feedback-privacy">{t.privacy}</p>
          <div className="feedback-actions">
            <button type="submit" className="cin-cta cin-cta-light" disabled={state === "sending"}>{state === "sending" ? t.sending : t.send}</button>
            <button type="button" className="share-chip" onClick={() => dialog.current?.close()}>{t.close}</button>
          </div>
        </form>}
      </div>
    </dialog>
  </div>;
}
