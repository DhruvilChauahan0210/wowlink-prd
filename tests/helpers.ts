import type { APIRequestContext, Page } from "@playwright/test";

/** The admin key the test server runs with (playwright.config.ts). Only for tests. */
export const TEST_ADMIN_KEY = "test-only-admin-key-not-a-real-secret";
export const adminHeaders = (key = TEST_ADMIN_KEY) => ({ authorization: `Bearer ${key}`, "x-forwarded-for": freshIp() });

let counter = 0;
/** A different pretend client address each call, so per-client rate limits don't couple unrelated tests. */
export const freshIp = () => `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${(counter++ % 250) + 1}`;
let users = 0;
/** A new pretend host each call, for the test server's sign-in (x-wowlink-test-user). */
export const freshUser = () => `u${process.pid}-${Date.now().toString(36)}-${users++}`;

export type Draft = { title: string; date: string; time: string; venue: string; message: string; events?: { id: string; name: string; date: string; time: string; venue: string }[]; language?: "en" | "gu" | "hi"; thanks?: string; palette?: string; rsvp?: boolean; countdown?: boolean; mapUrl?: string; attribution?: boolean; askDiet?: boolean; askSong?: boolean; poll?: { question: string; options: string[] } | null };
export const sampleDraft = (overrides: Partial<Draft> = {}): Draft => ({
  title: "Aarav & Meera",
  date: "2026-11-08",
  time: "18:00",
  venue: "The Garden House, Surat",
  message: "Some days are made more beautiful by the people who share them.",
  ...overrides,
});

/**
 * Publish an invitation through the API and return its slug and manage key. In the Creator studio by default (the
 * admin can publish one there directly), so a test can use every feature; pass "free" to test the free plan.
 */
export async function publish(request: APIRequestContext, templateId = "wedding", draft: Partial<Draft> = {}, plan: "pro" | "free" = "pro") {
  // A free one is published by a host of its own (the free plan has one live invitation per host).
  const headers = { "x-forwarded-for": freshIp(), ...(plan === "pro" ? { authorization: `Bearer ${TEST_ADMIN_KEY}` } : { "x-wowlink-test-user": freshUser() }) };
  const response = await request.post("/api/experiences", { data: { templateId, draft: sampleDraft(draft), ...(plan === "pro" && { plan: "pro" }) }, headers });
  if (response.status() !== 201) throw new Error(`publish failed: ${response.status()} ${await response.text()}`);
  return (await response.json()) as { slug: string; key: string };
}

/** Headers for the owner endpoints. */
export const ownerHeaders = (key: string) => ({ authorization: `Bearer ${key}`, "x-forwarded-for": freshIp() });

/** Add a personal invitation through the API and return it. */
export async function addGuest(request: APIRequestContext, slug: string, key: string, name: string, events: string[] | "all" = "all") {
  const response = await request.post(`/api/experiences/${slug}/guests`, { headers: ownerHeaders(key), data: { name, events } });
  if (response.status() !== 201) throw new Error(`addGuest failed: ${response.status()} ${await response.text()}`);
  return ((await response.json()) as { guest: { id: string; name: string; events: string[] | "all" } }).guest;
}

/** Collect uncaught errors and console errors (ignoring expected 404s for missing resources). */
export function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && !/Failed to load resource/.test(message.text())) errors.push(message.text());
  });
  return errors;
}

/** Open an invitation in the studio as its host: the manage link saves the key on this browser first. */
export async function openInStudio(page: Page, slug: string, key: string) {
  await page.goto(`/manage/${slug}#k=${key}`);
  await page.locator(".manage-hero h1").waitFor();
  await page.goto(`/create?edit=${slug}`);
  await page.getByRole("button", { name: "Update", exact: true }).waitFor();
  await page.locator(".studio-save-status").filter({ hasText: "Editing your live invitation" }).waitFor();
}
