import { readFile } from "node:fs/promises";
import path from "node:path";
import type { CSSProperties, ReactElement } from "react";
import { ImageResponse } from "next/og";
import { recordError } from "../lib/errors";
import { GUEST_TEXT, OCCASION_WORDS } from "../lib/i18n";
import { formatInvitationDate, formatInvitationTime, getInvitationTemplate, sortSchedule, type Lang, type TemplateId } from "../lib/invitations";
import { OCCASION_COPY } from "../lib/occasion-pages";
import { STARTER_OCCASIONS } from "../lib/plans";
import type { PublicExperience } from "../lib/store";
import { paletteFor } from "../lib/palette";
import { renderSvg } from "../lib/svg-string";
import { StandaloneArt, type ArtName } from "../ui/art";
import { SEAL_CREAM, SEAL_EDGE, SEAL_RED, SEAL_W, SEAL_W_TRANSFORM } from "../ui/brand";
import { needsShaping, shapeText, type ShapeStyle } from "./shaped-text";

/*
 * The card WhatsApp, iMessage and social apps show when an invitation link is shared:
 * the occasion's drawing as a taped print, the names, the date and the place, on WowLink's paper, in the invitation's
 * language. A personal link's card is addressed to that household and lists only their celebrations.
 */

export const shareCardSize = { width: 1200, height: 630 };

// The image renderer needs TTF (not woff2), so it has its own static copies of the fonts.
const font = (file: string) => readFile(path.join(process.cwd(), "app/fonts/og", file));
const svgData = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

/*
 * A line of the card's words, in its style. One with Gujarati or Hindi in it is shaped by HarfBuzz and placed as an
 * image (shaped-text.ts): the image renderer can't join those letters itself.
 */
async function words(text: string, style: Omit<ShapeStyle, "maxWidth">, css: CSSProperties): Promise<ReactElement> {
  if (needsShaping(text)) {
    try {
      return shaped(await shapeText(text, { ...style, maxWidth: COLUMN }), css);
    } catch (error) {
      unshaped(error);
    }
  }
  return <div style={css}>{text}</div>;
}

// Should HarfBuzz ever fail to load, the card still comes out (its Gujarati or Hindi letters unjoined), and the error
// shows on the admin page and in the health check, once per server instance.
let noted = false;
function unshaped(error: unknown) {
  if (noted) return;
  noted = true;
  void recordError({ method: "GET", path: "share card", message: `Gujarati or Hindi couldn't be shaped: ${String(error)}`.slice(0, 300), digest: null }).catch(() => undefined);
}
function shaped(lines: Awaited<ReturnType<typeof shapeText>>, css: CSSProperties) {
  const { width, height, overflow: o } = lines;
  return <div style={{ ...css, display: "flex" }}>
    <img src={lines.src} width={width + o.left + o.right} height={height + o.top + o.bottom} style={{ margin: `${-o.top}px ${-o.right}px ${-o.bottom}px ${-o.left}px` }} />
  </div>;
}

/**
 * The title, by its length (a long one smaller). One in Gujarati or Hindi is measured instead, its lines being taller:
 * as big as it can be within the room the rest of the card leaves it (`room`, in pixels), in at most three lines.
 */
async function titleWords(title: string, room: number, css: CSSProperties) {
  const style = { font: "fraunces" as const, lineHeight: 1.02, letterSpacing: -0.02, color: INK };
  if (needsShaping(title)) {
    try {
      let fitted;
      for (const size of [80, 66, 54, 46, 40]) {
        fitted = await shapeText(title, { ...style, size, maxWidth: COLUMN });
        if (fitted.lines <= 3 && fitted.height <= room) break;
      }
      return shaped(fitted!, css);
    } catch (error) {
      unshaped(error);
    }
  }
  const size = title.length > 34 ? 54 : title.length > 22 ? 66 : 80;
  return <div style={{ ...css, fontFamily: "Fraunces", fontSize: size, lineHeight: style.lineHeight, letterSpacing: "-0.02em" }}>{title}</div>;
}

const COLUMN = 600;

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
  const [eyebrowLine, titleLines, lineLines, smallLine, ctaLine] = await Promise.all([
    words(eyebrow, { font: "caveat", size: 40, lineHeight: 1.1, color: tone }, { fontFamily: "Caveat", fontSize: 40, color: tone, lineHeight: 1.1 }),
    // The words start 120px down and should end by 600: the title gets what the rest leaves (each with its margin).
    titleWords(title, 480 - 54 - lines.reduce((sum, _, i) => sum + (i ? 6 + 36 : 26 + 38), 0) - (small ? 14 + 31 : 0) - (34 + 50), { marginTop: 10 }),
    Promise.all(lines.map((line, i) => words(line, { font: "figtree", size: i ? 28 : 30, lineHeight: 1.25, color: "#5d5044" }, { fontSize: i ? 28 : 30, color: "#5d5044", marginTop: i ? 6 : 26 }))),
    small ? words(small, { font: "figtree", size: 24, lineHeight: 1.25, color: "#7b6d5a" }, { fontSize: 24, color: "#7b6d5a", marginTop: 14 }) : null,
    words(cta, { font: "caveat", size: 40, lineHeight: 1.2, color: tone }, { fontFamily: "Caveat", fontSize: 40, color: tone, marginTop: 34, transform: "rotate(-2deg)" }),
  ]);

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
        <div style={{ position: "absolute", left: 540, top: 120, width: COLUMN, display: "flex", flexDirection: "column" }}>
          {eyebrowLine}
          {titleLines}
          {lineLines}
          {smallLine}
          {ctaLine}
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

const OPEN: Record<Lang, string> = { en: "tap to open your invitation →", gu: "આમંત્રણ ખોલવા ટૅપ કરો →", hi: "निमंत्रण खोलने के लिए टैप करें →" };

/** `experience` is null when the link doesn't lead anywhere (still a friendly card, never an error). */
export function shareCard(experience: PublicExperience | null, addressee?: string) {
  const name = (experience?.templateId ?? "wedding") as ArtName;
  const template = getInvitationTemplate(name);
  // In the language guests first see the invitation in.
  const lang = experience?.language ?? "en";
  const t = GUEST_TEXT[lang];
  const when = experience ? [formatInvitationDate(experience.date, true, lang), formatInvitationTime(experience.time, lang)].filter(Boolean).join(" · ") : "";
  return card({
    name,
    // the host's colours, when they chose some
    tone: paletteFor(experience?.palette)?.accent ?? TONE[name],
    eyebrow: !experience ? "WowLink" : addressee ? t.addressedTo(addressee) : OCCASION_WORDS[lang]?.[template.id].eyebrow ?? template.eyebrow,
    title: experience?.title ?? "This invitation isn’t available",
    lines: !experience ? [] : experience.pending ? [t.detailsToFollow] : [when, experience.venue].filter(Boolean),
    small: experience && experience.events.length > 1 ? `${sortSchedule(experience.events).slice(0, 4).map(e => e.name).join(" · ")}${experience.events.length > 4 ? " · …" : ""}` : undefined,
    cta: experience ? OPEN[lang] : "make your own at WowLink",
  });
}

const OCCASION_CARD: Record<Lang, { lines: string[]; free: string; make: string }> = {
  en: { lines: ["Hand-drawn, in Gujarati, Hindi or English", "One link for WhatsApp, with replies"], free: "make yours free →", make: "make yours →" },
  gu: { lines: ["હાથે દોરેલું, ગુજરાતી, હિન્દી કે અંગ્રેજીમાં", "WhatsApp માટે એક લિંક, જવાબો સાથે"], free: "આમંત્રણ બનાવો, મફત →", make: "આમંત્રણ બનાવો →" },
  hi: { lines: ["हाथ से बना, हिन्दी, गुजराती या अंग्रेज़ी में", "WhatsApp के लिए एक लिंक, जवाबों के साथ"], free: "निमंत्रण बनाएँ, मुफ़्त →", make: "निमंत्रण बनाएँ →" },
};

/** The card for an occasion's own page (/templates/<id>, in English, Gujarati or Hindi), when that page is shared. */
export function occasionCard(id: TemplateId, lang: Lang = "en") {
  const { names, pages } = OCCASION_COPY[lang];
  const words = OCCASION_CARD[lang];
  return card({
    name: id,
    tone: TONE[id],
    eyebrow: names[id],
    title: pages[id].heading.filter(Boolean).join(" "),
    lines: words.lines,
    cta: STARTER_OCCASIONS.includes(id) ? words.free : words.make,
  });
}

/** The card for an invitation wording guide (/wording/<slug>), when it's shared. */
export function wordingCard(id: TemplateId, title: string) {
  return card({
    name: id,
    tone: TONE[id],
    eyebrow: "Invitation wording",
    title,
    lines: ["Ready to copy, in English, Gujarati and Hindi", "For the invitation and the WhatsApp message"],
    cta: "copy the words →",
  });
}

export function guideCard(id: TemplateId, title: string) {
  return card({
    name: id,
    tone: TONE[id],
    eyebrow: "Guide",
    title,
    lines: ["How to send it, and when", "Plain answers, in short steps"],
    cta: "read the guide →",
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
