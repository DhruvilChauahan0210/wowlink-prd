/*
 * A planner's brand on an invitation (Creator studio): their name, a sign-off line and a small logo, shown at the
 * bottom of the invitation. The logo travels inside the invitation as a data URL: PNG, JPEG or WebP only (never SVG,
 * which can carry scripts), checked by its first bytes as well as its label, and at most 150 KB.
 */

export type Brand = { name: string; signoff: string; logo: string };
export const BRAND_LIMITS = { name: 60, signoff: 120, logoBytes: 150_000 } as const;

const LOGO = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/;
const clean = (value: unknown, max: number) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "");

/** Whether a logo really is the image it says it is (by its first bytes). */
function looksLikeImage(type: string, base64: string) {
  let head: number[];
  try { head = Array.from(atob(base64.slice(0, 24)), (c) => c.charCodeAt(0)); } catch { return false; }
  if (type === "png") return head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
  if (type === "jpeg") return head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  return String.fromCharCode(...head.slice(0, 4)) === "RIFF" && String.fromCharCode(...head.slice(8, 12)) === "WEBP";
}

/** The brand as sent, tidied. Null when there's nothing in it. */
export function cleanBrand(input: unknown): Brand | null {
  if (!input || typeof input !== "object") return null;
  const data = input as Record<string, unknown>;
  const brand = { name: clean(data.name, 1000), signoff: clean(data.signoff, 1000), logo: typeof data.logo === "string" ? data.logo.trim() : "" };
  return brand.name || brand.signoff || brand.logo ? brand : null;
}

/** What's wrong with a brand, or "". */
export function brandError(brand: Brand | null) {
  if (!brand) return "";
  if (!brand.name) return "Add your studio’s name.";
  if (brand.name.length > BRAND_LIMITS.name) return `Keep the name under ${BRAND_LIMITS.name} characters.`;
  if (brand.signoff.length > BRAND_LIMITS.signoff) return `Keep the sign-off under ${BRAND_LIMITS.signoff} characters.`;
  if (brand.logo) {
    const match = brand.logo.match(LOGO);
    if (!match || !looksLikeImage(match[1], match[2])) return "The logo must be a PNG, JPEG or WebP image.";
    if ((match[2].length * 3) / 4 > BRAND_LIMITS.logoBytes) return "The logo must be under 150 KB.";
  }
  return "";
}
