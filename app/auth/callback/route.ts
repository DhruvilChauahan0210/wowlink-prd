import { NextResponse } from "next/server";
import { serverSupabase } from "../../lib/auth";

/**
 * Where Google sends a host back after signing in: the one-time code becomes a session (cookies), then they go on to
 * where they were. Only paths on this site, never another address.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next") ?? "";
  const back = /^\/(?!\/)[^\\]*$/.test(next) ? next : "/mine";
  const code = url.searchParams.get("code");
  const { error } = code ? await (await serverSupabase()).auth.exchangeCodeForSession(code) : { error: true };
  return NextResponse.redirect(new URL(error ? `/signin?failed=1&next=${encodeURIComponent(back)}` : back, url.origin), 303);
}
