import { NextResponse, type NextRequest } from "next/server";

/*
 * A sign-in link from Supabase comes back to the site's own address (the home page, ?code=…) when the page it was
 * meant for isn't on the project's list of allowed addresses. Carry the code on to the callback, which finishes signing
 * in, rather than leaving the host on the home page not signed in. Only the home page runs this.
 */
export function middleware(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.next();
  const callback = new URL("/auth/callback", request.url);
  callback.searchParams.set("code", code);
  callback.searchParams.set("next", "/mine");
  return NextResponse.redirect(callback, 303);
}

export const config = { matcher: "/" };
