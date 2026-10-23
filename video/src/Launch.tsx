import type { ReactNode } from "react";
import { AbsoluteFill, Audio, Easing, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import lines from "../public/voice/lines.json";
import { C, F, Ground, SceneWords, useShape, type Word } from "./kit";
import { Cta, Guest, Hook, Host, Languages, Reveal, Rsvp, Studio } from "./scenes";

/*
 * WowLink's launch video: eight lines of Hinglish voiceover (scripts/voice.py), each with its scene and caption, over an
 * original track (scripts/music.py), then an end card. Timings come from the voice files, so changing the script and
 * re-running `npm run voice` and `npm run music` re-times everything. Cut like a Reel, with calm, eased motion: every
 * scene has its own colour, the cuts zoom through a blur from one scene into the next, the camera pushes in slowly
 * through each scene, and the captions rise in a few words at a time as they're said.
 */

export const FPS = 30;
type Line = { id: string; caption: string; highlight: string[]; seconds: number; words: Word[] };
const LINES = lines as Line[];
const START: Record<string, number> = {};
let at = 0;
for (const line of LINES) {
  START[line.id] = Math.round(at * FPS);
  at += line.seconds;
}
export const VOICE_END = Math.round(at * FPS);
export const TOTAL = VOICE_END + Math.round(3.2 * FPS);
const length = (id: string) => {
  const i = LINES.findIndex((l) => l.id === id);
  return (i + 1 < LINES.length ? START[LINES[i + 1].id] : VOICE_END) - START[id];
};

const SCENES = { hook: Hook, reveal: Reveal, studio: Studio, guest: Guest, rsvp: Rsvp, languages: Languages, host: Host, cta: Cta } as const;
const GROUND: Record<string, Ground> = { hook: "paper", reveal: "marigold", studio: "paper", guest: "red", rsvp: "marigold", languages: "paper", host: "dark", cta: "dark" };

export function Launch() {
  return <AbsoluteFill style={{ background: C.dark }}>
    <Audio src={staticFile("music.wav")} volume={(f) => (f < VOICE_END ? 0.36 : 0.6)}/>
    {LINES.map((line) => <Sequence key={line.id} from={START[line.id]} durationInFrames={length(line.id) + 15}><Audio src={staticFile(`voice/${line.id}.wav`)} volume={1}/></Sequence>)}
    {LINES.map((line) => {
      const Scene = SCENES[line.id as keyof typeof SCENES];
      const frames = line.id === "cta" ? TOTAL - START.cta : length(line.id);
      return <Sequence key={line.id} from={START[line.id]} durationInFrames={frames}>
        <SceneWords.Provider value={line.words}>
          <Cut id={line.id} frames={frames}><Scene/></Cut>
        </SceneWords.Provider>
      </Sequence>;
    })}
    {LINES.map((line) => <Sequence key={`caption-${line.id}`} from={START[line.id]} durationInFrames={length(line.id)}><Caption line={line} frames={length(line.id)}/></Sequence>)}
  </AbsoluteFill>;
}

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/**
 * A scene's frame: its ground and a slow camera push-in, joined to its neighbours by a zoom-through: the scene eases
 * into a zoomed blur over its last frames, and the next one eases out of the same blur, so the cut hides inside it.
 */
function Cut({ id, frames, children }: { id: string; frames: number; children: ReactNode }) {
  const frame = useCurrentFrame();
  const into = id === "hook" ? 1 : interpolate(frame, [0, 8], [0, 1], { ...CLAMP, easing: Easing.out(Easing.cubic) });
  const away = id === "cta" ? 0 : interpolate(frame, [frames - 5, frames], [0, 1], { ...CLAMP, easing: Easing.in(Easing.cubic) });
  const zoom = (1 + 0.16 * (1 - into)) * (1 + 0.16 * away);
  const blur = 10 * (1 - into) + 10 * away;
  const push = 1 + 0.035 * interpolate(frame, [0, frames], [0, 1], { ...CLAMP, easing: Easing.inOut(Easing.sin) });
  return <AbsoluteFill style={{ transform: `scale(${zoom})`, filter: blur > 0.05 ? `blur(${blur}px)` : undefined }}>
    <Ground kind={GROUND[id]}/>
    <AbsoluteFill style={{ transform: `scale(${push})` }}>{children}</AbsoluteFill>
  </AbsoluteFill>;
}

/**
 * The line on screen, the way Reels caption it: a few words at a time, each rising in as it's said, bold with a dark
 * outline and a soft shadow, the key words on a marigold box that wipes in behind them. Above the phone in the Reel;
 * on the left in the wide version. The last line's caption stops where the end card takes over ("Apna pehla...").
 */
function Caption({ line, frames }: { line: Line; frames: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { wide } = useShape();
  const chunks = chunk(line);
  const until = line.id === "cta" ? Math.round((line.words.find((w) => w.w === "Apna")?.s ?? 1.7) * fps) : frames;
  const index = chunks.filter((c) => frame >= Math.round(c.start * fps)).length - 1;
  if (index < 0 || frame >= until) return null;
  const current = chunks[index];
  const end = index + 1 < chunks.length ? Math.min(until, Math.round(chunks[index + 1].start * fps)) : until;
  const out = interpolate(frame, [end - 3, end], [1, 0], CLAMP);
  const big = line.id === "cta";
  const size = (wide ? 104 : 96) * (big ? 1.25 : 1);
  const place = big
    ? { left: 60, right: 60, top: 0, bottom: 0, alignItems: "center", justifyContent: "center" }
    : wide
      ? { left: 120, top: 0, bottom: 0, width: 900, alignItems: "center", justifyContent: "flex-start" }
      : { left: 50, right: 50, top: 330 - size * 1.15, height: size * 2.3, alignItems: "center", justifyContent: "center" };
  const key = (word: string) => line.highlight.some((h) => word.replace(/[^\w]/g, "").toLowerCase() === h.toLowerCase());
  return <div style={{ position: "absolute", display: "flex", ...place, opacity: out }}>
    <div style={{ font: `900 ${size}px/1.1 ${F.sans}`, letterSpacing: "-0.025em", display: "flex", flexWrap: "wrap", justifyContent: big || !wide ? "center" : "flex-start", columnGap: "0.24em", rowGap: "0.08em" }}>
      {current.words.map((word, i) => {
        const at = Math.round(word.s * fps);
        const marked = key(word.text);
        const p = spring({ frame: frame - at, fps, config: { damping: 18, stiffness: 240, mass: 0.6 } });
        const wipe = spring({ frame: frame - at - 2, fps, config: { damping: 20, stiffness: 200 } });
        return <span key={i} style={{ display: "inline-block", position: "relative", opacity: frame >= at ? Math.min(1, p * 1.6) : 0, transform: `translateY(${(1 - p) * size * 0.28}px)`, padding: marked ? "0 0.14em" : undefined }}>
          {marked && <span style={{ position: "absolute", inset: "0.04em 0 -0.02em", background: C.marigold, border: `${size * 0.04}px solid ${C.dark}`, borderRadius: size * 0.14, transform: `rotate(-2deg) scaleX(${wipe})`, transformOrigin: "left center", boxShadow: `0 ${size * 0.06}px 0 ${C.dark}` }}/>}
          <span style={{ position: "relative", color: marked ? C.dark : "#fff8ec", WebkitTextStroke: marked ? undefined : `${size * 0.09}px ${C.dark}`, paintOrder: "stroke fill", textShadow: marked ? undefined : `0 ${size * 0.05}px ${size * 0.14}px rgba(20,14,10,.35)` }}>{word.text}</span>
        </span>;
      })}
    </div>
  </div>;
}

type Chunk = { start: number; words: { text: string; s: number }[] };

/**
 * The line's words in Reels-sized bites: a new bite after a comma or other stop, or when it would pass 3 words or 17
 * letters; a lone short word that trails off ("hai!") joins the bite before. Shown with the caption's punctuation
 * when the caption and the spoken words line up.
 */
function chunk(line: Line): Chunk[] {
  const typed = line.caption.split(" ");
  const words = line.words.map((w, i) => ({ text: typed.length === line.words.length ? typed[i] : w.w, s: w.s }));
  const chunks: Chunk[] = [];
  for (const word of words) {
    const last = chunks[chunks.length - 1];
    const text = last?.words.map((w) => w.text).join(" ") ?? "";
    const stop = last && /[,.!?…]$/.test(text);
    if (!last || stop || last.words.length >= 3 || text.length + 1 + word.text.length > 17) chunks.push({ start: word.s, words: [word] });
    else last.words.push(word);
  }
  for (let i = chunks.length - 1; i > 0; i--) {
    const c = chunks[i];
    const before = chunks[i - 1].words.map((w) => w.text).join(" ");
    if (c.words.length === 1 && c.words[0].text.replace(/[^\w]/g, "").length <= 4 && !/[,.!?…]$/.test(before)) {
      chunks[i - 1].words.push(...c.words);
      chunks.splice(i, 1);
    }
  }
  return chunks;
}
