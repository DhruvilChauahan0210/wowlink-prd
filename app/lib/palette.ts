/*
 * A host's colours for an invitation: one of a few palettes, or a colour of their own. They tint the page's
 * handwriting and marks (eyebrows, labels, links, underlines, the countdown circle, the timeline thread, doodles);
 * the illustrations keep their own watercolours.
 *
 * Every colour is checked for contrast, so whatever a host picks stays readable:
 *   accent  words on the paper background, at least 4.5:1
 *   light   words on the dark message section, at least 4.5:1
 *   tone    large handwritten words (eyebrows, hints) on the opening scene, at least 3:1
 *   tone2   decoration only
 */

export type Palette = { accent: string; light: string; tone: string; tone2: string };

/** The backgrounds the colours sit on. */
export const PAPER = "#f3ebdc";
export const SCENE = "#ece2cf";
export const DARK = "#16110e";

export const PALETTES = {
  sindoor: { accent: "#a8341f", light: "#f2a58f", tone: "#c2412d", tone2: "#f0a03a" },
  marigold: { accent: "#8a4c0a", light: "#f4c57e", tone: "#b5600f", tone2: "#c2412d" },
  rani: { accent: "#a0245c", light: "#f4a6c8", tone: "#c23a72", tone2: "#f0a03a" },
  peacock: { accent: "#1b5f6a", light: "#8fd3d8", tone: "#237a83", tone2: "#3d5aa8" },
  mehndi: { accent: "#43632a", light: "#b9d692", tone: "#557833", tone2: "#c79a2e" },
  indigo: { accent: "#3a3f8f", light: "#b0b5f2", tone: "#4a52b0", tone2: "#d9821b" },
  kesar: { accent: "#9c4510", light: "#f6b98a", tone: "#b85316", tone2: "#9c2f55" },
} satisfies Record<string, Palette>;

export type PaletteId = keyof typeof PALETTES;

/** Each occasion's own tone (as in studio.css), for the "occasion's own colours" swatch. */
export const OCCASION_TONES: Record<string, string> = { wedding: "#c2412d", engagement: "#9c2f55", birthday: "#c9506d", garba: "#b8552c", babyshower: "#3d7f79", housewarming: "#a24a24", anniversary: "#b8405f", opening: "#4f7a3c" };
export const PALETTE_IDS = Object.keys(PALETTES) as PaletteId[];

const HEX = /^#[0-9a-f]{6}$/i;
/** "" (the occasion's own colours), a palette id, or a colour of the host's own ("#rrggbb"). */
export const isPaletteValue = (value: unknown): value is string => value === "" || (typeof value === "string" && (PALETTE_IDS.includes(value as PaletteId) || HEX.test(value)));

// ---------- colour arithmetic ----------

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
const toHex = (c: number[]) => `#${c.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("")}`;

/** WCAG relative luminance. */
function luminance(hex: string) {
  const [r, g, b] = rgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
/** WCAG contrast ratio between two colours (1 to 21). */
export function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

function toHsl(hex: string) {
  const [r, g, b] = rgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function fromHsl(h: number, s: number, l: number) {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return toHex([f(0) * 255, f(8) * 255, f(4) * 255]);
}

/** The colour, made darker (or lighter) a step at a time until it reaches the contrast it needs against `on`. */
function readable(hex: string, on: string, ratio: number, darker: boolean) {
  const [h, s, l] = toHsl(hex);
  for (let step = 0; step <= 100; step++) {
    const candidate = fromHsl(h, s, Math.min(1, Math.max(0, l + (darker ? -step : step) / 100)));
    if (contrast(candidate, on) >= ratio) return candidate;
  }
  return darker ? "#000000" : "#ffffff";
}

/** A palette made from one colour of the host's own. */
export function customPalette(hex: string): Palette {
  const [h, s] = toHsl(hex);
  return {
    accent: readable(hex, PAPER, 4.6, true),
    light: readable(hex, DARK, 4.6, false),
    tone: readable(hex, SCENE, 3.1, true),
    // a neighbouring hue for the little doodles, so the page isn't all one colour
    tone2: fromHsl((h + 38) % 360, Math.max(0.45, Math.min(0.8, s)), 0.55),
  };
}

/** The colours to use, or null for the occasion's own. */
export function paletteFor(value: string | undefined | null): Palette | null {
  if (!value) return null;
  if (Object.hasOwn(PALETTES, value)) return PALETTES[value as PaletteId];
  return HEX.test(value) ? customPalette(value.toLowerCase()) : null;
}

/** The palette as CSS custom properties, for the page (see .has-palette in studio.css). */
export const paletteStyle = (p: Palette) => ({ "--p-accent": p.accent, "--p-light": p.light, "--p-tone": p.tone, "--p-tone2": p.tone2 }) as Record<string, string>;
