import { expect, test } from "@playwright/test";
import { publish } from "../helpers";

/*
 * Search: each occasion has its own page to be found by, listed in the sitemap with the home page, the occasions and
 * the privacy page. People's invitations, the studio and the manage pages stay out of search.
 */

const OCCASIONS = ["wedding", "engagement", "birthday", "garba", "babyshower", "housewarming", "anniversary", "opening"];

test("the sitemap lists the public pages and nothing private", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  const xml = await response.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => new URL(m[1]).pathname + new URL(m[1]).search);
  expect(urls).toEqual(["/", "/templates", ...OCCASIONS.map(id => `/templates/${id}`), "/privacy", "/privacy?lang=gu"]);
  expect(xml).toContain('hreflang="gu"');
});

test("robots.txt keeps crawlers out of the private pages, and points to the sitemap", async ({ request }) => {
  const text = await (await request.get("/robots.txt")).text();
  for (const path of ["/api/", "/manage/", "/mine", "/admin"]) expect(text).toContain(`Disallow: ${path}`);
  // Invitations carry noindex instead, which crawlers (and link-preview bots) can only read if they may fetch them.
  expect(text).not.toContain("Disallow: /e/");
  expect(text).toMatch(/Sitemap: http:\/\/localhost:3100\/sitemap\.xml/);
});

test("an occasion's page: found by its words, with a sample that opens, and a way to start", async ({ page, request }) => {
  const response = await page.goto("/templates/garba");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("Garba and Navratri invitation maker online — WowLink");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /Garba or Navratri invitation/);
  await expect(page.locator("link[rel=canonical]")).toHaveAttribute("href", "http://localhost:3100/templates/garba");
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  await expect(page.locator("h1")).toHaveText("A Garba invitation that lights a diya");

  // The sample opens right here.
  const scene = page.locator(".occasion-demo .inv-scene");
  await scene.getByRole("button", { name: "Let the night begin" }).click();
  await expect(scene).toHaveClass(/is-open/);
  await expect(scene.getByRole("button", { name: "Watch it again" })).toBeVisible();

  await expect(page.getByRole("link", { name: "Make yours, free" })).toHaveAttribute("href", "/create?template=garba");
  await expect(page.locator(".occasion-others a")).toHaveCount(7);
  await expect(page.locator(".occasion-faq dt")).toHaveCount(5);

  // Its share card.
  const image = await page.locator('meta[property="og:image"]').getAttribute("content");
  const card = await request.get(image!);
  expect(card.status()).toBe(200);
  expect(card.headers()["content-type"]).toBe("image/png");
});

test("every occasion has a page, and unknown ones don't", async ({ request }) => {
  for (const id of OCCASIONS) expect((await request.get(`/templates/${id}`)).status()).toBe(200);
  expect((await request.get("/templates/funeral")).status()).toBe(404);
});

test("the catalogue leads to each occasion's page", async ({ page }) => {
  await page.goto("/templates");
  await expect(page.locator(".cin-catalog-grid .cin-occasion-image")).toHaveCount(8);
  await page.getByRole("link", { name: "Housewarming & vastu puja: see how it opens" }).click();
  await expect(page).toHaveURL(/\/templates\/housewarming$/);
  await expect(page.locator("h1")).toHaveText("A housewarming invitation with a door to open");
});

test("invitations, the studio and the manage pages ask not to be listed", async ({ page, request }) => {
  const { slug } = await publish(request);
  for (const path of [`/e/${slug}`, "/create", `/manage/${slug}`, "/mine", "/e/preview?template=wedding"]) {
    await page.goto(path);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  }
  for (const path of ["/", "/templates", "/templates/wedding", "/privacy"]) {
    await page.goto(path);
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  }
});
