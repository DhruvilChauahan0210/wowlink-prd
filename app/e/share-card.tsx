import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { formatInvitationDate, formatInvitationTime, getInvitationTemplate, sortSchedule, type TemplateId } from "../lib/invitations";
import { OCCASION_PAGES } from "../lib/occasion-pages";
import { STARTER_OCCASIONS } from "../lib/plans";
import type { PublicExperience } from "../lib/store";
import { paletteFor } from "../lib/palette";
import { renderSvg } from "../lib/svg-string";
import { StandaloneArt, type ArtName } from "../ui/art";
import { SEAL_CREAM, SEAL_EDGE, SEAL_RED, SEAL_W, SEAL_W_TRANSFORM } from "../ui/brand";

/*
 * The card WhatsApp, iMessage and social apps show when an invitation link is shared:
 * the occasion's drawing as a taped print, the names, the date and the place, on WowLink's paper.
 * A personal link's card is addressed to that household and lists only their celebrations.
 */

export const shareCardSize = { width: 1200, height: 630 };

// The image renderer needs TTF (not woff2), so it has its own static copies of the fonts.
const font = (file: string) => readFile(path.join(process.cwd(), "app/fonts/og", file));
const svgData = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

/*
 * The image renderer draws characters in the order they're stored and doesn't reorder Indic vowel signs. The "i" sign
 * in Gujarati (િ) and Hindi (ि) is stored after its consonant but written before it, so move it in front of its
 * consonant (cluster); otherwise "પરિવાર" comes out as "પરવિાર", and "परिवार" as "परवािर".
 */
const drawable = (text: string) => text.replace(/((?:[ક-હ]઼?્)*[ક-હ]઼?)િ/g, "િ$1").replace(/((?:[क-ह]़?्)*[क-ह]़?)ि/g, "ि$1");

const TONE: Record<ArtName, string> = { wedding: "#a8341f", birthday: "#c9506d", garba: "#b8552c", opening: "#4f7a3c", engagement: "#9c2f55", babyshower: "#3d7f79", housewarming: "#a24a24", anniversary: "#b8405f", diwali: "#b8441a", janoi: "#b0580f", puja: "#b23a1e", naming: "#b83a72" };
const INK = "#241a13";
const PAPER = "#f3ebdc";

// The garland across the top, as on the site.
const torana = renderSvg(
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="52" viewBox="0 0 1200 52">
    {Array.from({ length: 17 }, (_, i) => (
      <g key={i} transform={`translate(${i * 72} 0)`}>
        <path d="M0 3Q18 9 36 3T72 3" fill="none" stroke={INK} strokeOpacity=".5" strokeWidth="1.5" />
        <path d="M7 6L29 6L18 44Z" fill="#a8341f" />
        <path d="M43 6L65 6L54 44Z" fill="#e0922f" />
      </g>
    ))}
  </svg>,
);
// WowLink's seal (ui/brand.tsx).
const mark = renderSvg(
  <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 100 100">
    <path d={SEAL_EDGE} fill={SEAL_RED} />
    <path d={SEAL_W} transform={SEAL_W_TRANSFORM} fill="none" stroke={SEAL_CREAM} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>,
);

type CardWords = { name: ArtName; tone: string; eyebrow: string; title: string; lines: string[]; small?: string; cta: string };

/** The card itself: the drawing as a taped print on the left, the words on the right. */
async function card({ name, tone, eyebrow, title, lines, small, cta }: CardWords) {
  const [serif, hand, sans, gujarati, devanagari] = await Promise.all([font("fraunces.ttf"), font("caveat.ttf"), font("figtree.ttf"), font("noto-serif-gujarati.ttf"), font("noto-serif-devanagari.ttf")]);
  // Gujarati comes last: it's only reached for characters the others don't have (a household's name, a title).
  const fonts = [
    { name: "Fraunces", data: serif, weight: 400 as const, style: "normal" as const },
    { name: "Caveat", data: hand, weight: 700 as const, style: "normal" as const },
    { name: "Figtree", data: sans, weight: 500 as const, style: "normal" as const },
    { name: "Noto Serif Gujarati", data: gujarati, weight: 500 as const, style: "normal" as const },
    { name: "Noto Serif Devanagari", data: devanagari, weight: 500 as const, style: "normal" as const },
  ];
  const titleSize = title.length > 34 ? 54 : title.length > 22 ? 66 : 80;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: PAPER, fontFamily: "Figtree", color: INK, position: "relative" }}>
        <img src={svgData(torana)} width={1200} height={52} style={{ position: "absolute", top: 0, left: 0 }} />

        {/* the drawing, taped down like a print */}
        <div style={{ position: "absolute", left: 84, top: 96, display: "flex", padding: 14, background: "#fbf6ec", transform: "rotate(-3deg)", boxShadow: "0 18px 36px rgba(42,29,20,.28)" }}>
          <div style={{ display: "flex", background: "#f1e6d2", position: "relative" }}>
            <img src={svgData(renderSvg(<StandaloneArt name={name} />))} width={330} height={403} />
          </div>
        </div>
        <div style={{ position: "absolute", left: 210, top: 80, width: 110, height: 34, background: "rgba(224,146,47,.75)", transform: "rotate(-4deg)" }} />

        {/* the words */}
        <div style={{ position: "absolute", left: 540, top: 120, width: 600, display: "flex", flexDirection: "column" }}>
          <div style={{ fontFamily: "Caveat", fontSize: 40, color: tone, lineHeight: 1.1 }}>{drawable(eyebrow)}</div>
          <div style={{ fontFamily: "Fraunces", fontSize: titleSize, lineHeight: 1.02, letterSpacing: "-0.02em", marginTop: 10 }}>{drawable(title)}</div>
          {lines.map((line, i) => <div key={i} style={{ fontSize: i ? 28 : 30, color: "#5d5044", marginTop: i ? 6 : 26 }}>{drawable(line)}</div>)}
          {small && <div style={{ fontSize: 24, color: "#7b6d5a", marginTop: 14 }}>{drawable(small)}</div>}
          <div style={{ fontFamily: "Caveat", fontSize: 40, color: tone, marginTop: 34, transform: "rotate(-2deg)" }}>{cta}</div>
        </div>

        <div style={{ position: "absolute", right: 60, bottom: 40, display: "flex", alignItems: "center", gap: 10 }}>
          <img src={svgData(mark)} width={42} height={42} />
          <div style={{ display: "flex", fontFamily: "Fraunces", fontSize: 32, letterSpacing: "-0.03em" }}>wow<span style={{ color: SEAL_RED }}>link</span></div>
        </div>
      </div>
    ),
    { ...shareCardSize, fonts },
  );
}

/** `experience` is null when the link doesn't lead anywhere (still a friendly card, never an error). */
export function shareCard(experience: PublicExperience | null, addressee?: string) {
  const name = (experience?.templateId ?? "wedding") as ArtName;
  const template = getInvitationTemplate(name);
  const when = experience ? [formatInvitationDate(experience.date, true), formatInvitationTime(experience.time)].filter(Boolean).join(" · ") : "";
  return card({
    name,
    // the host's colours, when they chose some
    tone: paletteFor(experience?.palette)?.accent ?? TONE[name],
    eyebrow: !experience ? "WowLink" : addressee ? `For ${addressee}` : template.eyebrow,
    title: experience?.title ?? "This invitation isn’t available",
    lines: !experience ? [] : experience.pending ? ["Details to follow"] : [when, experience.venue],
    small: experience && experience.events.length > 1 ? `${sortSchedule(experience.events).slice(0, 4).map(e => e.name).join(" · ")}${experience.events.length > 4 ? " · …" : ""}` : undefined,
    cta: experience ? "tap to open your invitation →" : "make your own at WowLink",
  });
}

/** The card for an occasion's own page (/templates/<id>), when that page is shared. */
export function occasionCard(id: TemplateId) {
  const template = getInvitationTemplate(id);
  const { heading } = OCCASION_PAGES[template.id];
  return card({
    name: template.id,
    tone: TONE[template.id],
    eyebrow: template.category,
    title: `${heading[0]} ${heading[1]}`,
    lines: ["Hand-drawn, in Gujarati, Hindi or English", "One link for WhatsApp, with replies"],
    cta: STARTER_OCCASIONS.includes(template.id) ? "make yours free →" : "make yours →",
  });
}

/** The card for WowLink's own pages (the home page, pricing, help…), when they're shared. */
export function siteCard() {
  return card({
    name: "wedding",
    tone: TONE.wedding,
    eyebrow: "WowLink",
    title: "One link. A whole celebration.",
    lines: ["Hand-drawn invitations for WhatsApp", "In Gujarati, Hindi or English, with replies"],
    cta: "make yours free →",
  });
}
