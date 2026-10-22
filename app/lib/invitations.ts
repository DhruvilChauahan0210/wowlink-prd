export type InvitationDraft = {
  title: string;
  date: string;
  time: string;
  venue: string;
  message: string;
};

export const invitationTemplates = [
  { id: "wedding", name: "The Wedding Edit", category: "Wedding & engagement", action: "Open the invitation", eyebrow: "Together with their families", title: "Aarav & Meera", date: "2026-11-08", time: "18:00", venue: "The Garden House, Surat", message: "Some days are made more beautiful by the people who share them. We would love to celebrate ours with you." },
  { id: "birthday", name: "Make a Wish", category: "Birthday & milestones", action: "Reveal the surprise", eyebrow: "Another year, a little more magic", title: "A night for Riya", date: "2026-12-05", time: "19:00", venue: "The Courtyard, Surat", message: "Good friends, a few candles, and a whole lot of joy. Come make another trip around the sun one to remember." },
  { id: "garba", name: "Raas & Rhythm", category: "Garba & Navratri", action: "Let the night begin", eyebrow: "Nine nights, endless memories", title: "Raas under the stars", date: "2027-10-05", time: "20:00", venue: "Rangoli Courtyard, Navsari", message: "Bring your favourite people and your dancing shoes. Let’s fill the night with colour, rhythm, and a little magic." },
  { id: "opening", name: "A New Beginning", category: "Grand opening", action: "Cut the ribbon", eyebrow: "The start of something wonderful", title: "A new beginning", date: "2026-12-12", time: "10:00", venue: "The Atelier, Vapi", message: "Every new beginning deserves a celebration. Be with us as we open our doors to a beautiful new chapter." },
] as const;

export type InvitationTemplate = (typeof invitationTemplates)[number];
export function getInvitationTemplate(id: string | null | undefined): InvitationTemplate {
  return invitationTemplates.find(item => item.id === id) ?? invitationTemplates[0];
}
export function initialDraft(template: InvitationTemplate): InvitationDraft {
  return { title: template.title, date: template.date, time: template.time, venue: template.venue, message: template.message };
}
export const draftKey = (id: string) => `wowlink:draft:${id}`;

export function readDraft(id: string): InvitationDraft | null {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(draftKey(id)) ?? "null");
    if (!parsed || typeof parsed !== "object") return null;
    const data = parsed as Record<string, unknown>;
    if (!["title", "date", "time", "venue", "message"].every(key => typeof data[key] === "string")) return null;
    return { title: String(data.title), date: String(data.date), time: String(data.time), venue: String(data.venue), message: String(data.message) };
  } catch { return null; }
}

export function formatInvitationDate(value: string, long = false) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "A date to remember";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "A date to remember";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: long ? "long" : "short", year: "numeric" });
}
export function formatInvitationTime(value: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) return "";
  const [hours, minutes] = value.split(":").map(Number);
  if (hours > 23 || minutes > 59) return "";
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${hours >= 12 ? "PM" : "AM"}`;
}
