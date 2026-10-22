import { expect, test } from "@playwright/test";
import { collectErrors } from "../helpers";

// Every page loads, renders its key content, and logs no errors (including React hydration warnings).
const PAGES = [
  { path: "/", check: "Invitations," },
  { path: "/templates", check: "Pick a" },
  { path: "/create", check: "Make it" },
  { path: "/e/preview?template=wedding", check: "Aarav & Meera" },
  { path: "/e/preview?template=opening", check: "A new beginning" },
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

test("the home page hero draws itself, and the reel shows all four occasions", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".cin-hero-art.is-drawing")).toBeVisible();
  await expect(page.locator(".cin-occasion-card")).toHaveCount(4);
  await expect(page.locator(".cin-occasion-card h3")).toHaveText(["For your forever.", "Make a wish.", "Feel the rhythm.", "Here’s to new."]);
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
