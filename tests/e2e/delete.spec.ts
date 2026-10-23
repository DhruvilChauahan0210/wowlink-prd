import { expect, test, type Browser } from "@playwright/test";
import { addGuest, collectErrors, freshIp, ownerHeaders, publish } from "../helpers";

/*
 * Deleting: a host can delete one reply (a guest asked to be taken off), or the whole invitation with everything in
 * it. Both are for good, and both need the manage key.
 */

const general = () => ({ "x-forwarded-for": freshIp() });
const freshContext = (browser: Browser) => browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": freshIp() } });

test("deleting an invitation needs its key, and takes everything in it", async ({ request }) => {
  const { slug, key } = await publish(request, "wedding", { title: "Isha & Kabir" });
  const patel = await addGuest(request, slug, key, "the Patel family");
  const rsvp = (data: object) => request.post(`/api/experiences/${slug}/rsvps`, { headers: general(), data: { attendance: "Attending", ...data } });
  expect((await rsvp({ name: "Riya", wish: "Bless you both" })).status()).toBe(201);
  expect((await rsvp({ guest: patel.id })).status()).toBe(201);

  // A wrong key can't, and looks the same as an invitation that isn't there.
  const wrong = await request.delete(`/api/experiences/${slug}`, { headers: ownerHeaders("not-the-key-at-all-123") });
  expect(wrong.status()).toBe(404);
  expect((await request.get(`/e/${slug}`)).status()).toBe(200);

  const deleted = await request.delete(`/api/experiences/${slug}`, { headers: ownerHeaders(key) });
  expect(deleted.status()).toBe(200);
  expect(await deleted.json()).toEqual({ ok: true, replies: 2 });

  // Every way in is gone.
  expect((await request.get(`/e/${slug}`)).status()).toBe(404);
  expect((await request.get(`/e/${slug}/${patel.id}`)).status()).toBe(404);
  expect((await request.get(`/e/${slug}/invite.ics`)).status()).toBe(404);
  expect((await request.get(`/api/experiences/${slug}`, { headers: ownerHeaders(key) })).status()).toBe(404);
  expect((await rsvp({ name: "Late" })).status()).toBe(404);
  // The link preview card still answers (it never errors), but without the invitation's details.
  const card = await request.get(`/e/${slug}/opengraph-image`);
  expect(card.status()).toBe(200);
  // And it can't be deleted twice.
  expect((await request.delete(`/api/experiences/${slug}`, { headers: ownerHeaders(key) })).status()).toBe(404);
});

test("a host can delete one reply; a household can then reply again", async ({ request }) => {
  const { slug, key } = await publish(request);
  const patel = await addGuest(request, slug, key, "the Patel family");
  const rsvp = (data: object) => request.post(`/api/experiences/${slug}/rsvps`, { headers: general(), data: { attendance: "Attending", ...data } });
  expect((await rsvp({ name: "Riya", wish: "So happy for you" })).status()).toBe(201);
  expect((await rsvp({ guest: patel.id, guestCount: 4 })).status()).toBe(201);
  const owned = async () => (await (await request.get(`/api/experiences/${slug}`, { headers: ownerHeaders(key) })).json()) as { rsvps: { id: string; name: string; guestId?: string }[] };
  const { rsvps } = await owned();
  const riya = rsvps.find(r => r.name === "Riya")!;
  const patels = rsvps.find(r => r.guestId === patel.id)!;

  expect((await request.delete(`/api/experiences/${slug}/rsvps/${riya.id}`, { headers: ownerHeaders("not-the-key-at-all-123") })).status()).toBe(404);
  expect((await request.delete(`/api/experiences/${slug}/rsvps/${riya.id}`, { headers: ownerHeaders(key) })).status()).toBe(200);
  const again = await request.delete(`/api/experiences/${slug}/rsvps/${riya.id}`, { headers: ownerHeaders(key) });
  expect(again.status()).toBe(404);
  expect((await again.json()).error).toBe("That reply isn’t there any more.");
  expect((await owned()).rsvps.map(r => r.id)).toEqual([patels.id]);

  // The Patels' invitation stays: remove their reply and they can send a fresh one.
  expect((await request.delete(`/api/experiences/${slug}/rsvps/${patels.id}`, { headers: ownerHeaders(key) })).status()).toBe(200);
  expect((await owned()).rsvps).toEqual([]);
  expect((await request.get(`/e/${slug}/${patel.id}`)).status()).toBe(200);
  expect((await rsvp({ guest: patel.id, attendance: "Maybe" })).status()).toBe(201);
  expect((await owned()).rsvps).toHaveLength(1);
});

test("on the manage page: remove a reply, then delete the invitation", async ({ browser, request }) => {
  const { slug, key } = await publish(request, "birthday", { title: "Riya turns 7" });
  await addGuest(request, slug, key, "the Shah family");
  const rsvp = (data: object) => request.post(`/api/experiences/${slug}/rsvps`, { headers: general(), data: { attendance: "Attending", guestCount: 2, ...data } });
  expect((await rsvp({ name: "Asha", wish: "Happy birthday!" })).status()).toBe(201);
  expect((await rsvp({ name: "Dev" })).status()).toBe(201);

  const context = await freshContext(browser);
  const page = await context.newPage();
  const errors = collectErrors(page);
  await page.goto(`/manage/${slug}#k=${key}`);
  const table = page.locator(".manage-replies");
  await expect(table.locator("tbody tr")).toHaveCount(2);

  // Asking first, and "Keep it" changes nothing.
  await page.getByRole("button", { name: "Remove the reply from Asha" }).click();
  const ask = page.getByRole("group", { name: "Remove the reply from Asha" });
  await expect(ask).toContainText("Delete this reply and its wish for good?");
  // Focus goes to the question, and back to the button when it's called off.
  await expect(ask.locator("p")).toBeFocused();
  await ask.getByRole("button", { name: "Keep it" }).click();
  await expect(ask).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Remove the reply from Asha" })).toBeFocused();
  await page.getByRole("button", { name: "Remove the reply from Asha" }).click();
  await ask.getByRole("button", { name: "Remove", exact: true }).click();
  await expect(table.locator("tbody tr")).toHaveCount(1);
  await expect(table).not.toContainText("Asha");
  await expect(page.locator("#replies-heading")).toBeFocused();
  await expect(page.locator(".manage-totals dd").first()).toHaveText("1");

  // Deleting the invitation says what goes with it, offers the replies first, and can be called off.
  const card = page.locator(".manage-delete");
  await card.getByRole("button", { name: "Delete invitation" }).click();
  await expect(card.locator(".manage-confirm p")).toHaveText("Delete it for good? 1 reply and 1 personal invitation will be deleted with it. This can’t be undone.");
  await expect(card.locator(".manage-confirm p")).toBeFocused();
  await expect(card.getByRole("button", { name: "Delete invitation" })).toHaveAttribute("aria-expanded", "true");
  await expect(card.getByRole("button", { name: "Download the replies first" })).toBeVisible();
  await card.getByRole("button", { name: "Keep it" }).click();
  await expect(card.getByRole("button", { name: "Delete for good" })).toHaveCount(0);
  await expect(card.getByRole("button", { name: "Delete invitation" })).toBeFocused();

  await card.getByRole("button", { name: "Delete invitation" }).click();
  await card.getByRole("button", { name: "Delete for good" }).click();
  await expect(page.getByRole("heading", { name: "Deleted" })).toBeFocused();
  await expect(page.locator(".manage-notice")).toContainText("“Riya turns 7” and everything in it is gone.");
  expect(await page.evaluate(s => localStorage.getItem(`wowlink:owner:${s}`), slug)).toBeNull();

  // Gone from My invitations, and from the web.
  await page.getByRole("link", { name: "My invitations" }).first().click();
  await expect(page.locator(".mine-empty")).toBeVisible();
  expect((await request.get(`/e/${slug}`)).status()).toBe(404);
  expect(errors).toEqual([]);
  await context.close();
});

test("deleting, in Gujarati", async ({ browser, request }) => {
  const { slug, key } = await publish(request);
  await addGuest(request, slug, key, "the Patel family");
  await addGuest(request, slug, key, "the Shah family");
  const context = await freshContext(browser);
  const page = await context.newPage();
  await page.goto("/mine");
  await page.evaluate(() => localStorage.setItem("wowlink:host-lang", "gu"));
  await page.goto(`/manage/${slug}#k=${key}`);
  const card = page.locator(".manage-delete");
  await expect(card.locator("h2")).toHaveText("આ આમંત્રણ કાઢી નાખો");
  await card.getByRole("button", { name: "આમંત્રણ કાઢી નાખો" }).click();
  await expect(card.locator(".manage-confirm p")).toHaveText("હંમેશ માટે કાઢી નાખવું છે? તેની સાથે 2 વ્યક્તિગત આમંત્રણ પણ કાઢી નખાશે. આ પાછું લાવી શકાશે નહીં.");
  await card.getByRole("button", { name: "હંમેશ માટે કાઢી નાખો" }).click();
  await expect(page.getByRole("heading", { name: "કાઢી નાખ્યું" })).toBeVisible();
  await context.close();
});

test("deleting an invitation that was already deleted elsewhere still ends at “Deleted”", async ({ browser, request }) => {
  const { slug, key } = await publish(request, "wedding", { title: "Isha & Kabir" });
  const context = await freshContext(browser);
  const page = await context.newPage();
  await page.goto(`/manage/${slug}#k=${key}`);
  await expect(page.locator("h1")).toHaveText("Isha & Kabir");
  // Another device deletes it (or an earlier try did, and its answer was lost).
  expect((await request.delete(`/api/experiences/${slug}`, { headers: ownerHeaders(key) })).status()).toBe(200);
  const card = page.locator(".manage-delete");
  await card.getByRole("button", { name: "Delete invitation" }).click();
  await card.getByRole("button", { name: "Delete for good" }).click();
  await expect(page.getByRole("heading", { name: "Deleted" })).toBeFocused();
  expect(await page.evaluate(s => localStorage.getItem(`wowlink:owner:${s}`), slug)).toBeNull();
  await context.close();
});
