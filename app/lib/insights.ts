/*
 * Counting, without tracking. Everything here is a plain number per day: how often an invitation was opened, by how
 * many browsers, how many played the opening, how many came from the QR code, and how the host shared it. No visitor
 * is identified and nothing is stored about one; a browser only remembers (in its own storage) that it has already
 * been counted, so each person counts once.
 *
 * Days are India's calendar days (IST), like everything else in WowLink.
 */

export const SHARE_CHANNELS = ["whatsapp", "copy", "native", "qr", "personal"] as const;
export type ShareChannel = (typeof SHARE_CHANNELS)[number];
export const isShareChannel = (value: unknown): value is ShareChannel => SHARE_CHANNELS.includes(value as ShareChannel);

/** One invitation's numbers. `days` holds visits per day, for the last few weeks. */
export type InvitationStats = {
  since: string;
  views: number;
  visitors: number;
  played: number;
  viaQr: number;
  shares: Partial<Record<ShareChannel, number>>;
  days: Record<string, number>;
};

/** WowLink's own pages, counted from the browser (so link previews and crawlers don't count). */
export const PAGE_METRICS = ["studio", "sample", "occasion"] as const;
export type PageMetric = (typeof PAGE_METRICS)[number];
export const isPageMetric = (value: unknown): value is PageMetric => PAGE_METRICS.includes(value as PageMetric);

/** App-wide counts per day: { "2026-10-23": { view: 12, "published:wedding": 1, … } }. */
export type Metrics = Record<string, Record<string, number>>;

const DAY_MS = 86_400_000;
const IST_MS = 5.5 * 3_600_000;
/** The IST calendar day of a moment, as "YYYY-MM-DD". */
export const dayKey = (ms: number) => new Date(ms + IST_MS).toISOString().slice(0, 10);
/** The last `n` days up to and including today's, oldest first. */
export const lastDays = (n: number, now: number) => Array.from({ length: n }, (_, i) => dayKey(now - (n - 1 - i) * DAY_MS));

/** How long day-by-day counts are kept: an invitation's for its chart, the app's for the admin page. */
export const INVITATION_DAYS = 60;
export const METRIC_DAYS = 400;

export const emptyStats = (since: string): InvitationStats => ({ since, views: 0, visitors: 0, played: 0, viaQr: 0, shares: {}, days: {} });

/** Drop day counts older than `keep` days, so the numbers stay small. */
export function trimDays<T>(days: Record<string, T>, keep: number, now: number) {
  const oldest = dayKey(now - (keep - 1) * DAY_MS);
  for (const day of Object.keys(days)) if (day < oldest) delete days[day];
}

/** Add one to an app-wide count for today. */
export function bump(metrics: Metrics, name: string, now: number, by = 1) {
  const today = (metrics[dayKey(now)] ??= {});
  today[name] = (today[name] ?? 0) + by;
}

/** The app's counts over the last `days` days: totals, and each day's for the given names. */
export function summarise(metrics: Metrics, days: number, now: number, daily: readonly string[] = []) {
  const range = lastDays(days, now);
  const totals: Record<string, number> = {};
  for (const day of range) for (const [name, n] of Object.entries(metrics[day] ?? {})) totals[name] = (totals[name] ?? 0) + n;
  return { dates: range, totals, daily: Object.fromEntries(daily.map((name) => [name, range.map((day) => metrics[day]?.[name] ?? 0)])) as Record<string, number[]> };
}

/** A share of a whole, as a whole percentage, never above 100 (a cleared browser can be counted twice). */
export const percent = (part: number, whole: number) => (whole > 0 ? Math.min(100, Math.round((part / whole) * 100)) : 0);
