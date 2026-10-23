import { expect, test, type APIRequestContext } from "../fixtures";
import { addGuest, adminHeaders, freshIp, openInStudio, ownerHeaders, publish, sampleDraft } from "../helpers";

/*
 * The Creator studio's own tools: asking for it (until payments exist), custom links, a planner's brand and client
 * previews, wishes on the invitation and reminding everyone at once.
 */

const general = () => ({ "x-forwarded-for": freshIp() });
// A 1×1 PNG, for logos.
const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
const owned = async (request: APIRequestContext, slug: string, key: string) => (await request.get(`/api/experiences/${slug}`, { headers: ownerHeaders(key) })).json();

test("a free host asks for the Creator studio, and the admin approves it", async ({ page, request }) => {
  const { slug, key } = await publish(request, "wedding", { title: "Asha & Dev" }, "free");
  await page.goto(`/manage/${slug}#k=${key}`);
  const card = page.locator("#creator-studio");
  await card.getByRole("button", { name: "Ask for the Creator studio" }).click();
  await card.getByLabel(/Anything we should know/).fill("A big wedding with five functions");
  await card.getByLabel(/How can we reach you/).fill("98250 12345");
  await card.getByRole("button", { name: "Send request" }).click();
  await expect(card.getByRole("status")).toContainText("We’ll look at it soon");
  expect((await owned(request, slug, key)).upgrade.status).toBe("open");

  const { requests } = await (await request.get("/api/admin/upgrades", { headers: adminHeaders() })).json();
  const mine = requests.find((r: { invitation: { slug: string } }) => r.invitation.slug === slug);
  expect(mine).toMatchObject({ note: "A big wedding with five functions", contact: "98250 12345", status: "open" });
  expect((await request.post(`/api/admin/upgrades/${mine.id}`, { headers: adminHeaders(), data: { action: "approve" } })).status()).toBe(200);
  expect((await owned(request, slug, key)).experience.plan).toBe("pro");
  // Already there: nothing more to ask.
  expect((await request.post(`/api/experiences/${slug}/upgrade`, { headers: ownerHeaders(key), data: {} })).status()).toBe(409);
  await page.reload();
  await expect(page.locator(".manage-plan")).toHaveText("Creator studio");
  await expect(page.locator("#creator-studio")).toHaveCount(0);
});

test("custom links: tidy, unique, never rude, and earlier ones keep working", async ({ request }) => {
  const { slug, key } = await publish(request, "wedding", { title: "Isha & Kabir" });
  const patel = await addGuest(request, slug, key, "the Patel family");
  const setLink = (alias: string, s = slug, k = key) => request.post(`/api/experiences/${s}/alias`, { headers: ownerHeaders(k), data: { alias } });
  const name = `isha-kabir-${Date.now().toString(36)}`;
  const saved = await setLink(`  ${name.toUpperCase().replace(/-/g, " ")} `);
  expect(saved.status()).toBe(200);
  expect((await saved.json()).aliases).toEqual([name]);
  expect(await (await request.get(`/e/${name}`)).text()).toContain("Isha &amp; Kabir");
  expect((await request.get(`/e/${name}/${patel.id}`)).status()).toBe(200);
  // Replies through the custom link land on the same invitation.
  expect((await request.post(`/api/experiences/${name}/rsvps`, { headers: general(), data: { attendance: "Attending" } })).status()).toBe(201);
  expect((await owned(request, slug, key)).rsvps).toHaveLength(1);

  for (const [bad, error] of [["ab", "Make it 4 to 40 characters."], ["admin", "That one is WowLink’s own. Try another."], ["p0rn-party", "That link isn’t allowed. Try another."], ["2026-11", "Add a word or two, not just numbers."], ["isha_kabir!", "Use lowercase letters, numbers and hyphens, like “isha-kabir”."]]) {
    const response = await setLink(bad);
    expect(response.status(), bad).toBe(422);
    expect((await response.json()).error).toBe(error);
  }
  // Someone else can't take it, or a free invitation have one.
  const other = await publish(request, "birthday");
  expect((await setLink(name, other.slug, other.key)).status()).toBe(409);
  const free = await publish(request, "birthday", {}, "free");
  expect((await setLink(`riya-${Date.now().toString(36)}`, free.slug, free.key)).status()).toBe(403);

  // A new link; the first still works.
  const second = `${name}-wedding`;
  expect((await (await setLink(second)).json()).aliases).toEqual([second, name]);
  expect((await request.get(`/e/${name}`)).status()).toBe(200);
  // The admin finds it by any of its links.
  expect((await (await request.get(`/api/admin/invitations/${name}`, { headers: adminHeaders() })).json()).invitation.slug).toBe(slug);
  // Only the latest three keep working; the one that drops off is retired, never given to someone else.
  await setLink(`${name}-party`);
  expect((await (await setLink(`${name}-sangeet`)).json()).aliases).toEqual([`${name}-sangeet`, `${name}-party`, second]);
  expect((await request.get(`/e/${name}`)).status()).toBe(404);
  expect((await setLink(name, other.slug, other.key)).status()).toBe(409);
  // Deleted, the links are retired: nobody can take them.
  expect((await request.delete(`/api/experiences/${slug}`, { headers: ownerHeaders(key) })).status()).toBe(200);
  expect((await request.get(`/e/${second}`)).status()).toBe(404);
  expect((await setLink(second, other.slug, other.key)).status()).toBe(409);
});

test("a planner's brand: checked, shown on the invitation, saved as a kit in the studio", async ({ page, request }) => {
  const { slug, key } = await publish(request, "garba");
  const patch = (brand: object) => request.patch(`/api/experiences/${slug}`, { headers: ownerHeaders(key), data: { draft: sampleDraft({ brand } as object) } });
  const svg = await patch({ name: "Shubh Events", signoff: "", logo: "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=" });
  expect(svg.status()).toBe(422);
  expect((await svg.json()).fields.brand).toBe("The logo must be a PNG, JPEG or WebP image.");
  expect((await patch({ name: "Shubh Events", signoff: "Planned with love by Shubh Events", logo: PNG })).status()).toBe(200);
  const html = await (await request.get(`/e/${slug}`)).text();
  expect(html).toContain("Planned with love by Shubh Events");
  expect(html).toContain('alt="Shubh Events"');
  // Not on the free plan.
  const free = await request.post("/api/experiences", { headers: general(), data: { templateId: "garba", draft: sampleDraft({ brand: { name: "Shubh Events", signoff: "", logo: "" } } as object) } });
  expect((await free.json()).pro).toEqual(["brand"]);

  // In the studio: save it as a kit, take it off, and put it back with one click.
  await openInStudio(page, slug, key);
  await page.getByRole("button", { name: "Save as my brand kit" }).click();
  await expect(page.getByText("Saved on this device.")).toBeVisible();
  await page.getByRole("button", { name: "Take the brand off" }).click();
  await page.getByRole("button", { name: "Use my brand kit" }).click();
  await expect(page.locator("#brand-name")).toHaveValue("Shubh Events");
});

test("a client preview: the planner shares it, the client asks for a change, the planner sees it", async ({ page, request, browser }) => {
  const { slug, key } = await publish(request, "wedding", { title: "Isha & Kabir" });
  const made = await request.post(`/api/experiences/${slug}/previews`, { headers: ownerHeaders(key), data: { templateId: "wedding", draft: sampleDraft({ title: "Isha & Kabir (new date)" }) } });
  expect(made.status()).toBe(201);
  const { token } = await made.json();
  // The published invitation hasn't changed.
  expect(await (await request.get(`/e/${slug}`)).text()).not.toContain("new date");

  const client = await (await browser.newContext({ extraHTTPHeaders: general() })).newPage();
  await client.goto(`/p/${token}`);
  await expect(client.locator(".client-preview-bar")).toContainText("A preview, not published yet.");
  await expect(client.locator(".inv-intro .inv-title")).toHaveText("Isha & Kabir (new date)");
  await client.getByRole("button", { name: "Ask for changes" }).click();
  await client.locator("#preview-note").fill("Please make the reception 8 PM");
  await client.getByRole("button", { name: "Send", exact: true }).click();
  await expect(client.locator(".client-preview-done")).toContainText("You asked for changes.");

  const { previews } = await (await request.get(`/api/experiences/${slug}/previews`, { headers: ownerHeaders(key) })).json();
  expect(previews[0].feedback[0]).toMatchObject({ verdict: "changes", note: "Please make the reception 8 PM" });
  await openInStudio(page, slug, key);
  await expect(page.locator(".studio-client-preview")).toContainText("Your client asked for changes");
  await expect(page.locator(".studio-client-preview")).toContainText("Please make the reception 8 PM");

  // Free invitations don't get them; a change needs a note; unknown previews aren't there.
  const free = await publish(request, "wedding", {}, "free");
  expect((await request.post(`/api/experiences/${free.slug}/previews`, { headers: ownerHeaders(free.key), data: { templateId: "wedding", draft: sampleDraft() } })).status()).toBe(403);
  expect((await request.post(`/api/previews/${token}/feedback`, { headers: general(), data: { verdict: "changes" } })).status()).toBe(422);
  expect((await request.get("/p/nothing-here")).status()).toBe(404);
  // Taken down, its previews go too, and no new ones can be made.
  expect((await request.post(`/api/admin/invitations/${slug}`, { headers: adminHeaders(), data: { action: "take-down" } })).status()).toBe(200);
  expect((await request.get(`/p/${token}`)).status()).toBe(404);
  expect((await request.post(`/api/previews/${token}/feedback`, { headers: general(), data: { verdict: "approve" } })).status()).toBe(404);
  expect((await request.post(`/api/experiences/${slug}/previews`, { headers: ownerHeaders(key), data: { templateId: "wedding", draft: sampleDraft() } })).status()).toBe(403);
});

test("wishes on the invitation, and reminding everyone, are the Creator studio's", async ({ page, request }) => {
  const free = await publish(request, "birthday", {}, "free");
  expect((await request.patch(`/api/experiences/${free.slug}`, { headers: ownerHeaders(free.key), data: { showWishes: true } })).status()).toBe(403);

  const { slug, key } = await publish(request, "wedding");
  await addGuest(request, slug, key, "the Patel family");
  await addGuest(request, slug, key, "the Shah family");
  await page.goto(`/manage/${slug}#k=${key}`);
  await page.getByRole("button", { name: "Remind everyone who hasn’t replied (2)" }).click();
  const remind = page.locator(".manage-remind");
  await expect(remind.locator("p")).toHaveText(/^1 of 2: the (Patel|Shah) family$/);
  await expect(remind.getByRole("link", { name: "Open WhatsApp" })).toHaveAttribute("href", /^https:\/\/wa\.me\/\?text=/);
  await remind.getByRole("button", { name: "Skip" }).click();
  await expect(remind.locator("p")).toHaveText(/^2 of 2: /);
  await remind.getByRole("button", { name: "Skip" }).click();
  await expect(page.getByText("Done: 0 reminded, 2 skipped.")).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.getByRole("button", { name: "Remind everyone who hasn’t replied (2)" })).toBeVisible();
});
