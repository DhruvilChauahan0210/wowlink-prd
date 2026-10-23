import { expect, test } from "@playwright/test";
import { publish } from "../helpers";

test("each invitation has its own share preview image (1200 × 630 PNG)", async ({ page, request }) => {
  const { slug } = await publish(request, "birthday", { title: "A night for Riya" });
  await page.goto(`/e/${slug}`);
  const og = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(og).toMatch(new RegExp(`^http://localhost:3100/e/${slug}/opengraph-image`));
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "A night for Riya — you’re invited");
  const image = await request.get(og!);
  expect(image.status()).toBe(200);
  expect(image.headers()["content-type"]).toBe("image/png");
  const png = await image.body();
  expect(png.subarray(1, 4).toString()).toBe("PNG");
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
});

test("the share image also renders for an invitation with a schedule", async ({ request }) => {
  const events = ["Mehndi", "Haldi", "Sangeet", "Wedding", "Reception"].map((name, i) => ({ id: `e${i}`, name, date: `2026-11-0${4 + i}`, time: "", venue: "" }));
  const { slug } = await publish(request, "wedding", { events });
  const image = await request.get(`/e/${slug}/opengraph-image`);
  expect(image.status()).toBe(200);
  expect(image.headers()["content-type"]).toBe("image/png");
});

test("add to calendar: a Google link and a standards-compliant .ics, in India time", async ({ page, request }) => {
  const { slug } = await publish(request, "wedding", { title: "Isha & Kabir", date: "2026-11-08", time: "18:00", venue: "Lakeview Lawns, Udaipur" });
  await page.goto(`/e/${slug}`);
  const google = page.getByRole("link", { name: "Google" });
  await expect.poll(async () => new URL((await google.getAttribute("href"))!).searchParams.get("details")).toContain(`/e/${slug}`);
  const params = new URL((await google.getAttribute("href"))!).searchParams;
  expect(params.get("dates")).toBe("20261108T180000/20261108T210000");
  expect(params.get("ctz")).toBe("Asia/Kolkata");
  expect(params.get("location")).toBe("Lakeview Lawns, Udaipur");
  await expect(page.getByRole("link", { name: "Apple / Outlook" })).toHaveAttribute("href", `/e/${slug}/invite.ics`);

  const ics = await request.get(`/e/${slug}/invite.ics`);
  expect(ics.headers()["content-type"]).toContain("text/calendar");
  const text = await ics.text();
  expect(text).toContain("DTSTART;TZID=Asia/Kolkata:20261108T180000");
  expect(text).toContain("DTEND;TZID=Asia/Kolkata:20261108T210000");
  expect(text).toContain("LOCATION:Lakeview Lawns\\, Udaipur");
  expect(text).toContain(`UID:${slug}@wowlink`);
  expect(text.endsWith("\r\n")).toBe(true);
  for (const line of text.split("\r\n")) expect(Buffer.byteLength(line)).toBeLessThanOrEqual(75);
});

test("previews build the .ics in the browser", async ({ page }) => {
  await page.goto("/e/preview?template=garba");
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Apple / Outlook" }).click()]);
  expect(download.suggestedFilename()).toBe("invitation.ics");
  let text = "";
  for await (const chunk of await download.createReadStream()) text += chunk;
  expect(text).toContain("SUMMARY:Raas under the stars");
  expect(text).toContain("DTSTART;TZID=Asia/Kolkata:20271005T200000");
});

// The occasion is 8 November 2026 at 6:00 PM India time; the browser's clock is set to each moment.
const COUNTDOWN: [string, string, RegExp][] = [
  ["weeks ahead", "2026-10-22T10:00:00+05:30", /^17\s*days to go$/],
  ["the day before", "2026-11-07T10:00:00+05:30", /^Tomorrow!$/],
  ["just after midnight India time", "2026-11-08T00:30:00+05:30", /^Today, in 18 hours$/],
  ["that afternoon", "2026-11-08T15:00:00+05:30", /^Today, in 3 hours$/],
  ["once it has started", "2026-11-08T19:00:00+05:30", /^Happening now!$/],
];

test.describe("countdown", () => {
  let slug = "";
  test.beforeAll(async ({ request }) => {
    ({ slug } = await publish(request, "wedding", { date: "2026-11-08", time: "18:00" }));
  });
  for (const [label, now, expected] of COUNTDOWN) {
    test(label, async ({ page }) => {
      await page.clock.install({ time: new Date(now) });
      await page.goto(`/e/${slug}`);
      await expect(page.locator(".inv-countdown")).toHaveText(expected);
    });
  }
  test("afterwards, the countdown gives way to a thank-you", async ({ page }) => {
    await page.clock.install({ time: new Date("2026-11-10T10:00:00+05:30") });
    await page.goto(`/e/${slug}`);
    await expect(page.locator(".inv-after")).toBeVisible();
    await expect(page.locator(".inv-countdown")).toHaveCount(0);
  });
});
