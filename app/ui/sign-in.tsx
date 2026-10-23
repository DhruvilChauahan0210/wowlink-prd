"use client";

import { useId, useState, type FormEvent } from "react";
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
  const [stage, setStage] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const supabase = browserSupabase();
  const callback = () => `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function sendCode(event?: FormEvent) {
    event?.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError("");
    // The email has the code, and a link too: opened in this browser, the link signs in as well.
    const { error: failed } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true, emailRedirectTo: callback() } });
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
    onSignedIn();
  }

  async function google() {
    if (!supabase) return;
    beforeLeaving?.();
    setBusy(true);
    const { error: failed } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: callback() } });
    if (failed) {
      setBusy(false);
      setError(h.signInFailed);
    }
  }

  if (!supabase) return null;
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
    <p className="sign-in-or"><span>{h.orWord}</span></p>
    <button type="button" className="cin-cta cin-cta-outline sign-in-google" disabled={busy} onClick={() => void google()}>{h.continueGoogle}</button>
  </div>;
}
