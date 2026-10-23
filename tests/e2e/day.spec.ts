import { expect, test } from "@playwright/test";
import { freshIp, ownerHeaders, publish } from "../helpers";

/*
 * On the day, the invitation leads with what's happening today. Once everything is over, it becomes a thank-you.
 * The browser's clock is set to each moment (India time).
 */

const events = [
  { id: "sangeet", name: "Sangeet", date: "2026-11-07", time: "19:30", venue: "Lakeview Lawns, Surat" },
  { id: "wedding", name: "Wedding", date: "2026-11-08", time: "18:00", venue: "" },
];

let slug = "";
test.beforeAll(async ({ request }) => {
  ({ slug } = await publish(request, "wedding", { title: "Isha & Kabir", date: "2026-11-08", time: "18:00", events, thanks: "Thank you for dancing with us till 2 am!" }));
});

test("on the day: today's celebration first, with directions", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-07T10:00:00+05:30") });
  await page.goto(`/e/${slug}`);
  const today = page.locator(".inv-today");
  await expect(today.locator("h2")).toHaveText("Today");
  await expect(today.locator("li")).toHaveCount(1);
  await expect(today.locator("li")).toContainText("Sangeet7:30 PMLakeview Lawns, Surat");
  await expect(today.getByRole("link", { name: /Directions/ })).toHaveAttribute("href", /maps\/search\/\?api=1&query=Lakeview%20Lawns%2C%20Surat/);
  // Replying is still open on the day.
  await expect(page.locator("#rsvp-heading")).toBeVisible();
});

test("while it's on, it says so", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-07T20:00:00+05:30") });
  await page.goto(`/e/${slug}`);
  await expect(page.locator(".inv-today li")).toContainText("Happening now");
});

test("between celebrations there's nothing on today", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-07T23:00:00+05:30") });
  await page.goto(`/e/${slug}`);
  await expect(page.locator(".inv-countdown")).toHaveText("Tomorrow!");
  await expect(page.locator(".inv-today")).toHaveCount(0);
});

test("afterwards, the invitation becomes a thank-you", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-10T10:00:00+05:30") });
  await page.goto(`/e/${slug}`);
  await expect(page.locator(".inv-after")).toHaveText("It was wonderful. Thank you for being part of it.");
  await expect(page.locator("#thanks-heading")).toHaveText("Thank you");
  await expect(page.locator(".inv-thanks-section p")).toHaveText("Thank you for dancing with us till 2 am!");
  await expect(page.locator(".inv-details-heading h2")).toHaveText("A day to remember");
  // No reply form, countdown or calendar links any more.
  await expect(page.locator("#rsvp-heading")).toHaveCount(0);
  await expect(page.locator(".inv-countdown")).toHaveCount(0);
  await expect(page.locator(".inv-calendar")).toHaveCount(0);
});

test("the thank-you note is written in the studio, and checked like the message", async ({ request, page }) => {
  const long = await request.post("/api/experiences", { headers: { "x-forwarded-for": freshIp() }, data: { templateId: "wedding", draft: { title: "A", date: "2026-11-08", time: "", venue: "B", message: "", thanks: "x".repeat(501) } } });
  expect(long.status()).toBe(422);
  expect((await long.json()).fields.thanks).toBeTruthy();

  await page.goto("/create?template=anniversary");
  await page.locator("#thanks").fill("Thank you for 25 wonderful years of showing up.");
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  const manage = await page.locator(".publish-dialog[open] .publish-private input").inputValue();
  const [published, key] = [manage.split("/manage/")[1].split("#")[0], manage.split("#k=")[1]];
  const { experience } = await (await request.get(`/api/experiences/${published}`, { headers: ownerHeaders(key) })).json();
  expect(experience.thanks).toBe("Thank you for 25 wonderful years of showing up.");
});
