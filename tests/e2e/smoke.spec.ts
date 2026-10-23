import { expect, test } from "@playwright/test";
import { collectErrors } from "../helpers";

// Every page loads, renders its key content, and logs no errors (including React hydration warnings).
const PAGES = [
  { path: "/", check: "Invitations," },
  { path: "/templates", check: "Pick a" },
  { path: "/create", check: "Make it" },
  { path: "/e/preview?template=wedding", check: "Aarav & Meera" },
  { path: "/e/preview?template=opening", check: "A new beginning" },
  { path: "/templates/wedding", check: "A wedding invitation" },
  { path: "/templates/babyshower", check: "A seemant invitation" },
  { path: "/privacy", check: "What we keep" },
  { path: "/privacy?lang=gu", check: "અમે શું સાચવીએ છીએ" },
];

for (const { path, check } of PAGES) {
  test(`${path} loads cleanly`, async ({ page }) => {
    const errors = collectErrors(page);
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1").first()).toContainText(check.trim());
    await page.waitForLoadState("networkidle");
    expect(errors).toEqual([]);
  });
}

test("the home page hero draws itself, and the reel shows all twelve occasions", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".cin-hero-art.is-drawing")).toBeVisible();
  await expect(page.locator(".cin-occasion-card")).toHaveCount(12);
  await expect(page.locator(".cin-occasion-card h3")).toHaveText(["For your forever.", "Say yes, together.", "Make a wish.", "Feel the rhythm.", "Little blessings.", "Step inside.", "Still us.", "Here’s to new.", "Light it up.", "A sacred thread.", "With faith.", "Hello, little one."]);
});

test("an unknown invitation link shows the not-found page", async ({ page }) => {
  const response = await page.goto("/e/doesnotexist");
  expect(response?.status()).toBe(404);
  await expect(page.locator("h1")).toContainText("slipped away");
});

test("the app icon is served", async ({ request }) => {
  const response = await request.get("/icon.svg");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("image/svg+xml");
});

test("each occasion's drawing is served as an image, for the places it doesn't animate", async ({ request, page }) => {
  for (const name of ["wedding", "engagement", "anniversary"]) {
    const response = await request.get(`/art/${name}.svg`);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/svg+xml");
    const svg = await response.text();
    // self-contained: its own filters, and no text that needs the page's fonts
    expect(svg).toContain('id="wobble"');
    expect(svg).not.toContain("<text");
  }
  expect((await request.get("/art/funeral.svg")).status()).toBe(404);
  await page.goto("/templates");
  await expect(page.locator(".cin-catalog-grid img.art-image")).toHaveCount(12);
});
