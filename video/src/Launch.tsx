import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import lines from "../public/voice/lines.json";
import { C, F, Paper, useShape } from "./kit";
import { Cta, Guest, Hook, Host, Languages, Reveal, Rsvp, Studio } from "./scenes";

/*
 * WowLink's launch video: eight lines of Hinglish voiceover (scripts/voice.py), each with its scene and caption, over an
 * original track (scripts/music.py), then an end card. Timings come from the voice files, so changing the script and
 * re-running `npm run voice` and `npm run music` re-times everything.
 */

export const FPS = 30;
type Line = { id: string; caption: string; highlight: string[]; seconds: number };
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

const SCENES = { hook: Hook, reveal: Reveal, studio: Studio, guest: Guest, rsvp: Rsvp, languages: Languages, host: Host } as const;

export function Launch() {
  return <AbsoluteFill style={{ background: C.paper }}>
    <Paper/>
    <Audio src={staticFile("music.wav")} volume={(f) => (f < VOICE_END ? 0.32 : 0.6)}/>
    {LINES.map((line) => <Sequence key={line.id} from={START[line.id]} durationInFrames={length(line.id) + 15}><Audio src={staticFile(`voice/${line.id}.mp3`)} volume={1}/></Sequence>)}
    {Object.entries(SCENES).map(([id, Scene]) => <Sequence key={id} from={START[id]} durationInFrames={length(id)}><Scene/></Sequence>)}
    <Sequence from={START.cta} durationInFrames={TOTAL - START.cta}><Cta/></Sequence>
    {LINES.filter((line) => line.id !== "cta").map((line) => <Sequence key={`caption-${line.id}`} from={START[line.id]} durationInFrames={length(line.id)}><Caption line={line} frames={length(line.id)}/></Sequence>)}
  </AbsoluteFill>;
}

/**
 * The line on screen, Reel-style: word by word as it's said (spread over the line), the key words in red and
 * underlined by hand. On top in the Reel; on the left, larger, in the wide version.
 */
function Caption({ line, frames }: { line: Line; frames: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { wide } = useShape();
  const words = line.caption.split(" ");
  const every = (frames * 0.78) / words.length;
  const out = interpolate(frame, [frames - 6, frames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const key = (word: string) => line.highlight.some((h) => word.replace(/[^\w]/g, "").toLowerCase() === h.toLowerCase());
  return <div style={{ position: "absolute", ...(wide ? { left: 130, top: 0, bottom: 0, width: 900, display: "flex", alignItems: "center" } : { left: 60, right: 60, top: 130, display: "flex", justifyContent: "center" }), opacity: out }}>
    <div style={{ font: `800 ${wide ? 84 : 74}px/1.18 ${F.sans}`, color: C.ink, letterSpacing: "-0.02em", display: "flex", flexWrap: "wrap", justifyContent: wide ? "flex-start" : "center", columnGap: "0.26em", rowGap: "0.08em" }}>
      {words.map((word, i) => {
        const p = spring({ frame: frame - 2 - i * every, fps, config: { damping: 12, stiffness: 200, mass: 0.6 } });
        const marked = key(word);
        const draw = interpolate(frame - 2 - i * every, [3, 11], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return <span key={i} style={{ display: "inline-block", position: "relative", color: marked ? C.red : C.ink, opacity: Math.min(1, p * 1.6), transform: `translateY(${(1 - p) * 34}px) scale(${0.85 + 0.15 * p})` }}>
          {word}
          {marked && <svg width="100%" height="24" viewBox="0 0 200 24" preserveAspectRatio="none" style={{ position: "absolute", left: 0, bottom: -12, overflow: "visible" }}><path d="M3 14C40 6 80 18 120 11S180 9 197 13" fill="none" stroke={C.marigold} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw}/></svg>}
        </span>;
      })}
    </div>
  </div>;
}
