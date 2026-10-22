import { expect, test, type Browser } from "@playwright/test";
import { collectErrors, freshIp } from "../helpers";

/*
 * The whole publishing journey, in order: the creator publishes from the studio, a guest RSVPs from their
 * own browser, the owner opens the manage link on another device, edits, unpublishes and republishes.
 */
test.describe.configure({ mode: "serial" });

let publicUrl = "";
let manageUrl = "";
let slug = "";

const freshContext = (browser: Browser) => browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": freshIp() } });

test("the studio won't publish without the required details", async ({ page }) => {
  await page.goto("/create?template=wedding");
  await page.locator("#title").fill("");
  await page.locator("#venue").fill("");
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page.locator("#title-error")).toHaveText("Add the names or a title for the occasion.");
  await expect(page.locator("#venue-error")).toHaveText("Add where it’s happening.");
  await expect(page.locator("#title")).toBeFocused();
  await expect(page.locator("#title")).toHaveAttribute("aria-invalid", "true");
  // Typing clears that field's error.
  await page.locator("#title").fill("A");
  await expect(page.locator("#title-error")).toHaveCount(0);
});

test("publishing gives a public link and a private manage link", async ({ browser }) => {
  const context = await freshContext(browser);
  const page = await context.newPage();
  const errors = collectErrors(page);
  await page.goto("/create?template=wedding");
  await page.locator("#title").fill("Isha & Kabir");
  await page.locator("#venue").fill("The Garden House, Surat");
  await page.getByRole("button", { name: "Publish", exact: true }).click();

  const dialog = page.locator(".publish-dialog[open]");
  await expect(dialog).toBeVisible();
  publicUrl = await dialog.locator(".share-tools input").inputValue();
  manageUrl = await dialog.locator(".publish-private input").inputValue();
  slug = publicUrl.split("/e/")[1];
  expect(publicUrl).toMatch(/\/e\/[2-9b-zB-Z]{7}$/);
  expect(manageUrl).toBe(`${new URL(publicUrl).origin}/manage/${slug}#k=${manageUrl.split("#k=")[1]}`);
  expect(manageUrl.split("#k=")[1].length).toBeGreaterThan(20);
  await expect(page).toHaveURL(new RegExp(`/create\\?edit=${slug}$`));
  await expect(dialog.getByRole("link", { name: "WhatsApp" })).toHaveAttribute("href", new RegExp(`^https://wa\\.me/\\?text=.*${slug}`));
  await dialog.getByRole("button", { name: "QR code" }).click();
  await expect(dialog.locator(".share-qr-code svg")).toBeVisible();

  await dialog.getByRole("button", { name: "Keep editing" }).click();
  await expect(page.getByRole("button", { name: "Update", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
  await context.close();
});

test("a guest opens the link and RSVPs without an account", async ({ browser }) => {
  const context = await freshContext(browser);
  const page = await context.newPage();
  await page.goto(publicUrl);
  await expect(page).toHaveTitle("Isha & Kabir — you’re invited");
  await page.getByRole("button", { name: "Open the invitation" }).click();
  await expect(page.locator(".inv-card")).toHaveCSS("opacity", "1");
  await page.locator("#guest-name").fill("Nani & Nana");
  await page.locator("#guest-count").fill("2");
  await page.getByRole("button", { name: "Send my reply" }).click();
  await expect(page.locator(".inv-rsvp-confirmation")).toContainText("Your reply is on its way to Isha & Kabir");
  await context.close();
});

test("the manage link works on another device, and only with the right key", async ({ browser }) => {
  const context = await freshContext(browser);
  const page = await context.newPage();

  await page.goto(`/manage/${slug}`);
  await expect(page.locator(".manage-notice h1")).toHaveText("This page needs your private link");

  await page.goto(`/manage/${slug}#k=not-the-key`);
  await expect(page.locator(".manage-notice h1")).toHaveText("That link doesn’t open this invitation");

  await page.goto(manageUrl);
  await expect(page.locator(".manage-hero h1")).toHaveText("Isha & Kabir");
  // The key is remembered on this device and taken out of the address bar.
  await expect(page).toHaveURL(new RegExp(`/manage/${slug}$`));
  await expect(page.locator(".manage-table tbody tr")).toHaveCount(1);
  await expect(page.locator(".manage-table tbody tr td").first()).toHaveText("Nani & Nana");
  await expect(page.locator(".manage-totals > div").first()).toContainText("1");
  await expect(page.locator(".manage-totals > div").first()).toContainText("2 guests in all");

  // Editing from this device goes live on the same link.
  await page.getByRole("link", { name: "Edit in studio" }).click();
  await expect(page.locator("#title")).toHaveValue("Isha & Kabir");
  await page.locator("#venue").fill("Lakeview Lawns, Udaipur");
  await page.getByRole("button", { name: "Update", exact: true }).click();
  await expect(page.locator(".publish-dialog[open]")).toBeVisible();
  const guest = await context.newPage();
  await guest.goto(publicUrl);
  await expect(guest.locator(".inv-details-grid")).toContainText("Lakeview Lawns, Udaipur");

  // Unpublishing hides it from guests; publishing again brings it back, replies kept.
  await page.goto(`/manage/${slug}`);
  await page.getByRole("button", { name: "Unpublish" }).click();
  await expect(page.getByRole("button", { name: "Publish again" })).toBeVisible();
  expect((await guest.goto(publicUrl))?.status()).toBe(404);
  await page.getByRole("button", { name: "Publish again" }).click();
  await expect(page.getByRole("button", { name: "Unpublish" })).toBeVisible();
  expect((await guest.goto(publicUrl))?.status()).toBe(200);
  await expect(page.locator(".manage-table tbody tr")).toHaveCount(1);
  await context.close();
});
