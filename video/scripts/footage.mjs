// The launch video's product footage, from a private copy of WowLink (never the live site, so no real data is touched
// or counted). Headless: no window opens. Start the copy first, from the repo root:
//   DATABASE_URL= NEXT_DIST_DIR=.next-video npx next build
//   DATABASE_URL= NEXT_DIST_DIR=.next-video WOWLINK_DATA_FILE=/tmp/video.json WOWLINK_TEST_AUTH=1 \
//     WOWLINK_ADMIN_KEY=video-capture-admin-key-local-only-123 npx next start -p 3110
// then, from video/: npm run footage
// Writes public/footage/*.png (phone screens at 3x) and public/footage/opening/*.jpg (the invitation opening, 30 fps).

import { createRequire } from "node:module";
import { mkdir, readdir } from "node:fs/promises";

const { chromium } = createRequire(new URL("../../package.json", import.meta.url))("@playwright/test");
const SITE = process.env.SITE ?? "http://localhost:3110";
const OUT = new URL("../public/footage/", import.meta.url).pathname;
const ADMIN = { authorization: "Bearer video-capture-admin-key-local-only-123" };
let ip = 1;
const json = { "content-type": "application/json" };
const fresh = () => ({ "x-forwarded-for": `10.9.0.${ip++}` });

async function publish(draft) {
  const response = await fetch(`${SITE}/api/experiences`, { method: "POST", headers: { ...json, ...ADMIN, ...fresh() }, body: JSON.stringify({ templateId: "wedding", plan: "pro", draft }) });
  if (response.status !== 201) throw new Error(`publish: ${response.status} ${await response.text()}`);
  return response.json();
}

const events = (names) => [
  { id: "mehndi", name: names[0], date: "2026-12-10", time: "16:00", venue: names[3] },
  { id: "sangeet", name: names[1], date: "2026-12-11", time: "19:30", venue: names[3] },
  { id: "wedding", name: names[2], date: "2026-12-12", time: "18:30", venue: names[3] },
];
const base = { date: "2026-12-12", time: "18:30", countdown: true, rsvp: true };
const english = await publish({ ...base, title: "Isha & Kabir", venue: "Shubh Vatika, Ahmedabad", message: "Two families, one celebration. Come, bless us with your presence.", language: "en", events: events(["Mehndi", "Sangeet", "Wedding", "Shubh Vatika, Ahmedabad"]) });
const gujarati = await publish({ ...base, title: "ઈશા અને કબીર", venue: "શુભ વાટિકા, અમદાવાદ", message: "બે પરિવાર, એક ઉજવણી. આપના આશીર્વાદ સાથે પધારો.", language: "gu", events: events(["મહેંદી", "સંગીત", "લગ્ન", "શુભ વાટિકા, અમદાવાદ"]) });
const hindi = await publish({ ...base, title: "ईशा और कबीर", venue: "शुभ वाटिका, अहमदाबाद", message: "दो परिवार, एक जश्न। आपके आशीर्वाद के साथ पधारें।", language: "hi", events: events(["मेहंदी", "संगीत", "शादी", "शुभ वाटिका, अहमदाबाद"]) });

// Replies, for the host's page.
for (const [name, attendance, count] of [["Nani & Nana", "Attending", 2], ["The Patel family", "Attending", 5], ["Rohan", "Attending", 1], ["Meera Aunty", "Attending", 3], ["Dev & Priya", "Attending", 2], ["Kavya", "Not attending", 0], ["The Shahs", "Attending", 4]]) {
  await fetch(`${SITE}/api/experiences/${english.slug}/rsvps`, { method: "POST", headers: { ...json, ...fresh() }, body: JSON.stringify({ name, attendance, guestCount: count, wish: name === "Nani & Nana" ? "Jug jug jiyo, beta!" : undefined }) });
}

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });
const phone = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };
// Links on screen show the live address, not this private copy's; the Feedback button stays out of the picture.
const shot = async (page, name) => {
  await page.evaluate((live) => {
    for (const button of document.querySelectorAll(".feedback-button")) button.style.display = "none";
    for (const input of document.querySelectorAll("input")) input.value = input.value.replace(location.origin, live);
    for (const el of document.querySelectorAll("a, p, span")) if (el.children.length === 0 && el.textContent?.includes(location.host)) el.textContent = el.textContent.replace(location.origin, live).replace(location.host, live.replace("https://", ""));
  }, "https://wowlink-one.vercel.app");
  await page.screenshot({ path: `${OUT}${name}.png` });
};
const settle = (page, ms = 900) => page.waitForTimeout(ms);

// The occasions to pick from.
{
  const page = await browser.newPage(phone);
  await page.goto(`${SITE}/templates`, { waitUntil: "networkidle" });
  await settle(page, 1500);
  await shot(page, "templates");
  await page.close();
}

// The studio, filling in the names.
{
  const context = await browser.newContext({ ...phone, extraHTTPHeaders: { "x-wowlink-test-user": `video-host-${Date.now()}` } });
  const page = await context.newPage();
  await page.goto(`${SITE}/create?template=wedding`, { waitUntil: "networkidle" });
  await settle(page);
  await page.locator("#title").fill("Isha & Kabir");
  await page.locator("#venue").fill("Shubh Vatika, Ahmedabad");
  await settle(page);
  await shot(page, "studio-edit");
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await page.locator(".publish-dialog[open] .share-tools").waitFor();
  await settle(page, 1200);
  await shot(page, "publish");
  await context.close();
}

// A guest: the invitation as it arrives, its opening frame by frame (every CSS animation paused and stepped
// 1/30 s at a time, so the frames are as sharp as the stills), then the details and a reply.
{
  const page = await browser.newPage(phone);
  await page.goto(`${SITE}/e/${english.slug}`, { waitUntil: "networkidle" });
  await settle(page, 1800);
  await shot(page, "guest-closed");
  await mkdir(`${OUT}opening`, { recursive: true });
  await page.getByRole("button", { name: "Open the invitation" }).click();
  await page.evaluate(() => { for (const a of document.getAnimations()) a.pause(); });
  for (let f = 0; f <= 102; f++) {
    await page.evaluate((ms) => { for (const a of document.getAnimations()) { a.pause(); a.currentTime = ms; } }, (f * 1000) / 30);
    await page.screenshot({ path: `${OUT}opening/${String(f).padStart(3, "0")}.jpg`, type: "jpeg", quality: 88 });
  }
  await page.evaluate(() => { for (const a of document.getAnimations()) a.finish(); });
  await settle(page, 1200);
  await shot(page, "guest-opened");
  for (let y = 0; y < 6; y++) {
    await page.mouse.wheel(0, 260);
    await settle(page, 450);
  }
  await shot(page, "guest-details");
  await page.locator("#guest-name").scrollIntoViewIfNeeded();
  await settle(page, 600);
  await page.locator("#guest-name").fill("Nani & Nana");
  await page.locator("#guest-count").fill("2");
  await settle(page, 500);
  await shot(page, "guest-rsvp");
  await page.getByRole("button", { name: "Send my reply" }).click();
  await page.locator(".inv-rsvp-confirmation").waitFor();
  await settle(page, 1500);
  await shot(page, "guest-replied");
  await page.close();
}

// The same invitation in Gujarati and Hindi.
for (const [name, invitation, action] of [["gujarati", gujarati, /./], ["hindi", hindi, /./]]) {
  const page = await browser.newPage(phone);
  await page.goto(`${SITE}/e/${invitation.slug}`, { waitUntil: "networkidle" });
  await settle(page, 1500);
  await shot(page, `${name}-closed`);
  await page.locator(".inv-object button").first().click();
  await settle(page, 5500);
  await shot(page, `${name}-opened`);
  await page.close();
}

// The host's page: who's coming.
{
  const page = await browser.newPage(phone);
  await page.goto(`${SITE}/manage/${english.slug}#k=${english.key}`, { waitUntil: "networkidle" });
  await page.locator(".manage-hero h1").waitFor();
  await settle(page, 1200);
  await shot(page, "host");
  // Who's coming: the replies, with the headcount for each celebration.
  await page.locator("#replies-heading").evaluate((el) => el.scrollIntoView({ block: "start" }));
  await page.evaluate(() => window.scrollBy(0, -90));
  await settle(page, 900);
  await shot(page, "host-replies");
  await page.close();
}

await browser.close();
console.log("footage:", (await readdir(OUT)).join(", "));
