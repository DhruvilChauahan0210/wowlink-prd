// A throwaway Postgres for `npm run test:pg`: PGlite (real Postgres, in memory) on a local port. Nothing is kept.
// PGlite has one session, so the app connects to it with one connection (WOWLINK_PG_MAX=1).

import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const port = Number(process.env.TEST_DB_PORT || 5433);
const db = await PGlite.create();
const server = new PGLiteSocketServer({ db, port, host: "127.0.0.1" });
await server.start();
console.log(`Test database on 127.0.0.1:${port}`);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, async () => {
    await server.stop();
    await db.close();
    process.exit(0);
  });
}
