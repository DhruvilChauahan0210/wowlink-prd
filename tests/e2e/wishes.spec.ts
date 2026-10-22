import { expect, test, type Browser } from "@playwright/test";
import { addGuest, collectErrors, freshIp, ownerHeaders, publish } from "../helpers";

/*
 * Blessings and wishes: guests leave one with their reply; the host sees them all and chooses whether the
 * invitation shows them, hiding any one they like.
 */

const general = () => ({ "x-forwarded-for": freshIp() });
const freshContext = (browser: Browser) => browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": freshIp() } });

test("wishes stay with the host until they choose to show them, and only typed names go with them", async ({ request }) => {
  const { slug, key } = await publish(request);
  const patel = await addGuest(request, slug, key, "the Patel family");
  const rsvp = (data: object) => request.post(`/api/experiences/${slug}/rsvps`, { headers: general(), data: { attendance: "Attending", ...data } });
  expect((await rsvp({ name: "Riya", wish: "  Many   happy years to you both  " })).status()).toBe(201);
  expect((await rsvp({ guest: patel.id, wish: "Bless you both" })).status()).toBe(201);

  const owner = async () => (await request.get(`/api/experiences/${slug}`, { headers: ownerHeaders(key) })).json();
  const { rsvps } = await owner();
  expect(rsvps.map((r: { wish: string }) => r.wish).sort()).toEqual(["Bless you both", "Many happy years to you both"]);

  // Off by default: not on the page.
  expect(await (await request.get(`/e/${slug}`)).text()).not.toContain("Many happy years");
  expect((await request.patch(`/api/experiences/${slug}`, { headers: ownerHeaders(key), data: { showWishes: "yes" } })).status()).toBe(400);
  expect((await request.patch(`/api/experiences/${slug}`, { headers: ownerHeaders(key), data: { showWishes: true } })).status()).toBe(200);
  const page = await (await request.get(`/e/${slug}`)).text();
  expect(page).toContain("Many happy years to you both");
  expect(page).toContain("Bless you both");
  // The Patels typed no name: their wish isn't signed with the name on the host's list.
  expect(page).not.toContain("Patel");

  // Hiding one: owner only, and it leaves the page.
  const riya = rsvps.find((r: { name: string }) => r.name === "Riya");
  expect((await request.patch(`/api/experiences/${slug}/rsvps/${riya.id}`, { headers: ownerHeaders("wrong"), data: { hidden: true } })).status()).toBe(404);
  expect((await request.patch(`/api/experiences/${slug}/rsvps/${riya.id}`, { headers: ownerHeaders(key), data: { hidden: true } })).status()).toBe(200);
  expect(await (await request.get(`/e/${slug}`)).text()).not.toContain("Many happy years");

  // A household changing its reply without a wish takes the wish back.
  expect((await rsvp({ guest: patel.id, wish: "" })).status()).toBe(200);
  expect((await owner()).rsvps.find((r: { guestId?: string }) => r.guestId === patel.id).wish).toBeUndefined();
});

test("a guest leaves a wish; the host shows it on the invitation, then hides it", async ({ browser }) => {
  const context = await freshContext(browser);
  const { slug, key } = await publish(context.request, "wedding", { title: "Isha & Kabir" });
  const guest = await context.newPage();
  const errors = collectErrors(guest);
  await guest.goto(`/e/${slug}`);
  await expect(guest.locator("#guest-wish-hint")).toHaveText("Only the hosts will see it.");
  await guest.locator("#guest-name").fill("Nani");
  await guest.locator("#guest-wish").fill("May your home always be full of laughter.");
  await guest.getByRole("button", { name: "Send my reply" }).click();
  await expect(guest.locator(".inv-rsvp-wish")).toHaveText("“May your home always be full of laughter.”");

  const host = await context.newPage();
  await host.goto(`/manage/${slug}#k=${key}`);
  const card = host.locator("section", { has: host.locator("#wishes-heading") });
  await expect(card.locator(".manage-wish blockquote")).toHaveText("May your home always be full of laughter.");
  await expect(card.locator(".manage-wish-meta")).toContainText("— Nani");
  await card.getByRole("checkbox", { name: "Show them on the invitation" }).check();
  await expect(card.getByRole("checkbox", { name: "Show them on the invitation" })).toBeChecked();

  await guest.reload();
  await expect(guest.locator("#guest-wish-hint")).toHaveText("The hosts may show it on this page, with your name.");
  await expect(guest.locator(".inv-wish")).toHaveCount(1);
  await expect(guest.locator(".inv-wish")).toContainText("May your home always be full of laughter.");
  await expect(guest.locator(".inv-wish span")).toHaveText("— Nani");

  await card.getByRole("button", { name: /^Hide the wish from Nani/ }).click();
  await expect(card.locator(".manage-wish-hidden")).toHaveText("Hidden from the invitation");
  await guest.reload();
  await expect(guest.locator(".inv-wishes-section")).toHaveCount(0);
  expect(errors).toEqual([]);
  await context.close();
});

test("in Gujarati too", async ({ browser }) => {
  const context = await freshContext(browser);
  const { slug, key } = await publish(context.request, "wedding", { language: "gu" });
  await context.request.patch(`/api/experiences/${slug}`, { headers: ownerHeaders(key), data: { showWishes: true } });
  await context.request.post(`/api/experiences/${slug}/rsvps`, { headers: general(), data: { attendance: "Attending", wish: "જીવનભર સુખી રહો" } });
  const page = await context.newPage();
  await page.goto(`/e/${slug}`);
  await expect(page.locator("#wishes-heading")).toHaveText("આશીર્વાદ અને શુભેચ્છાઓ");
  await expect(page.locator(".inv-wish span")).toHaveText("— એક મહેમાન");
  await context.close();
});
