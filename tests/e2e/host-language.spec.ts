import { expect, test } from "@playwright/test";
import { addGuest, publish } from "../helpers";

/*
 * Hosts can use the studio, the manage page and My invitations in Gujarati. It's their own choice, remembered on
 * their device, and separate from the language the invitation's guests read.
 */

test("the studio in Gujarati, remembered, with its messages translated", async ({ page }) => {
  await page.goto("/create?template=wedding");
  await page.getByRole("button", { name: "Use WowLink in Gujarati (ગુજરાતી)" }).click();
  await expect(page.locator(".studio-fieldset legend").first()).toHaveText("પ્રસંગ");
  await expect(page.getByRole("button", { name: "લગ્ન", exact: true })).toBeVisible();
  await expect(page.locator("label[for=title]")).toHaveText("નામ અથવા પ્રસંગનું શીર્ષક");

  await page.locator("#title").fill("");
  await page.getByRole("button", { name: "પ્રકાશિત કરો", exact: true }).click();
  await expect(page.locator("#title-error")).toHaveText("પ્રસંગનું નામ અથવા શીર્ષક ઉમેરો.");
  await expect(page.locator(".studio-save-status")).toHaveText("પ્રકાશિત કરતાં પહેલાં થોડી વિગતો બાકી છે.");

  await page.reload();
  await expect(page.getByRole("button", { name: "પ્રકાશિત કરો", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "WowLink અંગ્રેજીમાં વાપરો (English)" }).click();
  await expect(page.getByRole("button", { name: "Publish", exact: true })).toBeVisible();
});

test("the manage page in Gujarati: server messages too, and the guests' language stays the invitation's", async ({ page, request }) => {
  const { slug, key } = await publish(request, "wedding", { title: "Isha & Kabir" });
  await addGuest(request, slug, key, "the Patel family");
  await page.goto("/mine");
  await page.evaluate(() => localStorage.setItem("wowlink:host-lang", "gu"));
  await page.goto(`/manage/${slug}#k=${key}`);
  await expect(page.locator("#guests-heading")).toHaveText("વ્યક્તિગત આમંત્રણો");
  await expect(page.locator(".manage-totals dt").first()).toHaveText("આવશે");
  const row = page.locator(".manage-guest").filter({ hasText: "the Patel family" });
  await expect(row.locator(".manage-guest-status")).toHaveText("હજી ખોલ્યું નથી");

  // The server answers in English; the host reads it in Gujarati.
  await page.locator("#new-guest-name").fill(" ");
  await page.getByRole("button", { name: "આમંત્રણ ઉમેરો" }).click();
  await expect(page.locator("#new-guest-error")).toHaveText("કોના માટે છે તે લખો, જેમ કે “પટેલ પરિવાર”.");

  // The invitation is in English, so what guests receive is in English.
  const whatsApp = await row.getByRole("link", { name: "the Patel family ને WhatsApp પર લિંક મોકલો" }).getAttribute("href");
  expect(decodeURIComponent(whatsApp!)).toContain("You’re invited: Isha & Kabir");
});

test("My invitations in Gujarati", async ({ page, request }) => {
  const { slug, key } = await publish(request, "anniversary", { title: "Mummy & Papa’s 25th", date: "2027-02-14" });
  await page.goto("/mine");
  await page.evaluate(([s, k]) => { localStorage.setItem("wowlink:host-lang", "gu"); localStorage.setItem(`wowlink:owner:${s}`, k); }, [slug, key]);
  await page.reload();
  await expect(page.locator(".mine-intro h1")).toHaveText("મારાં આમંત્રણો");
  await expect(page.locator(".mine-kind")).toHaveText("લગ્નતિથિ");
  await expect(page.locator(".mine-counts")).toHaveText("હજી કોઈ જવાબ નથી");
  await expect(page.locator(".mine-item .manage-muted").first()).toContainText("14 ફેબ્રુઆરી 2027");
});
