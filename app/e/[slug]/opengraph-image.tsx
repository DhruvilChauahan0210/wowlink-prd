import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { formatInvitationDate, formatInvitationTime, getInvitationTemplate, sortSchedule } from "../../lib/invitations";
import { getPublished } from "../../lib/store";
import { renderSvg } from "../../lib/svg-string";
import { StandaloneArt, type ArtName } from "../../ui/art";

/*
 * The card WhatsApp, iMessage and social apps show when an invitation link is shared:
 * the occasion's drawing as a taped print, the names, the date and the place, on WowLink's paper.
 */

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "An invitation made with WowLink";
export const dynamic = "force-dynamic";

// The image renderer needs TTF (not woff2), so it has its own static copies of the fonts.
const font = (file: string) => readFile(path.join(process.cwd(), "app/fonts/og", file));
const svgData = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

const TONE: Record<ArtName, string> = { wedding: "#a8341f", birthday: "#c9506d", garba: "#b8552c", opening: "#4f7a3c" };
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
const mark = renderSvg(
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 32 32">
    <path d="M5 29V15.5a11 11 0 0 1 22 0V29M10.5 29V16.5a5.5 5.5 0 0 1 11 0V29" fill="none" stroke="#a8341f" strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="16" cy="22" r="2.1" fill="#e0922f" />
  </svg>,
);

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const experience = await getPublished((await params).slug);
  const [serif, hand, sans] = await Promise.all([font("fraunces.ttf"), font("caveat.ttf"), font("figtree.ttf")]);
  const fonts = [
    { name: "Fraunces", data: serif, weight: 400 as const, style: "normal" as const },
    { name: "Caveat", data: hand, weight: 700 as const, style: "normal" as const },
    { name: "Figtree", data: sans, weight: 500 as const, style: "normal" as const },
  ];

  const name = (experience?.templateId ?? "wedding") as ArtName;
  const template = getInvitationTemplate(name);
  const tone = TONE[name];
  const title = experience?.title ?? "This invitation isn’t available";
  const titleSize = title.length > 34 ? 54 : title.length > 22 ? 66 : 80;
  const when = experience ? [formatInvitationDate(experience.date, true), formatInvitationTime(experience.time)].filter(Boolean).join(" · ") : "";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: PAPER, fontFamily: "Figtree", color: INK, position: "relative" }}>
        <img src={svgData(torana)} width={1200} height={52} style={{ position: "absolute", top: 0, left: 0 }} />

        {/* the drawing, taped down like a print */}
        <div style={{ position: "absolute", left: 84, top: 96, display: "flex", padding: 14, background: "#fbf6ec", transform: "rotate(-3deg)", boxShadow: "0 18px 36px rgba(42,29,20,.28)" }}>
          <div style={{ display: "flex", background: "#f1e6d2", position: "relative" }}>
            <img src={svgData(renderSvg(<StandaloneArt name={name} />))} width={330} height={403} />
            {/* SVG text doesn't survive the image renderer, so the shop sign's word is laid on top (sign: x 118–242, y 66–104 of 360 × 440). */}
            {name === "opening" && <div style={{ position: "absolute", left: 108, top: 60, width: 114, height: 35, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Caveat", fontSize: 27, color: INK }}>OPEN</div>}
          </div>
        </div>
        <div style={{ position: "absolute", left: 210, top: 80, width: 110, height: 34, background: "rgba(224,146,47,.75)", transform: "rotate(-4deg)" }} />

        {/* the words */}
        <div style={{ position: "absolute", left: 540, top: 120, width: 600, display: "flex", flexDirection: "column" }}>
          <div style={{ fontFamily: "Caveat", fontSize: 40, color: tone }}>{experience ? template.eyebrow : "WowLink"}</div>
          <div style={{ fontFamily: "Fraunces", fontSize: titleSize, lineHeight: 1.02, letterSpacing: "-0.02em", marginTop: 10 }}>{title}</div>
          {experience && <div style={{ fontSize: 30, color: "#5d5044", marginTop: 26 }}>{when}</div>}
          {experience && <div style={{ fontSize: 28, color: "#5d5044", marginTop: 6 }}>{experience.venue}</div>}
          {experience && experience.events.length > 1 && <div style={{ fontSize: 24, color: "#7b6d5a", marginTop: 14 }}>{`${sortSchedule(experience.events).slice(0, 4).map(e => e.name).join(" · ")}${experience.events.length > 4 ? " · …" : ""}`}</div>}
          <div style={{ fontFamily: "Caveat", fontSize: 40, color: tone, marginTop: 34, transform: "rotate(-2deg)" }}>{experience ? "tap to open your invitation →" : "make your own at WowLink"}</div>
        </div>

        <div style={{ position: "absolute", right: 60, bottom: 40, display: "flex", alignItems: "center", gap: 10 }}>
          <img src={svgData(mark)} width={36} height={36} />
          <div style={{ fontFamily: "Fraunces", fontSize: 30 }}>WowLink</div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
