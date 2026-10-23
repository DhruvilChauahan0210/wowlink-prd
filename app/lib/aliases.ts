/*
 * Custom links (Creator studio): /e/isha-kabir instead of /e/7fK29pQ. Lowercase words and numbers joined by hyphens,
 * 4 to 40 characters, not one of WowLink's own words, nothing rude (in English, Hindi or Gujarati, also spelled with
 * look-alike digits), and never one another invitation has or had.
 */

export const ALIAS_LIMITS = { min: 4, max: 40, kept: 3 } as const;

const RESERVED = ["preview", "admin", "api", "manage", "create", "new", "help", "pricing", "privacy", "report", "templates", "mine", "wowlink", "invite", "invitation", "edit", "login", "signup"];
// Matched inside the link with the hyphens and look-alike digits taken out, so "f-u-c-k" and "p0rn" are caught too.
// Kept short on purpose: words that are also inside real names (Nazir, Randive, Chodhary) aren't here.
const RUDE = ["fuck", "shit", "porn", "nude", "rape", "bitch", "cunt", "chutiya", "chutia", "madarchod", "bhenchod", "behenchod", "bhosdi", "gandu", "harami", "lauda", "gaand"];
const LOOKALIKE: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b", "@": "a", $: "s" };

/** The invitation's link: its current custom link, or its slug. */
export const linkOf = (e: { slug: string; aliases?: string[] }) => e.aliases?.[0] ?? e.slug;

/** What someone typed, tidied into a link: lowercase, spaces and underscores to hyphens, no doubled hyphens. */
export const tidyAlias = (input: string) => input.trim().toLowerCase().replace(/[\s_]+/g, "-").replace(/-{2,}/g, "-").replace(/^-|-$/g, "");

/** What's wrong with a custom link, or "". */
export function aliasError(alias: string) {
  if (alias.length < ALIAS_LIMITS.min || alias.length > ALIAS_LIMITS.max) return `Make it ${ALIAS_LIMITS.min} to ${ALIAS_LIMITS.max} characters.`;
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(alias)) return "Use lowercase letters, numbers and hyphens, like “isha-kabir”.";
  if (/^\d+(-\d+)*$/.test(alias)) return "Add a word or two, not just numbers.";
  if (RESERVED.includes(alias)) return "That one is WowLink’s own. Try another.";
  const plain = alias.replace(/-/g, "").replace(/[0-9@$]/g, (c) => LOOKALIKE[c] ?? c);
  if (RUDE.some((word) => plain.includes(word))) return "That link isn’t allowed. Try another.";
  return "";
}
