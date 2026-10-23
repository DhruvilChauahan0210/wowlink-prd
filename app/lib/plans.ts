import type { InvitationDraft, TemplateId } from "./invitations";

/*
 * Two plans (PRD section 7). Personal is free and deliberately small: four starter occasions, one celebration, the
 * occasion's own colours, 50 replies, and it stays up until 30 days after the day. The Creator studio has everything.
 * There are no accounts or payments yet, so the plan belongs to each invitation; WowLink's admin can move one to the
 * Creator studio. Invitations made before plans existed keep everything ("pro").
 */

export type Plan = "free" | "pro";
export const STARTER_OCCASIONS: readonly TemplateId[] = ["wedding", "birthday", "garba", "opening"];

// The Creator studio's reply limit can be tuned (NEXT_PUBLIC_WOWLINK_PRO_REPLIES) until real usage settles it (PRD §7).
const PRO_REPLIES = Number(process.env.NEXT_PUBLIC_WOWLINK_PRO_REPLIES) || 1000;
export const PLAN_LIMITS = {
  free: { replies: 50, daysAfter: 30 },
  pro: { replies: PRO_REPLIES, daysAfter: null },
} as const satisfies Record<Plan, { replies: number; daysAfter: number | null }>;

/** What the Creator studio adds, by name. */
export type ProFeature = "occasion" | "schedule" | "colours" | "attribution" | "song" | "poll" | "brand" | "personal" | "csv" | "copy" | "insights" | "alias" | "preview" | "wishes" | "remind";

const FEATURE_NAMES: Record<ProFeature, string> = {
  occasion: "this occasion", schedule: "a schedule of celebrations", colours: "your own colours", attribution: "hiding “Made with WowLink”",
  song: "song requests", poll: "a poll", brand: "your brand", personal: "personal invitations", csv: "spreadsheet downloads", copy: "copying an invitation", insights: "detailed insights",
  alias: "a custom link", preview: "client previews", wishes: "showing wishes on the invitation", remind: "reminding everyone at once",
};
/** "A schedule of celebrations and your own colours are part of the Creator studio." (the server's words; the studio shows its own). */
export function proMessage(features: ProFeature[]) {
  const names = features.map((f) => FEATURE_NAMES[f]);
  const list = names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
  return `${list.charAt(0).toUpperCase()}${list.slice(1)} ${features.length === 1 ? "is" : "are"} part of the Creator studio.`;
}

/** The Creator studio features a draft (for an occasion) uses, if any. */
export function proFeaturesIn(templateId: TemplateId, draft: InvitationDraft): ProFeature[] {
  const used: ProFeature[] = [];
  if (!STARTER_OCCASIONS.includes(templateId)) used.push("occasion");
  if (draft.events.length) used.push("schedule");
  if (draft.palette) used.push("colours");
  if (draft.attribution === false) used.push("attribution");
  if (draft.askSong) used.push("song");
  if (draft.poll) used.push("poll");
  if (draft.brand) used.push("brand");
  return used;
}

/** The draft with the Creator studio's parts taken out: what a free invitation publishes. */
export const freeDraft = (draft: InvitationDraft): InvitationDraft => ({ ...draft, events: [], palette: "", attribution: true, askSong: false, poll: null, brand: null });

/** The plan an invitation is on. Missing means it was made before plans existed, and keeps everything. */
export const planOf = (e: { plan?: Plan }): Plan => e.plan ?? "pro";
export const repliesLimit = (plan: Plan): number => PLAN_LIMITS[plan].replies;

/** The occasion's last day: the main date, or its latest celebration. */
export function lastDay(draft: Pick<InvitationDraft, "date" | "events">) {
  return [draft.date, ...draft.events.map(e => e.date)].filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort().at(-1) ?? "";
}

/** The day a free invitation comes down (30 days after the occasion), as "YYYY-MM-DD"; null when it doesn't. */
export function endsOn(e: { plan?: Plan } & Pick<InvitationDraft, "date" | "events">) {
  const days = PLAN_LIMITS[planOf(e)].daysAfter;
  const last = lastDay(e);
  if (days === null || !last) return null;
  const end = new Date(`${last}T12:00:00Z`);
  end.setUTCDate(end.getUTCDate() + days);
  return end.toISOString().slice(0, 10);
}

/** Whether a free invitation's time is up (on India's calendar). */
export function hasEnded(e: { plan?: Plan } & Pick<InvitationDraft, "date" | "events">, now = Date.now()) {
  const end = endsOn(e);
  return !!end && new Date(now + 5.5 * 3_600_000).toISOString().slice(0, 10) > end;
}
