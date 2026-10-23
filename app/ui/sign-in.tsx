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
    <button type="button" className="cin-cta cin-cta-light sign-in-google" disabled={busy || ready === false} onClick={() => void withGoogle()}>{h.continueGoogle}</button>
    {ready === false && <p className="manage-muted">{h.googleNotReady}</p>}
    {error && <p className="studio-error" role="alert">{error}</p>}
  </div>;
}
