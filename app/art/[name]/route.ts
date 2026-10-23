import { renderSvg } from "../../lib/svg-string";
import { ART_NAMES, StandaloneArt, isArtName } from "../../ui/art";

/**
 * Each occasion's drawing as an SVG image (/art/wedding.svg), for the places it doesn't animate: the home page
 * reel, the catalogue, the studio's occasion tiles. Prerendered at build time.
 */
export const dynamic = "force-static";
export const generateStaticParams = () => ART_NAMES.map((name) => ({ name: `${name}.svg` }));

export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const id = name.replace(/\.svg$/, "");
  if (!name.endsWith(".svg") || !isArtName(id)) return new Response("Not found", { status: 404 });
  return new Response(renderSvg(StandaloneArt({ name: id })), {
    headers: { "content-type": "image/svg+xml; charset=utf-8", "cache-control": "public, max-age=86400, stale-while-revalidate=604800" },
  });
}
