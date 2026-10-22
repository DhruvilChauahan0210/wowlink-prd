/** The manage key from `Authorization: Bearer <key>`. */
export const keyFrom = (request: Request) => request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ?? "";

/** A wrong key and an unknown invitation look the same, so keys can't be probed. */
export const notYours = () => Response.json({ error: "This link isn’t valid for that invitation." }, { status: 404 });
