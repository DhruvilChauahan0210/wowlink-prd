import { expect, test, type Browser } from "../fixtures";
import { addGuest, collectErrors, freshIp, freshUser, ownerHeaders, publish } from "../helpers";

/*
 * Gujarati and English: the host picks the language guests see first, and each guest can switch for themselves.
 */

// A new browser, signed in as a host of its own (it may publish).
const freshContext = (browser: Browser) => browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": freshIp(), "x-wowlink-test-user": freshUser() } });
const SCHEDULE = [
  { id: "sangeet", name: "Sangeet", date: "2026-11-07", time: "19:30", venue: "" },
  { id: "reception", name: "Reception", date: "2026-11-08", time: "21:00", venue: "" },
];

test("the host picks Gujarati in the studio; the preview and the share message follow", async ({ page }) => {
  await page.goto("/create?template=wedding");
  await page.getByRole("radio", { name: "ગુજરાતી" }).check();
  await expect(page.locator(".studio-canvas-frame .inv-intro .inv-overline")).toHaveText("બંને પરિવારો તરફથી સ્નેહભર્યું આમંત્રણ");
  await expect(page.locator(".studio-canvas-frame .inv-date")).toContainText("8 નવે 2026");
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  const whatsApp = await page.locator(".publish-dialog[open]").getByRole("link", { name: "WhatsApp" }).getAttribute("href");
  expect(decodeURIComponent(whatsApp!)).toContain("આપને આમંત્રણ છે: Aarav & Meera");
});

test("a Gujarati invitation: opening, details and a reply, all in Gujarati", async ({ browser }) => {
  const context = await freshContext(browser);
  const { slug } = await publish(context.request, "wedding", { title: "Isha & Kabir", language: "gu", events: SCHEDULE });
  const page = await context.newPage();
  const errors = collectErrors(page);
  await page.goto(`/e/${slug}`);
  await expect(page).toHaveTitle("Isha & Kabir — આપને આમંત્રણ છે");
  await expect(page.locator(".invitation-page")).toHaveAttribute("lang", "gu");
  await page.getByRole("button", { name: "આમંત્રણ ખોલો" }).click();
  await expect(page.locator(".inv-card .inv-overline")).toHaveText("આપના આવવાથી જ પ્રસંગ પૂર્ણ થશે");
  await expect(page.locator(".inv-details-grid h3").first()).toHaveText("8 નવેમ્બર 2026");
  await expect(page.locator(".inv-details-grid p").first()).toHaveText("સાંજે 6:00 વાગ્યે");
  await expect(page.locator(".inv-timeline-day")).toHaveText(["શનિ, 7 નવે", "રવિ, 8 નવે"]);
  await expect(page.locator("#rsvp-heading")).toHaveText("શું આપ પધારશો?");

  await page.getByRole("checkbox", { name: /Reception/ }).uncheck();
  await page.locator("#guest-count").fill("3");
  await page.getByRole("button", { name: "જવાબ મોકલો" }).click();
  await expect(page.locator(".inv-confirm-label")).toHaveText("જવાબ મોકલાયો");
  await expect(page.locator(".inv-rsvp-confirmation h3")).toHaveText("ખુશીથી, હા!");
  await expect(page.locator(".inv-rsvp-summary")).toHaveText("Sangeet માં આવીશું · 3 લોકો.");
  expect(errors).toEqual([]);
  await context.close();
});

test("a guest can switch language, and the page remembers it", async ({ browser }) => {
  const context = await freshContext(browser);
  const { slug } = await publish(context.request, "wedding", { language: "gu" });
  const page = await context.newPage();
  await page.goto(`/e/${slug}`);
  await expect(page.locator("#rsvp-heading")).toHaveText("શું આપ પધારશો?");
  await page.getByRole("button", { name: "આ અંગ્રેજીમાં વાંચો (English)" }).click();
  await expect(page.locator("#rsvp-heading")).toHaveText("Will you be there?");
  await expect(page.getByRole("button", { name: "Open the invitation" })).toBeVisible();
  await page.reload();
  await expect(page.locator("#rsvp-heading")).toHaveText("Will you be there?");
  // And the other way, on an English invitation.
  const { slug: english } = await publish(context.request);
  await page.goto(`/e/${english}`);
  await page.getByRole("button", { name: "Read this in Gujarati (ગુજરાતી)" }).click();
  await expect(page.locator(".inv-detail-label").first()).toHaveText("ક્યારે");
  await context.close();
});

test("a personal invitation in Gujarati is addressed in Gujarati, and so is its WhatsApp message", async ({ browser }) => {
  const context = await freshContext(browser);
  const { slug, key } = await publish(context.request, "wedding", { title: "Isha & Kabir", language: "gu", events: SCHEDULE });
  const family = await addGuest(context.request, slug, key, "રમેશભાઈ પટેલ પરિવાર");
  const page = await context.newPage();
  await page.goto(`/e/${slug}/${family.id}`);
  await expect(page.locator(".inv-addressee")).toHaveText("રમેશભાઈ પટેલ પરિવાર માટે");
  await expect(page.locator("#schedule-heading")).toHaveText("આપના પ્રસંગો");

  await page.goto(`/manage/${slug}#k=${key}`);
  const row = page.locator(".manage-guest").filter({ hasText: "રમેશભાઈ પટેલ પરિવાર" });
  const invite = decodeURIComponent((await row.getByRole("link", { name: /their link on WhatsApp/ }).getAttribute("href"))!);
  expect(invite).toContain("રમેશભાઈ પટેલ પરિવાર માટે\nઆપને આમંત્રણ છે: Isha & Kabir");
  const remind = decodeURIComponent((await row.getByRole("link", { name: /^Remind/ }).getAttribute("href"))!);
  expect(remind).toContain("નમસ્તે રમેશભાઈ પટેલ પરિવાર!");
  // The host's own screens stay in English.
  await expect(page.locator("#guests-heading")).toHaveText("Personal invitations");
  await context.close();
});

test("the countdown in Gujarati", async ({ browser }) => {
  const context = await freshContext(browser);
  const { slug } = await publish(context.request, "wedding", { date: "2026-11-08", time: "18:00", language: "gu" });
  const page = await context.newPage();
  await page.clock.install({ time: new Date("2026-10-22T10:00:00+05:30") });
  await page.goto(`/e/${slug}`);
  await expect(page.locator(".inv-countdown")).toHaveText(/^17\s*દિવસ બાકી$/);
  await context.close();
});

test("the owner API keeps the language", async ({ request }) => {
  const { slug, key } = await publish(request, "garba", { language: "gu" });
  const { experience } = await (await request.get(`/api/experiences/${slug}`, { headers: ownerHeaders(key) })).json();
  expect(experience.language).toBe("gu");
});
