import type { APIRequestContext, Page } from "@playwright/test";

let counter = 0;
/** A different pretend client address each call, so per-client rate limits don't couple unrelated tests. */
export const freshIp = () => `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${(counter++ % 250) + 1}`;

export type Draft = { title: string; date: string; time: string; venue: string; message: string };
export const sampleDraft = (overrides: Partial<Draft> = {}): Draft => ({
  title: "Aarav & Meera",
  date: "2026-11-08",
  time: "18:00",
  venue: "The Garden House, Surat",
  message: "Some days are made more beautiful by the people who share them.",
  ...overrides,
});

/** Publish an invitation through the API and return its slug and manage key. */
export async function publish(request: APIRequestContext, templateId = "wedding", draft: Partial<Draft> = {}) {
  const response = await request.post("/api/experiences", { data: { templateId, draft: sampleDraft(draft) }, headers: { "x-forwarded-for": freshIp() } });
  if (response.status() !== 201) throw new Error(`publish failed: ${response.status()} ${await response.text()}`);
  return (await response.json()) as { slug: string; key: string };
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
