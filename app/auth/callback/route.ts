import { NextResponse } from "next/server";
import { isAdminEmail } from "../../lib/admin";
import { serverSupabase } from "../../lib/auth";
import { recordCounts } from "../../lib/store";

/**
 * Where Google sends a host back after signing in: the one-time code becomes a session (cookies), then they go on to
 * where they were. Only paths on this site, never another address. Each sign-in is counted, and a new account too
 * (one made just now); WowLink's own admins aren't.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next") ?? "";
  const back = /^\/(?!\/)[^\\]*$/.test(next) ? next : "/mine";
  const code = url.searchParams.get("code");
  const result = code ? await (await serverSupabase()).auth.exchangeCodeForSession(code) : null;
  const user = result && !result.error ? result.data.user : null;
  if (user && !isAdminEmail(user.email ?? "")) {
    const isNew = Math.abs(Date.parse(user.last_sign_in_at ?? "") - Date.parse(user.created_at)) < 60_000;
    await recordCounts(...(isNew ? ["signin", "signup"] as const : ["signin"] as const)).catch(() => undefined);
  }
  return NextResponse.redirect(new URL(user ? back : `/signin?failed=1&next=${encodeURIComponent(back)}`, url.origin), 303);
}
