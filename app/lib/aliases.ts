/*
 * Custom links (Creator studio): /e/isha-kabir instead of /e/7fK29pQ. Lowercase words and numbers joined by hyphens,
 * 4 to 40 characters, not one of WowLink's own words, nothing rude (in English, Hindi or Gujarati, also spelled with
 * look-alike digits), and never one another invitation has or had.
 */

export const ALIAS_LIMITS = { min: 4, max: 40, kept: 3 } as const;

const RESERVED = ["preview", "admin", "api", "manage", "create", "new", "help", "pricing", "privacy", "report", "templates", "mine", "wowlink", "invite", "invitation", "edit", "login", "signup"];
// Checked with look-alike digits read as letters ("p0rn"), and with spelled-out letters joined up ("f-u-c-k").
// Real names come first: short words hide inside names (Ishita, Harshit, Anudeep, Aporna), so those only count as a
// whole word or the start of one; a community's name (Chutia) isn't here.
const RUDE = {
  anywhere: ["fuck", "bitch", "chutiya", "madarchod", "bhenchod", "behenchod", "bhosdi"],
  starting: ["porn", "gandu", "gaand", "harami", "lauda"],
  whole: ["shit", "nude", "rape", "cunt"],
};
const LOOKALIKE: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b", "@": "a", $: "s" };
const plain = (text: string) => text.replace(/[0-9@$]/g, (c) => LOOKALIKE[c] ?? c);

/** The link's words, look-alikes read as letters, with runs of single letters joined ("f-u-c-k" is "fuck"). */
function wordsOf(alias: string) {
  const words: string[] = [];
  let letters = "";
  for (const token of alias.split("-").map(plain)) {
    if (token.length === 1) letters += token;
    else {
      if (letters) words.push(letters);
      letters = "";
      words.push(token);
    }
  }
  if (letters) words.push(letters);
  return words;
}

const isRude = (alias: string) => {
  const words = wordsOf(alias);
  const joined = words.join("");
  return RUDE.anywhere.some((w) => joined.includes(w)) || words.some((word) => RUDE.starting.some((w) => word.startsWith(w)) || RUDE.whole.includes(word));
};

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
  if (isRude(alias)) return "That link isn’t allowed. Try another.";
  return "";
}
