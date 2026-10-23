"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { HostText } from "../lib/host-i18n";
import { browserSupabase } from "../lib/supabase-browser";

/**
 * Signing in: an emailed code (typed here, so it works whichever app opens the email), or Google. `next` is where
 * Google (or the email's link) brings the host back; `beforeLeaving` runs just before going to Google (the studio
 * saves the draft).
 */
export function SignIn({ h, next, onSignedIn, beforeLeaving }: { h: HostText; next: string; onSignedIn: () => void; beforeLeaving?: () => void }) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code" | "done">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const supabase = browserSupabase();
  const callback = () => `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  // "Continue with Google" only once Google is switched on in the Supabase project (its public settings say so).
  const [google, setGoogle] = useState(false);
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return;
    fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } }).then(r => r.json()).then(settings => setGoogle(settings?.external?.google === true)).catch(() => undefined);
  }, []);

  // Signed in only once, however it happens.
  const signedIn = useRef(onSignedIn);
  signedIn.current = onSignedIn;
  const finish = () => {
    setStage("done");
    signedIn.current();
  };

  // Waiting for the code, the host may tap the email's link instead (in another tab): notice, and carry on.
  useEffect(() => {
    if (stage !== "code") return;
    let stopped = false;
    const check = async () => {
      const body = await fetch("/api/account", { cache: "no-store" }).then(r => r.json()).catch(() => null);
      if (!stopped && body?.user) {
        stopped = true;
        finish();
      }
    };
    const timer = setInterval(() => void check(), 4000);
    addEventListener("focus", check);
    return () => {
      stopped = true;
      clearInterval(timer);
      removeEventListener("focus", check);
    };
  }, [stage]);

  async function sendCode(event?: FormEvent) {
    event?.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError("");
    // The email's link (and the code, when the email has one) signs in this browser. The link opens a new tab: that one
    // says so, while this one notices and carries on.
    const linkLanding = `/signin?signed=1&next=${encodeURIComponent(next)}`;
    const { error: failed } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true, emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(linkLanding)}` } });
    setBusy(false);
    if (failed) return setError(failed.status === 429 ? h.waitForCode : h.codeFailed);
    setCode("");
    setStage("code");
  }

  async function verify(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError("");
    const { error: failed } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.replace(/\s/g, ""), type: "email" });
    setBusy(false);
    if (failed) return setError(h.wrongCode);
    finish();
  }

  async function withGoogle() {
    if (!supabase) return;
    beforeLeaving?.();
    setBusy(true);
    const { error: failed } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: callback() } });
    if (failed) {
      setBusy(false);
      setError(h.signInFailed);
    }
  }

  if (!supabase || stage === "done") return null;
  return <div className="sign-in">
    {stage === "email" ? <form className="sign-in-form" onSubmit={sendCode}>
      <div className="studio-field"><label htmlFor={`${id}-email`}>{h.emailLabel}</label><input id={`${id}-email`} type="email" autoComplete="email" inputMode="email" required value={email} onChange={e => setEmail(e.target.value)}/></div>
      <button type="submit" className="cin-cta cin-cta-light" disabled={busy || !email.trim()}>{h.sendCode}</button>
    </form> : <form className="sign-in-form" onSubmit={verify}>
      <p className="manage-muted" role="status">{h.codeSentTo(email.trim())}</p>
      <div className="studio-field"><label htmlFor={`${id}-code`}>{h.codeLabel}</label><input id={`${id}-code`} autoComplete="one-time-code" inputMode="numeric" pattern="[0-9 ]{6,12}" maxLength={12} required value={code} onChange={e => setCode(e.target.value)} autoFocus/></div>
      <div className="manage-guest-buttons">
        <button type="submit" className="cin-cta cin-cta-light" disabled={busy || code.replace(/\s/g, "").length < 6}>{h.verifyCode}</button>
        <button type="button" className="share-chip" disabled={busy} onClick={() => void sendCode()}>{h.sendAgain}</button>
        <button type="button" className="share-chip" onClick={() => { setStage("email"); setError(""); }}>{h.otherEmail}</button>
      </div>
    </form>}
    {error && <p className="studio-error" role="alert">{error}</p>}
    {google && <>
      <p className="sign-in-or"><span>{h.orWord}</span></p>
      <button type="button" className="cin-cta cin-cta-outline sign-in-google" disabled={busy} onClick={() => void withGoogle()}>{h.continueGoogle}</button>
    </>}
  </div>;
}
