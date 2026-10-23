import { defineConfig, devices } from "@playwright/test";
import { TEST_ADMIN_KEY } from "./tests/helpers";

/*
 * End-to-end and unit tests, all run by Playwright: `npm test`.
 *
 * The app is built and served on its own port, from its own build folder, against its own data file,
 * so a running `npm run dev` (port 3000, .next, .data/wowlink.json) is never touched.
 */

const PORT = 3100;
const DATA_FILE = ".data/e2e.json";
// `npm run test:pg`: the same tests against Postgres (a throwaway PGlite, scripts/test-db.mjs) instead of the file.
const PG = process.env.WOWLINK_TEST_DB === "pg";
const PG_PORT = 5433;
const DATABASE_URL = `postgres://postgres@127.0.0.1:${PG_PORT}/postgres`;

const app = {
  // Idle connections are kept for two minutes: the tests' HTTP client reuses them between tests, and with Node's
  // default of 5 seconds the server can close one just as a test sends on it (ECONNRESET).
  command: `${PG ? "node scripts/db-migrate.mjs" : `rm -f ${DATA_FILE}`} && npx next build && npx next start -p ${PORT} --keepAliveTimeout 120000`,
  url: `http://localhost:${PORT}`,
  env: {
    NEXT_DIST_DIR: ".next-test", WOWLINK_DATA_FILE: DATA_FILE, NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}`, WOWLINK_ADMIN_KEY: TEST_ADMIN_KEY, NEXT_PUBLIC_WOWLINK_PRO_REPLIES: "100",
    // Hosts sign in as whoever x-wowlink-test-user names (tests/fixtures.ts); never on a real site.
    WOWLINK_TEST_AUTH: "1",
    // Never the developer's own database or Supabase project from .env.local: set here, even empty, these win.
    DATABASE_URL: PG ? DATABASE_URL : "", NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
    ...(PG && { WOWLINK_PG_MAX: "1" }),
  },
  reuseExistingServer: false,
  timeout: 240_000,
  stdout: "ignore" as const,
  stderr: "pipe" as const,
};

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    // Phones get the visual flows (openings, page smoke tests); data flows don't depend on screen size.
    { name: "phone", use: { ...devices["Pixel 7"] }, testMatch: /(openings|smoke)\.spec\.ts/ },
  ],
  // The database first (Playwright starts these in order), then the app.
  webServer: PG ? [{ command: "node scripts/test-db.mjs", port: PG_PORT, env: { TEST_DB_PORT: String(PG_PORT) }, reuseExistingServer: false, timeout: 60_000, stdout: "ignore", stderr: "pipe" }, app] : app,
});
