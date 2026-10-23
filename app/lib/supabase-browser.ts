import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/*
 * Supabase in the browser, only for signing in and out: it keeps the session in cookies, which the server reads
 * (app/lib/auth.ts). The publishable key is meant to be public; WowLink's data isn't reachable with it.
 */

let client: SupabaseClient | null = null;

/** The browser's Supabase client, or null on a site without accounts. */
export function browserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return (client ??= createBrowserClient(url, key));
}
