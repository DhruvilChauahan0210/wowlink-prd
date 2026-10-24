import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Font } from "harfbuzzjs";

/*
 * Gujarati and Hindi words for the share cards, drawn as outlines. The image renderer (Satori) draws each character on
 * its own and can't join letters, so "પ્ર" comes out as પ્‌ર and "निमंत्रण" as निमंत्‌रण. HarfBuzz, the shaper browsers
 * use, joins them properly: a line with any Gujarati or Hindi in it is shaped here, in the card's own fonts, laid out
 * the way the card's text would be, and placed on the card as an SVG image. Lines without any stay plain text.
 */

const FILES = { fraunces: "fraunces.ttf", caveat: "caveat.ttf", figtree: "figtree.ttf", gujarati: "noto-serif-gujarati.ttf", devanagari: "noto-serif-devanagari.ttf" } as const;
type FontName = keyof typeof FILES;
/** The card's fonts for Latin letters; Gujarati and Hindi always come from their Noto fonts. */
export type CardFont = "fraunces" | "caveat" | "figtree";

type Loaded = { font: Font; upem: number; ascender: number; descender: number };
type HarfBuzz = typeof import("harfbuzzjs");

const INDIC = /[ऀ-ॿ઀-૿꣠-ꣿ]/;
const GUJARATI = /[઀-૿]/;
// Joiners and the dandas (।, ॥) go with the letters around them, Gujarati or Hindi.
const CARRIED = /[‌‍।॥]/;
const DEVANAGARI = /[ऀ-ॿ꣠-ꣿ]/;
const isIndic = (name: FontName) => name === "gujarati" || name === "devanagari";

/** Whether a line needs shaping (has Gujarati or Hindi in it). */
export const needsShaping = (text: string) => INDIC.test(text);

let loading: Promise<{ hb: HarfBuzz; fonts: Record<FontName, Loaded> }> | undefined;

// HarfBuzz and the fonts load once per server instance.
function harfbuzz() {
  return (loading ??= (async () => {
    const hb = await import("harfbuzzjs");
    const entries = await Promise.all((Object.keys(FILES) as FontName[]).map(async (name) => {
      const face = new hb.Face(new hb.Blob(new Uint8Array(await readFile(path.join(process.cwd(), "app/fonts/og", FILES[name])))));
      const font = new hb.Font(face);
      const { ascender, descender } = font.hExtents();
      return [name, { font, upem: face.upem, ascender, descender: -descender }] as const;
    }));
    return { hb, fonts: Object.fromEntries(entries) as Record<FontName, Loaded> };
  })());
}

export type ShapeStyle = {
  font: CardFont;
  /** In pixels. */
  size: number;
  /** As in CSS, a multiple of the size. Gujarati and Hindi get at least 1.3, so their marks above and below don't collide. */
  lineHeight: number;
  /** Wrap within this width, in pixels. */
  maxWidth: number;
  color: string;
  /** In em, for Latin letters only: spacing out Gujarati or Hindi would pull its marks apart. */
  letterSpacing?: number;
};

export type Shaped = {
  /** The lines, as an SVG data URL. */
  src: string;
  /** The box the text takes up, as plain text would. */
  width: number;
  height: number;
  /**
   * How far the ink reaches outside that box (a tall matra on the first line, a tail below the last): the image is that
   * much bigger, and negative margins pull it back so the text sits where plain text would.
   */
  overflow: { top: number; right: number; bottom: number; left: number };
  lines: number;
};

type Glyph = { d: string; x: number; y: number; scale: number; ink?: { top: number; bottom: number; left: number; right: number } };
type Word = { glyphs: Glyph[]; width: number; fonts: Set<FontName> };

/** Shapes `text` and lays it out in the card's style, as outlines in an SVG. */
export async function shapeText(text: string, style: ShapeStyle): Promise<Shaped> {
  const { hb, fonts } = await harfbuzz();
  const { size, maxWidth } = style;
  const has = (name: FontName, char: string) => fonts[name].font.nominalGlyph(char.codePointAt(0)!) !== undefined;
  const fallback: FontName[] = [style.font, "figtree", "fraunces", "caveat", "gujarati", "devanagari"];

  // Which font draws a character: Gujarati's or Hindi's for theirs, else the first of the card's fonts that has it.
  function fontFor(char: string, previous: FontName | undefined): FontName | undefined {
    if (CARRIED.test(char) && previous && has(previous, char)) return previous;
    if (GUJARATI.test(char)) return "gujarati";
    if (DEVANAGARI.test(char)) return "devanagari";
    return fallback.find((name) => has(name, char));
  }

  // A word, shaped run by run (a run being the characters one font draws), its glyphs placed from x = 0.
  function shapeWord(word: string): Word {
    const runs: { font: FontName; text: string }[] = [];
    for (const char of word) {
      const name = fontFor(char, runs.at(-1)?.font);
      if (!name) continue; // no font has it (an emoji): left out, as the card would
      if (runs.at(-1)?.font === name) runs.at(-1)!.text += char;
      else runs.push({ font: name, text: char });
    }
    const out: Word = { glyphs: [], width: 0, fonts: new Set() };
    for (const run of runs) {
      const { font, upem } = fonts[run.font];
      const scale = size / upem;
      const spacing = isIndic(run.font) ? 0 : (style.letterSpacing ?? 0) * size;
      const buffer = new hb.Buffer();
      buffer.addText(run.text);
      buffer.guessSegmentProperties();
      hb.shape(font, buffer);
      const positions = buffer.getGlyphPositions();
      buffer.getGlyphInfos().forEach(({ codepoint: id }, i) => {
        const { xAdvance, xOffset, yOffset } = positions[i];
        const x = out.width + xOffset * scale;
        const y = -yOffset * scale;
        const e = font.glyphExtents(id);
        out.glyphs.push({
          d: font.glyphToPath(id),
          x, y, scale,
          ink: e && { left: x + e.xBearing * scale, right: x + (e.xBearing + e.width) * scale, top: y - e.yBearing * scale, bottom: y - (e.yBearing + e.height) * scale },
        });
        out.width += xAdvance * scale + spacing;
      });
      out.fonts.add(run.font);
    }
    return out;
  }

  const space = (() => {
    const { font, upem } = fonts[style.font];
    const glyph = font.nominalGlyph(32);
    return glyph === undefined ? size * 0.25 : (font.glyphHAdvance(glyph) / upem) * size;
  })();

  // Lines, filled word by word up to the width.
  const lines: Word[][] = [];
  let filled = 0;
  // (A word no font could draw, an emoji on its own, takes no room at all.)
  for (const word of text.trim().split(/\s+/).map(shapeWord).filter((word) => word.glyphs.length)) {
    const line = lines.at(-1);
    if (line && filled + space + word.width <= maxWidth) {
      line.push(word);
      filled += space + word.width;
    } else {
      lines.push([word]);
      filled = word.width;
    }
  }

  // Each line as tall as CSS would make it: every font's box centred on the shared baseline, the tallest winning.
  const placed: Glyph[] = [];
  const ink = { top: Infinity, bottom: -Infinity, left: Infinity, right: -Infinity };
  let top = 0;
  let widest = 0;
  for (const line of lines) {
    let above = 0;
    let below = 0;
    for (const name of new Set<FontName>([style.font, ...line.flatMap((word) => [...word.fonts])])) {
      const { ascender, descender, upem } = fonts[name];
      const gap = (isIndic(name) ? Math.max(style.lineHeight, 1.3) : style.lineHeight) * size;
      const ascent = (ascender / upem) * size + (gap - ((ascender + descender) / upem) * size) / 2;
      above = Math.max(above, ascent);
      below = Math.max(below, gap - ascent);
    }
    const baseline = top + above;
    let x = 0;
    for (const [i, word] of line.entries()) {
      if (i) x += space;
      for (const glyph of word.glyphs) {
        if (!glyph.d) continue; // a space or a mark with nothing to draw
        placed.push({ ...glyph, x: x + glyph.x, y: baseline + glyph.y });
        if (!glyph.ink) continue;
        ink.top = Math.min(ink.top, baseline + glyph.ink.top);
        ink.bottom = Math.max(ink.bottom, baseline + glyph.ink.bottom);
        ink.left = Math.min(ink.left, x + glyph.ink.left);
        ink.right = Math.max(ink.right, x + glyph.ink.right);
      }
      x += word.width;
    }
    widest = Math.max(widest, x);
    top = baseline + below;
  }

  const width = Math.ceil(widest);
  const height = Math.ceil(top);
  const overflow = {
    top: Math.ceil(Math.max(0, -ink.top)),
    right: Math.ceil(Math.max(0, ink.right - width)),
    bottom: Math.ceil(Math.max(0, ink.bottom - height)),
    left: Math.ceil(Math.max(0, -ink.left)),
  };
  const w = width + overflow.left + overflow.right;
  const h = height + overflow.top + overflow.bottom;
  const paths = placed.map((g) => `<path transform="translate(${(g.x + overflow.left).toFixed(2)} ${(g.y + overflow.top).toFixed(2)}) scale(${g.scale.toFixed(5)} ${(-g.scale).toFixed(5)})" d="${g.d}"/>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><g fill="${style.color}">${paths}</g></svg>`;
  return { src: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`, width, height, overflow, lines: lines.length };
}
