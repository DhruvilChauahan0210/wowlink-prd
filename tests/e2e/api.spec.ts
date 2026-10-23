import { expect, test } from "@playwright/test";
import { freshIp, publish, sampleDraft } from "../helpers";

const headers = () => ({ "x-forwarded-for": freshIp() });
const owner = (key: string) => ({ authorization: `Bearer ${key}`, ...headers() });

test("publishing rejects missing or impossible details, field by field", async ({ request }) => {
  const response = await request.post("/api/experiences", { headers: headers(), data: { templateId: "wedding", draft: { title: "  ", date: "2026-02-31", time: "25:00", venue: "" } } });
  expect(response.status()).toBe(422);
  const body = await response.json();
  expect(Object.keys(body.fields).sort()).toEqual(["date", "time", "title", "venue"]);
});

test("publishing rejects an unknown occasion", async ({ request }) => {
  const response = await request.post("/api/experiences", { headers: headers(), data: { templateId: "funeral", draft: sampleDraft() } });
  expect(response.status()).toBe(400);
});

test("details are trimmed, and the owner view never leaks the stored key", async ({ request }) => {
  const { slug, key } = await publish(request, "garba", { title: "  Raas at the Patels  " });
  const response = await request.get(`/api/experiences/${slug}`, { headers: owner(key) });
  expect(response.status()).toBe(200);
  const { experience } = await response.json();
  expect(experience.title).toBe("Raas at the Patels");
  expect(experience.status).toBe("published");
  expect(JSON.stringify(experience)).not.toContain("keyHash");
  expect(JSON.stringify(experience)).not.toContain(key);
});

test("the owner endpoints need the right key", async ({ request }) => {
  const { slug } = await publish(request);
  expect((await request.get(`/api/experiences/${slug}`, { headers: owner("wrong") })).status()).toBe(404);
  expect((await request.get(`/api/experiences/${slug}`, { headers: headers() })).status()).toBe(404);
  expect((await request.patch(`/api/experiences/${slug}`, { headers: owner("wrong"), data: { status: "unpublished" } })).status()).toBe(404);
});

test("RSVPs: valid replies are saved, bots and bad input are not", async ({ request }) => {
  const { slug, key } = await publish(request);
  const rsvp = (data: object) => request.post(`/api/experiences/${slug}/rsvps`, { headers: headers(), data });
  expect((await rsvp({ attendance: "Attending", name: "Riya", guestCount: 3 })).status()).toBe(201);
  expect((await rsvp({ attendance: "Not attending", name: "Dev", guestCount: 4 })).status()).toBe(201);
  // The honeypot answers "ok" so bots learn nothing, but stores nothing.
  expect((await rsvp({ attendance: "Maybe", name: "bot", website: "spam.example" })).status()).toBe(201);
  expect((await rsvp({ attendance: "yes please" })).status()).toBe(422);

  const { rsvps } = await (await request.get(`/api/experiences/${slug}`, { headers: owner(key) })).json();
  expect(rsvps.map((r: { name: string }) => r.name).sort()).toEqual(["Dev", "Riya"]);
  // Guest counts only apply to people who are coming.
  expect(rsvps.find((r: { name: string }) => r.name === "Dev").guestCount).toBe(0);
  expect(rsvps.find((r: { name: string }) => r.name === "Riya").guestCount).toBe(3);
});

test("RSVPs are rate-limited per guest", async ({ request }) => {
  const { slug } = await publish(request);
  const sameGuest = { "x-forwarded-for": freshIp() };
  const statuses: number[] = [];
  for (let i = 0; i < 6; i++) statuses.push((await request.post(`/api/experiences/${slug}/rsvps`, { headers: sameGuest, data: { attendance: "Maybe" } })).status());
  expect(statuses).toEqual([201, 201, 201, 201, 201, 429]);
});

test("a free invitation takes at most 50 replies", async ({ request }) => {
  const { slug } = await publish(request, "wedding", {}, "free");
  for (let i = 0; i < 50; i++) {
    const response = await request.post(`/api/experiences/${slug}/rsvps`, { headers: headers(), data: { attendance: "Attending", name: `Guest ${i}` } });
    expect(response.status()).toBe(201);
  }
  const full = await request.post(`/api/experiences/${slug}/rsvps`, { headers: headers(), data: { attendance: "Attending" } });
  expect(full.status()).toBe(409);
});

test("unpublished invitations take no replies and disappear for guests", async ({ request }) => {
  const { slug, key } = await publish(request);
  expect((await request.patch(`/api/experiences/${slug}`, { headers: owner(key), data: { status: "unpublished" } })).status()).toBe(200);
  expect((await request.post(`/api/experiences/${slug}/rsvps`, { headers: headers(), data: { attendance: "Maybe" } })).status()).toBe(404);
  expect((await request.get(`/e/${slug}`)).status()).toBe(404);
});
