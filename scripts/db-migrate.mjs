// Sets up (or updates) WowLink's tables at DATABASE_URL: applies supabase/migrations/*.sql in order, each once.
// Safe to run again. `npm run db:migrate` reads DATABASE_URL from .env.local.

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { connect } from "./db.mjs";

const sql = connect();
const dir = path.join(process.cwd(), "supabase", "migrations");
try {
  await sql`create schema if not exists wowlink`;
  await sql`create table if not exists wowlink.migrations (name text primary key, applied_at timestamptz not null default now())`;
  await sql`alter table wowlink.migrations enable row level security`;
  const applied = new Set((await sql`select name from wowlink.migrations`).map((row) => row.name));
  for (const name of (await readdir(dir)).filter((file) => file.endsWith(".sql")).sort()) {
    if (applied.has(name)) continue;
    const text = await readFile(path.join(dir, name), "utf8");
    await sql.begin(async (tx) => {
      await tx.unsafe(text);
      await tx`insert into wowlink.migrations (name) values (${name})`;
    });
    console.log(`Applied ${name}`);
  }
  console.log("The database is up to date.");
} finally {
  await sql.end();
}
