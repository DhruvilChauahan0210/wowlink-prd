import { expect, test } from "@playwright/test";
import { freshIp, sampleDraft } from "../helpers";

const days = (page: import("@playwright/test").Page) => page.locator(".inv-timeline-item h3");

test("the wedding sample shows its schedule; occasions without one show no timeline", async ({ page }) => {
  await page.goto("/e/preview?template=wedding");
  await expect(days(page)).toHaveText(["Mehndi", "Sangeet", "Wedding", "Reception"]);
  await expect(page.locator(".inv-timeline-day").first()).toHaveText("Fri, 6 Nov");
  await page.goto("/e/preview?template=garba");
  await expect(page.locator(".inv-schedule-section")).toHaveCount(0);
});

test("build a schedule in the studio, publish it, and guests get a timeline in order", async ({ browser }) => {
  const context = await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": freshIp() } });
  const page = await context.newPage();
  await page.goto("/create?template=wedding");
  await page.locator("#title").fill("Isha & Kabir");
  // The sample schedule: Mehndi, Sangeet, Wedding, Reception. Drop the reception, add a haldi.
  await page.getByRole("button", { name: "Remove Reception from the schedule" }).click();
  await page.getByRole("button", { name: "+ Haldi" }).click();
  await expect(page.getByRole("button", { name: "+ Haldi" })).toHaveCount(0);
  const haldi = page.locator(".studio-event").last();
  await expect(haldi.locator("input[type=date]")).toHaveValue("2026-11-07");
  await expect(haldi.locator("input[type=time]")).toHaveValue("10:00");
  await haldi.locator("input[id$=-venue]").fill("Patel family home, Surat");

  await page.getByRole("button", { name: "Publish", exact: true }).click();
  const publicUrl = await page.locator(".publish-dialog[open] .share-tools input").inputValue();
  const slug = publicUrl.split("/e/")[1];

  const guest = await context.newPage();
  await guest.goto(`/e/${slug}`);
  // Studio order was Mehndi, Sangeet, Wedding, Haldi; guests see them by date and time.
  await expect(days(guest)).toHaveText(["Mehndi", "Haldi", "Sangeet", "Wedding"]);
  await expect(guest.locator(".inv-timeline-item").nth(1)).toContainText("10:00 AM · Patel family home, Surat");
  await expect(guest.getByRole("link", { name: "Map for the Haldi" })).toBeVisible();
  await expect(guest.getByRole("link", { name: "Map for the Mehndi" })).toHaveCount(0);
  await guest.getByRole("button", { name: "Open the invitation" }).click();
  await expect(guest.locator(".inv-card-schedule")).toHaveText("4 celebrations · Fri, 6 Nov to Sun, 8 Nov");

  // One file for every event, one per event, and just the main occasion.
  const all = await (await context.request.get(`/e/${slug}/invite.ics`)).text();
  expect(all.match(/BEGIN:VEVENT/g)).toHaveLength(4);
  expect(all).toContain("SUMMARY:Haldi · Isha & Kabir");
  const haldiHref = await guest.getByRole("link", { name: "Add the Haldi to Apple or Outlook calendar" }).getAttribute("href");
  const one = await (await context.request.get(haldiHref!)).text();
  expect(one.match(/BEGIN:VEVENT/g)).toHaveLength(1);
  expect(one).toContain("LOCATION:Patel family home\\, Surat");
  const main = await (await context.request.get(`/e/${slug}/invite.ics?event=main`)).text();
  expect(main).toContain("SUMMARY:Isha & Kabir\r\n");
  expect((await context.request.get(`/e/${slug}/invite.ics?event=nope`)).status()).toBe(404);
  await context.close();
});

test("the studio points at a schedule entry that needs fixing", async ({ page }) => {
  await page.goto("/create?template=birthday");
  await page.getByRole("button", { name: "+ Add an event" }).click();
  const blank = page.locator(".studio-event").last();
  await expect(blank.locator("input[list]")).toBeFocused();
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(blank.locator(".studio-error")).toHaveText("Give this event a name.");
  await expect(blank.locator("input[list]")).toBeFocused();
  await expect(blank.locator("input[list]")).toHaveAttribute("aria-invalid", "true");
  await blank.locator("input[list]").fill("Cake cutting");
  await expect(blank.locator(".studio-error")).toHaveCount(0);
});

test("the API enforces schedule rules", async ({ request }) => {
  const post = (events: object[]) => request.post("/api/experiences", { headers: { "x-forwarded-for": freshIp() }, data: { templateId: "wedding", draft: { ...sampleDraft(), events } } });
  const nine = Array.from({ length: 9 }, (_, i) => ({ id: `e${i}`, name: `Day ${i}`, date: "2026-11-06", time: "", venue: "" }));
  const tooMany = await post(nine);
  expect(tooMany.status()).toBe(422);
  expect((await tooMany.json()).fields.events).toBe("A schedule can have up to 8 events.");
  expect((await post([{ id: "x", name: "Mehndi", date: "2026-02-30", time: "", venue: "" }])).status()).toBe(422);
  expect((await post(nine.slice(0, 8))).status()).toBe(201);
});
