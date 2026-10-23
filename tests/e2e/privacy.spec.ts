import { expect, test } from "@playwright/test";
import { addGuest, ownerHeaders, publish } from "../helpers";

/* The privacy page, in both languages, and the ways guests and hosts reach it. */

test("the privacy page, in English and in Gujarati", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.locator("h1")).toHaveText("What we keep, and who sees it");
  await expect(page.locator(".privacy-page")).toHaveAttribute("lang", "en");
  await expect(page.locator("link[rel=canonical]")).toHaveAttribute("href", /\/privacy$/);
  await expect(page.locator("link[rel=alternate][hreflang=gu]")).toHaveAttribute("href", /\/privacy\?lang=gu$/);
  await expect(page.getByRole("heading", { name: "A link isn’t a lock" })).toBeVisible();

  await page.locator(".page-langs").getByRole("link", { name: "ગુજરાતી" }).click();
  await expect(page).toHaveURL(/\/privacy\?lang=gu$/);
  await expect(page.locator("h1")).toHaveText("અમે શું સાચવીએ છીએ, અને કોણ જુએ છે");
  await expect(page.locator(".privacy-page")).toHaveAttribute("lang", "gu");
  // What crawlers read: the page as the server sends it (after a client-side switch, Next.js streams the head in later).
  expect(await (await page.request.get("/privacy?lang=gu")).text()).toMatch(/<link rel="canonical" href="[^"]*\/privacy\?lang=gu"/);
  await expect(page.locator(".privacy-updated")).toContainText("23 ઑક્ટોબર 2026");
  await page.locator(".page-langs").getByRole("link", { name: "English" }).click();
  await expect(page.locator("h1")).toHaveText("What we keep, and who sees it");
});

test("guests find it from the reply form and the footer, in the invitation's language", async ({ page, request }) => {
  const { slug } = await publish(request, "wedding", { language: "gu" });
  await page.goto(`/e/${slug}`);
  await expect(page.locator(".inv-rsvp-privacy")).toContainText("આપનો જવાબ ફક્ત યજમાન જ જોશે.");
  await expect(page.locator(".inv-rsvp-privacy a")).toHaveAttribute("href", "/privacy?lang=gu");
  await expect(page.locator(".invitation-footer-privacy")).toHaveAttribute("href", "/privacy?lang=gu");

  const english = await publish(request);
  await page.goto(`/e/${english.slug}`);
  await expect(page.locator(".inv-rsvp-privacy")).toHaveText("Your reply goes to the hosts only. How it’s kept");
  await expect(page.locator(".inv-rsvp-privacy a")).toHaveAttribute("href", "/privacy");
  // When the hosts show wishes, the note says so: a wish isn't for the hosts only.
  expect((await request.patch(`/api/experiences/${english.slug}`, { headers: ownerHeaders(english.key), data: { showWishes: true } })).status()).toBe(200);
  await page.reload();
  await expect(page.locator(".inv-rsvp-privacy")).toHaveText("Only the hosts see your reply. A wish may be shown on this page, with your name. How it’s kept");
});

test("hosts find it on the manage page", async ({ page, request }) => {
  const { slug, key } = await publish(request);
  await addGuest(request, slug, key, "the Patel family");
  await page.goto(`/manage/${slug}#k=${key}`);
  await expect(page.getByRole("link", { name: "How guests’ replies are kept" })).toHaveAttribute("href", "/privacy");
});
