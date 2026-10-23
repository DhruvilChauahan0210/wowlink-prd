import { expect, test, type Browser } from "@playwright/test";
import { collectErrors, freshIp, ownerHeaders, publish } from "../helpers";

/*
 * What hosts can ask besides "are you coming": food needs (free), a song request and a poll of their own (the
 * Creator studio). Guests answer with their reply; the host sees the counts for the caterer, the songs and the poll.
 */

const freshContext = (browser: Browser) => browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": freshIp() } });
const owned = async (request: import("@playwright/test").APIRequestContext, slug: string, key: string) =>
  (await (await request.get(`/api/experiences/${slug}`, { headers: ownerHeaders(key) })).json()) as { rsvps: { name: string; diet?: string[]; dietNote?: string; song?: string; pick?: number }[] };

test("food needs on a free invitation: asked, answered, counted for the caterer", async ({ browser, request }) => {
  const { slug, key } = await publish(request, "wedding", { title: "Isha & Kabir", askDiet: true }, "free");
  const context = await freshContext(browser);
  const page = await context.newPage();
  const errors = collectErrors(page);
  await page.goto(`/e/${slug}`);
  const food = page.locator(".inv-diet");
  await expect(food.locator("legend")).toContainText("Any food needs?");
  await food.getByRole("checkbox", { name: "Jain" }).check();
  await food.getByRole("checkbox", { name: "No onion or garlic" }).check();
  await page.locator("#guest-diet-note").fill("  One child, no nuts ");
  await page.locator("#guest-count").fill("3");
  await page.locator("#guest-name").fill("Rameshbhai");
  // Song requests and polls aren't on a free invitation.
  await expect(page.locator("#guest-song")).toHaveCount(0);
  await page.getByRole("button", { name: "Send my reply" }).click();
  await expect(page.locator(".inv-rsvp-confirmation")).toBeVisible();
  // Can't make it: no food question.
  await page.getByRole("button", { name: /Reply for someone else/ }).click();
  await page.getByRole("radio", { name: "Not attending" }).check();
  await expect(page.locator(".inv-diet")).toHaveCount(0);

  const { rsvps } = await owned(request, slug, key);
  expect(rsvps[0]).toMatchObject({ name: "Rameshbhai", diet: ["jain", "no-onion-garlic"], dietNote: "One child, no nuts" });

  const host = await context.newPage();
  await host.goto(`/manage/${slug}#k=${key}`);
  const card = host.locator("section").filter({ has: host.locator("#extras-heading") });
  await expect(card.locator(".manage-extras-list li")).toHaveText(["Jain1 household · 3 people", "No onion or garlic1 household · 3 people"]);
  await expect(card.locator(".manage-extras-notes")).toContainText("Rameshbhai: One child, no nuts");
  expect(errors).toEqual([]);
  await context.close();
});

test("song requests and a poll, in the Creator studio", async ({ browser, request }) => {
  const poll = { question: "Which day suits you for the haldi?", options: ["Friday", "Saturday"] };
  const { slug, key } = await publish(request, "wedding", { title: "Isha & Kabir", askSong: true, poll });
  const context = await freshContext(browser);
  const page = await context.newPage();
  await page.goto(`/e/${slug}`);
  await page.locator("#guest-song").fill("Gallan Goodiyaan");
  await page.locator(".inv-poll").getByRole("radio", { name: "Saturday" }).check();
  await page.getByRole("button", { name: "Send my reply" }).click();
  await expect(page.locator(".inv-rsvp-confirmation")).toBeVisible();

  const { rsvps } = await owned(request, slug, key);
  expect(rsvps[0]).toMatchObject({ song: "Gallan Goodiyaan", pick: 1 });

  const host = await context.newPage();
  await host.goto(`/manage/${slug}#k=${key}`);
  const card = host.locator("section").filter({ has: host.locator("#extras-heading") });
  await expect(card).toContainText("Gallan Goodiyaan");
  await expect(card.locator(".manage-poll li").nth(1)).toContainText("Saturday1 answer");
  await context.close();
});

test("the server keeps only the extras an invitation asks for", async ({ request }) => {
  const { slug, key } = await publish(request, "birthday", {}, "free");
  const post = (data: object) => request.post(`/api/experiences/${slug}/rsvps`, { headers: { "x-forwarded-for": freshIp() }, data: { attendance: "Attending", ...data } });
  expect((await post({ name: "A", diet: ["jain"], song: "Anything", pick: 0 })).status()).toBe(201);
  const { rsvps } = await owned(request, slug, key);
  expect(rsvps[0].diet).toBeUndefined();
  expect(rsvps[0].song).toBeUndefined();
  expect(rsvps[0].pick).toBeUndefined();
  // A poll needs a question and two answers.
  const bad = await request.post("/api/experiences", { headers: { "x-forwarded-for": freshIp() }, data: { templateId: "wedding", draft: { title: "A", date: "2026-11-08", time: "", venue: "B", message: "", poll: { question: "Pick one", options: ["Only"] } } } });
  expect(bad.status()).toBe(422);
  expect((await bad.json()).fields.poll).toBe("Give the poll at least two answers.");
});
