/*
 * Feedback from the Feedback button on WowLink's own pages: how it's going (a mood, if picked), what they wrote, the
 * page they were on (its path only), and an email or phone number if they gave one so WowLink can reply. Nothing else
 * about who sent it. Kept by feedback-store.ts, read on the admin page.
 */

export const MOODS = ["love", "okay", "confused"] as const;
export type Mood = (typeof MOODS)[number];
export const isMood = (value: unknown): value is Mood => MOODS.includes(value as Mood);
export const MOOD_EMOJI: Record<Mood, string> = { love: "😍", okay: "🙂", confused: "😕" };
export const FEEDBACK_LIMITS = { message: 1000, contact: 120, page: 200 } as const;

export type Feedback = { id: string; at: string; mood: Mood | null; message: string; page: string; contact: string | null; doneAt: string | null };
export type FeedbackNote = Pick<Feedback, "mood" | "message" | "page" | "contact">;
