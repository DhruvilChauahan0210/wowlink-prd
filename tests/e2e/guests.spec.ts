import { expect, test, type APIRequestContext, type Browser } from "@playwright/test";
import { addGuest, collectErrors, freshIp, ownerHeaders, publish } from "../helpers";

/*
 * Personal invitations and replies per celebration: what each link shows (and never shows), one reply per
 * household, the free plan's limit, and the host's and guest's journeys through it.
 */

const SCHEDULE = [
  { id: "mehndi-day", name: "Secret Mehndi", date: "2026-11-06", time: "16:00", venue: "Patel home, Surat" },
  { id: "sangeet-night", name: "Sangeet", date: "2026-11-07", time: "19:30", venue: "" },
  { id: "reception-eve", name: "Reception", date: "2026-11-08", time: "21:00", venue: "" },
];
const general = () => ({ "x-forwarded-for": freshIp() });
const owned = async (request: APIRequestContext, slug: string, key: string) => (await request.get(`/api/experiences/${slug}`, { headers: ownerHeaders(key) })).json();
const freshContext = (browser: Browser) => browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": freshIp() } });

test("hidden celebrations and the guest list never reach the general link", async ({ request }) => {
  const { slug, key } = await publish(request, "wedding", { events: SCHEDULE });
  expect((await request.patch(`/api/experiences/${slug}`, { headers: ownerHeaders(key), data: { publicEvents: ["reception-eve"] } })).status()).toBe(200);
  const patel = await addGuest(request, slug, key, "the Patel family", ["mehndi-day", "reception-eve"]);

  // The page, including the data React sends along with it.
  const page = await (await request.get(`/e/${slug}`)).text();
  for (const secret of ["Secret Mehndi", "mehndi-day", "Sangeet", "sangeet-night", "Patel", patel.id, "\"18:00\""]) expect(page, secret).not.toContain(secret);
  expect(page).toContain("Reception");

  // Calendar files: only what the link shows.
  expect((await request.get(`/e/${slug}/invite.ics?event=mehndi-day`)).status()).toBe(404);
  const all = await (await request.get(`/e/${slug}/invite.ics`)).text();
  expect(all.match(/BEGIN:VEVENT/g)).toHaveLength(1);
  const main = await (await request.get(`/e/${slug}/invite.ics?event=main`)).text();
  expect(main).toContain("SUMMARY:Reception · Aarav & Meera");
  expect(main).toContain(`UID:${slug}-reception-eve@wowlink`);

  // A reply that ticks a hidden celebration only records what the link shows.
  expect((await request.post(`/api/experiences/${slug}/rsvps`, { headers: general(), data: { attendance: "Attending", guestCount: 2, events: ["mehndi-day"] } })).status()).toBe(201);
  const { rsvps } = await owned(request, slug, key);
  expect(Object.keys(rsvps[0].byEvent)).toEqual(["reception-eve"]);

  // The personal link shows the family's celebrations, addressed to them, and stays out of search engines.
  const personal = await request.get(`/e/${slug}/${patel.id}`);
  expect(personal.status()).toBe(200);
  const html = await personal.text();
  expect(html).toContain("For the Patel family");
  expect(html).toContain("Secret Mehndi");
  expect(html).not.toContain("sangeet-night");
  expect(html).toMatch(/<meta name="robots" content="noindex, nofollow"/);
  const theirs = await (await request.get(`/e/${slug}/${patel.id}/invite.ics`)).text();
  expect(theirs.match(/BEGIN:VEVENT/g)).toHaveLength(2);
  expect(theirs).toContain(`URL:http://localhost:3100/e/${slug}/${patel.id}`);
  expect((await request.get(`/e/${slug}/${patel.id}/invite.ics?event=sangeet-night`)).status()).toBe(404);
  const image = await request.get(`/e/${slug}/${patel.id}/opengraph-image`);
  expect(image.headers()["content-type"]).toBe("image/png");

  // Links that don't lead anywhere say so plainly.
  const unknown = await request.get(`/e/${slug}/bcdfghjk`);
  expect(unknown.status()).toBe(404);
  expect(await unknown.text()).toContain("has changed");
  expect((await request.get(`/e/${slug}/not-a-guest-id`)).status()).toBe(404);

  // Unpublished: personal links go too.
  await request.patch(`/api/experiences/${slug}`, { headers: ownerHeaders(key), data: { status: "unpublished" } });
  expect((await request.get(`/e/${slug}/${patel.id}`)).status()).toBe(404);
  expect((await request.get(`/e/${slug}/${patel.id}/invite.ics`)).status()).toBe(404);
});

test("the guest-list endpoints need the manage key, and check what they're given", async ({ request }) => {
  const { slug, key } = await publish(request, "wedding", { events: SCHEDULE });
  const patel = await addGuest(request, slug, key, "the Patel family");
  const wrong = ownerHeaders("not-the-key");
  expect((await request.post(`/api/experiences/${slug}/guests`, { headers: wrong, data: { name: "Shah" } })).status()).toBe(404);
  expect((await request.patch(`/api/experiences/${slug}/guests/${patel.id}`, { headers: wrong, data: { name: "Shah" } })).status()).toBe(404);
  expect((await request.delete(`/api/experiences/${slug}/guests/${patel.id}`, { headers: wrong })).status()).toBe(404);
  expect((await request.patch(`/api/experiences/${slug}/guests/bcdfghjk`, { headers: ownerHeaders(key), data: { name: "Shah" } })).status()).toBe(404);

  const blank = await request.post(`/api/experiences/${slug}/guests`, { headers: ownerHeaders(key), data: { name: " ", events: [] } });
  expect(blank.status()).toBe(422);
  expect(Object.keys((await blank.json()).fields).sort()).toEqual(["events", "name"]);
  expect((await request.patch(`/api/experiences/${slug}`, { headers: ownerHeaders(key), data: { publicEvents: ["nope"] } })).status()).toBe(422);

  // The owner view has the list; nothing public does.
  const { experience } = await owned(request, slug, key);
  expect(experience.guests.map((g: { name: string }) => g.name)).toEqual(["the Patel family"]);
});

test("a personal link has one reply per household; a new link keeps it, removing the invitation removes it", async ({ request }) => {
  const { slug, key } = await publish(request, "wedding", { events: SCHEDULE });
  const patel = await addGuest(request, slug, key, "the Patel family");
  const reply = (data: object, guest = patel.id) => request.post(`/api/experiences/${slug}/rsvps`, { headers: general(), data: { guest, ...data } });

  const first = await reply({ attendance: "Attending", guestCount: 3, name: "Rameshbhai", events: ["mehndi-day"] });
  expect(first.status()).toBe(201);
  expect(await first.json()).toMatchObject({ updated: false });
  const again = await reply({ attendance: "Maybe", guestCount: 2, name: "Rohan", events: ["sangeet-night"] });
  expect(again.status()).toBe(200);
  expect(await again.json()).toMatchObject({ updated: true });
  expect((await reply({ attendance: "Maybe" }, "bcdfghjk")).status()).toBe(404);

  let { rsvps } = await owned(request, slug, key);
  expect(rsvps).toHaveLength(1);
  expect(rsvps[0]).toMatchObject({ name: "Rohan", attendance: "Maybe", guestCount: 2, guestId: patel.id });
  expect(rsvps[0].byEvent["sangeet-night"]).toEqual({ attendance: "Maybe", guestCount: 2 });
  expect(rsvps[0].updatedAt).toBeTruthy();

  // Their link was forwarded too far: a new one replaces it, and the reply comes along.
  const relinked = await (await request.patch(`/api/experiences/${slug}/guests/${patel.id}`, { headers: ownerHeaders(key), data: { newLink: true } })).json();
  expect(relinked.guest.id).not.toBe(patel.id);
  expect((await request.get(`/e/${slug}/${patel.id}`)).status()).toBe(404);
  expect((await request.get(`/e/${slug}/${relinked.guest.id}`)).status()).toBe(200);
  ({ rsvps } = await owned(request, slug, key));
  expect(rsvps[0].guestId).toBe(relinked.guest.id);

  expect((await request.delete(`/api/experiences/${slug}/guests/${relinked.guest.id}`, { headers: ownerHeaders(key) })).status()).toBe(200);
  ({ rsvps } = await owned(request, slug, key));
  expect(rsvps).toHaveLength(0);
});

test("a pasted list adds several households at once; their numbers stay with the host", async ({ request }) => {
  const { slug, key } = await publish(request, "wedding", { events: SCHEDULE });
  await addGuest(request, slug, key, "Kakaji & Kaki");
  const response = await request.post(`/api/experiences/${slug}/guests`, { headers: ownerHeaders(key), data: { list: "the Patel family, 98250 12345\nkakaji & KAKI\n\nthe Shah family", events: ["reception-eve"] } });
  expect(response.status()).toBe(201);
  const { guests, skipped } = await response.json();
  expect(guests.map((g: { name: string }) => g.name)).toEqual(["the Patel family", "the Shah family"]);
  expect(guests[0]).toMatchObject({ phone: "919825012345", events: ["reception-eve"] });
  expect(skipped).toEqual(["kakaji & KAKI"]);
  // A guest never sees anyone's number, not even their own.
  expect(await (await request.get(`/e/${slug}/${guests[0].id}`)).text()).not.toContain("9825012345");

  // All or nothing: a list that doesn't fit adds no one.
  const { slug: small, key: smallKey } = await publish(request);
  for (let i = 0; i < 97; i++) await request.post(`/api/experiences/${small}/rsvps`, { headers: general(), data: { attendance: "Maybe" } });
  const tooMany = await request.post(`/api/experiences/${small}/guests`, { headers: ownerHeaders(smallKey), data: { list: "A\nB\nC\nD" } });
  expect(tooMany.status()).toBe(409);
  expect((await tooMany.json()).error).toContain("room for 3 more");
  expect((await owned(request, small, smallKey)).experience.guests).toHaveLength(0);
});

test("the host pastes a list, then reminds the households who haven't replied", async ({ browser }) => {
  const context = await freshContext(browser);
  const { slug, key } = await publish(context.request, "wedding", { title: "Isha & Kabir", events: SCHEDULE });
  const host = await context.newPage();
  const errors = collectErrors(host);
  await host.goto(`/manage/${slug}#k=${key}`);
  const add = host.locator(".manage-guest-add");
  await add.getByRole("radio", { name: "Paste a list" }).check();
  await add.locator("#new-guest-list").fill("the Patel family, 98250 12345\nthe Shah family\n");
  await expect(add.getByRole("button", { name: "Add 2 invitations" })).toBeVisible();
  await add.getByRole("button", { name: "Add 2 invitations" }).click();
  await expect(host.locator(".manage-guest-add + .share-status")).toHaveText("Added 2 invitations.");
  const patel = host.locator(".manage-guest").filter({ hasText: "the Patel family" });
  await expect(patel.locator(".manage-guest-events")).toContainText("+91 98250 12345");

  // With a number, WhatsApp opens their chat; without one, WhatsApp asks who to send it to.
  await expect(patel.getByRole("link", { name: "Send the Patel family their link on WhatsApp" })).toHaveAttribute("href", /^https:\/\/wa\.me\/919825012345\?text=/);
  const shah = host.locator(".manage-guest").filter({ hasText: "the Shah family" });
  await expect(shah.getByRole("link", { name: "Send the Shah family their link on WhatsApp" })).toHaveAttribute("href", /^https:\/\/wa\.me\/\?text=/);
  const remind = patel.getByRole("link", { name: "Remind the Patel family on WhatsApp" });
  expect(decodeURIComponent((await remind.getAttribute("href"))!)).toContain("A gentle reminder from Isha & Kabir");

  // Once they've replied, there's nothing to remind them about.
  const patelId = (await patel.getByRole("link", { name: /^Preview/ }).getAttribute("href"))!.split("/")[3].split("?")[0];
  await context.request.post(`/api/experiences/${slug}/rsvps`, { headers: general(), data: { attendance: "Attending", guest: patelId } });
  await host.getByRole("button", { name: "Refresh" }).click();
  await expect(patel.locator(".manage-guest-status")).toHaveText("Coming · 1 person");
  await expect(remind).toHaveCount(0);
  await expect(shah.getByRole("link", { name: "Remind the Shah family on WhatsApp" })).toBeVisible();

  // Fixing a number in the edit form.
  await shah.getByRole("button", { name: "Edit the invitation for the Shah family" }).click();
  await host.locator(".manage-guest.is-editing input[type=tel]").fill("12");
  await host.locator(".manage-guest.is-editing").getByRole("button", { name: "Save" }).click();
  await expect(host.locator(".manage-guest.is-editing .studio-error")).toContainText("doesn’t look like a WhatsApp number");
  await host.locator(".manage-guest.is-editing input[type=tel]").fill("+44 7700 900123");
  await host.locator(".manage-guest.is-editing").getByRole("button", { name: "Save" }).click();
  await expect(shah.locator(".manage-guest-events")).toContainText("+447700900123");
  expect(errors).toEqual([]);
  await context.close();
});

test("the host downloads the replies and the caterer's headcount", async ({ browser }) => {
  const context = await freshContext(browser);
  const { slug, key } = await publish(context.request, "wedding", { title: "Isha & Kabir", events: SCHEDULE });
  await context.request.post(`/api/experiences/${slug}/rsvps`, { headers: general(), data: { attendance: "Attending", name: "Riya", guestCount: 3, events: ["sangeet-night"] } });
  const host = await context.newPage();
  await host.goto(`/manage/${slug}#k=${key}`);
  const read = async (name: string) => {
    const [download] = await Promise.all([host.waitForEvent("download"), host.getByRole("button", { name }).click()]);
    let text = "";
    for await (const chunk of await download.createReadStream()) text += chunk;
    return { file: download.suggestedFilename(), text };
  };
  const replies = await read("Every reply (CSV)");
  expect(replies.file).toBe("isha-kabir-replies.csv");
  expect(replies.text).toContain("Riya,,Attending,3,No,3,No");
  const headcount = await read("Headcount per celebration (CSV)");
  expect(headcount.file).toBe("isha-kabir-headcount.csv");
  expect(headcount.text).toContain("Sangeet,\"Sat, 7 Nov\",7:30 PM,\"The Garden House, Surat\",3,1");
  await context.close();
});

test("only a real visit counts as opened: not a link preview, not the host's preview", async ({ browser }) => {
  const context = await freshContext(browser);
  const { slug, key } = await publish(context.request, "wedding", { events: SCHEDULE });
  const patel = await addGuest(context.request, slug, key, "the Patel family");
  const openedAt = async () => (await owned(context.request, slug, key)).experience.guests[0].openedAt;
  // WhatsApp fetches the page for its preview but never runs it.
  expect((await context.request.get(`/e/${slug}/${patel.id}`)).status()).toBe(200);
  const host = await context.newPage();
  await host.goto(`/e/${slug}/${patel.id}?preview=1`);
  await expect(host.locator(".inv-preview-banner")).toBeVisible();
  await host.waitForTimeout(500);
  expect(await openedAt()).toBeUndefined();
  // Unknown links answer the same as real ones.
  expect((await context.request.post(`/api/experiences/${slug}/opened`, { headers: general(), data: { guest: "bcdfghjk" } })).status()).toBe(204);

  const family = await context.newPage();
  await family.goto(`/e/${slug}/${patel.id}`);
  await expect.poll(openedAt).toBeTruthy();
  const first = await openedAt();
  // A refresh soon after isn't recorded again.
  await context.request.post(`/api/experiences/${slug}/opened`, { headers: general(), data: { guest: patel.id } });
  const { experience } = await owned(context.request, slug, key);
  expect(experience.guests[0]).toMatchObject({ openedAt: first, lastOpenedAt: first });
  await context.close();
});

test("personal invitations keep their place under the free plan's limit", async ({ request }) => {
  const { slug, key } = await publish(request);
  const patel = await addGuest(request, slug, key, "the Patel family");
  const shah = await addGuest(request, slug, key, "the Shah family");
  // 100 replies: 98 from the general link, plus a place kept for each of the two households.
  for (let i = 0; i < 98; i++) expect((await request.post(`/api/experiences/${slug}/rsvps`, { headers: general(), data: { attendance: "Attending", name: `Guest ${i}` } })).status()).toBe(201);
  expect((await request.post(`/api/experiences/${slug}/rsvps`, { headers: general(), data: { attendance: "Attending" } })).status()).toBe(409);
  for (const guest of [patel, shah]) expect((await request.post(`/api/experiences/${slug}/rsvps`, { headers: general(), data: { attendance: "Attending", guest: guest.id } })).status()).toBe(201);
  expect((await request.post(`/api/experiences/${slug}/guests`, { headers: ownerHeaders(key), data: { name: "the Desai family" } })).status()).toBe(409);
});

test("personal links are rate-limited per household, not per network", async ({ request }) => {
  const { slug, key } = await publish(request);
  const [patel, shah] = [await addGuest(request, slug, key, "Patel"), await addGuest(request, slug, key, "Shah")];
  const sameNetwork = { "x-forwarded-for": freshIp() };
  const statuses: number[] = [];
  for (let i = 0; i < 6; i++) statuses.push((await request.post(`/api/experiences/${slug}/rsvps`, { headers: sameNetwork, data: { attendance: "Maybe", guest: patel.id } })).status());
  expect(statuses).toEqual([201, 200, 200, 200, 200, 429]);
  // A cousin replying for another family from the same phone isn't held up.
  expect((await request.post(`/api/experiences/${slug}/rsvps`, { headers: sameNetwork, data: { attendance: "Maybe", guest: shah.id } })).status()).toBe(201);
});

test("a personal invitation, from the manage page to the family's reply and back", async ({ browser }) => {
  const context = await freshContext(browser);
  const { slug, key } = await publish(context.request, "wedding", { title: "Isha & Kabir", events: SCHEDULE });
  const host = await context.newPage();
  const hostErrors = collectErrors(host);
  await host.goto(`/manage/${slug}#k=${key}`);

  // The host adds the Patels, invited to the Sangeet and the Reception only.
  const add = host.locator(".manage-guest-add");
  await add.locator("#new-guest-name").fill("the Patel family");
  await add.getByRole("radio", { name: "Only some" }).check();
  await add.getByRole("checkbox", { name: /Secret Mehndi/ }).uncheck();
  await add.getByRole("button", { name: "Add invitation" }).click();
  const row = host.locator(".manage-guest").filter({ hasText: "the Patel family" });
  await expect(row.locator(".manage-guest-status")).toHaveText("Not opened yet");
  await expect(row.locator(".manage-guest-events")).toHaveText("Sangeet · Reception");
  await expect(host.locator(".manage-headcount tbody tr").filter({ hasText: "Sangeet" }).locator("td").last()).toHaveText("1 invitation");
  const previewHref = (await row.getByRole("link", { name: "Preview the invitation for the Patel family" }).getAttribute("href"))!;
  const personal = previewHref.replace("?preview=1", "");
  await expect(row.getByRole("link", { name: "Send the Patel family their link on WhatsApp" })).toHaveAttribute("href", new RegExp(encodeURIComponent(personal)));

  // The family opens their link on another phone.
  const familyContext = await freshContext(browser);
  const family = await familyContext.newPage();
  const familyErrors = collectErrors(family);
  await family.goto(personal);
  await expect(family.locator(".inv-addressee")).toHaveText("For the Patel family");
  // The host sees they've opened it (the page reports it once it's running).
  await expect(async () => {
    await host.getByRole("button", { name: "Refresh" }).click();
    await expect(row.locator(".manage-guest-status")).toHaveText(/^Opened \d+ \w+ · no reply yet$/, { timeout: 1000 });
  }).toPass();
  await expect(host.locator(".manage-guest-summary")).toHaveText("1 of 1 opened · 0 replied");
  await expect(family.locator(".inv-timeline-item h3")).toHaveText(["Sangeet", "Reception"]);
  await expect(family.locator("#schedule-heading")).toHaveText("Your celebrations");
  await expect(family.getByText("Secret Mehndi")).toHaveCount(0);
  await family.getByRole("checkbox", { name: /Reception/ }).uncheck();
  await family.locator("#guest-count").fill("3");
  await family.locator("#guest-name").fill("Rameshbhai");
  await family.getByRole("button", { name: "Send my reply" }).click();
  await expect(family.locator(".inv-confirm-label")).toHaveText("Reply sent");
  await expect(family.locator(".inv-rsvp-summary")).toHaveText("Coming to the Sangeet · 3 people.");

  // Coming back later, they see the household's reply first, and can change it.
  await family.reload();
  await expect(family.locator(".inv-confirm-label")).toHaveText("Reply from the Patel family");
  await expect(family.locator(".inv-rsvp-meta")).toContainText("Sent by Rameshbhai");
  await family.getByRole("button", { name: "Change the reply" }).click();
  await expect(family.getByRole("radio", { name: "Attending", exact: true })).toBeFocused();
  await expect(family.getByRole("checkbox", { name: /Reception/ })).not.toBeChecked();
  await family.getByRole("checkbox", { name: /Reception/ }).check();
  await family.getByRole("button", { name: "Not everyone coming to everything?" }).click();
  await family.locator("#count-reception-eve").fill("5");
  await family.getByRole("button", { name: "Update the reply" }).click();
  await expect(family.locator(".inv-confirm-label")).toHaveText("Reply updated");
  await expect(family.locator(".inv-rsvp-summary")).toHaveText("Coming to the Sangeet (3) and Reception (5).");

  // The host's numbers per celebration.
  await host.getByRole("button", { name: "Refresh" }).click();
  const headcount = (name: string) => host.locator(".manage-headcount tbody tr").filter({ hasText: name }).locator("td").first();
  await expect(headcount("Sangeet")).toContainText("3 people");
  await expect(headcount("Reception")).toContainText("5 people");
  await expect(headcount("Secret Mehndi")).toContainText("0 people");
  await expect(row.locator(".manage-guest-status")).toHaveText("Coming · 5 people");
  await expect(host.locator(".manage-replies tbody tr").first()).toContainText("for the Patel family");

  // The host's preview of their link doesn't send anything.
  const preview = await context.newPage();
  await preview.goto(previewHref);
  await expect(preview.locator(".inv-preview-banner")).toContainText("This is how the Patel family sees their invitation");
  await preview.getByRole("button", { name: "Preview my reply" }).click();
  await expect(preview.locator(".inv-confirm-label")).toHaveText("Reply preview");
  const { rsvps } = await owned(context.request, slug, key);
  expect(rsvps).toHaveLength(1);

  expect(hostErrors).toEqual([]);
  expect(familyErrors).toEqual([]);
  await Promise.all([context.close(), familyContext.close()]);
});

test("the general link can show just the Reception", async ({ browser }) => {
  const context = await freshContext(browser);
  const { slug, key } = await publish(context.request, "wedding", { events: SCHEDULE });
  const host = await context.newPage();
  await host.goto(`/manage/${slug}#k=${key}`);
  const audience = host.locator(".manage-audience");
  await audience.getByRole("radio", { name: "Only some" }).check();
  await audience.getByRole("checkbox", { name: /Secret Mehndi/ }).uncheck();
  await audience.getByRole("checkbox", { name: /Sangeet/ }).uncheck();
  await audience.getByRole("button", { name: "Save" }).click();
  await expect(audience.locator(".share-status")).toHaveText("Saved. The general link shows this now.");

  const guest = await context.newPage();
  await guest.goto(`/e/${slug}`);
  // One celebration: "Save the date" is the Reception, and there's no separate timeline.
  await expect(guest.locator(".inv-details-grid")).toContainText("Reception · 9:00 PM");
  await expect(guest.locator(".inv-schedule-section")).toHaveCount(0);
  await expect(guest.getByText("Secret Mehndi")).toHaveCount(0);
  // Nothing to tick: replying is just yes, maybe or no.
  await expect(guest.locator(".inv-which")).toHaveCount(0);
  await context.close();
});

test("when every celebration on a personal invitation is removed, its link waits for the details", async ({ browser }) => {
  const context = await freshContext(browser);
  const { request } = context;
  const { slug, key } = await publish(request, "wedding", { events: SCHEDULE });
  const desai = await addGuest(request, slug, key, "the Desai family", ["mehndi-day"]);
  const draft = { title: "Aarav & Meera", date: "2026-11-08", time: "18:00", venue: "The Garden House, Surat", message: "", events: SCHEDULE.slice(1) };
  expect((await request.patch(`/api/experiences/${slug}`, { headers: ownerHeaders(key), data: { draft } })).status()).toBe(200);

  const page = await context.newPage();
  await page.goto(`/e/${slug}/${desai.id}`);
  await expect(page.locator(".inv-pending")).toContainText("The hosts are updating the details of your invitation");
  await expect(page.locator("#rsvp-heading")).toHaveCount(0);
  // Never the ceremony's details instead.
  await expect(page.getByText("The Garden House, Surat")).toHaveCount(0);
  expect((await request.get(`/e/${slug}/${desai.id}/invite.ics`)).status()).toBe(404);
  expect((await request.post(`/api/experiences/${slug}/rsvps`, { headers: general(), data: { attendance: "Attending", guest: desai.id } })).status()).toBe(422);

  await page.goto(`/manage/${slug}#k=${key}`);
  await expect(page.locator(".manage-guest").filter({ hasText: "the Desai family" }).locator(".manage-warn")).toContainText("details to follow");
  await context.close();
});

test("removing a live celebration in the studio and adding it back keeps its replies", async ({ browser }) => {
  const context = await freshContext(browser);
  const { request } = context;
  const events = [{ id: "mehndi-x", name: "Mehndi", date: "2026-11-06", time: "16:00", venue: "" }, { id: "reception-x", name: "Reception", date: "2026-11-08", time: "21:00", venue: "" }];
  const { slug, key } = await publish(request, "wedding", { events });
  await request.post(`/api/experiences/${slug}/rsvps`, { headers: general(), data: { attendance: "Attending", guestCount: 2 } });

  const page = await context.newPage();
  await page.goto(`/manage/${slug}#k=${key}`);
  await page.getByRole("link", { name: "Edit in studio" }).click();
  await expect(page.locator(".studio-save-status")).toContainText("Editing your live invitation");
  await page.getByRole("button", { name: "Remove Mehndi from the schedule" }).click();
  await expect(page.locator(".studio-removed")).toContainText("Removed the Mehndi. 1 reply includes it.");
  await page.getByRole("button", { name: "+ Mehndi" }).click();
  await expect(page.locator(".studio-removed")).toHaveCount(0);
  await page.getByRole("button", { name: "Update", exact: true }).click();
  await expect(page.locator(".publish-dialog[open]")).toBeVisible();
  const { experience } = await owned(request, slug, key);
  expect(experience.events.map((e: { id: string }) => e.id).sort()).toEqual(["mehndi-x", "reception-x"]);
  await context.close();
});

test("a share image for a household named in Gujarati", async ({ request }) => {
  const { slug, key } = await publish(request, "wedding", { events: SCHEDULE });
  const family = await addGuest(request, slug, key, "રમેશભાઈ પટેલ પરિવાર");
  const image = await request.get(`/e/${slug}/${family.id}/opengraph-image`);
  expect(image.status()).toBe(200);
  expect(image.headers()["content-type"]).toBe("image/png");
});

// The wedding is 8 November; the reception is the evening after. India time throughout.
test.describe("countdown with celebrations after the main day", () => {
  let slug = "";
  test.beforeAll(async ({ request }) => {
    ({ slug } = await publish(request, "wedding", { date: "2026-11-08", time: "18:00", events: [{ id: "reception", name: "Reception", date: "2026-11-09", time: "20:00", venue: "" }] }));
  });
  for (const [label, now, expected] of [
    ["before the wedding, it counts to the wedding", "2026-11-07T10:00:00+05:30", /^Tomorrow!$/],
    ["the morning after, it counts to the reception", "2026-11-09T10:00:00+05:30", /^Today: the Reception, in 10 hours$/],
    ["after the last celebration", "2026-11-10T10:00:00+05:30", /^This day has passed/],
  ] as const) {
    test(label, async ({ page }) => {
      await page.clock.install({ time: new Date(now) });
      await page.goto(`/e/${slug}`);
      await expect(page.locator(".inv-countdown")).toHaveText(expected);
    });
  }
});
