"use client";

import { useEffect, useState } from "react";
import type { HostText } from "../lib/host-i18n";
import { browserSupabase } from "../lib/supabase-browser";

/**
 * Signing in, with Google. `next` is where Google brings the host back (through /auth/callback); `beforeLeaving` runs
 * just before going to Google (the studio saves the draft).
 */
export function SignIn({ h, next, beforeLeaving }: { h: HostText; next: string; beforeLeaving?: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Whether Google is switched on in the Supabase project (its public settings say); null while that's being checked.
  const [ready, setReady] = useState<boolean | null>(null);
  const supabase = browserSupabase();

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return;
    fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } })
      .then(r => r.json())
      .then(settings => setReady(settings?.external?.google === true))
      .catch(() => setReady(true));
  }, []);

  async function withGoogle() {
    if (!supabase) return;
    beforeLeaving?.();
    setBusy(true);
    setError("");
    const { error: failed } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` } });
    if (failed) {
      setBusy(false);
      setError(h.signInFailed);
    }
  }

  if (!supabase) return null;
  return <div className="sign-in">
    <button type="button" className="cin-cta cin-cta-light sign-in-google" disabled={busy || ready === false} onClick={() => void withGoogle()}><GoogleMark/>{h.continueGoogle}</button>
    {ready === false && <p className="manage-muted">{h.googleNotReady}</p>}
    {error && <p className="studio-error" role="alert">{error}</p>}
  </div>;
}

/** Google's "G", on a white disc as Google asks for on a dark button. Inline, so nothing loads from elsewhere. */
function GoogleMark() {
  return <span className="sign-in-g" aria-hidden="true"><svg viewBox="0 0 48 48" width="18" height="18">
    <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"/>
  </svg></span>;
}

