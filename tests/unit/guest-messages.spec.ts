import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { guestMessage } from "../../app/lib/i18n";

/* What the server tells a guest about their reply arrives in English; the reply form shows it in their language. */

const route = readFileSync("app/api/experiences/[slug]/rsvps/route.ts", "utf8") + readFileSync("app/lib/guests.ts", "utf8");
const sent = [...route.matchAll(/error: "([^"]+)"/g)].map((m) => m[1]);

test("every reply message the server can send has a Gujarati and a Hindi version", () => {
  expect(sent.length).toBeGreaterThan(6);
  for (const message of sent) {
    expect(guestMessage(message, "gu"), message).not.toBe(message);
    expect(guestMessage(message, "hi"), message).not.toBe(message);
    expect(guestMessage(message, "en")).toBe(message);
  }
});

test("a message it doesn't know stays as it is", () => {
  expect(guestMessage("Something new", "hi")).toBe("Something new");
});
