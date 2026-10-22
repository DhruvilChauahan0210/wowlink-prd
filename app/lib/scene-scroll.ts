import Lenis from "lenis";

type Frame = (time: number) => void;
const frames = new Set<Frame>();
let scroll: Lenis | null = null;

// A single loop owns smoothing, parallax, canvas, and SVG drawing.
export function startSceneScroll(reduced: boolean) {
  if (!reduced) scroll = new Lenis({ lerp: 0.085, smoothWheel: true });
  let raf = 0;
  const tick = (time: number) => {
    scroll?.raf(time);
    frames.forEach((frame) => frame(time));
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => { cancelAnimationFrame(raf); scroll?.destroy(); scroll = null; };
}

export function onSceneFrame(frame: Frame) {
  frames.add(frame);
  return () => { frames.delete(frame); };
}

export function sceneNavigate(id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  if (scroll) scroll.scrollTo(target, { duration: 1.4 });
  else target.scrollIntoView({ behavior: "instant" });
  history.replaceState(null, "", `#${id}`);
}

export const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v));
export const range = (v: number, a: number, b: number) => clamp((v - a) / (b - a));
export const ease = (p: number) => 1 - (1 - p) ** 3;
export function progress(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  return { p: clamp(-rect.top / Math.max(1, rect.height - innerHeight)), rect };
}
