import { expect, test } from "../fixtures";
import { adminHeaders, freshIp, ownerHeaders, publish, sampleDraft } from "../helpers";

/*
 * The two plans. Free is deliberately small: the four starter occasions, one celebration, the occasion's colours,
 * 50 replies, no personal invitations, and it comes down 30 days after the day. The Creator studio has the rest. The
 * server enforces it, whatever the studio sends.
 */

const general = () => ({ "x-forwarded-for": freshIp() });
const create = (request: import("@playwright/test").APIRequestContext, templateId: string, draft: object) =>
  request.post("/api/experiences", { headers: general(), data: { templateId, draft: sampleDraft(draft) } });
/** "YYYY-MM-DD", `days` from today on India's calendar. */
const day = (days: number) => new Date(Date.now() + 5.5 * 3_600_000 + days * 86_400_000).toISOString().slice(0, 10);

test("a free invitation can't use the Creator studio's features", async ({ request }) => {
  const schedule = await create(request, "wedding", { events: [{ id: "mehndi", name: "Mehndi", date: "2026-11-06", time: "", venue: "" }] });
  expect(schedule.status()).toBe(403);
  expect(await schedule.json()).toMatchObject({ error: "A schedule of celebrations is part of the Creator studio.", pro: ["schedule"] });
  expect((await (await create(request, "wedding", { palette: "peacock" })).json()).pro).toEqual(["colours"]);
  expect((await (await create(request, "engagement", {})).json()).pro).toEqual(["occasion"]);
  expect((await (await create(request, "birthday", { askSong: true, poll: { question: "Veg or Jain?", options: ["Veg", "Jain"] }, attribution: false })).json()).pro).toEqual(["attribution", "song", "poll"]);

  // A plain one is fine, and so is asking about food.
  const ok = await create(request, "garba", { askDiet: true });
  expect(ok.status()).toBe(201);
  const { slug, key } = await ok.json();
  // It stays free when edited...
  const edit = await request.patch(`/api/experiences/${slug}`, { headers: ownerHeaders(key), data: { draft: sampleDraft({ palette: "rani" }) } });
  expect(edit.status()).toBe(403);
  expect((await request.patch(`/api/experiences/${slug}`, { headers: ownerHeaders(key), data: { templateId: "puja" } })).status()).toBe(403);
  // ...and has no personal invitations.
  const guest = await request.post(`/api/experiences/${slug}/guests`, { headers: ownerHeaders(key), data: { name: "the Patel family" } });
  expect(guest.status()).toBe(403);
  expect((await guest.json()).error).toBe("Personal invitations are part of the Creator studio.");
});

test("the admin moves an invitation to the Creator studio, and back", async ({ request }) => {
  const { slug, key } = await publish(request, "wedding", {}, "free");
  const move = (action: string) => request.post(`/api/admin/invitations/${slug}`, { headers: adminHeaders(), data: { action } });
  expect((await (await move("make-pro")).json()).invitation.plan).toBe("pro");
  expect((await request.post(`/api/experiences/${slug}/guests`, { headers: ownerHeaders(key), data: { name: "the Patel family" } })).status()).toBe(201);
  expect((await request.patch(`/api/experiences/${slug}`, { headers: ownerHeaders(key), data: { draft: sampleDraft({ palette: "rani" }) } })).status()).toBe(200);
  expect((await (await move("make-free")).json()).invitation.plan).toBe("free");
  // Back on the free plan, the guest page shows only what free includes.
  expect(await (await request.get(`/e/${slug}`)).text()).not.toContain("has-palette");
  // Only the admin can publish straight into the Creator studio.
  const sneaky = await request.post("/api/experiences", { headers: general(), data: { templateId: "wedding", draft: sampleDraft({ palette: "rani" }), plan: "pro" } });
  expect(sneaky.status()).toBe(403);
});

test("a free invitation comes down 30 days after the day; the Creator studio's doesn't", async ({ request, page }) => {
  const recent = await publish(request, "birthday", { date: day(-20) }, "free");
  expect((await request.get(`/e/${recent.slug}`)).status()).toBe(200);
  const old = await publish(request, "birthday", { date: day(-40), title: "Long ago" }, "free");
  expect((await request.get(`/e/${old.slug}`)).status()).toBe(404);
  expect((await request.post(`/api/experiences/${old.slug}/rsvps`, { headers: general(), data: { attendance: "Attending" } })).status()).toBe(404);
  const kept = await publish(request, "birthday", { date: day(-40) });
  expect((await request.get(`/e/${kept.slug}`)).status()).toBe(200);

  // The host is told, and keeps their replies.
  await page.goto(`/manage/${old.slug}#k=${old.key}`);
  await expect(page.locator(".manage-hero .manage-warn")).toContainText("This free invitation ended on");
  await page.goto(`/manage/${recent.slug}#k=${recent.key}`);
  await expect(page.locator(".manage-hero .manage-ends")).toContainText("Free invitations stay up until 30 days after the occasion");
  await expect(page.locator(".manage-plan")).toHaveText("Free plan");
});

test("the studio keeps a new invitation to the free plan, and says what's in the Creator studio", async ({ page }) => {
  await page.goto("/create?template=wedding");
  await expect(page.locator("#events")).toContainText("A schedule of celebrations (mehndi, sangeet, reception…) is part of the Creator studio.");
  // The preview shows what guests will get: no schedule.
  await expect(page.locator(".studio-canvas-frame .inv-card-schedule")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Two Rings/ }).locator(".studio-pro-badge")).toHaveText("Creator studio");

  await page.getByRole("button", { name: /Two Rings/ }).click();
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page.locator(".studio-save-status")).toHaveText("This occasion is part of the Creator studio. Pick one of the four starter occasions to publish it free.");

  await page.getByRole("button", { name: /The Wedding Edit/ }).click();
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  const url = await page.locator(".publish-dialog[open] .share-tools input").inputValue();
  const guest = await page.context().newPage();
  await guest.goto(url);
  await expect(guest.locator(".inv-schedule-section")).toHaveCount(0);
});

test("the manage page shows a free invitation what the Creator studio adds", async ({ page, request }) => {
  const { slug, key } = await publish(request, "opening", {}, "free");
  expect((await request.post(`/api/experiences/${slug}/rsvps`, { headers: general(), data: { attendance: "Attending" } })).status()).toBe(201);
  await page.goto(`/manage/${slug}#k=${key}`);
  await expect(page.locator("section").filter({ has: page.locator("#guests-heading") })).toContainText("Personal invitations, a link for each family with their name on it, are part of the Creator studio.");
  await expect(page.getByText("Spreadsheet downloads are part of the Creator studio.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Every reply (CSV)" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Make another like this/ })).toHaveCount(0);
});

test("the home page and /pricing show the same plan cards, and only what's true today", async ({ page }) => {
  await page.goto("/pricing");
  const pricing = await page.locator(".cin-plan-grid").innerText();
  await page.goto("/");
  const home = await page.locator("#plans .cin-plan-grid").innerText();
  expect(home).toBe(pricing);
  expect(home).toContain("One live invitation at a time");
  expect(home).toContain("Coming soon");
  expect(home).not.toMatch(/20 live invitations|Preview the creator studio/i);
});
