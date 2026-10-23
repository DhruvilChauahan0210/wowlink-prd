import { expect, test } from "@playwright/test";
import { customPalette } from "../../app/lib/palette";
import { freshIp, openInStudio, ownerHeaders, publish } from "../helpers";

/*
 * Hosts can tint an invitation with a palette or a colour of their own. The drawings keep their watercolours; the
 * handwriting, underlines and doodles take the host's colours, made readable whatever was picked.
 */

const rgb = (hex: string) => `rgb(${[1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(", ")})`;

test("a palette chosen in the studio shows in the preview and on the published invitation", async ({ browser }) => {
  const context = await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": freshIp() } });
  // Own colours are the Creator studio's.
  const { slug, key } = await publish(context.request, "birthday", { title: "Riya turns 7" });
  const page = await context.newPage();
  await openInStudio(page, slug, key);
  const preview = page.locator(".inv-scene").first();
  await expect(page.getByRole("radio", { name: "The occasion’s own" })).toBeChecked();
  await expect(preview).not.toHaveClass(/has-palette/);
  await expect(preview.locator(".inv-intro .inv-overline")).toHaveCSS("color", rgb("#c9506d"));

  await page.getByRole("radio", { name: "Peacock" }).check();
  await expect(page.locator(".studio-palette-name")).toHaveText("Peacock");
  await expect(preview).toHaveClass(/has-palette/);
  await expect(preview.locator(".inv-intro .inv-overline")).toHaveCSS("color", rgb("#237a83"));
  await page.getByRole("button", { name: "Update", exact: true }).click();
  await expect(page.locator(".publish-dialog[open]")).toBeVisible();

  const guest = await context.newPage();
  await guest.goto(`/e/${slug}`);
  await expect(guest.locator(".invitation-page")).toHaveClass(/has-palette/);
  await expect(guest.locator(".inv-intro .inv-overline")).toHaveCSS("color", rgb("#237a83"));
  // Words on the dark message section take the palette's light shade.
  await expect(guest.locator(".inv-message-section .inv-message-sign")).toHaveCSS("color", rgb("#8fd3d8"));
  // Paper sections take the deep one.
  await expect(guest.locator(".inv-details-section .inv-detail-label").first()).toHaveCSS("color", rgb("#1b5f6a"));
  await context.close();
});

test("a colour of the host's own, and back to the occasion's own", async ({ page, request }) => {
  const { slug, key } = await publish(request, "wedding");
  await openInStudio(page, slug, key);
  await page.getByLabel("Your own colour").fill("#ffff00");
  await expect(page.locator(".studio-own-colour")).toHaveClass(/is-selected/);
  await expect(page.getByRole("radiogroup", { name: "Colours" }).getByRole("radio", { checked: true })).toHaveCount(0);
  const preview = page.locator(".inv-scene").first();
  // Bright yellow can't be read on paper, so it's deepened until it can.
  await expect(preview.locator(".inv-intro .inv-overline")).toHaveCSS("color", rgb(customPalette("#ffff00").tone));

  await page.getByRole("radio", { name: "The occasion’s own" }).check();
  await expect(preview).not.toHaveClass(/has-palette/);
  await expect(preview.locator(".inv-intro .inv-overline")).toHaveCSS("color", rgb("#c2412d"));
});

test("a free invitation keeps the occasion's colours", async ({ page }) => {
  await page.goto("/create?template=birthday");
  await expect(page.locator(".studio-fieldset").filter({ has: page.locator("legend", { hasText: "Colours" }) })).toContainText("Your own colours are part of the Creator studio.");
  await expect(page.getByRole("radiogroup", { name: "Colours" })).toHaveCount(0);
});

test("the link preview image uses the host's colour", async ({ request }) => {
  const { slug, key } = await publish(request, "garba", { title: "Navratri at the Shahs", palette: "#3A3F8F" });
  const owned = await request.get(`/api/experiences/${slug}`, { headers: ownerHeaders(key) });
  expect((await owned.json()).experience.palette).toBe("#3a3f8f");
  const image = await request.get(`/e/${slug}/opengraph-image`);
  expect(image.status()).toBe(200);
  expect(image.headers()["content-type"]).toBe("image/png");
});
