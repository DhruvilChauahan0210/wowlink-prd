import { expect, test, type Browser } from "../fixtures";
import { addGuest, freshIp, publish } from "../helpers";

/*
 * "My invitations": everything this device can manage, a backup of the manage links, and adding invitations from
 * a link or a backup on another device.
 */

const freshContext = (browser: Browser) => browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": freshIp() } });

test("lists this device's invitations, with replies, and backs up their manage links for another device", async ({ browser }) => {
  const phone = await freshContext(browser);
  const { request } = phone;
  const wedding = await publish(request, "wedding", { title: "Isha & Kabir", date: "2026-11-08" });
  const birthday = await publish(request, "birthday", { title: "Riya turns 30", date: "2026-10-30" });
  await addGuest(request, wedding.slug, wedding.key, "the Patel family");
  await request.post(`/api/experiences/${wedding.slug}/rsvps`, { headers: { "x-forwarded-for": freshIp() }, data: { attendance: "Attending", guestCount: 3 } });

  const page = await phone.newPage();
  await page.goto("/mine");
  await expect(page.locator(".mine-empty")).toBeVisible();
  // Publishing (or opening a manage link) saves the key on this device.
  await page.evaluate(([w, b]) => {
    localStorage.setItem(`wowlink:owner:${w.slug}`, w.key);
    localStorage.setItem(`wowlink:owner:${b.slug}`, b.key);
  }, [wedding, birthday]);
  await page.reload();
  const items = page.locator(".mine-item");
  // Soonest first.
  await expect(items.locator("h2")).toHaveText(["Riya turns 30", "Isha & Kabir"]);
  await expect(items.nth(1).locator(".mine-counts")).toHaveText("1 reply · 3 coming · 1 yet to reply");
  await expect(items.nth(0).locator(".mine-counts")).toHaveText("No replies yet");
  await expect(items.nth(1).getByRole("link", { name: "Replies & guests" })).toHaveAttribute("href", `/manage/${wedding.slug}`);
  await expect(items.nth(1).getByRole("link", { name: "Edit" })).toHaveAttribute("href", `/create?edit=${wedding.slug}`);

  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Save my manage links" }).click()]);
  expect(download.suggestedFilename()).toBe("wowlink-manage-links.txt");
  let backup = "";
  for await (const chunk of await download.createReadStream()) backup += chunk;
  expect(backup).toContain(`/manage/${wedding.slug}#k=${wedding.key}`);
  expect(backup).toContain(`/manage/${birthday.slug}#k=${birthday.key}`);
  expect(backup).toContain("Keep this file private");

  // On another device: paste the backup in, and both are there.
  const laptop = await freshContext(browser);
  const other = await laptop.newPage();
  await other.goto("/mine");
  await other.getByLabel("Add from a manage link or a backup").fill(backup);
  await other.getByRole("button", { name: "Add", exact: true }).click();
  await expect(other.locator(".share-status")).toHaveText("Added 2 invitations.");
  await expect(other.locator(".mine-item h2")).toHaveText(["Riya turns 30", "Isha & Kabir"]);
  // Adding the same again changes nothing.
  await other.getByLabel("Add from a manage link or a backup").fill(`${backup}\nand some other text`);
  await other.getByRole("button", { name: "Add", exact: true }).click();
  await expect(other.locator(".share-status")).toHaveText("Those are already here.");
  await Promise.all([phone.close(), laptop.close()]);
});

test("a saved link that no longer works can be forgotten; drafts are listed too", async ({ browser }) => {
  const context = await freshContext(browser);
  const page = await context.newPage();
  await page.goto("/mine");
  await page.evaluate(() => {
    localStorage.setItem("wowlink:owner:bcdfghj", "this-key-does-not-open-anything");
    localStorage.setItem("wowlink:draft:garba", JSON.stringify({ title: "Raas at the Shahs", date: "2026-10-12", time: "", venue: "", message: "" }));
  });
  await page.reload();
  await expect(page.locator(".mine-gone-title")).toHaveText("An invitation that’s no longer here");
  await page.getByRole("button", { name: "Forget it on this device" }).click();
  await expect(page.locator(".mine-item")).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("wowlink:owner:bcdfghj"))).toBeNull();

  const drafts = page.locator("section", { has: page.locator("#drafts-heading") });
  await expect(drafts.locator("strong")).toHaveText("Raas at the Shahs");
  await expect(drafts.getByRole("link", { name: "Keep editing" })).toHaveAttribute("href", "/create?template=garba");
  await drafts.getByRole("button", { name: "Discard the garba & navratri draft" }).click();
  await expect(page.locator("#drafts-heading")).toHaveCount(0);

  await page.getByLabel("Add from a manage link or a backup").fill("not a link at all");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.locator(".share-status")).toContainText("There’s no manage link in that");
  await context.close();
});

test("the home page and the manage page link to it", async ({ page, request }) => {
  await page.goto("/");
  if (test.info().project.name === "desktop") await expect(page.getByRole("link", { name: "My invitations" }).first()).toHaveAttribute("href", "/mine");
  const { slug, key } = await publish(request);
  await page.goto(`/manage/${slug}#k=${key}`);
  await expect(page.locator(".studio-header").getByRole("link", { name: "My invitations" })).toHaveAttribute("href", "/mine");
});
