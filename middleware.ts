import { NextResponse, type NextRequest } from "next/server";

/*
 * Two small jobs before a page:
 * - A sign-in link from Supabase comes back to the site's own address (the home page, ?code=…) when the page it was
 *   meant for isn't on the project's list of allowed addresses. Carry the code on to the callback, which finishes
 *   signing in, rather than leaving the host on the home page not signed in.
 * - An occasion's page, or a guide, in Gujarati or Hindi is /templates/<id>?lang=gu (like every other page's languages),
 *   built ahead at /templates/<id>/gu (app/templates/[id]/[lang]; the guides likewise, at /guides/<slug>/gu). Serve the
 *   one from the other, and send anyone who finds the built one's address to the real one, so each page has one address.
 */
const OTHER_LANGS = ["gu", "hi"];

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname === "/") {
    const code = searchParams.get("code");
    if (!code) return NextResponse.next();
    const callback = new URL("/auth/callback", request.url);
    callback.searchParams.set("code", code);
    callback.searchParams.set("next", "/mine");
    return NextResponse.redirect(callback, 303);
  }

  // /templates/<id> and /guides/<slug>: the page's languages, built ahead at <page>/<lang>.
  const [, section, id, built] = pathname.split("/");
  if (built !== undefined) {
    if (!OTHER_LANGS.includes(built)) return NextResponse.next();
    // Keep whatever else the link carried (?utm_source=…).
    const page = request.nextUrl.clone();
    page.pathname = `/${section}/${id}`;
    page.searchParams.set("lang", built);
    return NextResponse.redirect(page, 308);
  }
  const lang = searchParams.get("lang");
  if (!lang || !OTHER_LANGS.includes(lang)) return NextResponse.next();
  const target = request.nextUrl.clone();
  target.pathname = `/${section}/${id}/${lang}`;
  target.searchParams.delete("lang");
  return NextResponse.rewrite(target);
}

export const config = { matcher: ["/", "/templates/:id", "/templates/:id/:lang", "/guides/:slug", "/guides/:slug/:lang"] };
