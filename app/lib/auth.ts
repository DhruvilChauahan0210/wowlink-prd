import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/*
 * Who is signed in, on the server. Hosts sign in with Supabase Auth (an email code or Google); the browser keeps the
 * session in cookies (app/lib/supabase-browser.ts) and the server checks its signature on each request.
 *
 * Accounts are on when the Supabase project's address and publishable key are set. Without them (the JSON file on
 * your own computer) there are no accounts and anyone can publish, as before.
 *
 * Tests can't sign in to a real project, so with WOWLINK_TEST_AUTH=1 the user is whoever the x-wowlink-test-user
 * header names. Never set it on a real site: it is refused on Vercel's production.
 */

export type User = { id: string; email: string };

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

const testAuth = () => process.env.WOWLINK_TEST_AUTH === "1" && process.env.VERCEL_ENV !== "production";
/** Whether hosts sign in (and must, to publish). */
export const accountsOn = () => testAuth() || !!(SUPABASE_URL && SUPABASE_KEY);

/** Supabase on the server, with the request's session cookies (refreshed ones are written back). */
export async function serverSupabase() {
  const jar = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) jar.set(name, value, options);
        } catch { /* a page render can't set cookies; the browser refreshes its session itself */ }
      },
    },
  });
}

/** The signed-in host, or null. */
export async function currentUser(request: Request): Promise<User | null> {
  if (testAuth()) {
    const id = request.headers.get("x-wowlink-test-user") ?? "";
    return /^[\w-]{1,64}$/.test(id) ? { id: `test-${id}`, email: `${id}@test.wowlink.local` } : null;
  }
  if (!accountsOn()) return null;
  const { data, error } = await (await serverSupabase()).auth.getClaims();
  const claims = data?.claims;
  return !error && claims?.sub ? { id: claims.sub, email: typeof claims.email === "string" ? claims.email : "" } : null;
}

/** The answer when an account is needed and there's no one signed in. */
export const signInFirst = () => Response.json({ error: "Sign in to publish.", signIn: true }, { status: 401 });
