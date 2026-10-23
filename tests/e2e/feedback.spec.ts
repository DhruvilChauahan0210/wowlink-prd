import { expect, test, type APIRequestContext } from "../fixtures";
import { adminHeaders, collectErrors, freshIp, publish, TEST_ADMIN_KEY } from "../helpers";

/*
 * Feedback: a button on WowLink's own pages (never on a guest's invitation), a short note in the page's language, read
 * and marked done on the admin page. Only what was written, the page's path and a way to reply are kept.
 */

type Note = { id: string; mood: string | null; message: string; page: string; contact: string | null; doneAt: string | null };
const notes = async (request: APIRequestContext) => ((await (await request.get("/api/admin/feedback", { headers: adminHeaders() })).json()).feedback ?? []) as Note[];
const send = (request: APIRequestContext, data: object, ip = freshIp()) => request.post("/api/feedback", { headers: { "x-forwarded-for": ip }, data });

test("a host sends feedback from the Feedback button; the admin reads it and marks it done", async ({ page, request, user }) => {
  const errors = collectErrors(page);
  await page.goto("/templates");
  await page.getByRole("button", { name: "Feedback" }).click();
  await expect(page.getByRole("dialog", { name: "Tell us what you think" })).toBeVisible();
  const dialog = page.locator("dialog.feedback-dialog");
  // Signed in: their account's email is filled in, theirs to change.
  const contact = dialog.getByLabel("Email or phone, if you’d like a reply");
  await expect(contact).toHaveValue(`${user}@test.wowlink.local`);
  await expect(dialog.getByText("From your account. Clear it if you’d rather not hear back.")).toBeVisible();
  // Cleared, it stays cleared, even after closing and opening again.
  await contact.fill("");
  await dialog.getByRole("button", { name: "Close" }).click();
  await page.getByRole("button", { name: "Feedback" }).click();
  await page.waitForTimeout(300);
  await expect(contact).toHaveValue("");
  await contact.fill(`${user}@test.wowlink.local`);
  // Nothing written yet: asked for a few words.
  await dialog.getByRole("button", { name: "Send" }).click();
  await expect(dialog.getByRole("alert")).toHaveText("Write a few words first.");
  await dialog.getByText("It’s confusing").click();
  const message = `The occasion list is long ${Date.now()}`;
  await dialog.getByLabel("Your note").fill(message);
  await dialog.getByRole("button", { name: "Send" }).click();
  await expect(dialog.getByRole("heading", { name: "Thank you!" })).toBeFocused();
  await dialog.getByRole("button", { name: "Close" }).click();
  await expect(dialog).toBeHidden();

  const note = (await notes(request)).find((n) => n.message === message);
  expect(note).toMatchObject({ mood: "confused", page: "/templates", contact: `${user}@test.wowlink.local`, doneAt: null });

  // The admin page shows it, and marks it done.
  await page.goto("/admin");
  await page.getByText("Use the admin key").click();
  await page.locator("#admin-key").fill(TEST_ADMIN_KEY);
  await page.getByRole("button", { name: "Open" }).click();
  const item = page.locator(".admin-feedback li").filter({ hasText: message });
  await expect(item).toContainText("😕");
  await expect(item).toContainText("/templates");
  await item.getByRole("button", { name: "Mark done" }).click();
  await expect(item).toHaveClass(/is-done/);
  await expect(item.getByRole("button", { name: "Open again" })).toBeVisible();
  expect((await notes(request)).find((n) => n.message === message)?.doneAt).toBeTruthy();
  // The numbers start with the funnels.
  await expect(page.getByRole("region", { name: "Hosts funnel" })).toContainText("Visited WowLink");
  await expect(page.getByRole("region", { name: "Guests funnel" })).toContainText("Replies");
  expect(errors).toEqual([]);
});

test("the button speaks the page's language, and isn't on guests' invitations or the admin", async ({ page, request }) => {
  await page.goto("/pricing?lang=hi");
  await page.getByRole("button", { name: "फ़ीडबैक" }).click();
  await expect(page.getByRole("dialog", { name: "अपनी राय बताइए" })).toBeVisible();
  await page.keyboard.press("Escape");

  const { slug } = await publish(request);
  await page.goto(`/e/${slug}`);
  await expect(page.getByRole("button", { name: "Open the invitation" })).toBeVisible();
  await expect(page.locator(".feedback-button")).toHaveCount(0);
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "WowLink admin" })).toBeVisible();
  await expect(page.locator(".feedback-button")).toHaveCount(0);
});

test("feedback needs a few words, keeps only the page's path, ignores bots, and one address can't flood it", async ({ request }) => {
  expect((await send(request, { message: " " })).status()).toBe(400);
  expect((await send(request, { message: "x".repeat(1001) })).status()).toBe(400);
  const bot = `Buy followers ${Date.now()}`;
  expect((await send(request, { message: bot, website: "spam.example" })).status()).toBe(201);
  const kept = `Lovely, but slow on my phone ${Date.now()}`;
  expect((await send(request, { message: kept, mood: "grumpy", page: "/manage/abcdefg?k=secret#k=secret", contact: "  98765 43210  " })).status()).toBe(201);
  const list = await notes(request);
  expect(list.find((n) => n.message === bot)).toBeUndefined();
  expect(list.find((n) => n.message === kept)).toMatchObject({ mood: null, page: "/manage/abcdefg", contact: "98765 43210" });

  const ip = freshIp();
  for (let i = 0; i < 5; i++) expect((await send(request, { message: `Note ${i} ${Date.now()}` }, ip)).status()).toBe(201);
  expect((await send(request, { message: "One too many" }, ip)).status()).toBe(429);

  // Only the admin reads it.
  expect((await request.get("/api/admin/feedback", { headers: { "x-forwarded-for": freshIp() } })).status()).toBe(404);
  expect((await request.post(`/api/admin/feedback/${list[0].id}`, { headers: { "x-forwarded-for": freshIp() }, data: { action: "done" } })).status()).toBe(404);
  expect((await request.post("/api/admin/feedback/not-a-note", { headers: adminHeaders(), data: { action: "done" } })).status()).toBe(404);
  expect((await request.post(`/api/admin/feedback/${list[0].id}`, { headers: adminHeaders(), data: { action: "shred" } })).status()).toBe(400);
});
