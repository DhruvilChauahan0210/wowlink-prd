import { expect, test } from "../fixtures";
import { publish } from "../helpers";

/*
 * Search: each occasion has its own page to be found by, in English, Gujarati and Hindi, and its invitation wording
 * guide, listed in the sitemap with the home page, the occasions and the other public pages. People's invitations,
 * the studio and the manage pages stay out of search.
 */

const OCCASIONS = ["wedding", "engagement", "birthday", "garba", "babyshower", "housewarming", "anniversary", "opening", "diwali", "janoi", "puja", "naming"];
const GUIDES = ["wedding-invitation-wording", "engagement-invitation-wording", "birthday-invitation-wording", "navratri-garba-invitation-message", "seemant-baby-shower-invitation-wording", "griha-pravesh-invitation-message", "anniversary-invitation-wording", "shop-opening-invitation-message", "diwali-party-invitation-message", "janoi-upanayan-invitation-wording", "satyanarayan-katha-invitation-message", "naming-ceremony-invitation-wording"];

test("the sitemap lists the public pages and nothing private", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  const xml = await response.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => new URL(m[1]).pathname + new URL(m[1]).search);
  const everyLanguage = (path: string) => [path, `${path}?lang=gu`, `${path}?lang=hi`];
  expect(urls).toEqual(["/", "/templates", ...OCCASIONS.flatMap(id => everyLanguage(`/templates/${id}`)), "/wording", ...GUIDES.map(slug => `/wording/${slug}`), ...everyLanguage("/pricing"), ...everyLanguage("/help"), ...everyLanguage("/privacy")]);
  expect(xml).toContain('hreflang="gu"');
  expect(xml).toContain('hreflang="x-default"');
});

test("robots.txt keeps crawlers out of the private pages, and points to the sitemap", async ({ request }) => {
  const text = await (await request.get("/robots.txt")).text();
  for (const path of ["/api/", "/manage/", "/mine", "/admin"]) expect(text).toContain(`Disallow: ${path}`);
  // Invitations carry noindex instead, which crawlers (and link-preview bots) can only read if they may fetch them.
  expect(text).not.toContain("Disallow: /e/");
  expect(text).toMatch(/Sitemap: http:\/\/localhost:3100\/sitemap\.xml/);
});

test("an occasion's page: found by its words, with a sample that opens, and a way to start", async ({ page, request }) => {
  const response = await page.goto("/templates/garba");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("Garba and Navratri invitation maker online — WowLink");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /Garba or Navratri invitation/);
  await expect(page.locator("link[rel=canonical]")).toHaveAttribute("href", "http://localhost:3100/templates/garba");
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  await expect(page.locator("h1")).toHaveText("A Garba invitation that lights a diya");

  // The sample opens right here.
  const scene = page.locator(".occasion-demo .inv-scene");
  await scene.getByRole("button", { name: "Let the night begin" }).click();
  await expect(scene).toHaveClass(/is-open/);
  await expect(scene.getByRole("button", { name: "Watch it again" })).toBeVisible();

  await expect(page.getByRole("link", { name: "Make yours, free" })).toHaveAttribute("href", "/create?template=garba");
  await expect(page.locator(".occasion-others a")).toHaveCount(11);
  await expect(page.locator(".occasion-faq dt")).toHaveCount(5);

  // Its share card.
  const image = await page.locator('meta[property="og:image"]').getAttribute("content");
  const card = await request.get(image!);
  expect(card.status()).toBe(200);
  expect(card.headers()["content-type"]).toBe("image/png");
});

test("every occasion has a page, and unknown ones don't", async ({ request }) => {
  for (const id of OCCASIONS) expect((await request.get(`/templates/${id}`)).status()).toBe(200);
  expect((await request.get("/templates/funeral")).status()).toBe(404);
  expect((await request.get("/templates/funeral?lang=gu")).status()).toBe(404);
});

test("an occasion's page in Gujarati and Hindi: its own words and address, linked to the others", async ({ page, request }) => {
  const response = await page.goto("/templates/garba?lang=gu");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("ગરબા અને નવરાત્રિનું આમંત્રણ ઑનલાઇન બનાવો — WowLink");
  await expect(page.locator("h1")).toHaveText("દીવો પ્રગટાવતું ગરબાનું આમંત્રણ");
  await expect(page.locator("link[rel=canonical]")).toHaveAttribute("href", "http://localhost:3100/templates/garba?lang=gu");
  for (const [lang, href] of [["en", "/templates/garba"], ["gu", "/templates/garba?lang=gu"], ["hi", "/templates/garba?lang=hi"], ["x-default", "/templates/garba"]]) {
    await expect(page.locator(`link[rel=alternate][hreflang="${lang}"]`)).toHaveAttribute("href", `http://localhost:3100${href}`);
  }
  // Its sample reads in Gujarati, and starting from it opens the studio in Gujarati.
  const scene = page.locator(".occasion-demo .inv-scene");
  await expect(scene).toHaveAttribute("lang", "gu");
  await expect(scene).toContainText("તારાઓ નીચે રાસ");
  await expect(page.getByRole("link", { name: "આપનું આમંત્રણ બનાવો, મફત" })).toHaveAttribute("href", "/create?template=garba&lang=gu");
  await expect(page.locator(".occasion-others a").first()).toHaveAttribute("href", "/templates/wedding?lang=gu");
  await expect(page.locator("footer[data-site-footer]")).toHaveAttribute("lang", "gu");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/templates\/garba\/opengraph-image/);

  // On to Hindi, and back to English, from the header.
  await page.locator(".page-langs").getByRole("link", { name: "हिन्दी" }).click();
  await expect(page).toHaveURL(/\/templates\/garba\?lang=hi$/);
  await expect(page.locator("h1")).toHaveText("दीया जलाने वाला गरबा निमंत्रण");
  await page.locator(".page-langs").getByRole("link", { name: "English" }).click();
  await expect(page.locator("h1")).toHaveText("A Garba invitation that lights a diya");

  // The address it's built at leads to its real one.
  const built = await request.get("/templates/garba/hi", { maxRedirects: 0 });
  expect(built.status()).toBe(308);
  expect(built.headers().location).toMatch(/\/templates\/garba\?lang=hi$/);
});

test("every occasion's page is built ahead in every language, as the live site needs", async () => {
  // `next start` would render a page missing from the build on demand; on Vercel it's a 404 (dynamicParams = false).
  const { readFileSync } = await import("node:fs");
  const built = Object.keys(JSON.parse(readFileSync(".next-test/prerender-manifest.json", "utf8")).routes);
  for (const id of OCCASIONS) for (const page of [`/templates/${id}`, `/templates/${id}/gu`, `/templates/${id}/hi`]) expect(built, page).toContain(page);
  for (const slug of GUIDES) expect(built).toContain(`/wording/${slug}`);
});

test("the wording guides: each wording in three languages, ready to copy, and a way to send it", async ({ page, context }) => {
  await page.goto("/wording");
  await expect(page.locator(".wording-index a")).toHaveCount(GUIDES.length);
  await page.getByRole("link", { name: /Griha pravesh and vastu puja/ }).click();
  await expect(page).toHaveURL(/\/wording\/griha-pravesh-invitation-message$/);
  await expect(page).toHaveTitle("Griha pravesh invitation message, in Hindi and Gujarati — WowLink");
  await expect(page.locator(".wording-section")).toHaveCount(3);
  await expect(page.locator(".wording-section").first().locator(".wording-card")).toHaveCount(3);
  await expect(page.locator(".wording-text[lang=hi]").first()).toContainText("गृह प्रवेश");

  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const card = page.locator(".wording-section").first().locator(".wording-card").nth(2);
  await card.getByRole("button", { name: "Copy the invitation, in Hindi" }).click();
  await expect(card.getByRole("button", { name: /Copied/ })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(await card.locator(".wording-text").innerText());

  await expect(page.getByRole("link", { name: "Make yours" })).toHaveAttribute("href", "/create?template=housewarming");
  await expect(page.locator(".occasion-others a")).toHaveCount(GUIDES.length - 1);

  // An occasion's page leads to its guide.
  await page.goto("/templates/housewarming");
  await expect(page.getByRole("link", { name: /Wording ideas/ })).toHaveAttribute("href", "/wording/griha-pravesh-invitation-message");
});

test("the catalogue leads to each occasion's page", async ({ page }) => {
  await page.goto("/templates");
  await expect(page.locator(".cin-catalog-grid .cin-occasion-image")).toHaveCount(12);
  await page.getByRole("link", { name: "Housewarming & vastu puja: see how it opens" }).click();
  await expect(page).toHaveURL(/\/templates\/housewarming$/);
  await expect(page.locator("h1")).toHaveText("A housewarming invitation with a door to open");
});

test("invitations, the studio and the manage pages ask not to be listed", async ({ page, request }) => {
  const { slug } = await publish(request);
  for (const path of [`/e/${slug}`, "/create", `/manage/${slug}`, "/mine", "/e/preview?template=wedding"]) {
    await page.goto(path);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  }
  for (const path of ["/", "/templates", "/templates/wedding", "/templates/wedding?lang=gu", "/wording", "/wording/wedding-invitation-wording", "/privacy"]) {
    await page.goto(path);
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  }
});

test("search engines get structured data, a share image, and a title and description that fit", async ({ request }) => {
  const ld = (html: string) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap((m) => [JSON.parse(m[1])].flat()) as { "@type": string; mainEntity?: unknown[] }[];
  const types = async (path: string) => {
    const html = await (await request.get(path)).text();
    const decode = (text: string) => text.replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, '"');
    const title = decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "");
    const description = decode(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "");
    expect(title.length, `${path} title`).toBeLessThanOrEqual(70);
    expect(description.length, `${path} description`).toBeGreaterThan(50);
    expect(description.length, `${path} description`).toBeLessThanOrEqual(160);
    expect(html, `${path} share image`).toMatch(/<meta property="og:image" content="[^"]+"/);
    return ld(html);
  };
  expect((await types("/")).map((b) => b["@type"])).toEqual(["Organization", "WebSite", "WebApplication"]);
  const occasion = await types("/templates/garba");
  expect(occasion.map((b) => b["@type"])).toEqual(["BreadcrumbList", "FAQPage"]);
  expect(occasion[1].mainEntity?.length).toBeGreaterThanOrEqual(3);
  expect((await types("/templates")).map((b) => b["@type"])).toEqual(["BreadcrumbList", "ItemList"]);
  expect((await types("/help?lang=gu"))[0]["@type"]).toBe("FAQPage");
  const inGujarati = await types("/templates/garba?lang=gu");
  expect(inGujarati.map((b) => b["@type"])).toEqual(["BreadcrumbList", "FAQPage"]);
  expect((inGujarati[1] as { inLanguage?: string }).inLanguage).toBe("gu");
  expect((await types("/wording")).map((b) => b["@type"])).toEqual(["BreadcrumbList", "ItemList"]);
  for (const path of ["/pricing", "/pricing?lang=hi", "/privacy"]) await types(path);
  // Every occasion's page in every language, and every wording guide, has a title and a description that fit.
  for (const id of OCCASIONS) for (const lang of ["", "?lang=gu", "?lang=hi"]) await types(`/templates/${id}${lang}`);
  for (const slug of GUIDES) expect((await types(`/wording/${slug}`)).map((b) => b["@type"])).toEqual(["BreadcrumbList"]);
});
