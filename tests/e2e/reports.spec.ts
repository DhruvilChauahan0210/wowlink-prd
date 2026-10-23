import { expect, test, type APIRequestContext, type Browser } from "@playwright/test";
import { TEST_ADMIN_KEY, addGuest, adminHeaders, collectErrors, freshIp, ownerHeaders, publish } from "../helpers";

/*
 * Reports and taking down: anyone who can open an invitation can report it; WowLink's admin (behind its key) sees the
 * reports and can take an invitation down, put it back, or dismiss the reports.
 */

const general = () => ({ "x-forwarded-for": freshIp() });
const freshContext = (browser: Browser) => browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": freshIp() } });
type Invitation = { slug: string; status: string; removed?: { reason?: string }; reports: { reason: string; details: string; resolvedAt?: string; outcome?: string }[] };
const reported = async (request: APIRequestContext, slug: string) =>
  ((await (await request.get("/api/admin/reports", { headers: adminHeaders() })).json()) as { invitations: Invitation[] }).invitations.find(i => i.slug === slug);
const report = (request: APIRequestContext, data: object) => request.post("/api/reports", { headers: general(), data });

test("a guest reports an invitation from its footer, in their language", async ({ browser, request }) => {
  const { slug } = await publish(request, "garba", { title: "Raas at the Shahs", language: "gu" });
  const context = await freshContext(browser);
  const page = await context.newPage();
  const errors = collectErrors(page);
  await page.goto(`/e/${slug}`);
  await page.locator(".invitation-footer").getByRole("link", { name: "ફરિયાદ કરો" }).click();
  await expect(page).toHaveURL(new RegExp(`/report/${slug}\\?lang=gu$`));
  await expect(page.locator("h1")).toHaveText("આ આમંત્રણની ફરિયાદ કરો");
  await expect(page.locator(".report-which")).toHaveText("આપ “Raas at the Shahs” ની ફરિયાદ કરો છો.");
  // What crawlers get: the page as the server sends it.
  expect(await (await request.get(`/report/${slug}?lang=gu`)).text()).toMatch(/<meta name="robots" content="noindex, nofollow"/);

  // A reason is needed.
  await page.getByRole("button", { name: "ફરિયાદ મોકલો" }).click();
  await expect(page.locator("#report-error")).toHaveText("તેમાં શું ખોટું છે તે પસંદ કરો.");
  await page.getByRole("radio", { name: "સ્પામ, છેતરપિંડી કે જોખમી લિંક" }).check();
  await page.locator("#report-details").fill("  Asks for   money  ");
  await page.getByRole("button", { name: "ફરિયાદ મોકલો" }).click();
  await expect(page.getByRole("heading", { name: "આભાર" })).toBeFocused();

  const found = await reported(request, slug);
  expect(found?.reports).toEqual([expect.objectContaining({ reason: "scam", details: "Asks for money" })]);
  // Nothing about who sent it.
  expect(Object.keys(found!.reports[0]).sort()).toEqual(["createdAt", "details", "experienceId", "id", "reason"]);
  expect(errors).toEqual([]);
  await context.close();
});

test("reports need a reason and a live invitation, bots are ignored, and one address can't flood them", async ({ request }) => {
  const { slug } = await publish(request);
  expect((await report(request, { slug, reason: "because" })).status()).toBe(422);
  expect((await report(request, { slug: "bcdfghj", reason: "scam" })).status()).toBe(404);
  // The hidden field: thanked, not kept.
  expect((await report(request, { slug, reason: "scam", website: "spam.example" })).status()).toBe(201);
  expect(await reported(request, slug)).toBeUndefined();

  const sameAddress = { "x-forwarded-for": freshIp() };
  const statuses: number[] = [];
  for (let i = 0; i < 6; i++) statuses.push((await request.post("/api/reports", { headers: sameAddress, data: { slug, reason: "other" } })).status());
  expect(statuses).toEqual([201, 201, 201, 201, 201, 429]);
});

test("the admin needs its key, and too many wrong tries lock it out", async ({ request }) => {
  expect((await request.get("/api/admin/reports")).status()).toBe(404);
  expect((await request.get("/api/admin/reports", { headers: adminHeaders("not-the-admin-key-at-all-000") })).status()).toBe(404);
  expect((await request.get("/api/admin/reports", { headers: adminHeaders() })).status()).toBe(200);

  const sameAddress = (key: string) => ({ authorization: `Bearer ${key}`, "x-forwarded-for": "10.250.250.250" });
  for (let i = 0; i < 10; i++) await request.get("/api/admin/numbers", { headers: sameAddress(`wrong-key-number-${i}-padding-padding`) });
  // Even the right key, from that address, for the next hour; the answer says it's a lockout.
  const locked = await request.get("/api/admin/numbers", { headers: sameAddress(TEST_ADMIN_KEY) });
  expect(locked.status()).toBe(429);
  expect((await locked.json()).error).toBe("Too many wrong tries. Try again in an hour.");
  expect((await request.get("/api/admin/numbers", { headers: adminHeaders() })).status()).toBe(200);
});

test("taking an invitation down shuts every way in; its host keeps their replies; restoring brings it back", async ({ request }) => {
  const { slug, key } = await publish(request, "opening", { title: "Grand Sale" });
  const patel = await addGuest(request, slug, key, "the Patel family");
  expect((await request.post(`/api/experiences/${slug}/rsvps`, { headers: general(), data: { attendance: "Attending", name: "Riya" } })).status()).toBe(201);
  expect((await report(request, { slug, reason: "scam", details: "fake sale" })).status()).toBe(201);
  expect((await report(request, { slug, reason: "scam" })).status()).toBe(201);
  expect((await report(request, { slug, reason: "fake" })).status()).toBe(201);

  const down = await request.post(`/api/admin/invitations/${slug}`, { headers: adminHeaders(), data: { action: "take-down" } });
  expect(down.status()).toBe(200);
  const { invitation } = (await down.json()) as { invitation: Invitation };
  // The most common reason goes on the host's notice; its reports count as acted on.
  expect(invitation.removed?.reason).toBe("scam");
  expect(invitation.reports.every(r => r.outcome === "taken-down" && r.resolvedAt)).toBe(true);

  for (const path of [`/e/${slug}`, `/e/${slug}/${patel.id}`, `/e/${slug}/invite.ics`]) expect((await request.get(path)).status()).toBe(404);
  expect((await request.post(`/api/experiences/${slug}/rsvps`, { headers: general(), data: { attendance: "Attending" } })).status()).toBe(404);
  expect((await report(request, { slug, reason: "scam" })).status()).toBe(404);

  // The host still has everything, but can't publish it again.
  const owned = await (await request.get(`/api/experiences/${slug}`, { headers: ownerHeaders(key) })).json();
  expect(owned.experience.removed.reason).toBe("scam");
  expect(owned.rsvps).toHaveLength(1);
  const republish = await request.patch(`/api/experiences/${slug}`, { headers: ownerHeaders(key), data: { status: "published" } });
  expect(republish.status()).toBe(403);
  expect((await republish.json()).error).toBe("WowLink took this invitation down after it was reported, so it can’t be published again.");

  expect((await request.post(`/api/admin/invitations/${slug}`, { headers: adminHeaders(), data: { action: "restore" } })).status()).toBe(200);
  expect((await request.get(`/e/${slug}`)).status()).toBe(200);
  expect((await request.post(`/api/admin/invitations/${slug}`, { headers: adminHeaders(), data: { action: "explode" } })).status()).toBe(400);
  expect((await request.post("/api/admin/invitations/bcdfghj", { headers: adminHeaders(), data: { action: "restore" } })).status()).toBe(404);
});

test("dismissing reports leaves the invitation up", async ({ request }) => {
  const { slug } = await publish(request);
  expect((await report(request, { slug, reason: "other", details: "I don't like the colours" })).status()).toBe(201);
  expect((await request.post(`/api/admin/invitations/${slug}`, { headers: adminHeaders(), data: { action: "dismiss" } })).status()).toBe(200);
  const found = await reported(request, slug);
  expect(found?.reports[0]).toMatchObject({ outcome: "dismissed" });
  expect(found?.status).toBe("published");
  expect((await request.get(`/e/${slug}`)).status()).toBe(200);
});

test("the admin page: sign in, see a report, take it down and put it back; the host is told", async ({ browser, request }) => {
  const { slug, key } = await publish(request, "birthday", { title: "Totally real giveaway" });
  expect((await report(request, { slug, reason: "fake", details: "Pretends to be a bank" })).status()).toBe(201);
  const context = await freshContext(browser);
  const page = await context.newPage();
  const errors = collectErrors(page);
  await page.goto("/admin");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await page.locator("#admin-key").fill("not-the-admin-key-at-all-000");
  await page.getByRole("button", { name: "Open" }).click();
  await expect(page.locator("#admin-key-error")).toBeVisible();
  await page.locator("#admin-key").fill(TEST_ADMIN_KEY);
  await page.getByRole("button", { name: "Open" }).click();

  const card = page.locator(".admin-card").filter({ hasText: "Totally real giveaway" }).first();
  await expect(card).toContainText("It’s fake, or pretends to be someone else");
  await expect(card).toContainText("“Pretends to be a bank”");
  await card.getByRole("button", { name: "Take down" }).click();
  await expect(card.locator(".manage-status")).toHaveText("Taken down");
  await expect(page.getByRole("status").filter({ hasText: "Taken down: Totally real giveaway" })).toHaveCount(1);
  await expect(card.locator("h3")).toBeFocused();
  expect((await request.get(`/e/${slug}`)).status()).toBe(404);

  // The admin can still look at it, as guests saw it, without it counting as a visit.
  await card.getByRole("link", { name: "Look at it" }).click();
  await expect(page.locator(".admin-view-banner")).toContainText("Admin view");
  await expect(page.locator(".inv-intro .inv-title")).toHaveText("Totally real giveaway");
  await page.waitForTimeout(400);
  expect((await (await request.get(`/api/experiences/${slug}`, { headers: ownerHeaders(key) })).json()).experience.stats.views).toBe(0);
  await page.getByRole("link", { name: "← Back to the admin" }).click();

  // The host's manage page and My invitations say so.
  const host = await context.newPage();
  await host.goto(`/manage/${slug}#k=${key}`);
  await expect(host.locator(".manage-taken-down h2")).toHaveText("WowLink took this invitation down");
  await expect(host.locator(".manage-taken-down p")).toContainText("It was reported (it’s fake, or pretends to be someone else)");
  await expect(host.locator(".manage-hero .manage-status")).toHaveText("Taken down");
  await expect(host.getByRole("button", { name: "Publish again" })).toHaveCount(0);
  await expect(host.getByRole("link", { name: "Edit in studio" })).toHaveCount(0);
  await expect(host.locator(".manage-guest-add")).toHaveCount(0);
  // The studio opens it, but says it can't be updated.
  await host.goto(`/create?edit=${slug}`);
  await expect(host.locator(".studio-save-status")).toHaveText("WowLink took this invitation down, so it can’t be updated or published again.");
  await expect(host.getByRole("button", { name: "Update", exact: true })).toBeDisabled();
  await expect(host.locator(".studio-header-label")).toHaveText("Taken down");
  await host.goto("/mine");
  const item = host.locator(".mine-item").filter({ hasText: "Totally real giveaway" });
  await expect(item.locator(".manage-status")).toHaveText("Taken down");
  await expect(item.getByRole("link", { name: "Edit" })).toHaveCount(0);

  await card.getByRole("button", { name: "Restore" }).click();
  await expect(card.locator(".manage-status")).toHaveText("Live");
  expect((await request.get(`/e/${slug}`)).status()).toBe(200);

  // Finding one by its link.
  await page.locator("#admin-find").fill(`http://localhost:3100/e/${slug}`);
  await page.getByRole("button", { name: "Find" }).click();
  await expect(page.locator(".admin-card").filter({ hasText: "Totally real giveaway" })).toHaveCount(2);
  await page.locator("#admin-find").fill("http://localhost:3100/e/bcdfghj");
  await page.getByRole("button", { name: "Find" }).click();
  await expect(page.locator("p.manage-muted", { hasText: "There’s no invitation at that link." })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "There’s no invitation at that link." })).toHaveCount(1);

  await expect(page.locator("#numbers-heading")).toHaveText("Numbers");
  expect(errors).toEqual([]);
  await context.close();
});

test("from a personal link, the report page leads back to it", async ({ browser, request }) => {
  const { slug, key } = await publish(request);
  const patel = await addGuest(request, slug, key, "the Patel family");
  const context = await freshContext(browser);
  const page = await context.newPage();
  await page.goto(`/e/${slug}/${patel.id}`);
  await page.locator(".invitation-footer").getByRole("link", { name: "Report" }).click();
  await expect(page).toHaveURL(new RegExp(`/report/${slug}\\?from=${patel.id}$`));
  await expect(page.getByRole("link", { name: "Back to the invitation" })).toHaveAttribute("href", `/e/${slug}/${patel.id}`);
  // Switching language keeps it.
  await expect(page.getByRole("link", { name: "ગુજરાતીમાં" })).toHaveAttribute("href", `/report/${slug}?lang=gu&from=${patel.id}`);
  // Anything that isn't a personal link's id is ignored.
  await page.goto(`/report/${slug}?from=../../evil`);
  await expect(page.getByRole("link", { name: "Back to the invitation" })).toHaveAttribute("href", `/e/${slug}`);
  await context.close();
});

test("one invitation keeps at most 50 open reports, always the newest", async ({ request }) => {
  const { slug } = await publish(request);
  for (let i = 0; i < 51; i++) expect((await report(request, { slug, reason: "other", details: `report ${i}` })).status()).toBe(201);
  const found = await reported(request, slug);
  expect(found?.reports).toHaveLength(50);
  expect(found?.reports.map(r => r.details)).toContain("report 50");
  expect(found?.reports.map(r => r.details)).not.toContain("report 0");
});
