import postgres from "postgres";
import { METRIC_DAYS, dayKey, type Metrics } from "./insights";
import type { Backend, Db, Part, Scope, StoredExperience } from "./store";

/*
 * The store in Postgres (Supabase), used when DATABASE_URL is set. Tables live in their own `wowlink` schema, which
 * Supabase's Data API doesn't serve, with row level security on (supabase/migrations). Only this server reaches them.
 *
 * Each row keeps its object as a JSON document, so the rules in store.ts run on exactly what the JSON file holds. A
 * call loads only what its scope names; a change runs in one transaction that locks the invitation's row, so two
 * requests for the same invitation take turns. Afterwards only what changed is written back.
 *
 * Links (slugs, custom links and retired ones) each have a row with a lowercase primary key: that is what keeps every
 * link unique across the whole app, even when two invitations try for the same one at once.
 */

/** A link someone else already has: found only when saving. */
export class LinkTaken extends Error {
  constructor() {
    super("That link is already taken.");
    this.name = "LinkTaken";
  }
}

type Sql = postgres.Sql | postgres.TransactionSql;
type Row = { experienceId: string };
// Survives dev-server hot reloads, so there is only ever one pool of connections.
const g = globalThis as typeof globalThis & { __wowlinkSql?: postgres.Sql };

function client() {
  if (!g.__wowlinkSql) {
    const url = process.env.DATABASE_URL!;
    let host = "";
    try { host = new URL(url).hostname; } catch { /* postgres reports a malformed URL itself */ }
    g.__wowlinkSql = postgres(url, {
      // Supabase's pooler (transaction mode) can't keep prepared statements between transactions.
      prepare: false,
      max: Number(process.env.WOWLINK_PG_MAX) || 5,
      ssl: host === "localhost" || host === "127.0.0.1" ? false : "require",
      idle_timeout: 20,
      connect_timeout: 10,
      onnotice: () => undefined,
    });
  }
  return g.__wowlinkSql;
}

/** The database, when there is one: for other shared state (rate-limit.ts). */
export const database = () => (process.env.DATABASE_URL ? client() : null);

const KEY: Record<Part, "id" | "token"> = { rsvps: "id", reports: "id", upgrades: "id", previews: "token" };
const keyOf = (part: Part, row: object) => (row as Record<string, string>)[KEY[part]];
const linksOf = (e: StoredExperience) => new Set([e.slug, ...(e.aliases ?? [])].map((l) => l.toLowerCase()));
const docs = <T>(rows: readonly { doc: T }[]) => rows.map((r) => r.doc);

/** What was loaded, as it was: to tell afterwards what changed. */
type Before = { experiences: Map<string, string>; links: Map<string, Set<string>>; parts: Map<Part, Map<string, string>>; retired: number };

async function load(sql: Sql, scope: Scope, lock: boolean) {
  const forUpdate = lock ? sql`for update` : sql``;
  // A host's invitations are changed one call at a time (the free plan's one live invitation is counted across them).
  const lockOwner = async (owner: string) => {
    if (lock) await sql`select pg_advisory_xact_lock(hashtext(${`owner:${owner}`}))`;
  };
  const byOwner = async (owner: string) => {
    await lockOwner(owner);
    return docs(await sql<{ doc: StoredExperience }[]>`select doc from wowlink.experiences where owner_id = ${owner} order by id ${forUpdate}`);
  };
  let experiences: StoredExperience[] = [];
  if ("link" in scope) {
    // The slug exactly, or the invitation a custom link belongs to: store.ts decides which wins.
    experiences = docs(await sql<{ doc: StoredExperience }[]>`select doc from wowlink.experiences where slug = ${scope.link} or id = (select experience_id from wowlink.links where link = ${scope.link.toLowerCase()}) order by id ${forUpdate}`);
  } else if ("slug" in scope) {
    // With `owners`: the invitation and every other one its host has.
    const owner = scope.owners ? (await sql<{ owner_id: string | null }[]>`select owner_id from wowlink.experiences where slug = ${scope.slug}`)[0]?.owner_id : null;
    if (owner) await lockOwner(owner);
    experiences = docs(owner
      ? await sql<{ doc: StoredExperience }[]>`select doc from wowlink.experiences where slug = ${scope.slug} or owner_id = ${owner} order by id ${forUpdate}`
      : await sql<{ doc: StoredExperience }[]>`select doc from wowlink.experiences where slug = ${scope.slug} ${forUpdate}`);
  } else if ("create" in scope) {
    if (scope.owner) experiences = await byOwner(scope.owner);
  } else if ("owner" in scope) {
    experiences = await byOwner(scope.owner);
  } else if ("token" in scope) {
    experiences = docs(await sql<{ doc: StoredExperience }[]>`select doc from wowlink.experiences where id = (select experience_id from wowlink.previews where token = ${scope.token}) ${forUpdate}`);
  } else if ("upgradeId" in scope) {
    experiences = docs(await sql<{ doc: StoredExperience }[]>`select doc from wowlink.experiences where id = (select experience_id from wowlink.upgrades where id = ${scope.upgradeId}) ${forUpdate}`);
  } else if ("all" in scope) {
    experiences = docs(await sql<{ doc: StoredExperience }[]>`select doc from wowlink.experiences order by id ${forUpdate}`);
  }
  const ids = experiences.map((e) => e.id);
  const db: Db = { experiences, rsvps: [], retired: [], reports: [], metrics: {}, upgrades: [], previews: [] };
  const parts = new Map<Part, Map<string, string>>();
  const fill = (part: Part, rows: object[]) => {
    (db[part] as object[]) = rows;
    parts.set(part, new Map(rows.map((r) => [keyOf(part, r), JSON.stringify(r)])));
  };

  // A preview or a request on its own; otherwise the parts asked for, of the invitations loaded.
  if ("token" in scope) fill("previews", docs(await sql<{ doc: object }[]>`select doc from wowlink.previews where token = ${scope.token}`));
  if ("upgradeId" in scope) fill("upgrades", docs(await sql<{ doc: object }[]>`select doc from wowlink.upgrades where id = ${scope.upgradeId}`));
  for (const part of scope.with ?? []) {
    const rows = "all" in scope ? await sql<{ doc: object }[]>`select doc from wowlink.${sql(part)}` : await sql<{ doc: object }[]>`select doc from wowlink.${sql(part)} where experience_id = any(${ids}::text[])`;
    fill(part, docs(rows));
  }
  // A custom link wanted: whether it's anyone else's, or was once.
  if (scope.probe?.length) {
    const rows = await sql<{ link: string }[]>`select link from wowlink.links where link = any(${scope.probe}::text[]) and (experience_id is null or not (experience_id = any(${ids}::text[])))`;
    db.retired = rows.map((r) => r.link);
  }
  // The app's numbers, for reading only: a change starts from none, so what it adds is what gets added.
  if (!lock && "all" in scope && scope.metrics) {
    const metrics: Metrics = {};
    for (const { key, day, count } of await sql<{ key: string; day: string; count: number }[]>`select key, day, count from wowlink.metrics`) (metrics[key] ??= {})[day] = count;
    db.metrics = metrics;
  }

  const before: Before = {
    experiences: new Map(experiences.map((e) => [e.id, JSON.stringify(e)])),
    links: new Map(experiences.map((e) => [e.id, linksOf(e)])),
    parts,
    retired: db.retired.length,
  };
  return { db, before, ids };
}

/** Write back what a change did: new and changed rows, removed rows, links taken and given up, numbers added. */
async function save(tx: postgres.TransactionSql, before: Before, ids: string[], db: Db) {
  const changed = db.experiences.filter((e) => before.experiences.get(e.id) !== JSON.stringify(e));
  if (changed.length) {
    const rows = changed.map((e) => ({ id: e.id, slug: e.slug, doc: e }));
    await tx`insert into wowlink.experiences (id, slug, doc) select x.id, x.slug, x.doc from jsonb_to_recordset(${tx.json(rows as never)}::jsonb) as x(id text, slug text, doc jsonb)
      on conflict (id) do update set slug = excluded.slug, doc = excluded.doc, updated_at = now()`;
  }

  // Links: new ones must not be anyone else's (the primary key settles a race); dropped ones are retired.
  const retire = db.retired.slice(before.retired).map((l) => l.toLowerCase());
  for (const e of db.experiences) {
    const now = linksOf(e);
    const was = before.links.get(e.id) ?? new Set<string>();
    const added = [...now].filter((l) => !was.has(l));
    retire.push(...[...was].filter((l) => !now.has(l)));
    if (!added.length) continue;
    const owners = await tx<{ experience_id: string | null }[]>`insert into wowlink.links (link, experience_id) select unnest(${added}::text[]), ${e.id}
      on conflict (link) do update set link = excluded.link returning experience_id`;
    if (owners.some((o) => o.experience_id !== e.id)) throw new LinkTaken();
  }

  for (const [part, was] of before.parts) {
    const rows = db[part] as (Row & object)[];
    const now = new Set(rows.map((r) => keyOf(part, r)));
    const upserts = rows.filter((r) => was.get(keyOf(part, r)) !== JSON.stringify(r)).map((r) => ({ key: keyOf(part, r), experience_id: r.experienceId, doc: r }));
    const gone = [...was.keys()].filter((k) => !now.has(k));
    if (upserts.length) {
      await tx`insert into wowlink.${tx(part)} (${tx(KEY[part])}, experience_id, doc) select x.key, x.experience_id, x.doc from jsonb_to_recordset(${tx.json(upserts as never)}::jsonb) as x(key text, experience_id text, doc jsonb)
        on conflict (${tx(KEY[part])}) do update set doc = excluded.doc`;
    }
    if (gone.length) await tx`delete from wowlink.${tx(part)} where ${tx(KEY[part])} = any(${gone}::text[])`;
  }

  // Invitations deleted: their replies and the rest go with them (on delete cascade), their links stay retired.
  const kept = new Set(db.experiences.map((e) => e.id));
  const deleted = [...before.experiences.keys()].filter((id) => !kept.has(id));
  if (deleted.length) await tx`delete from wowlink.experiences where id = any(${deleted}::text[])`;
  if (retire.length) {
    // Only this change's own links, or links nobody has. (A dropped custom link is listed twice: once as retired by
    // store.ts, once as no longer the invitation's.)
    await tx`insert into wowlink.links (link, experience_id) select unnest(${[...new Set(retire)]}::text[]), null
      on conflict (link) do update set experience_id = null where wowlink.links.experience_id is null or wowlink.links.experience_id = any(${ids}::text[])`;
  }

  // The table's columns are named the other way round from what they hold, and always have been: `key` is the day,
  // `day` is the count's name (see the read above, which matches).
  const counts = Object.entries(db.metrics).flatMap(([day, names]) => Object.entries(names).filter(([, count]) => count > 0).map(([name, count]) => ({ key: day, day: name, count })));
  if (counts.length) {
    await tx`insert into wowlink.metrics (key, day, count) select x.key, x.day, x.count from jsonb_to_recordset(${tx.json(counts)}::jsonb) as x(key text, day text, count integer)
      on conflict (key, day) do update set count = wowlink.metrics.count + excluded.count`;
    // Now and then, days older than the numbers go.
    if (Math.random() < 0.01) await tx`delete from wowlink.metrics where key < ${dayKey(Date.now() - METRIC_DAYS * 86_400_000)}`;
  }
}

export const pgBackend: Backend = {
  async read(scope, fn) {
    return fn((await load(client(), scope, false)).db);
  },
  async write<T>(scope: Scope, fn: (db: Db) => T) {
    try {
      return (await client().begin(async (tx) => {
        const { db, before, ids } = await load(tx, scope, true);
        const result = fn(db);
        if ((result as { ok?: boolean } | null)?.ok !== false) await save(tx, before, ids, db);
        return result;
      })) as T;
    } catch (error) {
      // A slug or link someone else has (a unique key): only links can clash.
      if (error instanceof LinkTaken || (error as { code?: string }).code === "23505") throw new LinkTaken();
      throw error;
    }
  },
};
