import { expect, test, type APIRequestContext, type Browser } from "../fixtures";
import { adminHeaders, freshIp, ownerHeaders, publish } from "../helpers";

/*
 * Insights: plain counts of real visits (never link previews, never the host's own), people counted once, openings
 * played, visits from the QR code, and how the host shared it. Hosts see theirs; the admin sees the app's.
 */

const freshContext = (browser: Browser, options = {}) => browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": freshIp() }, ...options });
type Stats = { views: number; visitors: number; played: number; viaQr: number; shares: Record<string, number> };
const statsOf = async (request: APIRequestContext, slug: string, key: string) =>
  ((await (await request.get(`/api/experiences/${slug}`, { headers: ownerHeaders(key) })).json()).experience.stats ?? {}) as Stats;

test("visits count from real visits, and each person once", async ({ browser, request }) => {
  const { slug, key } = await publish(request, "wedding");
  const stats = () => statsOf(request, slug, key);
  // A link preview fetches the page but never runs it.
  expect((await request.get(`/e/${slug}`)).status()).toBe(200);
  expect(await stats()).toMatchObject({ views: 0, visitors: 0 });

  const first = await freshContext(browser);
  const page = await first.newPage();
  await page.goto(`/e/${slug}`);
  await expect.poll(async () => (await stats()).views).toBe(1);
  await page.reload();
  await expect.poll(async () => (await stats()).views).toBe(2);
  expect((await stats()).visitors).toBe(1);

  // Playing the opening counts once per person.
  await page.getByRole("button", { name: "Open the invitation" }).click();
  await expect.poll(async () => (await stats()).played).toBe(1);
  await page.reload();
  await page.getByRole("button", { name: "Open the invitation" }).click();
  await page.waitForTimeout(400);
  expect((await stats()).played).toBe(1);

  // Someone else, from the printed QR code: counted as such, and the tag leaves the address bar.
  const second = await freshContext(browser);
  const scanned = await second.newPage();
  await scanned.goto(`/e/${slug}?via=qr`);
  await expect(scanned).toHaveURL(new RegExp(`/e/${slug}$`));
  // Four visits: three from the first person (open, reload, reload), one from the QR code.
  await expect.poll(stats).toMatchObject({ views: 4, visitors: 2, viaQr: 1 });
  await first.close();
  await second.close();
});

test("the host's own visits don't count", async ({ browser, request }) => {
  const { slug, key } = await publish(request);
  const context = await freshContext(browser);
  const host = await context.newPage();
  await host.goto(`/manage/${slug}#k=${key}`);
  await expect(host.locator("h1")).toHaveText("Aarav & Meera");
  await host.goto(`/e/${slug}`);
  await host.getByRole("button", { name: "Open the invitation" }).click();
  await host.waitForTimeout(600);
  expect(await statsOf(request, slug, key)).toMatchObject({ views: 0, played: 0 });
  await context.close();
});

test("the counting endpoint answers the same for anything, and only counts live invitations", async ({ request }) => {
  const post = (slug: string, data: object) => request.post(`/api/experiences/${slug}/events`, { headers: { "x-forwarded-for": freshIp() }, data });
  expect((await post("bcdfghj", { type: "view", first: true })).status()).toBe(204);
  expect((await post("bcdfghj", { type: "nonsense" })).status()).toBe(204);
  const { slug, key } = await publish(request);
  expect((await request.patch(`/api/experiences/${slug}`, { headers: ownerHeaders(key), data: { status: "unpublished" } })).status()).toBe(200);
  expect((await post(slug, { type: "view", first: true })).status()).toBe(204);
  expect((await statsOf(request, slug, key)).views).toBe(0);
  // Shares need the manage key.
  expect((await request.post(`/api/experiences/${slug}/shares`, { headers: ownerHeaders("not-the-key-at-all-123"), data: { channel: "copy" } })).status()).toBe(404);
  expect((await request.post(`/api/experiences/${slug}/shares`, { headers: ownerHeaders(key), data: { channel: "fax" } })).status()).toBe(400);
});

test("the manage page shows how it's doing", async ({ browser, request }) => {
  const { slug, key } = await publish(request, "opening", { title: "The Atelier opens" });
  const post = (data: object) => request.post(`/api/experiences/${slug}/events`, { headers: { "x-forwarded-for": freshIp() }, data });
  for (const data of [{ type: "view", first: true }, { type: "view", first: true, via: "qr" }, { type: "view", first: false }, { type: "played" }]) expect((await post(data)).status()).toBe(204);
  expect((await request.post(`/api/experiences/${slug}/rsvps`, { headers: { "x-forwarded-for": freshIp() }, data: { attendance: "Attending" } })).status()).toBe(201);

  const context = await freshContext(browser, { permissions: ["clipboard-read", "clipboard-write"] });
  const page = await context.newPage();
  await page.goto(`/manage/${slug}#k=${key}`);
  const card = page.locator("section").filter({ has: page.locator("#insights-heading") });
  await expect(card.locator("#insights-heading")).toHaveText("How it’s doing");
  await expect(card.locator("dt")).toHaveText(["People who opened it", "Played the opening", "Replied", "From the QR code"]);
  await expect(card.locator("dd")).toHaveText(["2", "1", "1", "1"]);
  await expect(card.locator(".manage-insights span")).toHaveText(["3 visits in all", "50% of them", "50% of them", "visit"]);
  await expect(card.locator(".manage-chart li")).toHaveCount(14);
  await expect(card.locator(".manage-chart li").last()).toContainText("3 visits");
  await expect(card.locator(".manage-shared")).toHaveText("You haven’t shared it from here yet.");

  // Sharing from the page is counted.
  await page.locator(".share-tools").getByRole("button", { name: "Copy link" }).click();
  await page.locator(".share-tools").getByRole("button", { name: "QR code" }).click();
  await expect.poll(async () => (await statsOf(request, slug, key)).shares).toEqual({ copy: 1, qr: 1 });
  await page.getByRole("button", { name: "Refresh" }).click();
  await expect(card.locator(".manage-shared")).toHaveText("You shared it: link copied 1 · QR code shown 1");
  await context.close();
});

test("the admin sees the app's numbers", async ({ request }) => {
  await publish(request, "anniversary");
  expect((await request.post("/api/metrics", { headers: { "x-forwarded-for": freshIp() }, data: { page: "studio" } })).status()).toBe(204);
  expect((await request.post("/api/metrics", { headers: { "x-forwarded-for": freshIp() }, data: { page: "everything" } })).status()).toBe(204);
  const response = await request.get("/api/admin/numbers?days=7", { headers: adminHeaders() });
  expect(response.status()).toBe(200);
  const numbers = await response.json();
  expect(numbers.days).toBe(7);
  expect(numbers.dates).toHaveLength(7);
  expect(numbers.totals.published).toBeGreaterThanOrEqual(1);
  expect(numbers.totals["published:anniversary"]).toBeGreaterThanOrEqual(1);
  expect(numbers.totals.studio).toBeGreaterThanOrEqual(1);
  expect(numbers.totals.everything).toBeUndefined();
  expect(numbers.daily.published.at(-1)).toBeGreaterThanOrEqual(1);
  expect(numbers.now.live).toBeGreaterThanOrEqual(1);
});
