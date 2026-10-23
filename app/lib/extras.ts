/*
 * What a host can ask guests besides "are you coming": food needs (free), a song for the sangeet (Creator studio),
 * and one poll of their own (Creator studio). The answers come back with the reply.
 */

export const DIETS = ["jain", "swaminarayan", "no-onion-garlic", "vegan", "other"] as const;
export type Diet = (typeof DIETS)[number];
export const isDiet = (value: unknown): value is Diet => DIETS.includes(value as Diet);

export const EXTRA_LIMITS = { song: 100, dietNote: 100, pollQuestion: 120, pollOption: 40, pollOptions: 4 } as const;

/** A host's question, with two to four answers to choose from. */
export type Poll = { question: string; options: string[] };

const clean = (value: unknown, max: number) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "");

/** The poll as the host wrote it, tidied: empty answers dropped. Null when there's no question. */
export function cleanPoll(input: unknown): Poll | null {
  if (!input || typeof input !== "object") return null;
  const data = input as Record<string, unknown>;
  const question = clean(data.question, 1000);
  const options = (Array.isArray(data.options) ? data.options : []).map(o => clean(o, 1000)).filter(Boolean);
  return question || options.length ? { question, options } : null;
}

/** What's wrong with a poll, if anything. */
export function pollError(poll: Poll | null) {
  if (!poll) return "";
  if (!poll.question) return "Write the poll’s question.";
  if (poll.question.length > EXTRA_LIMITS.pollQuestion) return `Keep the question under ${EXTRA_LIMITS.pollQuestion} characters.`;
  if (poll.options.length < 2) return "Give the poll at least two answers.";
  if (poll.options.length > EXTRA_LIMITS.pollOptions) return `A poll can have up to ${EXTRA_LIMITS.pollOptions} answers.`;
  if (poll.options.some(o => o.length > EXTRA_LIMITS.pollOption)) return `Keep each answer under ${EXTRA_LIMITS.pollOption} characters.`;
  return "";
}

/** A guest's extras, checked against what this invitation asks. */
export function cleanExtras(input: Record<string, unknown>, asks: { diet: boolean; song: boolean; poll: Poll | null }) {
  const diet = asks.diet && Array.isArray(input.diet) ? [...new Set(input.diet.filter(isDiet))] : [];
  const dietNote = asks.diet ? clean(input.dietNote, EXTRA_LIMITS.dietNote) : "";
  const song = asks.song ? clean(input.song, EXTRA_LIMITS.song) : "";
  const pick = asks.poll && Number.isInteger(input.pick) && (input.pick as number) >= 0 && (input.pick as number) < asks.poll.options.length ? (input.pick as number) : undefined;
  return { ...(diet.length && { diet }), ...(dietNote && { dietNote }), ...(song && { song }), ...(pick !== undefined && { pick }) };
}
