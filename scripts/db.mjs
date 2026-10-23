import postgres from "postgres";

/** One connection to DATABASE_URL for a script, set up like the app's (app/lib/store-pg.ts). Never prints the URL. */
export function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("Set DATABASE_URL first: in .env.local, or in the environment.");
    process.exit(1);
  }
  let host = "";
  try { host = new URL(url).hostname; } catch { /* postgres reports a malformed URL itself */ }
  return postgres(url, { prepare: false, max: 1, ssl: host === "localhost" || host === "127.0.0.1" ? false : "require", onnotice: () => undefined });
}
