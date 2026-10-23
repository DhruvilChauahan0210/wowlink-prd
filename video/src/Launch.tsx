import type { ReactNode } from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import lines from "../public/voice/lines.json";
import { C, F, Ground, SceneWords, useShape, type Word } from "./kit";
import { Cta, Guest, Hook, Host, Languages, Reveal, Rsvp, Studio } from "./scenes";

/*
 * WowLink's launch video: eight lines of Hinglish voiceover (scripts/voice.py), each with its scene and caption, over an
 * original track (scripts/music.py), then an end card. Timings come from the voice files, so changing the script and
 * re-running `npm run voice` and `npm run music` re-times everything. Cut like a Reel: every scene has its own colour,
 * slams in with a flash and a zoom, and pulses on the beat; the captions pop on a few words at a time as they're said.
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

// The beat, as music.py plays it: the groove starts on "WowLink" at 118 bpm, softer (no kick) for languages and host.
const DROP = START.reveal;
const BEAT = (60 / 118) * FPS;
const SOFT = [START.languages, START.host] as const;

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
          <Cut id={line.id}><Scene/></Cut>
        </SceneWords.Provider>
      </Sequence>;
    })}
    {LINES.map((line) => <Sequence key={`caption-${line.id}`} from={START[line.id]} durationInFrames={length(line.id)}><Caption line={line} frames={length(line.id)}/></Sequence>)}
  </AbsoluteFill>;
}

/** A scene's frame: its ground, a zoom-and-blur slam in with a flash on the cut, and a little pulse on every beat. */
function Cut({ id, children }: { id: string; children: ReactNode }) {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 9], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (t) => 1 - Math.pow(1 - t, 3) });
  const flash = id === "hook" ? 0 : interpolate(frame, [0, 6], [0.85, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const now = START[id] + frame;
  let pulse = 1;
  if (now >= DROP && now < VOICE_END) {
    const beats = (now - DROP) / BEAT;
    const since = (beats - Math.floor(beats)) * BEAT;
    const kick = Math.floor(beats) % 2 === 0 && !(now >= SOFT[0] && now < SOFT[1]);
    pulse = 1 + (kick ? 0.035 : 0.018) * Math.exp(-since / 3);
  }
  return <AbsoluteFill style={{ transform: `scale(${1.22 - 0.22 * enter})`, filter: enter < 1 ? `blur(${(1 - enter) * 14}px)` : undefined }}>
    <Ground kind={GROUND[id]}/>
    <AbsoluteFill style={{ transform: `scale(${pulse})` }}>{children}</AbsoluteFill>
    {flash > 0 && <AbsoluteFill style={{ background: C.cream, opacity: flash }}/>}
  </AbsoluteFill>;
}

/**
 * The line on screen, the way Reels caption it: a few words at a time, popping on as they're said, big and bold with
 * a dark outline, the key words in a marigold box. Above the phone in the Reel; on the left in the wide version. The
 * last line's caption stops where the end card takes over ("Apna pehla invitation...").
 */
function Caption({ line, frames }: { line: Line; frames: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { wide, height } = useShape();
  const chunks = chunk(line);
  const until = line.id === "cta" ? Math.round((line.words.find((w) => w.w === "Apna")?.s ?? 1.7) * fps) : frames;
  const index = chunks.filter((c) => frame >= Math.round(c.start * fps)).length - 1;
  if (index < 0 || frame >= until) return null;
  const current = chunks[index];
  const since = frame - Math.round(current.start * fps);
  const end = index + 1 < chunks.length ? Math.min(until, Math.round(chunks[index + 1].start * fps)) : until;
  const out = interpolate(frame, [end - 3, end], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pop = spring({ frame: since, fps, config: { damping: 10, stiffness: 260, mass: 0.6 } });
  const big = line.id === "cta";
  const size = (wide ? 112 : 104) * (big ? 1.25 : 1);
  const tilt = (index % 2 ? 1 : -1) * 2 * (1 - pop);
  const place = big
    ? { left: 60, right: 60, top: 0, bottom: 0, alignItems: "center", justifyContent: "center" }
    : wide
      ? { left: 120, top: 0, bottom: 0, width: 900, alignItems: "center", justifyContent: "flex-start" }
      : { left: 50, right: 50, top: 330 - size * 1.15, height: size * 2.3, alignItems: "center", justifyContent: "center" };
  const key = (word: string) => line.highlight.some((h) => word.replace(/[^\w]/g, "").toLowerCase() === h.toLowerCase());
  return <div style={{ position: "absolute", display: "flex", ...place, opacity: out }}>
    <div style={{ font: `900 ${size}px/1.08 ${F.sans}`, letterSpacing: "-0.03em", display: "flex", flexWrap: "wrap", justifyContent: big || !wide ? "center" : "flex-start", columnGap: "0.24em", rowGap: "0.06em", transform: `scale(${1.5 - 0.5 * pop}) rotate(${tilt}deg)`, transformOrigin: wide && !big ? "left center" : "center", maxHeight: height }}>
      {current.words.map((word, i) => {
        const said = frame >= Math.round(word.s * fps);
        const marked = key(word.text);
        const p = spring({ frame: frame - Math.round(word.s * fps), fps, config: { damping: 9, stiffness: 300, mass: 0.5 } });
        return <span key={i} style={{ display: "inline-block", position: "relative", color: marked ? C.dark : "#fff6e6", WebkitTextStroke: marked ? undefined : `${size * 0.12}px ${C.dark}`, paintOrder: "stroke fill", textShadow: marked ? undefined : `0 ${size * 0.08}px 0 ${C.dark}`, opacity: said ? 1 : 0.0, transform: `scale(${said ? 0.7 + 0.3 * p : 0.7})`, padding: marked ? "0 0.14em" : undefined }}>
          {marked && <span style={{ position: "absolute", inset: "0.02em -0.02em -0.02em", background: C.marigold, border: `${size * 0.05}px solid ${C.dark}`, borderRadius: size * 0.14, transform: "rotate(-3deg)", boxShadow: `0 ${size * 0.08}px 0 ${C.dark}`, zIndex: -1 }}/>}
          <span style={{ position: "relative" }}>{word.text}</span>
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
