import { test as base } from "@playwright/test";
import { freshUser } from "./helpers";

export * from "@playwright/test";

/*
 * The end-to-end tests' `test`: each one is signed in as a host of its own (the test server signs in whoever the
 * x-wowlink-test-user header names, app/lib/auth.ts), so per-host limits never couple two tests. A test about being
 * signed out says `test.use({ signedIn: false })`.
 */
export const test = base.extend<{ signedIn: boolean; user: string }>({
  signedIn: [true, { option: true }],
  /** Who this test is signed in as. */
  user: async ({}, use) => use(freshUser()),
  extraHTTPHeaders: async ({ extraHTTPHeaders, signedIn, user }, use) => {
    await use(signedIn ? { ...extraHTTPHeaders, "x-wowlink-test-user": user } : extraHTTPHeaders);
  },
});
