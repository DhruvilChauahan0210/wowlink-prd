import { expect, test } from "@playwright/test";
import { aliasError, tidyAlias } from "../../app/lib/aliases";

const NOT_ALLOWED = "That link isn’t allowed. Try another.";

test("custom links with real names in them are fine", () => {
  // Short rude words hide inside names; only a whole word (or its start) counts.
  for (const alias of ["ishita-weds-rohan", "harshit-birthday", "shital-mehta", "anudeep-kavya", "aporna-sen", "grape-party", "dharam-puja", "chutia-family"]) expect(aliasError(alias), alias).toBe("");
});

test("rude custom links are refused, spelled out or with look-alike digits", () => {
  for (const alias of ["p0rn-party", "pornstar", "f-u-c-k", "s-h-i-t", "shit-party", "nude-pics", "motherfucker", "gandu-2026", "b1tch-party"]) expect(aliasError(alias), alias).toBe(NOT_ALLOWED);
});

test("what someone types is tidied into a link", () => {
  expect(tidyAlias("  Isha  Kabir_Wedding ")).toBe("isha-kabir-wedding");
  expect(tidyAlias("--isha--kabir--")).toBe("isha-kabir");
});
