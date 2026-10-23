import { expect, test } from "../fixtures";

// Every occasion opens in its own way. Each must start closed, open on its trigger, and land on the card.
const OPENINGS = [
  { id: "wedding", title: "Aarav & Meera", action: "Open the invitation", hint: "untie the knot" },
  { id: "birthday", title: "A night for Riya", action: "Reveal the surprise", hint: "pull the bow" },
  { id: "garba", title: "Raas under the stars", action: "Let the night begin", hint: "light the diya" },
  { id: "opening", title: "A new beginning", action: "Cut the ribbon", hint: "cut the ribbon" },
  { id: "engagement", title: "Kabir & Isha", action: "Open the ring box", hint: "press the clasp" },
  { id: "babyshower", title: "Seemant for Priya", action: "Shake the rattle", hint: "shake the rattle" },
  { id: "housewarming", title: "The Shahs’ new home", action: "Open the door", hint: "lift the latch" },
  { id: "anniversary", title: "Mummy & Papa’s 25th", action: "Open the letter", hint: "break the seal" },
  { id: "diwali", title: "Diwali at the Mehtas", action: "Light the sparkler", hint: "light the diyas" },
  { id: "janoi", title: "Aarav’s janoi", action: "Tie the janoi", hint: "tie the thread" },
  { id: "puja", title: "Satyanarayan katha at home", action: "Ring the bell", hint: "ring the bell" },
  { id: "naming", title: "Naamkaran for baby Patel", action: "Lift the cloth", hint: "lift the cloth" },
];

for (const opening of OPENINGS) {
  test(`${opening.id}: the opening reveals the invitation card`, async ({ page }) => {
    await page.goto(`/e/preview?template=${opening.id}`);
    const scene = page.locator(".inv-scene");
    const card = page.locator(".inv-card");
    await expect(scene).toHaveClass(new RegExp(`\\binv-${opening.id}\\b`));
    await expect(page.locator(".inv-intro .inv-title")).toHaveText(opening.title);
    await expect(page.locator(".inv-hint")).toHaveText(opening.hint);
    await expect(card).toHaveAttribute("aria-hidden", "true");

    await page.getByRole("button", { name: opening.action }).click();

    await expect(scene).toHaveClass(/\bis-open\b/);
    await expect(card).toHaveAttribute("aria-hidden", "false");
    await expect(card).toHaveCSS("opacity", "1");
    await expect(card.locator("h2")).toHaveText(opening.title);
    await expect(page.locator(".inv-intro")).toHaveCSS("opacity", "0");
    await expect(page.locator(".inv-intro")).toHaveAttribute("aria-hidden", "true");
  });
}

test.describe("with reduced motion", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("the card appears straight away, without the animation", async ({ page }) => {
    await page.goto("/e/preview?template=birthday");
    await page.getByRole("button", { name: "Reveal the surprise" }).click();
    await expect(page.locator(".inv-card")).toHaveCSS("opacity", "1", { timeout: 1000 });
  });
});

test("the studio preview switches to the chosen occasion's opening", async ({ page }) => {
  await page.goto("/create?template=wedding");
  await expect(page.locator(".inv-hint")).toHaveText("untie the knot");
  await page.getByRole("button", { name: "Raas & Rhythm" }).click();
  await expect(page.locator(".inv-scene")).toHaveClass(/\binv-garba\b/);
  await expect(page.locator(".inv-hint")).toHaveText("light the diya");
  if (test.info().project.name === "phone") await page.getByRole("tab", { name: "Preview" }).click();
  await page.getByRole("button", { name: "Let the night begin" }).click();
  await expect(page.locator(".inv-scene")).toHaveClass(/\bis-open\b/);
  await page.getByRole("button", { name: "Watch it again" }).click();
  await expect(page.locator(".inv-scene")).not.toHaveClass(/\bis-open\b/);
});
