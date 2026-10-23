import { createContext, useContext, type CSSProperties, type ReactNode } from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/fonts";

/*
 * The video's pieces, in WowLink's own look: cream paper, ink, the red and marigold of its drawings, its fonts
 * (Fraunces, Figtree, Caveat) and hand-drawn strokes. Everything moves on springs, so it feels drawn, not slid.
 */

export const C = { paper: "#f3ebdc", surface: "#faf5ea", ink: "#241a13", muted: "#5d5044", red: "#a8341f", marigold: "#e0922f", dark: "#1f1813", cream: "#f6efe3", gold: "#e5b36a", green: "#2f6b3a" };
export const F = { serif: "Fraunces, serif", sans: "Figtree, sans-serif", hand: "Caveat, cursive", deva: "'Noto Serif Devanagari', serif", guj: "'Noto Serif Gujarati', serif" };

for (const [family, file, style] of [["Fraunces", "fraunces.woff2", "normal"], ["Fraunces", "fraunces-italic.woff2", "italic"], ["Figtree", "figtree.woff2", "normal"], ["Caveat", "caveat.woff2", "normal"], ["Noto Serif Devanagari", "noto-serif-devanagari.woff2", "normal"], ["Noto Serif Gujarati", "noto-serif-gujarati.woff2", "normal"]] as const) {
  loadFont({ family, url: staticFile(`fonts/${file}`), style, weight: "100 900" });
}

/** The current line's words and when each is said (seconds from the line's start). */
export type Word = { w: string; s: number; e: number };
export const SceneWords = createContext<Word[]>([]);

/** The frame (from the scene's start) at which a word is said; `fallback` if the line doesn't have it. */
export function useWord(word: string, fallback = 0, nth = 0) {
  const words = useContext(SceneWords);
  const { fps } = useVideoConfig();
  const found = words.filter((w) => w.w.replace(/[^\w]/g, "").toLowerCase() === word.toLowerCase())[nth];
  return found ? Math.round(found.s * fps) : fallback;
}

/** The frame size, and whether this is the wide (16:9) version. */
export function useShape() {
  const { width, height, fps } = useVideoConfig();
  return { width, height, fps, wide: width > height };
}

/** A spring from 0 to 1 starting at `delay` frames. */
export function useIn(delay = 0, config: { damping?: number; stiffness?: number; mass?: number } = {}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 120, mass: 0.8, ...config } });
}

/** 0 to 1 over `from`..`to` frames, eased. */
export function useRange(from: number, to: number) {
  const frame = useCurrentFrame();
  return interpolate(frame, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (t) => 1 - Math.pow(1 - t, 3) });
}

const GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .16 0 0 0 0 .11 0 0 0 0 .07 0 0 0 .1 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/** Festive bunting across the top, dropping in flag by flag. */
export function Bunting({ delay = 0, top = 0 }: { delay?: number; top?: number }) {
  const { width } = useShape();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const flag = 72;
  const count = Math.ceil(width / flag) + 1;
  const sag = (i: number) => 14 * Math.sin((Math.PI * i) / (count - 1));
  return <svg width={width} height={140} style={{ position: "absolute", top, left: 0 }} viewBox={`0 0 ${width} 140`}>
    <path d={`M0 10 Q${width / 2} 38 ${width} 10`} fill="none" stroke={C.ink} strokeOpacity={0.5} strokeWidth={2.5}/>
    {Array.from({ length: count }, (_, i) => {
      const p = spring({ frame: frame - delay - i * 1.2, fps, config: { damping: 9, stiffness: 140 } });
      const x = i * flag - 6;
      const y = 12 + sag(i);
      return <path key={i} d={`M${x} ${y}L${x + 52} ${y}L${x + 26} ${y + 64}Z`} fill={i % 2 ? C.marigold : C.red} transform={`rotate(${(1 - p) * -25} ${x + 26} ${y}) translate(0 ${(1 - p) * -90})`} opacity={p}/>;
    })}
  </svg>;
}

/** WowLink's arch mark, drawing itself in. */
export function Mark({ size, draw = 1, color = C.red }: { size: number; draw?: number; color?: string }) {
  const stroke = { fill: "none", stroke: color, strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round", pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - draw } as const;
  return <svg width={size} height={size} viewBox="0 0 32 32">
    <path d="M5 29V15.5a11 11 0 0 1 22 0V29" {...stroke}/>
    <path d="M10.5 29V16.5a5.5 5.5 0 0 1 11 0V29" {...stroke}/>
    <circle cx="16" cy="22" r="2.1" fill={color} opacity={draw > 0.9 ? 1 : 0}/>
  </svg>;
}

/** The logo: the mark and "WowLink". */
export function Logo({ size, draw = 1, color = C.ink, mark = C.red }: { size: number; draw?: number; color?: string; mark?: string }) {
  return <div style={{ display: "flex", alignItems: "center", gap: size * 0.28 }}>
    <Mark size={size} draw={draw} color={mark}/>
    <span style={{ font: `700 ${size * 0.82}px/1 ${F.serif}`, color, letterSpacing: "-0.02em", opacity: interpolate(draw, [0.4, 1], [0, 1], { extrapolateLeft: "clamp" }) }}>WowLink</span>
  </div>;
}

/** A phone, showing a screen (an image from public/, or anything) under a status bar. Screens are 1170×2532 (390×844 at 3x). */
export function Phone({ screen, width, style, children, scroll = 0 }: { screen?: string; width: number; style?: CSSProperties; children?: ReactNode; scroll?: number }) {
  const pad = width * 0.035;
  const inner = width - pad * 2;
  const height = inner * (2532 / 1170);
  const bar = inner * STATUS;
  return <div style={{ position: "absolute", width, height: height + pad * 2, borderRadius: width * 0.14, background: "#18120d", padding: pad, boxShadow: "0 40px 90px rgba(36,26,19,.35), 0 12px 24px rgba(36,26,19,.25)", ...style }}>
    <div style={{ position: "relative", width: inner, height, borderRadius: width * 0.11, overflow: "hidden", background: C.paper }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: bar, display: "flex", alignItems: "center", justifyContent: "space-between", padding: `0 ${inner * 0.09}px`, font: `700 ${inner * 0.04}px ${F.sans}`, color: C.ink }}>
        <span>9:41</span>
        <span style={{ display: "flex", gap: inner * 0.012, alignItems: "flex-end" }}>
          {[0.35, 0.55, 0.75, 1].map((h, i) => <span key={i} style={{ width: inner * 0.008, height: inner * 0.03 * h, background: C.ink, borderRadius: 2 }}/>)}
          <span style={{ marginLeft: inner * 0.02, width: inner * 0.06, height: inner * 0.028, border: `${inner * 0.004}px solid ${C.ink}`, borderRadius: inner * 0.008, padding: inner * 0.003 }}><span style={{ display: "block", width: "78%", height: "100%", background: C.ink, borderRadius: 2 }}/></span>
        </span>
      </div>
      <div style={{ position: "absolute", top: bar, left: 0, right: 0, bottom: 0, overflow: "hidden" }}>
        {screen && <Img src={staticFile(screen)} style={{ position: "absolute", top: -scroll * (inner / 1170), left: 0, width: inner }}/>}
        {children}
      </div>
      <div style={{ position: "absolute", top: bar * 0.24, left: "50%", width: inner * 0.27, height: bar * 0.52, marginLeft: -inner * 0.135, borderRadius: 999, background: "#18120d" }}/>
    </div>
  </div>;
}

/** The status bar's height, as a share of the screen's width. */
const STATUS = 0.105;

/** A point on a phone's screen (in the screenshot's 1170×2532 pixels) as a position in the phone's box. */
export const onScreen = (phoneWidth: number, x: number, y: number) => {
  const pad = phoneWidth * 0.035;
  const inner = phoneWidth - pad * 2;
  const scale = inner / 1170;
  return { left: pad + x * scale, top: pad + inner * STATUS + y * scale };
};

/** A finger's tap: a ring that grows and fades, at (left, top) inside a phone. */
export function Tap({ at, left, top, size = 90 }: { at: number; left: number; top: number; size?: number }) {
  const frame = useCurrentFrame() - at;
  if (frame < 0 || frame > 24) return null;
  const grow = interpolate(frame, [0, 18], [0.3, 1.4], { extrapolateRight: "clamp" });
  const fade = interpolate(frame, [4, 24], [0.9, 0], { extrapolateLeft: "clamp" });
  return <>
    <div style={{ position: "absolute", left: left - size / 2, top: top - size / 2, width: size, height: size, borderRadius: "50%", border: `5px solid ${C.red}`, transform: `scale(${grow})`, opacity: fade }}/>
    <div style={{ position: "absolute", left: left - size / 4, top: top - size / 4, width: size / 2, height: size / 2, borderRadius: "50%", background: C.red, opacity: fade * 0.45, transform: `scale(${interpolate(frame, [0, 6, 14], [0.6, 1, 0.8], { extrapolateRight: "clamp" })})` }}/>
  </>;
}

/** Springs its children in (scale and rise) at `delay`. */
export function Pop({ delay = 0, children, style, from = 0.6 }: { delay?: number; children: ReactNode; style?: CSSProperties; from?: number }) {
  const p = useIn(delay, { damping: 11, stiffness: 160 });
  return <div style={{ ...style, opacity: Math.min(1, p * 1.4), transform: `${style?.transform ?? ""} translateY(${(1 - p) * 40}px) scale(${from + (1 - from) * p})` }}>{children}</div>;
}

/** A twinkling star or flower, drawn like WowLink's doodles. */
export function Sparkle({ x, y, size = 50, delay = 0, color = C.marigold, kind = "star" }: { x: number; y: number; size?: number; delay?: number; color?: string; kind?: "star" | "flower" }) {
  const frame = useCurrentFrame();
  const p = useIn(delay, { damping: 8, stiffness: 120 });
  const twinkle = 1 + 0.12 * Math.sin((frame - delay) / 6);
  const path = kind === "star"
    ? "M25 3L31 19L48 19L34 29L40 46L25 36L10 46L16 29L2 19L19 19Z"
    : "M25 25m-6 0a6 6 0 1 0 12 0a6 6 0 1 0-12 0M25 4c5 7 5 11 0 15c-5-4-5-8 0-15M46 25c-7 5-11 5-15 0c4-5 8-5 15 0M25 46c-5-7-5-11 0-15c5 4 5 8 0 15M4 25c7-5 11-5 15 0c-4 5-8 5-15 0";
  return <svg width={size} height={size} viewBox="0 0 50 50" style={{ position: "absolute", left: x - size / 2, top: y - size / 2, transform: `scale(${p * twinkle}) rotate(${(1 - p) * -90 + (frame - delay) * 0.6}deg)`, opacity: p }}>
    <path d={path} fill="none" stroke={color} strokeWidth={3.2} strokeLinejoin="round" strokeLinecap="round"/>
  </svg>;
}

// ---------- the Reels kit: backgrounds, impacts, stickers, confetti ----------

export type Ground = "paper" | "marigold" | "red" | "dark";
const GROUNDS: Record<Ground, { base: string; glow: string; ray: string }> = {
  paper: { base: C.paper, glow: "#fbf4e6", ray: "#efe2c8" },
  marigold: { base: "#e7a03a", glow: "#f6c463", ray: "#eeb04c" },
  red: { base: "#a8341f", glow: "#cf5236", ray: "#b6402a" },
  dark: { base: C.dark, glow: "#3a2a1c", ray: "#251c16" },
};

/** A scene's background: a colour, a soft glow, slowly turning sunburst rays (or dots on paper), and grain. */
export function Ground({ kind, rays = kind !== "paper" }: { kind: Ground; rays?: boolean }) {
  const frame = useCurrentFrame();
  const { width, height } = useShape();
  const g = GROUNDS[kind];
  const size = Math.hypot(width, height) * 1.1;
  return <AbsoluteFill style={{ background: g.base, overflow: "hidden" }}>
    {rays && <svg width={size} height={size} viewBox="-50 -50 100 100" style={{ position: "absolute", left: width / 2 - size / 2, top: height * 0.55 - size / 2, transform: `rotate(${frame * 0.25}deg)` }}>
      {Array.from({ length: 18 }, (_, i) => {
        const a = (i / 18) * Math.PI * 2;
        const b = a + Math.PI / 18;
        return <path key={i} d={`M0 0L${50 * Math.cos(a) * 1.5} ${50 * Math.sin(a) * 1.5}L${50 * Math.cos(b) * 1.5} ${50 * Math.sin(b) * 1.5}Z`} fill={g.ray}/>;
      })}
    </svg>}
    {!rays && <AbsoluteFill style={{ backgroundImage: `radial-gradient(${C.ink}22 2.2px, transparent 2.6px)`, backgroundSize: "44px 44px", backgroundPosition: `${frame * 0.4}px ${frame * 0.8}px` }}/>}
    <AbsoluteFill style={{ background: `radial-gradient(55% 40% at 50% 55%, ${g.glow}cc 0%, transparent 75%)` }}/>
    <AbsoluteFill style={{ backgroundImage: GRAIN, opacity: kind === "dark" ? 0.45 : 0.75 }}/>
  </AbsoluteFill>;
}

/** A quick shake after each of `at` (frames): an offset to add to a transform. */
export function shake(frame: number, at: number[], amp = 22, frames = 12) {
  let x = 0;
  let y = 0;
  for (const a of at) {
    const t = frame - a;
    if (t < 0 || t > frames) continue;
    const k = amp * Math.pow(1 - t / frames, 2);
    x += k * Math.sin(t * 2.7);
    y += k * Math.cos(t * 3.3) * 0.6;
  }
  return { x, y };
}

/** A rubber stamp slamming down: big, tilted, in a thick box. */
export function Stamp({ at, children, color = C.red, ink = C.cream, rotate = -10, size = 120, style }: { at: number; children: ReactNode; color?: string; ink?: string; rotate?: number; size?: number; style?: CSSProperties }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at) return null;
  const p = spring({ frame: frame - at, fps, config: { damping: 11, stiffness: 320, mass: 0.7 } });
  return <div style={{ position: "absolute", ...style, transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${2.6 - 1.6 * p})`, opacity: Math.min(1, p * 3) }}>
    <div style={{ background: color, color: ink, border: `${size * 0.07}px solid ${C.dark}`, borderRadius: size * 0.16, padding: `${size * 0.12}px ${size * 0.32}px`, font: `900 ${size}px/1 ${F.sans}`, letterSpacing: "-0.02em", whiteSpace: "nowrap", boxShadow: `0 ${size * 0.12}px 0 ${C.dark}` }}>{children}</div>
  </div>;
}

/** An emoji sticker that pops on and wobbles. */
export function Sticker({ at, emoji, size = 130, x, y, rotate = 0 }: { at: number; emoji: string; size?: number; x: number; y: number; rotate?: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at) return null;
  const p = spring({ frame: frame - at, fps, config: { damping: 7, stiffness: 220 } });
  const wobble = Math.sin((frame - at) / 5) * 6;
  return <div style={{ position: "absolute", left: x, top: y, fontSize: size, lineHeight: 1, transform: `translate(-50%, -50%) scale(${p}) rotate(${rotate + wobble}deg)`, filter: "drop-shadow(0 10px 0 rgba(31,24,19,.25))" }}>{emoji}</div>;
}

const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** A burst of confetti from (x, y) at frame `at`: paper bits flying out and falling. */
export function Confetti({ at, x, y, count = 36, power = 1, colors = [C.red, C.marigold, C.cream, "#e5739a", C.gold] }: { at: number; x: number; y: number; count?: number; power?: number; colors?: string[] }) {
  const frame = useCurrentFrame();
  const t = (frame - at) / 30;
  if (t < 0 || t > 2.4) return null;
  return <>
    {Array.from({ length: count }, (_, i) => {
      const angle = hash(i + at) * Math.PI * 2;
      const speed = (700 + hash(i * 3 + at) * 900) * power;
      const px = x + Math.cos(angle) * speed * t;
      const py = y + Math.sin(angle) * speed * t * 0.8 + 1400 * t * t;
      const w = 14 + hash(i * 7) * 16;
      return <div key={i} style={{ position: "absolute", left: px, top: py, width: w, height: w * (hash(i * 5) > 0.5 ? 0.45 : 1), borderRadius: hash(i * 11) > 0.6 ? "50%" : 3, background: colors[i % colors.length], transform: `rotate(${t * 720 * (hash(i * 13) - 0.5)}deg)`, opacity: Math.max(0, 1 - t / 2.4) }}/>;
    })}
  </>;
}

/** A ring that bursts out from a point, behind a slam. */
export function Shockwave({ at, x, y, color = C.cream, size = 900 }: { at: number; x: number; y: number; color?: string; size?: number }) {
  const frame = useCurrentFrame();
  const t = (frame - at) / 18;
  if (t < 0 || t > 1) return null;
  return <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: "50%", border: `${18 * (1 - t)}px solid ${color}`, transform: `scale(${0.1 + t})`, opacity: 1 - t }}/>;
}
