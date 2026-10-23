import { expect, test } from "@playwright/test";
import { validateDraft } from "../../app/lib/invitations";
import { DARK, PALETTES, PAPER, SCENE, contrast, customPalette, isPaletteValue, paletteFor, type Palette } from "../../app/lib/palette";

const readable = (p: Palette) => {
  expect(contrast(p.accent, PAPER)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(p.light, DARK)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(p.tone, SCENE)).toBeGreaterThanOrEqual(3);
};

test("every palette is readable on the paper, the dark section and the opening scene", () => {
  for (const palette of Object.values(PALETTES)) readable(palette);
});

test("a host's own colour is made readable, however light or dark it is", () => {
  for (const hex of ["#ffff00", "#ffffff", "#000000", "#111111", "#ff69b4", "#00a86b", "#7a3fb5", "#f3ebdc", "#808080"]) {
    const palette = customPalette(hex);
    readable(palette);
    for (const colour of Object.values(palette)) expect(colour).toMatch(/^#[0-9a-f]{6}$/);
  }
  // A colour that's already readable is kept as it is.
  expect(customPalette("#1b5f6a").accent).toBe("#1b5f6a");
});

test("the occasion's own colours, a palette, or a colour of the host's own", () => {
  expect(paletteFor("")).toBeNull();
  expect(paletteFor(undefined)).toBeNull();
  expect(paletteFor("peacock")).toEqual(PALETTES.peacock);
  expect(paletteFor("#00A86B")).toEqual(customPalette("#00a86b"));
  expect(paletteFor("toString")).toBeNull();
  for (const value of ["", "rani", "#123abc", "#ABCDEF"]) expect(isPaletteValue(value)).toBe(true);
  for (const value of ["red", "#fff", "#12345g", "url(x)", "#123456;color:red", "toString", 42, null]) expect(isPaletteValue(value)).toBe(false);
});

test("a draft keeps a valid palette, lower-cased, and drops anything else", () => {
  const good = { title: "Aarav & Meera", date: "2026-11-08", time: "18:00", venue: "Surat", message: "" };
  const kept = validateDraft({ ...good, palette: "#00A86B" });
  expect(kept.ok && kept.value.palette).toBe("#00a86b");
  const named = validateDraft({ ...good, palette: "mehndi" });
  expect(named.ok && named.value.palette).toBe("mehndi");
  const bad = validateDraft({ ...good, palette: "red; background:url(x)" });
  expect(bad.ok && bad.value.palette).toBe("");
});
