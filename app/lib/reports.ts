import type { Lang } from "./invitations";

/*
 * Reports: anyone who can open an invitation can tell WowLink something is wrong with it. A report keeps the reason
 * and what the person wrote, and nothing about who sent it, so the hosts can't find out who reported them.
 */

export const REPORT_REASONS = ["fake", "scam", "hateful", "private", "other"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];
export const isReportReason = (value: unknown): value is ReportReason => REPORT_REASONS.includes(value as ReportReason);
export const REPORT_DETAILS_MAX = 500;

export type Report = {
  id: string;
  experienceId: string;
  reason: ReportReason;
  details: string;
  createdAt: string;
  /** Set once WowLink has looked at it: the invitation was taken down, or the report was dismissed. */
  resolvedAt?: string;
  outcome?: "taken-down" | "dismissed";
};

/** Why an invitation was taken down, shown to its host. */
export type Removal = { at: string; reason?: ReportReason };

export const REASON_TEXT: Record<Lang, Record<ReportReason, string>> = {
  en: {
    fake: "It’s fake, or pretends to be someone else",
    scam: "Spam, a scam or a dangerous link",
    hateful: "Hateful, violent or sexual content",
    private: "It shares someone’s private information",
    other: "Something else",
  },
  gu: {
    fake: "નકલી છે, અથવા કોઈ બીજાના નામે બનાવેલું છે",
    scam: "સ્પામ, છેતરપિંડી કે જોખમી લિંક",
    hateful: "નફરત, હિંસા કે અશ્લીલ વાતો",
    private: "કોઈની અંગત માહિતી જાહેર કરે છે",
    other: "બીજું કંઈ",
  },
};

export const REPORT_TEXT = {
  en: {
    title: "Report this invitation",
    reporting: (title: string) => `You’re reporting “${title}”.`,
    gone: "This invitation isn’t available any more, so there’s nothing to report.",
    why: "What’s wrong with it?",
    details: "Anything we should know?",
    optional: "optional",
    detailsHint: "Don’t include your own name or number: we don’t need them.",
    send: "Send report",
    sending: "Sending…",
    pickReason: "Pick what’s wrong with it.",
    failed: "Couldn’t send it. Check your connection and try again.",
    tooMany: "You’ve sent a lot of reports. Try again a little later.",
    promise: "WowLink looks at every reported invitation. The hosts aren’t told who reported them, and we can’t reply, because we don’t ask who you are.",
    thanksTitle: "Thank you",
    thanks: "We’ll look at it. If it breaks the rules, we’ll take it down.",
    back: "Back to the invitation",
    other: "ગુજરાતીમાં",
    privacy: "Privacy",
  },
  gu: {
    title: "આ આમંત્રણની ફરિયાદ કરો",
    reporting: (title: string) => `આપ “${title}” ની ફરિયાદ કરો છો.`,
    gone: "આ આમંત્રણ હવે ઉપલબ્ધ નથી, એટલે ફરિયાદ કરવા જેવું કંઈ નથી.",
    why: "તેમાં શું ખોટું છે?",
    details: "બીજું કંઈ જણાવવું છે?",
    optional: "વૈકલ્પિક",
    detailsHint: "આપનું નામ કે નંબર ન લખો: તેની જરૂર નથી.",
    send: "ફરિયાદ મોકલો",
    sending: "મોકલાય છે…",
    pickReason: "તેમાં શું ખોટું છે તે પસંદ કરો.",
    failed: "મોકલી ન શકાઈ. ઇન્ટરનેટ તપાસીને ફરી પ્રયાસ કરો.",
    tooMany: "આપે ઘણી ફરિયાદો મોકલી છે. થોડી વાર પછી પ્રયાસ કરો.",
    promise: "WowLink દરેક ફરિયાદ થયેલું આમંત્રણ જુએ છે. યજમાનને જણાવાતું નથી કે ફરિયાદ કોણે કરી, અને અમે જવાબ આપી શકતા નથી, કારણ કે અમે આપની ઓળખ પૂછતા નથી.",
    thanksTitle: "આભાર",
    thanks: "અમે તે જોઈશું. જો તે નિયમો તોડતું હશે, તો અમે તેને દૂર કરીશું.",
    back: "આમંત્રણ પર પાછા જાઓ",
    other: "English",
    privacy: "ગોપનીયતા",
  },
} satisfies Record<Lang, Record<string, string | ((title: string) => string)>>;
