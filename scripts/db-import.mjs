// Copies a WowLink JSON data file into an empty database: `npm run db:import -- .data/wowlink.json`.
// The file is only read, never changed. Run `npm run db:migrate` first.

import { readFile } from "node:fs/promises";
import { connect } from "./db.mjs";

const file = process.argv[2];
if (!file) {
  console.error("Which file? npm run db:import -- .data/wowlink.json");
  process.exit(1);
}
const data = JSON.parse(await readFile(file, "utf8"));
const sql = connect();
try {
  const [{ count }] = await sql`select count(*)::int as count from wowlink.experiences`;
  if (count > 0) {
    console.error("This database already has invitations. Import only into an empty one.");
    process.exitCode = 1;
  } else {
    const copied = await sql.begin(async (tx) => {
      const experiences = data.experiences ?? [];
      const ids = new Set(experiences.map((e) => e.id));
      for (const e of experiences) await tx`insert into wowlink.experiences (id, slug, doc) values (${e.id}, ${e.slug}, ${tx.json(e)})`;
      // Every link, lowercase. Two old slugs that differ only in case: the first keeps the row (both still open by
      // their exact slug).
      for (const e of experiences) {
        for (const link of new Set([e.slug, ...(e.aliases ?? [])].map((l) => l.toLowerCase()))) await tx`insert into wowlink.links (link, experience_id) values (${link}, ${e.id}) on conflict (link) do nothing`;
      }
      for (const link of data.retired ?? []) await tx`insert into wowlink.links (link, experience_id) values (${link.toLowerCase()}, null) on conflict (link) do nothing`;
      const counts = {};
      for (const [table, key] of [["rsvps", "id"], ["reports", "id"], ["upgrades", "id"], ["previews", "token"]]) {
        // Rows of invitations that are gone are left behind.
        const rows = (data[table] ?? []).filter((row) => ids.has(row.experienceId));
        for (const row of rows) await tx`insert into wowlink.${tx(table)} (${tx(key)}, experience_id, doc) values (${row[key]}, ${row.experienceId}, ${tx.json(row)})`;
        counts[table] = rows.length;
      }
      for (const [key, days] of Object.entries(data.metrics ?? {})) {
        for (const [day, n] of Object.entries(days)) await tx`insert into wowlink.metrics (key, day, count) values (${key}, ${day}, ${n})`;
      }
      return { experiences: experiences.length, ...counts };
    });
    console.log(`Copied ${copied.experiences} invitations, ${copied.rsvps} replies, ${copied.reports} reports, ${copied.upgrades} requests and ${copied.previews} previews.`);
  }
} finally {
  await sql.end();
}
