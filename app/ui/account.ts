"use client";

import { useCallback, useEffect, useState } from "react";
import { ownerKey } from "../lib/invitations";
import { browserSupabase } from "../lib/supabase-browser";

/*
 * The host's account, in the browser. The server says whether accounts are on and who is signed in (/api/account);
 * this device's manage keys stay in localStorage as before, and signing in adds keys for the host's other invitations.
 */

export type Account = { ready: boolean; accounts: boolean; email: string | null; admin: boolean };

export function useAccount() {
  const [account, setAccount] = useState<Account>({ ready: false, accounts: false, email: null, admin: false });
  const refresh = useCallback(async () => {
    const body = await fetch("/api/account", { cache: "no-store" }).then((r) => r.json()).catch(() => null);
    const next = { ready: true, accounts: !!body?.accounts, email: (body?.user?.email as string | undefined) ?? null, admin: body?.user?.admin === true };
    setAccount(next);
    return next;
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  return { ...account, refresh };
}

const OWNER_PREFIX = ownerKey("");

/** Every manage key saved on this device. */
export function savedKeys() {
  const found: { slug: string; key: string }[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const name = localStorage.key(i);
      const key = name?.startsWith(OWNER_PREFIX) ? localStorage.getItem(name) : null;
      if (name && key) found.push({ slug: name.slice(OWNER_PREFIX.length), key });
    }
  } catch { /* storage blocked: nothing saved here */ }
  return found;
}

/**
 * Bring this device in line with the signed-in account: the device's invitations without an owner become the host's,
 * and the device gets keys for the host's invitations it can't open yet. Returns the slugs it got keys for.
 */
export async function syncAccount() {
  const response = await fetch("/api/account/sync", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ known: savedKeys() }) }).catch(() => null);
  if (!response?.ok) return [];
  const { keys } = (await response.json()) as { keys: { slug: string; key: string }[] };
  try {
    for (const { slug, key } of keys) localStorage.setItem(ownerKey(slug), key);
  } catch { /* storage blocked: this visit only */ }
  return keys.map((k) => k.slug);
}

export async function signOut() {
  await browserSupabase()?.auth.signOut();
}
