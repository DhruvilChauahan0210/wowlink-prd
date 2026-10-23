import { expect, test, type APIRequestContext } from "../fixtures";
import { adminHeaders, freshIp, freshUser, ownerHeaders, publish, sampleDraft } from "../helpers";

/*
 * Hosts' accounts: publishing needs one, a host's free plan has one live invitation at a time, and signing in brings
 * a host's invitations to any phone. (The test server signs in whoever x-wowlink-test-user names; see fixtures.ts.)
 */

const LIMIT = "The free plan has one live invitation at a time. Unpublish the other one first, or move it to the Creator studio.";
const as = (user: string) => ({ "x-wowlink-test-user": user, "x-forwarded-for": freshIp() });
const create = (request: APIRequestContext, user: string, title = "Riya turns 7") =>
  request.post("/api/experiences", { headers: as(user), data: { templateId: "birthday", draft: sampleDraft({ title }) } });
const sync = (request: APIRequestContext, user: string, known: { slug: string; key: string }[]) =>
  request.post("/api/account/sync", { headers: as(user), data: { known } });

test("publishing needs an account, and a host's free plan has one live invitation", async ({ request }) => {
  const signedOut = await request.post("/api/experiences", { headers: as(""), data: { templateId: "birthday", draft: sampleDraft() } });
  expect(signedOut.status()).toBe(401);
  expect(await signedOut.json()).toMatchObject({ error: "Sign in to publish.", signIn: true });

  const host = freshUser();
  const first = await create(request, host, "First");
  expect(first.status()).toBe(201);
  const { slug, key } = await first.json();
  const second = await create(request, host, "Second");
  expect(second.status()).toBe(403);
  expect(await second.json()).toMatchObject({ error: LIMIT, limit: true });

  // Unpublishing the first makes room; then the first can't come back while the second is live.
  const status = (to: string) => request.patch(`/api/experiences/${slug}`, { headers: ownerHeaders(key), data: { status: to } });
  expect((await status("unpublished")).status()).toBe(200);
  expect((await create(request, host, "Second")).status()).toBe(201);
  const back = await status("published");
  expect(back.status()).toBe(403);
  expect((await back.json()).error).toBe(LIMIT);
  // In the Creator studio it doesn't count against the free plan.
  await request.post(`/api/admin/invitations/${slug}`, { headers: adminHeaders(), data: { action: "make-pro" } });
  expect((await status("published")).status()).toBe(200);
  // Someone else's free plan is their own.
  expect((await create(request, freshUser())).status()).toBe(201);
});

test("on another phone, signing in brings the host's invitations; one from before joins the account", async ({ request }) => {
  const host = freshUser();
  const made = await (await create(request, host)).json();
  // Published by WowLink for a client (no account yet): the client has its manage link.
  const older = await publish(request, "wedding", { title: "Isha & Kabir" });

  // A new phone knows nothing yet: it gets a key of its own for the host's invitation, and the first one still works.
  const { keys } = await (await sync(request, host, [])).json();
  expect(keys.map((k: { slug: string }) => k.slug)).toEqual([made.slug]);
  expect((await (await request.get(`/api/experiences/${made.slug}`, { headers: ownerHeaders(keys[0].key) })).json()).experience.title).toBe("Riya turns 7");
  expect((await request.get(`/api/experiences/${made.slug}`, { headers: ownerHeaders(made.key) })).status()).toBe(200);

  // The phone with the older invitation's link adds it to the account; any other phone then gets it too.
  await sync(request, host, [{ slug: older.slug, key: older.key }]);
  const again = await (await sync(request, host, [])).json();
  expect(again.keys.map((k: { slug: string }) => k.slug).sort()).toEqual([made.slug, older.slug].sort());

  // Someone else gets nothing, not even with a guessed key, and signed out there's no account to sync.
  expect((await (await sync(request, freshUser(), [{ slug: made.slug, key: "not-the-key-at-all-not-the-key" }])).json()).keys).toEqual([]);
  expect((await sync(request, "", [])).status()).toBe(401);
});

test("My invitations: who's signed in, and the account's invitations on a phone that had none", async ({ page, request, user }) => {
  // Published with the same account, from somewhere else.
  const made = await (await create(request, user, "Aarav's mundan")).json();
  await page.goto("/mine");
  await expect(page.locator(".mine-account")).toContainText(`Signed in as ${user}@test.wowlink.local`);
  await expect(page.getByRole("link", { name: "Aarav's mundan" })).toBeVisible();
  await expect(page.getByText("Added 1 invitation from your account to this phone.")).toBeVisible();
  // Its manage page opens without the manage link.
  await page.goto(`/manage/${made.slug}`);
  await expect(page.locator(".manage-hero h1")).toHaveText("Aarav's mundan");
});

test("a sign-in link that comes back to the home page goes on to finish signing in", async ({ request }) => {
  const landed = await request.get("/?code=abc123", { maxRedirects: 0 });
  expect(landed.status()).toBe(303);
  expect(landed.headers().location).toMatch(/\/auth\/callback\?code=abc123&next=%2Fmine$/);
  // The home page itself is untouched.
  expect((await request.get("/", { maxRedirects: 0 })).status()).toBe(200);
});

test.describe("signed out", () => {
  test.use({ signedIn: false });

  test("the studio asks to sign in at Publish", async ({ page }) => {
    await page.goto("/create?template=birthday");
    await page.getByRole("button", { name: "Publish", exact: true }).click();
    await expect(page.locator("dialog[open]").getByRole("heading", { name: "Sign in to publish" })).toBeVisible();
    await expect(page.locator(".studio-save-status")).toHaveText("Sign in to publish");
  });

  test("My invitations offers to sign in, and a manage page without its link says how to get in", async ({ page }) => {
    await page.goto("/mine");
    await expect(page.locator(".mine-account")).toContainText("Sign in to see your invitations on every phone");
    await page.goto("/manage/bcdfghj");
    await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/signin?next=%2Fmanage%2Fbcdfghj");
  });
});
