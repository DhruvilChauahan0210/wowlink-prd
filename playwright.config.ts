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
  webServer: {
    // Idle connections are kept for two minutes: the tests' HTTP client reuses them between tests, and with Node's
    // default of 5 seconds the server can close one just as a test sends on it (ECONNRESET).
    command: `rm -f ${DATA_FILE} && npx next build && npx next start -p ${PORT} --keepAliveTimeout 120000`,
    url: `http://localhost:${PORT}`,
    env: { NEXT_DIST_DIR: ".next-test", WOWLINK_DATA_FILE: DATA_FILE, NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}`, WOWLINK_ADMIN_KEY: TEST_ADMIN_KEY, NEXT_PUBLIC_WOWLINK_PRO_REPLIES: "100" },
    reuseExistingServer: false,
    timeout: 240_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
