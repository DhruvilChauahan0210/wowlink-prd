import { expect, test } from "../fixtures";
import { adminHeaders } from "../helpers";

/*
 * Keeping an eye on the live site: /api/health (the scheduled check calls it) and the admin's list of server errors.
 */

test("health says whether the site and its database are well, with counts only", async ({ request }) => {
  const health = await request.get("/api/health");
  expect(health.status()).toBe(200);
  const body = await health.json();
  expect(body).toMatchObject({ ok: true });
  expect(["ok", "none"]).toContain(body.db);
  expect(typeof body.errorsLastHour).toBe("number");
  expect(Object.keys(body).sort()).toEqual(["db", "errorsLastHour", "ok"]);
});

test("server errors are the admin's to see", async ({ request }) => {
  expect((await request.get("/api/admin/errors")).status()).toBe(404);
  const listed = await request.get("/api/admin/errors", { headers: adminHeaders() });
  expect(listed.status()).toBe(200);
  expect(Array.isArray((await listed.json()).errors)).toBe(true);
});
