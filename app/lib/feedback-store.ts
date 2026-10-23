import type { Feedback, FeedbackNote, Mood } from "./feedback";
import { database } from "./store-pg";

/*
 * Where feedback (feedback.ts) is kept: in the database when there is one, otherwise in this server's memory
 * (`npm run dev` without a database, and the tests). Shown on the admin page, newest first, until it's marked done.
 */

const g = globalThis as typeof globalThis & { __wowlinkFeedback?: Feedback[]; __wowlinkFeedbackId?: number };
const memory = (g.__wowlinkFeedback ??= []);
// Open notes first, then the ones marked done; newest first in each.
const ordered = (list: Feedback[]) => [...list].sort((a, b) => Number(!!a.doneAt) - Number(!!b.doneAt) || Number(b.id) - Number(a.id));

export async function saveFeedback(note: FeedbackNote) {
  const sql = database();
  if (!sql) {
    g.__wowlinkFeedbackId = (g.__wowlinkFeedbackId ?? 0) + 1;
    memory.unshift({ ...note, id: String(g.__wowlinkFeedbackId), at: new Date().toISOString(), doneAt: null });
    memory.splice(500);
    return;
  }
  await sql`insert into wowlink.feedback (mood, message, page, contact) values (${note.mood}, ${note.message}, ${note.page}, ${note.contact})`;
}

/** The latest feedback for the admin: open notes first, then done ones; newest first in each. */
export async function feedbackList(limit = 100): Promise<Feedback[]> {
  const sql = database();
  if (!sql) return ordered(memory).slice(0, limit);
  const rows = await sql<{ id: string; at: Date; mood: Mood | null; message: string; page: string; contact: string | null; done_at: Date | null }[]>`
    select id::text, at, mood, message, page, contact, done_at from wowlink.feedback order by (done_at is not null), id desc limit ${limit}`;
  return rows.map((r) => ({ id: r.id, at: r.at.toISOString(), mood: r.mood, message: r.message, page: r.page, contact: r.contact, doneAt: r.done_at?.toISOString() ?? null }));
}

/** Mark a note done (or open again). False if there's no such note. */
export async function markFeedback(id: string, done: boolean): Promise<boolean> {
  if (!/^\d{1,18}$/.test(id)) return false;
  const doneAt = done ? new Date() : null;
  const sql = database();
  if (!sql) {
    const note = memory.find((n) => n.id === id);
    if (note) note.doneAt = doneAt?.toISOString() ?? null;
    return !!note;
  }
  const rows = await sql`update wowlink.feedback set done_at = ${doneAt} where id = ${id} returning id`;
  return rows.length > 0;
}
